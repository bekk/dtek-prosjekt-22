import P5 from "p5";

type Shape = {
  x: number;
  y: number;
  size: number;
  fill: string;
};

// Creating the sketch itself
const sketch = (p: P5) => {
  const li: Shape[] = [];

  p.setup = () => {
    // Creating and positioning the canvas
    const canvas = p.createCanvas(1920, 1080);
    canvas.parent("app");

    // Configuring the canvas
    p.background("antiquewhite");
    p.strokeWeight(10);

    for (let i = 0; i < 1000; i++) {
      li.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: 100,
        fill: p.random(["#5C4B51", "#8CBEB2", "#F2EBBF", "#F3B562", "#F06060"]),
      });
    }
  };

  // The sketch draw method
  p.draw = () => {
    for (const shape of li) {
      p.fill(shape.fill);
      p.circle(shape.x, shape.y, p.noise(shape.x * 0.005, shape.y * 0.005) * shape.size);
    }
  };
};

new P5(sketch);
