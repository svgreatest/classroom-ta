// Laser pointer timing, Goodnotes-style: every laser stroke stays fully visible
// while the presenter keeps drawing, then all of them fade out together shortly
// after the last stroke ends. Nothing here is persisted.

export const LASER_HOLD_MS = 900;   // fully visible after the pen lifts
export const LASER_FADE_MS = 450;   // then fades to nothing over this long

// Opacity of the laser layer. `lastActivity` is when the pen last moved or
// lifted; pass null while a stroke is still being drawn.
export function laserOpacity(lastActivity: number | null, now: number): number {
  if (lastActivity === null) return 1;
  const idle = now - lastActivity;
  if (idle <= LASER_HOLD_MS) return 1;
  const fade = (idle - LASER_HOLD_MS) / LASER_FADE_MS;
  return fade >= 1 ? 0 : 1 - fade;
}

export function laserExpired(lastActivity: number | null, now: number): boolean {
  return laserOpacity(lastActivity, now) === 0;
}
