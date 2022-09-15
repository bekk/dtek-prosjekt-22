#ifndef _WIFICOM_H_
#define _WIFICOM_H_

#include "Arduino.h"

#define WIFI_CONNECT

void connectToWifi();
void sendYPR(float* ypr);
void sendButton(boolean pressed);
void checkWifi();

#endif
