#ifndef _MATRIX_H_
#define _MATRIX_H_

namespace matrix {
  void init();
  void redraw();

  void reset();
  void update();
  void writeText(String msg, int colorIndex);
  void allOn(int colorIndex, int time);

}

#endif
