#include "wificom.h"
#include "Arduino.h"
#include "matrix.h"

#define CMD_PING 0

#ifndef WIFI_CONNECT
  void connectToWifi(){}
  void sendYPR(float* ypr){}
  void checkWifi(){}
  void sendButton(boolean pressed) {}
#else  
  #include <WiFi.h>
  #include <WiFiUdp.h>

  const uint64_t chipid = ESP.getEfuseMac();
  
  // WiFi network name and password:
  const char * networkName = "Monopoly";
  const char * networkPswd = "jupiter8prophet5";
  
  
  // IP address to send UDP data to:
  // Either use the ip address of the server or
  // a network broadcast address
  const char * udpAddress = "192.168.1.38";
  const int udpPort = 8000;

  char incomingPacket[256];  
  boolean connected = false;
  WiFiUDP udp;
  
  //wifi event handler
  void WiFiEvent(WiFiEvent_t event){
      switch(event) {
        case ARDUINO_EVENT_WIFI_STA_GOT_IP:
            //When connected set
            Serial.print("WiFi connected! IP address: ");
            Serial.println(WiFi.localIP());
            //initializes the UDP state
            //This initializes the transfer buffer
            udp.begin(WiFi.localIP(),udpPort);
            connected = true;
            break;
        case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
            Serial.println("WiFi lost connection");
            connected = false;
            connectToWifi();
            break;
        default: break;
      }
  }
  
  void connectToWifi(){
    Serial.println("Connecting to WiFi network: " + String(networkName));
  
    // delete old config
    WiFi.disconnect(true);
    //register event handler
    WiFi.onEvent(WiFiEvent);
  
    //Initiate connection
    WiFi.begin(networkName, networkPswd);
  
    Serial.println("Waiting for WIFI connection...");
  }
  
  unsigned long lastWifiConnectionTry = 0;
  unsigned long intervalBetweenWifiRetries = 5000;
  
  void reconnectToWifi() {
    unsigned long currentMillis = millis();
    if (!connected && (currentMillis - lastWifiConnectionTry >= intervalBetweenWifiRetries)) {
      Serial.print(millis());
      Serial.println("Reconnecting to WiFi...");
      connectToWifi();
      lastWifiConnectionTry = currentMillis;
    }
  }
  
  void sendYPR(float* ypr) {  
    if(connected){
      //Send a packet
      udp.beginPacket(udpAddress,udpPort);
      udp.print(chipid);
      udp.print(";");      
      udp.print("ypr;");
      udp.print(ypr[0] * 180 / M_PI);
      udp.print(";");
      udp.print(ypr[1] * 180 / M_PI);
      udp.print(";");
      udp.print(ypr[2] * 180 / M_PI);
      udp.endPacket();
    }
  }

  void sendButton(boolean pressed) {  
    if(connected){
      //Send a packet
      udp.beginPacket(udpAddress,udpPort);
      udp.print(chipid);
      udp.print(";");      
      udp.print("btn;");
      udp.print(pressed ? 1 : 0);
      udp.endPacket();
    }
  }

  
  void checkWifi() {
    if(connected) return;
    reconnectToWifi();
  }

  void receive() {
    int packetSize = udp.parsePacket();
    if (packetSize) {
      Serial.printf("Received %d bytes from %s, port %d\n", packetSize, udp.remoteIP().toString().c_str(), udp.remotePort());
      int len = udp.read(incomingPacket, 255);
      if (len > 0) {
        incomingPacket[len] = '\0';
      }

      // TODO: move elsewhere
      if(incomingPacket[0] == CMD_PING){
        matrix::allOn(3, 300);
        Serial.println("all on");
      }

      Serial.printf("UDP packet contents: %s\n", incomingPacket);
    }  
  }

#endif
