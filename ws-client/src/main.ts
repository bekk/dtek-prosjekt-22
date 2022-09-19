import P5 from "p5";

// Creating the sketch itself
const sketch = (p: P5) => {
  let shader: P5.Shader;

  p.preload = () => {
    shader = p.loadShader("src/vert.glsl", "src/frag.glsl");
  };

  p.setup = () => {
    const canvas = p.createCanvas(1920, 1080, p.WEBGL);
    canvas.parent("app");
    p.noStroke();
    p.shader(shader);
  };

  // The sketch draw method
  p.draw = () => {
    p.background("antiquewhite");

    shader.setUniform("uFrameCount", p.frameCount * 2);

    p.rotateX(p.frameCount * 0.02);
    p.rotateY(p.frameCount * 0.01);

    // Draw some geometry to the screen
    // We're going to tessellate the sphere a bit so we have some more geometry to work with
    p.sphere(p.noise(p.frameCount * 0.001) * p.height, 200, 200);
  };
};

new P5(sketch);
