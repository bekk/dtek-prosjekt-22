import P5 from "p5";

type Color = "white" | "black" | "#60dd49";
type ParticleType = "normal" | "eraser" | "accent";

type Particle = {
  x: number;
  y: number;
  angle: number;
  type: ParticleType;
};

const PARTICLE_COUNT = 1000;
const NOISE_ZOOM = 200;

type TypeValues = {
  type: ParticleType;
  color: Color;
  strokeWeight: number;
  typeWeight: number;
};

const TYPE_VALUES: Record<ParticleType, TypeValues> = {
  normal: { type: "normal", color: "black", strokeWeight: 10, typeWeight: 100 },
  eraser: { type: "eraser", color: "white", strokeWeight: 10, typeWeight: 100 },
  accent: { type: "accent", color: "#60dd49", strokeWeight: 30, typeWeight: 1 },
};

const getRandomParticleType = (p: P5) => {
  const values = [TYPE_VALUES["normal"], TYPE_VALUES["accent"], TYPE_VALUES["eraser"]];
  const types = [];
  for (const type of values) {
    for (let i = 0; i < type.typeWeight; i++) {
      types.push(type.type);
    }
  }
  return p.random(types);
};

const updateParticle = (p: P5, particle: Particle) => {
  // Oppdater verdier
  const angle = p.noise(particle.x / NOISE_ZOOM, particle.y / NOISE_ZOOM, p.frameCount / NOISE_ZOOM);

  const STEP = TYPE_VALUES[particle.type].strokeWeight / 4;
  const xStep = particle.x + STEP * p.cos(angle);
  const yStep = particle.y + STEP * p.sin(angle);
  particle.x = xStep;
  particle.y = yStep;

  // Dersom den går utenfor skjermen
  if (particle.x > p.width || particle.y > p.height) {
    particle.x = p.random(p.width);
    particle.y = p.random(p.height);
  }

  // Tegn!
  p.strokeWeight(TYPE_VALUES[particle.type].strokeWeight);
  p.stroke(TYPE_VALUES[particle.type].color);
  p.point(particle.x, particle.y);
};

const sketch = (p: P5) => {
  const particles: Particle[] = [];

  p.setup = () => {
    const canvas = p.createCanvas(1920, 1080);
    canvas.parent("app");
    p.noFill();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = p.random(p.width);
      const y = p.random(p.height);
      const vector = p.createVector(x, y);

      particles.push({
        x,
        y,
        type: getRandomParticleType(p),
        angle: p.TWO_PI * p.noise(vector.x / NOISE_ZOOM, vector.y / NOISE_ZOOM),
      });
    }
  };

  p.draw = () => {
    for (const particle of particles) {
      updateParticle(p, particle);
    }
  };
};

new P5(sketch);
