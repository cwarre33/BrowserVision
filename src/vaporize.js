import html2canvas from 'html2canvas';

const cache = new WeakMap();

export async function preCaptureTargets(nodeList) {
  for (const el of nodeList) {
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 1,
      logging: false,
    });
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    cache.set(el, {
      data: imageData.data,
      width: canvas.width,
      height: canvas.height,
    });
  }
}

export function spawnFromCache(el, impact, angle, physics) {
  const entry = cache.get(el);
  if (!entry) return;
  const rect = el.getBoundingClientRect();
  const { data, width, height } = entry;
  const sx = rect.width / width;
  const sy = rect.height / height;

  const step = 4;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 128) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gx = rect.left + x * sx;
      const gy = rect.top + y * sy;

      let dx = gx - impact.x;
      let dy = gy - impact.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;

      const speed = 4 + Math.random() * 5;
      const jitter = () => (Math.random() - 0.5) * 2;
      const vx = dx * speed + Math.cos(angle) * 2 + jitter();
      const vy = dy * speed + Math.sin(angle) * 2 + jitter() - 2;

      physics.addParticle(gx, gy, r, g, b, vx, vy);
    }
  }

  el.classList.add('destroyed');
}
