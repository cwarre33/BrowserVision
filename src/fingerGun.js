export function createFingerGun({ fireThreshold = 0.05, releaseThreshold = 0.08 } = {}) {
  let armed = true;

  function update(landmarks, viewport) {
    if (!landmarks) return null;

    const lm4 = landmarks[4];
    const lm5 = landmarks[5];
    const lm6 = landmarks[6];
    const lm8 = landmarks[8];
    if (!lm4 || !lm5 || !lm6 || !lm8) return null;

    // Mirror x so on-screen aim matches user's perspective.
    const tipX = (1 - lm8.x) * viewport.w;
    const tipY = lm8.y * viewport.h;
    const baseX = (1 - lm5.x) * viewport.w;
    const baseY = lm5.y * viewport.h;

    const angle = Math.atan2(tipY - baseY, tipX - baseX);

    const d = Math.hypot(lm4.x - lm5.x, lm4.y - lm5.y);

    // Index must be extended (tip above PIP in image y).
    const indexExtended = lm8.y < lm6.y;

    let fired = false;
    if (armed && d < fireThreshold && indexExtended) {
      armed = false;
      fired = true;
    } else if (!armed && d > releaseThreshold) {
      armed = true;
    }

    return { tip: { x: tipX, y: tipY }, angle, fired, armed };
  }

  return { update };
}
