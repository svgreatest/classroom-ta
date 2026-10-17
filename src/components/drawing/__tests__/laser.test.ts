import { describe, it, expect } from 'vitest';
import { laserOpacity, laserExpired, LASER_HOLD_MS, LASER_FADE_MS } from '../laser';

describe('laserOpacity', () => {
  it('is fully visible while a stroke is being drawn', () => {
    expect(laserOpacity(null, 123456)).toBe(1);
  });

  it('stays fully visible during the hold period after the pen lifts', () => {
    expect(laserOpacity(1000, 1000)).toBe(1);
    expect(laserOpacity(1000, 1000 + LASER_HOLD_MS)).toBe(1);
  });

  it('fades linearly after the hold period', () => {
    const mid = 1000 + LASER_HOLD_MS + LASER_FADE_MS / 2;
    expect(laserOpacity(1000, mid)).toBeCloseTo(0.5, 5);
  });

  it('is gone once the fade completes', () => {
    const end = 1000 + LASER_HOLD_MS + LASER_FADE_MS;
    expect(laserOpacity(1000, end)).toBe(0);
    expect(laserExpired(1000, end)).toBe(true);
    expect(laserExpired(1000, end - 1)).toBe(false);
  });
});
