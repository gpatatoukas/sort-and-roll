import { expect, test } from '@jest/globals';
import { BACKGROUNDS, backgroundUnlocked } from '../../src/config/backgrounds';
test('16 unique scenes with increasing, reachable milestones and both palettes', () => {
  expect(BACKGROUNDS).toHaveLength(16);
  expect(new Set(BACKGROUNDS.map((b) => b.id)).size).toBe(16);
  expect(BACKGROUNDS.map((b) => b.unlockAt)).toEqual([
    0, 5, 10, 15, 25, 40, 60, 80, 100, 125, 150, 175, 200, 250, 300, 365,
  ]);
  BACKGROUNDS.forEach((b, i) => {
    expect(b.dark).toHaveLength(2);
    expect(b.light).toHaveLength(2);
    expect(backgroundUnlocked(i, b.unlockAt)).toBe(true);
    expect(backgroundUnlocked(i, b.unlockAt - 1)).toBe(false);
  });
  expect(backgroundUnlocked(99, 1000)).toBe(false);
  expect(BACKGROUNDS.find((b) => b.id === 'halloween')?.season).toBe('Halloween');
  expect(BACKGROUNDS.find((b) => b.id === 'christmas')?.unlockAt).toBe(80);
});
