#include "Arduino.h"
#include "I2Cdev.h"
#include "MPU6050_6Axis_MotionApps20.h"
#include "Wire.h"
#include "wificom.h"
#include "pins.h"
#include <Adafruit_NeoPixel.h>

#define MAKEPYTHON_ESP32_SDA 4
#define MAKEPYTHON_ESP32_SCL 5

namespace movement {

  MPU6050 mpu;
  
  bool dmpReady = false;
  uint8_t mpuIntStatus;
  uint8_t devStatus;
  uint16_t packetSize;
  uint16_t fifoCount;
  uint8_t fifoBuffer[64];
  Quaternion q;
  VectorInt16 aa;
  VectorInt16 aaReal;
  VectorInt16 aaWorld;
  VectorFloat gravity;
  float euler[3];
  float ypr[3];
  float previousYpr[3];
  const float minDeltaToSend = M_PI / 90;

  volatile bool mpuInterrupt = false;
  void dmpDataReady()
  {
    mpuInterrupt = true;
  }

  
  void init() {
    Wire.begin(MAKEPYTHON_ESP32_SDA, MAKEPYTHON_ESP32_SCL);
    Wire.setClock(400000);
  
    Serial.println(F("Initializing I2C devices..."));
    mpu.initialize();
  
    Serial.println(F("Testing device connections..."));
    Serial.println(mpu.testConnection() ? F("MPU6050 connection successful") : F("MPU6050 connection failed"));

    Serial.println("Setting initial ypr");
    Serial.print("Min delta between sends: ");Serial.println(minDeltaToSend);
    previousYpr[0] = 200;
    previousYpr[1] = 200;
    previousYpr[3] = 200;
  
    Serial.println(F("Initializing DMP..."));
    devStatus = mpu.dmpInitialize();
  
    mpu.setXGyroOffset(220);
    mpu.setYGyroOffset(76);
    mpu.setZGyroOffset(-85);
    mpu.setZAccelOffset(1688);
    
    if (devStatus == 0) {
      Serial.println(F("Enabling DMP..."));
      mpu.setDMPEnabled(true);
  
      Serial.print(F("Enabling interrupt detection (Arduino external interrupt "));
      Serial.print(digitalPinToInterrupt(PIN_INTERRUPT));
      Serial.println(F(")..."));
      attachInterrupt(digitalPinToInterrupt(PIN_INTERRUPT), dmpDataReady, RISING);
      mpuIntStatus = mpu.getIntStatus();
  
      Serial.println(F("DMP ready! Waiting for first interrupt..."));
      dmpReady = true;
  
      packetSize = mpu.dmpGetFIFOPacketSize();
    } else  {
      Serial.print(F("DMP Initialization failed (code "));
      Serial.print(devStatus);
      Serial.println(F(")"));
    }

  }

  void enable() {
    mpu.setDMPEnabled(false);
  }

  void disable() {
    mpu.setDMPEnabled(true);
  }

  void poll() {
    if (!dmpReady) return;
  
    while (!mpuInterrupt && fifoCount < packetSize) {
      if (mpuInterrupt && fifoCount < packetSize) {
        fifoCount = mpu.getFIFOCount();
      }
    }
  
    mpuInterrupt = false;
    mpuIntStatus = mpu.getIntStatus();
  
    fifoCount = mpu.getFIFOCount();
  
    if ((mpuIntStatus & _BV(MPU6050_INTERRUPT_FIFO_OFLOW_BIT)) || fifoCount >= 1024) {
      mpu.resetFIFO();
      fifoCount = mpu.getFIFOCount();
      Serial.println(F("FIFO overflow!"));
    } else if (mpuIntStatus & _BV(MPU6050_INTERRUPT_DMP_INT_BIT)) {
      while (fifoCount < packetSize) {
        fifoCount = mpu.getFIFOCount();      
      }
  
      mpu.getFIFOBytes(fifoBuffer, packetSize);
  
      fifoCount -= packetSize;
  
      mpu.dmpGetQuaternion(&q, fifoBuffer);
      mpu.dmpGetGravity(&gravity, &q);
      mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);

      // display initial world-frame acceleration, adjusted to remove gravity
      // and rotated based on known orientation from quaternion     
      mpu.dmpGetAccel(&aa, fifoBuffer);
      mpu.dmpGetLinearAccel(&aaReal, &aa, &gravity);
      mpu.dmpGetLinearAccelInWorld(&aaWorld, &aaReal, &q);
/*
      Serial.print("aworld\t");
      Serial.print(aaReal.x);
      Serial.print("\t");
      Serial.print(aaReal.y);
      Serial.print("\t");
      Serial.println(aaReal.z);
      
      Serial.print("aworld\t");
      Serial.print(aaWorld.x);
      Serial.print("\t");
      Serial.print(aaWorld.y);
      Serial.print("\t");
      Serial.println(aaWorld.z);
*/      

      float deltaY = abs(ypr[0] - previousYpr[0]);
      float deltaP = abs(ypr[1] - previousYpr[1]);
      float deltaR = abs(ypr[2] - previousYpr[2]);

      if(
        deltaY > minDeltaToSend ||
        deltaP > minDeltaToSend ||
        deltaR > minDeltaToSend
      ) {
        //Serial.print("DY: ");Serial.println(deltaY);
        //Serial.print("DP: ");Serial.println(deltaP);
        //Serial.print("DR: ");Serial.println(deltaR);
        previousYpr[0] = ypr[0];        
        previousYpr[1] = ypr[1];
        previousYpr[2] = ypr[2];
        sendYPR(ypr);         
      }

/*
      Serial.print("ypr;");
      Serial.print(ypr[0] * 180 / M_PI);
      Serial.print(";");
      Serial.print(ypr[1] * 180 / M_PI);
      Serial.print(";");
      Serial.println(ypr[2] * 180 / M_PI);

      uint8_t r = ypr[0] * 255 / M_PI;
      uint8_t g = ypr[1] * 255 / M_PI;
      uint8_t b = ypr[2] * 255 / M_PI;
      uint32_t rgb = pixels->Color(r,g,b);
    
      pixels->fill(rgb);
      pixels->show();
*/      
    }    
  }
}
