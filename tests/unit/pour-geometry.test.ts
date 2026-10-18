import { expect, test } from '@jest/globals';
import { pourGeometry } from '../../src/features/game/pour-geometry';
test('mouth stays above target and tilt follows left/right travel', () => {
  for (const [source, target, direction] of [
    [{ x: 10, y: 160 }, { x: 180, y: 0 }, 1],
    [{ x: 180, y: 0 }, { x: 10, y: 160 }, -1],
  ] as const) {
    const g = pourGeometry(source, target, 80, 120, 360);
    expect(g.direction).toBe(direction);
    expect(g.angle).toBe(65 * direction);
    const half = (120 + 13) / 2,
      angle = (g.angle * Math.PI) / 180;
    const lipX = g.end.x + (80 * 0.86) / 2 + Math.sin(angle) * half;
    const lipY = g.end.y + half - Math.cos(angle) * half;
    expect(lipX).toBeCloseTo(target.x + 40);
    expect(lipY).toBeCloseTo(target.y + 22 - 24);
    expect(g.liftY).toBeLessThan(g.start.y);
    expect(g.liftY).toBeLessThan(g.end.y);
  }
});
test('vertical pours tilt inward to stay near the board', () => {
  expect(pourGeometry({ x: 10, y: 0 }, { x: 10, y: 160 }, 80, 120, 360).direction).toBe(-1);
  expect(pourGeometry({ x: 250, y: 0 }, { x: 250, y: 160 }, 80, 120, 360).direction).toBe(1);
});
