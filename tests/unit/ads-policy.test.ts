import { expect, test } from '@jest/globals';
import {
  completionAds,
  decodeAdProgress,
  earnedPower,
  initialAdProgress,
} from '../../src/policies/ads';
import { fresh, decode, enter, finish } from '../../src/storage/progress';
import { play } from '../../src/engine/game';
const now = new Date('2026-10-18T12:00:00Z');
test('one earned transaction adds exactly one charge, survives reload, and cannot be duplicated', () => {
  const p = fresh(now);
  p.inventory.undo = 0;
  const next = earnedPower(p, 'undo', 'sdk-1');
  expect(next.inventory).toEqual({ undo: 1, hint: 3, bottle: 2, reveal: 2, remove: 1 });
  expect(p.inventory.undo).toBe(0);
  expect(p.ads).toEqual({
    rewardTransactions: [],
    rewardAtCompletion: -1,
    interstitialPending: false,
  });
  expect(next.ads).toEqual({
    rewardTransactions: ['sdk-1'],
    rewardAtCompletion: 0,
    interstitialPending: false,
  });
  const restored = decode(JSON.stringify(next), now);
  expect(earnedPower(restored, 'undo', 'sdk-1')).toBe(restored);
  expect(earnedPower(p, 'hint', '')).toBe(p);
  p.inventory.hint = 9999;
  expect(earnedPower(p, 'hint', 'full')).toBe(p);
  p.inventory.hint = 9998;
  expect(earnedPower(p, 'hint', 'last').inventory.hint).toBe(9999);
});
test('all five tools receive one charge without changing puzzles or level progress', () => {
  const p = enter(fresh(now), 'relaxed');
  for (const tool of ['undo', 'hint', 'bottle', 'reveal', 'remove'] as const) {
    const next = earnedPower(p, tool, tool);
    expect(next.inventory[tool]).toBe(p.inventory[tool] + 1);
    expect(next.games).toBe(p.games);
    expect(next.levels).toBe(p.levels);
    expect(next.completed).toBe(0);
  }
});
test('five completed levels create one natural-break opportunity, rewarded completion suppresses it', () => {
  const initial = initialAdProgress();
  for (const completed of [1, 2, 3, 4, 6, 9, 11])
    expect(completionAds(initial, completed).interstitialPending).toBe(false);
  for (const completed of [5, 10, 15])
    expect(completionAds(initial, completed).interstitialPending).toBe(true);
  expect(completionAds({ ...initial, rewardAtCompletion: 4 }, 5).interstitialPending).toBe(false);
  expect(completionAds({ ...initial, rewardAtCompletion: 3 }, 5).interstitialPending).toBe(true);
  expect(completionAds({ ...initial, interstitialPending: true }, 6).interstitialPending).toBe(
    false,
  );
  let p = enter({ ...fresh(now), completed: 4 }, 'relaxed');
  let game = p.games.relaxed!;
  for (const move of game.solution) game = play(game, move);
  p = { ...p, games: { relaxed: game } };
  const done = finish(p, 'relaxed');
  expect(done.completed).toBe(5);
  expect(done.ads.interstitialPending).toBe(true);
  expect(finish(done, 'relaxed')).toBe(done);
  expect(finish(earnedPower(p, 'undo', 'reward'), 'relaxed').ads.interstitialPending).toBe(false);
});
test('legacy and corrupt ad metadata recover without resetting game progress', () => {
  const p = fresh(now);
  p.completed = 37;
  const legacy = JSON.parse(JSON.stringify(p));
  delete legacy.ads;
  expect(decode(JSON.stringify(legacy), now).completed).toBe(37);
  expect(decode(JSON.stringify(legacy), now).ads).toEqual(initialAdProgress());
  for (const invalid of [
    null,
    1,
    {},
    { rewardTransactions: [3], rewardAtCompletion: 0, interstitialPending: false },
    { rewardTransactions: [''], rewardAtCompletion: 0, interstitialPending: false },
    { rewardTransactions: [], rewardAtCompletion: -2, interstitialPending: false },
    { rewardTransactions: [], rewardAtCompletion: 0.5, interstitialPending: false },
    { rewardTransactions: [], rewardAtCompletion: 0, interstitialPending: 1 },
  ])
    expect(decodeAdProgress(invalid)).toEqual(initialAdProgress());
  const many = Array.from({ length: 1001 }, (_, i) => String(i));
  expect(
    decodeAdProgress({ rewardTransactions: many, rewardAtCompletion: 0, interstitialPending: true })
      .rewardTransactions,
  ).toEqual(many.slice(1));
  const rewarded = earnedPower(
    { ...p, ads: { ...initialAdProgress(), rewardTransactions: many.slice(0, 1000) } },
    'undo',
    'new',
  );
  expect(rewarded.ads.rewardTransactions).toEqual([...many.slice(1, 1000), 'new']);
});

test('valid metadata preserves the no-reward sentinel and rejects mixed transaction arrays', () => {
  const valid = { rewardTransactions: ['kept'], rewardAtCompletion: -1, interstitialPending: true };
  expect(decodeAdProgress(valid)).toEqual(valid);
  expect(decodeAdProgress('metadata')).toEqual(initialAdProgress());
  expect(decodeAdProgress({ ...valid, rewardTransactions: ['kept', 1] })).toEqual(
    initialAdProgress(),
  );
});
