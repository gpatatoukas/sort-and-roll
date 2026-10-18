import { beforeEach, describe, expect, jest, test } from '@jest/globals';
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { play, type Game } from '../../src/engine/game';
import {
  decode,
  enter,
  finish,
  fresh,
  load,
  resetGame,
  rollover,
  save,
  validBoard,
  validGame,
} from '../../src/storage/progress';
const now = new Date('2026-10-18T12:00Z');
beforeEach(() => {
  jest.clearAllMocks();
});
describe('progress', () => {
  test('validates saves and isolates malformed sessions', () => {
    const p = enter(fresh(now), 'relaxed');
    expect(decode(JSON.stringify(p), now)).toEqual(p);
    for (const raw of [
      null,
      '{',
      '{}',
      'null',
      JSON.stringify({ ...p, version: 99 }),
      JSON.stringify({ ...p, inventory: { ...p.inventory, undo: -1 } }),
    ])
      expect(decode(raw, now).version).toBe(1);
    expect(decode(JSON.stringify({ ...p, games: { relaxed: { nope: true } } }), now).games).toEqual(
      {},
    );
    expect(validBoard([{}, {}, {}])).toBe(false);
    expect(validBoard(null)).toBe(false);
    expect(validGame(null, 'relaxed')).toBe(false);
    expect(validBoard([{ water: [8], hidden: [], lock: null }, {}, {}])).toBe(false);
  });
  test('mode isolation and daily shared seed', () => {
    const a = enter(enter(fresh(now), 'relaxed'), 'daily');
    expect(enter(a, 'relaxed')).toBe(a);
    expect(a.games.daily).toEqual(enter(fresh(now), 'daily').games.daily);
    expect(a.games.relaxed?.mode).toBe('relaxed');
  });
  test('daily and Monday rollover leave normal modes intact', () => {
    const p = enter(enter(enter(fresh(now), 'daily'), 'weekly'), 'relaxed');
    const next = rollover(p, new Date('2026-10-19T00:00Z'));
    expect(next.games.daily).toBeUndefined();
    expect(next.games.weekly).toBeUndefined();
    expect(next.games.relaxed).toEqual(p.games.relaxed);
    expect(next.weeklyLevel).toBe(1);
    expect(rollover(p, now)).toBe(p);
  });
  test('complete once, earn tool, streak and restart free', () => {
    let p = enter(fresh(now), 'daily');
    expect(finish(p, 'weekly')).toBe(p);
    expect(finish(p, 'daily')).toBe(p);
    const g = p.games.daily!;
    const won = g.solution.reduce(play, g);
    p = { ...p, games: { daily: won }, lastDaily: '2026-10-17', streak: 2 };
    const done = finish(p, 'daily');
    expect(done.dailyDone).toBe(true);
    expect(done.streak).toBe(3);
    expect(done.completed).toBe(1);
    expect(Object.values(done.inventory).reduce((a, b) => a + b)).toBe(12);
    expect(finish(done, 'daily')).toBe(done);
    expect(resetGame(play(g, g.solution[0]))).toEqual(g);
  });
  test('normal and weekly advancement and tenth completion reward', () => {
    for (const mode of ['relaxed', 'challenge', 'weekly'] as const) {
      const p = enter({ ...fresh(now), completed: 9 }, mode);
      const g = p.games[mode] as Game;
      const done = finish({ ...p, games: { [mode]: g.solution.reduce(play, g) } }, mode);
      expect(done.completed).toBe(10);
      expect(mode === 'weekly' ? done.weeklyLevel : done.levels[mode]).toBe(2);
      expect(Object.values(done.inventory).reduce((a, b) => a + b)).toBe(12);
    }
  });
  test('writes in order and recovers after a write failure', async () => {
    let release: () => void = () => undefined;
    jest.mocked(AsyncStorage.setItem).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const p = fresh(now),
      one = save(p),
      two = save({ ...p, completed: 1 });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([one, two]);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk'));
    await expect(save(p)).rejects.toThrow('disk');
    await save(p);
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(p));
    expect(await load()).toEqual(p);
  });
});

test('new and legacy saves default to dark; explicit light choice survives restore', () => {
  const p = enter(fresh(now), 'relaxed');
  expect(p.appearance).toBe('dark');
  const legacy = { ...p, appearance: undefined };
  const migrated = decode(JSON.stringify(legacy), now);
  expect(migrated.appearance).toBe('dark');
  expect(migrated.games.relaxed).toEqual(p.games.relaxed);
  expect(decode(JSON.stringify({ ...p, appearance: 'light' }), now).appearance).toBe('light');
  expect(decode(JSON.stringify({ ...p, appearance: 'invalid' }), now).games).toEqual(p.games);
});

test('audio preferences migrate without losing progress and all scene indices restore', () => {
  const p = enter(fresh(now), 'relaxed');
  const legacy = { ...p, music: undefined, sfx: undefined };
  const restored = decode(JSON.stringify(legacy), now);
  expect(restored.music).toBe(true);
  expect(restored.sfx).toBe(true);
  expect(restored.games).toEqual(p.games);
  const muted = decode(
    JSON.stringify({ ...p, music: false, sfx: false, vibration: false, theme: 15 }),
    now,
  );
  expect(muted.music).toBe(false);
  expect(muted.sfx).toBe(false);
  expect(muted.vibration).toBe(false);
  expect(muted.theme).toBe(15);
  expect(muted.games).toEqual(p.games);
});
