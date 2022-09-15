/*
 * Required external libs:
 * - Adafruit Neopixel
 * - Button
 */

#include <Adafruit_NeoPixel.h>
#include <Button.h>
#include "wificom.h"
#include "movement.h"
#include "stdint.h"
#include "pins.h"

#define NUMPIXELS 1


Adafruit_NeoPixel pixels(NUMPIXELS, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
Button button(PIN_BUTTON);

void setup()
{
  Serial.begin(115200);
  Serial.println(F("Button client starting..."));

  connectToWifi();
  
  pinMode(PIN_BUTTON, INPUT); // button
  pinMode(PIN_BUTTON_LED, OUTPUT); // button LED
  pinMode(PIN_INTERRUPT, INPUT);
  pinMode(21, OUTPUT);
  digitalWrite(21, LOW);

  pixels.begin();
  pixels.setBrightness(20);

  button.begin();
  
  movement::init();
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
short state = 0;
uint32_t col = 0;
void loop()
{
  checkWifi();
  
  if (button.toggled()) {
    if (button.read() == Button::PRESSED) {
      sendButton(true);
      Serial.println("Button has been pressed");
    } else {
      sendButton(false);
      Serial.println("Button has been released");
    }      
  }

  movement::poll(&pixels);
  
}
