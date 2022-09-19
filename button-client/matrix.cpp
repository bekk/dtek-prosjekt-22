#include <Adafruit_GFX.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_NeoPixel.h>
#include "pins.h"
#include "matrix.h"

// MATRIX DECLARATION:
// Parameter 1 = width of NeoPixel matrix
// Parameter 2 = height of matrix
// Parameter 3 = pin number (most are valid)
// Parameter 4 = matrix layout flags, add together as needed:
//   NEO_MATRIX_TOP, NEO_MATRIX_BOTTOM, NEO_MATRIX_LEFT, NEO_MATRIX_RIGHT:
//     Position of the FIRST LED in the matrix; pick two, e.g.
//     NEO_MATRIX_TOP + NEO_MATRIX_LEFT for the top-left corner.
//   NEO_MATRIX_ROWS, NEO_MATRIX_COLUMNS: LEDs are arranged in horizontal
//     rows or in vertical columns, respectively; pick one or the other.
//   NEO_MATRIX_PROGRESSIVE, NEO_MATRIX_ZIGZAG: all rows/columns proceed
//     in the same order, or alternate lines reverse direction; pick one.
//   See example below for these values in action.
// Parameter 5 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)

#define arr_len( x )  ( sizeof( x ) / sizeof( *x ) ) // Calculation of Array Size;

namespace matrix {
  
  int matrixW = 8;
  int matrixH = 8;
  #define PIN  // OUTPUT PIN FROM ARDUINO TO MATRIX D-In
  
  Adafruit_NeoMatrix matrix = Adafruit_NeoMatrix(matrixW, matrixH, PIN_NEOPIXEL,
                              NEO_MATRIX_TOP     + NEO_MATRIX_LEFT +
                              NEO_MATRIX_COLUMNS + NEO_MATRIX_ZIGZAG,
                              NEO_GRB            + NEO_KHZ800);
  
  const uint16_t colors[] = {
    matrix.Color(255, 0, 0), 
    matrix.Color(0, 255, 0), 
    matrix.Color(255, 255, 0), 
    matrix.Color(0, 0, 255), 
    matrix.Color(255, 0, 255),
    matrix.Color(0, 255, 255), 
    matrix.Color(255, 255, 255)
  }; 
  int colorsAvailable = arr_len(colors);
  
   // Width of Standard Font Characters is 8X6 Pixels
  const int pixelPerChar = 6;

  int currentCursor = matrix.width();
  int currentColor = 0;
  String currMsg;
  int msgSize;
  int scrollingMax;
  boolean isScrolling;

  // frame stuff
  unsigned long lastUpdate = 0;
  const int frameDelay = 40;
  
  void init() {
    matrix.begin();
    matrix.setTextWrap(false);
    matrix.setBrightness(5);
    matrix.setTextColor(colors[0]);
  }

  void update() {
    if(isScrolling) return;
    char exampleText[] = "Shake it!";
    writeText(exampleText, 0);
  }

  void nextFrame() {
        // BLANK the Entire Screen;
    matrix.fillScreen(0); 

    // Set Starting Point for Text String;
    matrix.setCursor(currentCursor, 0); 

    // Set the Message String;
    matrix.print(currMsg); 

    // Scroll text from right to left by moving the cursor pointer
    if (--currentCursor < -scrollingMax ) {
      isScrolling = false;
    }

    // DISPLAY the Text/Image
    matrix.show(); 
  }

  void redraw() {
    if(isScrolling && millis() - lastUpdate > frameDelay) {
      lastUpdate = millis();
      nextFrame(); 
    }
  }
    
  void writeText(String msg, int colorIndex) {

    currMsg = msg;
    msgSize = msg.length() * pixelPerChar + 2 * pixelPerChar;
    scrollingMax = msgSize + matrix.width(); 

    currentColor = colorIndex;
    matrix.setTextColor(colors[currentColor]);    
    isScrolling = true;

    // Reset Cursor Position and Start Text String at New Position on the Far Right;
    currentCursor = matrix.width();   
  }
}
