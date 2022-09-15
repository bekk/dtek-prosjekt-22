#include "wificom.h"

#ifndef WIFI_CONNECT
  void connectToWifi(){}
  void sendYPR(float* ypr){}
  void checkWifi(){}
#else  
  #include <WiFi.h>
  #include <WiFiUdp.h>
  
  // WiFi network name and password:
  const char * networkName = "Monopoly";
  const char * networkPswd = "jupiter8prophet5";
  const uint64_t chipid = ESP.getEfuseMac();
  
  //IP address to send UDP data to:
  // either use the ip address of the server or
  // a network broadcast address
  const char * udpAddress = "192.168.1.38";
  const int udpPort = 8000;
  
  //Are we currently connected?
  boolean connected = false;
  //The udp library class
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
      udp.print("ypr;");
      udp.print(chipid);
      udp.print(";");
      udp.print(ypr[0] * 180 / M_PI);
      udp.print(";");
      udp.print(ypr[1] * 180 / M_PI);
      udp.print(";");
      udp.print(ypr[2] * 180 / M_PI);
      udp.endPacket();
    }
  }
  
  void checkWifi() {
    if(connected) return;
    reconnectToWifi();
  }

#endif
