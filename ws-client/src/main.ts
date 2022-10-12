import P5 from "p5";

const STROKE = "black";
const STROKE_WEIGHT = 10;
const SIZE = 800;
const POINT_COUNT = 0;
const POINT_SIZE = 5;

const LINE_COUNT = 3;
const LINE_WIDTH = 10;
const LINE_GAP = 0; // Dette kjører så dritt at det ikke er verdt det
const LINE_SPEED_X = 0;
const LINE_SPEED_Y = 0;
const LINE_ROTATION_SPEED = 2;

const sketch = (p: P5) => {
  p.setup = () => {
    const canvas = p.createCanvas(1920, 1080);
    canvas.parent("app");
    p.strokeWeight(STROKE_WEIGHT);
    p.rectMode(p.CENTER);
    p.stroke(STROKE);
  };

  const drawStuff = (x1: number, y1: number, x2: number, y2: number) => {
    for (let i = 0; i < POINT_COUNT; i++) {
      p.point(p.random(x1, x2), p.random(y1, y2));
    }

    const pixelsPerLine = (y2 - y1) / LINE_COUNT;
    const offset = (p.frameCount * LINE_SPEED_Y) % pixelsPerLine;
    p.push();

    p.rotate((p.frameCount / 100) * LINE_ROTATION_SPEED);
    const ymax = y2 - y1;
    const ymin = ymax / 2;
    const xdiff = x2 - x1;

    for (let i = -ymin; i < ymax + ymin; i += pixelsPerLine) {
      p.drawingContext.setLineDash([LINE_WIDTH, LINE_GAP]);
      p.drawingContext.lineDashOffset = -p.frameCount * LINE_SPEED_X;
      p.line(x1 - xdiff, y1 + i + offset, x2 + xdiff, y1 + i + offset);
    }
  };

  const cleanWhitespace = () => {
    p.noStroke();
    p.rect((p.width - SIZE) / 4, p.height / 2, (p.width - SIZE) / 2, p.height);
    p.rect(p.width - (p.width - SIZE) / 4, p.height / 2, (p.width - SIZE) / 2, p.height);
    p.rect(p.width / 2, p.height - (p.height - SIZE) / 4, p.width, (p.height - SIZE) / 2);
    p.rect(p.width / 2, (p.height - SIZE) / 4, p.width, (p.height - SIZE) / 2);
    p.stroke(STROKE);
  };

  p.draw = () => {
    p.push();
    p.translate(p.width / 2, p.height / 2);

    p.background("white");

    p.strokeWeight(STROKE_WEIGHT);
    p.drawingContext.setLineDash([]);
    p.rect(0, 0, SIZE);

    p.strokeWeight(POINT_SIZE);
    drawStuff(-SIZE / 2, -SIZE / 2, SIZE / 2, SIZE / 2);

    p.pop();
    p.pop();
    cleanWhitespace();
  };
};

new P5(sketch);
