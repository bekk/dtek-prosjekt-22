#include "I2Cdev.h"
#include "MPU6050_6Axis_MotionApps20.h"
#include "Wire.h"
#include "wificom.h"

#define MAKEPYTHON_ESP32_SDA 4
#define MAKEPYTHON_ESP32_SCL 5
#define INTERRUPT_PIN 35

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
uint8_t teapotPacket[14] = {'$', 0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x00, '\r', '\n'};

volatile bool mpuInterrupt = false;
void dmpDataReady()
{
  mpuInterrupt = true;
}

void setup()
{
  Serial.begin(115200);
  Serial.println(F("Button client starting..."));

  connectToWifi();
  
  pinMode(21, OUTPUT);
  digitalWrite(21, LOW);
  Wire.begin(MAKEPYTHON_ESP32_SDA, MAKEPYTHON_ESP32_SCL);
  Wire.setClock(400000);

  Serial.println(F("Initializing I2C devices..."));
  mpu.initialize();
  pinMode(INTERRUPT_PIN, INPUT);

  Serial.println(F("Testing device connections..."));
  Serial.println(mpu.testConnection() ? F("MPU6050 connection successful") : F("MPU6050 connection failed"));

  Serial.println(F("Initializing DMP..."));
  devStatus = mpu.dmpInitialize();

  mpu.setXGyroOffset(220);
  mpu.setYGyroOffset(76);
  mpu.setZGyroOffset(-85);
  mpu.setZAccelOffset(1688);
  if (devStatus == 0)
  {
    Serial.println(F("Enabling DMP..."));
    mpu.setDMPEnabled(true);

    Serial.print(F("Enabling interrupt detection (Arduino external interrupt "));
    Serial.print(digitalPinToInterrupt(INTERRUPT_PIN));
    Serial.println(F(")..."));
    attachInterrupt(digitalPinToInterrupt(INTERRUPT_PIN), dmpDataReady, RISING);
    mpuIntStatus = mpu.getIntStatus();

    Serial.println(F("DMP ready! Waiting for first interrupt..."));
    dmpReady = true;

    packetSize = mpu.dmpGetFIFOPacketSize();
  }
  else
  {
    Serial.print(F("DMP Initialization failed (code "));
    Serial.print(devStatus);
    Serial.println(F(")"));
  }
}

/*
Ideas
- Instead of sending coordinates/rotation, detect motion and send "motion started", "motion stopped" instead
- Possibly try to use motion data to calculate some kind of position to show movement over time.
- Send button pressed
- Show messages on leds
- Blink colored leds
- receive messages to display from server?
- Reconnect to wifi if wifi fails
*/

void loop()
{
  checkWifi();

  if (!dmpReady)
    return;

  // TODO: store data in interrupt routine?
  while (!mpuInterrupt && fifoCount < packetSize)
  {
    if (mpuInterrupt && fifoCount < packetSize)
    {
      fifoCount = mpu.getFIFOCount();
    }
  }

  mpuInterrupt = false;
  mpuIntStatus = mpu.getIntStatus();

  fifoCount = mpu.getFIFOCount();

  if ((mpuIntStatus & _BV(MPU6050_INTERRUPT_FIFO_OFLOW_BIT)) || fifoCount >= 1024)
  {
    mpu.resetFIFO();
    fifoCount = mpu.getFIFOCount();
    Serial.println(F("FIFO overflow!"));
  }
  else if (mpuIntStatus & _BV(MPU6050_INTERRUPT_DMP_INT_BIT))
  {
    while (fifoCount < packetSize)
      fifoCount = mpu.getFIFOCount();

    mpu.getFIFOBytes(fifoBuffer, packetSize);

    fifoCount -= packetSize;

    mpu.dmpGetQuaternion(&q, fifoBuffer);
    mpu.dmpGetGravity(&gravity, &q);
    mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);
/*
    Serial.print("y");
    Serial.print(ypr[0] * 180 / M_PI);
    Serial.print(", yp");
    Serial.print(ypr[1] * 180 / M_PI);
    Serial.print(", pr");
    Serial.print(ypr[2] * 180 / M_PI);
    Serial.print("r");
    Serial.println("#");
    */
    sendYPR(ypr);
  }
}
