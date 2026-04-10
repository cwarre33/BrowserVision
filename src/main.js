import { createHandTracker } from './handTracking.js';
import { createFingerGun } from './fingerGun.js';
import { createPhysics } from './physics.js';
import { preCaptureTargets, spawnFromCache } from './vaporize.js';

const video = document.getElementById('cam');
const fx = document.getElementById('fx');
const ctx = fx.getContext('2d');
const hud = document.getElementById('hud');
const reload = document.getElementById('reload');
const reloadBtn = document.getElementById('reloadBtn');

let vw = window.innerWidth;
let vh = window.innerHeight;

function sizeCanvas() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  fx.width = vw * dpr;
  fx.height = vh * dpr;
  fx.style.width = vw + 'px';
  fx.style.height = vh + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvas();

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise((res) => (video.onloadedmetadata = res));
  await video.play();
}

async function main() {
  try {
    await startCamera();
  } catch (e) {
    hud.textContent = 'Camera permission required';
    return;
  }

  hud.textContent = 'Loading model…';
  const tracker = await createHandTracker();

  const physics = createPhysics({ width: vw, height: vh });
  const gun = createFingerGun({});

  hud.textContent = 'Rasterizing targets…';
  await preCaptureTargets(document.querySelectorAll('.target'));

  window.addEventListener('resize', () => {
    sizeCanvas();
    physics.resize(vw, vh);
  });

  reloadBtn.addEventListener('click', () => {
    physics.clear();
    document.querySelectorAll('.target.destroyed').forEach((el) => el.classList.remove('destroyed'));
    reload.hidden = true;
    hud.textContent = 'READY';
  });

  hud.textContent = 'Show your hand';

  let lastVideoTs = -1;
  let sawHand = false;

  function tick() {
    physics.step(1000 / 60);

    let landmarks = null;
    if (video.readyState >= 2 && video.currentTime !== lastVideoTs) {
      lastVideoTs = video.currentTime;
      landmarks = tracker.detect(video, performance.now());
    }
    const state = gun.update(landmarks, { w: vw, h: vh });

    if (state && !sawHand) {
      sawHand = true;
      hud.textContent = 'READY';
    }

    if (state?.fired) {
      const el = document.elementFromPoint(state.tip.x, state.tip.y);
      const target = el?.closest?.('.target:not(.destroyed)');
      if (target) {
        spawnFromCache(target, state.tip, state.angle, physics);
        const remaining = document.querySelectorAll('.target:not(.destroyed)').length;
        if (remaining === 0) reload.hidden = false;
      }
    }

    // Render
    ctx.clearRect(0, 0, vw, vh);

    // Particles
    for (const p of physics.particles) {
      const { x, y } = p.body.position;
      ctx.fillStyle = `rgba(${p.r|0},${p.g|0},${p.b|0},${p.alpha.toFixed(3)})`;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }

    // Laser sight
    if (state) {
      const { tip, angle, armed } = state;
      const len = 320;
      const ex = tip.x + Math.cos(angle) * len;
      const ey = tip.y + Math.sin(angle) * len;
      const grad = ctx.createLinearGradient(tip.x, tip.y, ex, ey);
      grad.addColorStop(0, armed ? 'rgba(255,60,60,0.9)' : 'rgba(120,255,120,0.9)');
      grad.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.fillStyle = armed ? '#ff3c3c' : '#78ff78';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

main();
