import Matter from 'matter-js';

export function createPhysics({ width, height }) {
  const engine = Matter.Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  const world = engine.world;

  const floor = Matter.Bodies.rectangle(width / 2, height + 20, width * 2, 40, {
    isStatic: true,
    collisionFilter: { category: 0x0001, mask: 0xffff },
  });
  Matter.World.add(world, floor);

  const particles = [];

  function addParticle(x, y, r, g, b, vx, vy) {
    const body = Matter.Bodies.rectangle(x, y, 3, 3, {
      frictionAir: 0.02,
      restitution: 0.4,
      friction: 0.1,
      collisionFilter: { category: 0x0002, mask: 0x0001 },
    });
    Matter.Body.setVelocity(body, { x: vx, y: vy });
    Matter.World.add(world, body);
    particles.push({ body, r, g, b, alpha: 1, life: 0 });
  }

  function step(dt) {
    Matter.Engine.update(engine, dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.alpha -= 0.008;
      p.life++;
      if (p.alpha <= 0 || p.body.position.y > height + 200) {
        Matter.World.remove(world, p.body);
        particles.splice(i, 1);
      }
    }
  }

  function clear() {
    for (const p of particles) Matter.World.remove(world, p.body);
    particles.length = 0;
  }

  function resize(w, h) {
    width = w;
    height = h;
    Matter.Body.setPosition(floor, { x: w / 2, y: h + 20 });
  }

  return { engine, world, floor, particles, addParticle, step, clear, resize };
}
