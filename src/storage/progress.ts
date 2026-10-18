import {
  initialAdProgress,
  decodeAdProgress,
  completionAds,
  type AdProgress,
} from '../policies/ads';
import { BACKGROUNDS } from '../config/backgrounds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clone,
  createGame,
  dateKey,
  seedFor,
  solved,
  weekKey,
  type Board,
  type Game,
  type Mode,
  type Power,
} from '../engine/game';
export const POWERS: Power[] = ['undo', 'hint', 'bottle', 'reveal', 'remove'];
export type Progress = {
  version: 1;
  ads: AdProgress;
  onboarded: boolean;
  identity: string;
  day: string;
  week: string;
  dailyDone: boolean;
  streak: number;
  lastDaily: string;
  completed: number;
  weeklyLevel: number;
  levels: Record<'relaxed' | 'challenge', number>;
  games: Partial<Record<Mode, Game>>;
  inventory: Record<Power, number>;
  music: boolean;
  sfx: boolean;
  vibration: boolean;
  appearance: 'dark' | 'light';
  theme: number;
  shape: number;
};
export function fresh(now = new Date()): Progress {
  return {
    version: 1,
    ads: initialAdProgress(),
    onboarded: false,
    identity: `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    day: dateKey(now),
    week: weekKey(now),
    dailyDone: false,
    streak: 0,
    lastDaily: '',
    completed: 0,
    weeklyLevel: 1,
    levels: { relaxed: 1, challenge: 1 },
    games: {},
    inventory: { undo: 3, hint: 3, bottle: 2, reveal: 2, remove: 1 },
    music: true,
    sfx: true,
    vibration: true,
    appearance: 'dark',
    theme: 0,
    shape: 0,
  };
}
const integer = (v: unknown, max = 1000000): v is number =>
  Number.isInteger(v) && Number(v) >= 0 && Number(v) <= max;
export function validBoard(v: unknown): v is Board {
  return (
    Array.isArray(v) &&
    v.length >= 3 &&
    v.length <= 10 &&
    v.every(
      (b) =>
        b &&
        typeof b === 'object' &&
        Array.isArray(b.water) &&
        b.water.length <= 4 &&
        b.water.every((c: unknown) => integer(c, 6) && c > 0) &&
        Array.isArray(b.hidden) &&
        b.hidden.every((i: unknown) => integer(i, b.water.length - 1)) &&
        (b.lock === null || (integer(b.lock, 6) && b.lock > 0)),
    )
  );
}
export function validGame(v: unknown, mode: Mode): v is Game {
  if (!v || typeof v !== 'object') return false;
  const g = v as Game;
  return (
    g.mode === mode &&
    integer(g.level) &&
    g.level > 0 &&
    integer(g.seed, 4294967295) &&
    validBoard(g.board) &&
    validBoard(g.initial) &&
    integer(g.moves) &&
    integer(g.par) &&
    g.par > 0 &&
    Array.isArray(g.history) &&
    g.history.length <= 100 &&
    g.history.every(validBoard) &&
    Array.isArray(g.solution) &&
    g.solution.length <= 200 &&
    g.solution.every(
      (m) => Array.isArray(m) && m.length === 2 && m.every((i) => integer(i, g.board.length - 1)),
    )
  );
}
export function rollover(p: Progress, now: Date): Progress {
  let next = p;
  if (p.day !== dateKey(now)) {
    next = { ...next, day: dateKey(now), dailyDone: false, games: { ...next.games } };
    delete next.games.daily;
  }
  if (p.week !== weekKey(now)) {
    next = { ...next, week: weekKey(now), weeklyLevel: 1, games: { ...next.games } };
    delete next.games.weekly;
  }
  return next;
}
export function decode(raw: string | null, now = new Date()): Progress {
  const fallback = fresh(now);
  if (!raw) return fallback;
  try {
    const p: Progress = JSON.parse(raw);
    if (
      !p ||
      p.version !== 1 ||
      typeof p.identity !== 'string' ||
      !p.identity ||
      typeof p.day !== 'string' ||
      typeof p.week !== 'string' ||
      typeof p.dailyDone !== 'boolean' ||
      !integer(p.completed) ||
      !integer(p.streak) ||
      typeof p.lastDaily !== 'string' ||
      !integer(p.weeklyLevel, 100) ||
      p.weeklyLevel < 1 ||
      !p.levels ||
      !integer(p.levels.relaxed) ||
      p.levels.relaxed < 1 ||
      !integer(p.levels.challenge) ||
      p.levels.challenge < 1 ||
      !p.inventory ||
      !POWERS.every((k) => integer(p.inventory[k], 9999)) ||
      typeof p.vibration !== 'boolean' ||
      !integer(p.theme, BACKGROUNDS.length - 1) ||
      !integer(p.shape, 2) ||
      !p.games ||
      typeof p.games !== 'object'
    )
      return fallback;
    const games: Progress['games'] = {};
    for (const mode of ['relaxed', 'challenge', 'daily', 'weekly'] as Mode[]) {
      const g = p.games[mode];
      const expected = mode === 'weekly' ? p.weeklyLevel : mode === 'daily' ? 25 : p.levels[mode];
      if (validGame(g, mode) && g.level === expected) games[mode] = g;
    }
    return rollover(
      {
        ...p,
        ads: decodeAdProgress(p.ads),
        games,
        onboarded: p.onboarded === true,
        music: typeof p.music === 'boolean' ? p.music : true,
        sfx: typeof p.sfx === 'boolean' ? p.sfx : true,
        appearance: p.appearance === 'light' ? 'light' : 'dark',
      },
      now,
    );
  } catch {
    return fallback;
  }
}
export function enter(p: Progress, mode: Mode): Progress {
  if (p.games[mode]) return p;
  const level = mode === 'weekly' ? p.weeklyLevel : mode === 'daily' ? 25 : p.levels[mode];
  const id = mode === 'daily' ? p.day : mode === 'weekly' ? `${p.identity}:${p.week}` : p.identity;
  return {
    ...p,
    games: { ...p.games, [mode]: createGame(mode, level, seedFor(`${mode}:${id}:${level}`)) },
  };
}
export function finish(p: Progress, mode: Mode): Progress {
  const game = p.games[mode];
  if (!game || !solved(game.board) || (mode === 'daily' && p.dailyDone)) return p;
  const games = { ...p.games };
  delete games[mode];
  const completed = p.completed + 1;
  const inventory = { ...p.inventory };
  if (completed % 10 === 0 || mode === 'daily')
    inventory[POWERS[seedFor(`${p.identity}:${completed}`) % POWERS.length]]++;
  const next = {
    ...p,
    ads: completionAds(p.ads, completed),
    games,
    inventory,
    completed,
    levels: { ...p.levels },
  };
  if (mode === 'relaxed' || mode === 'challenge') next.levels[mode]++;
  if (mode === 'weekly') next.weeklyLevel++;
  if (mode === 'daily') {
    const previous = new Date(`${p.day}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    next.dailyDone = true;
    next.streak = p.lastDaily === dateKey(previous) ? p.streak + 1 : 1;
    next.lastDaily = p.day;
  }
  return next;
}
const KEY = 'sort-and-roll/progress/v1';
let tail: Promise<unknown> = Promise.resolve();
export const load = async () => {
  await tail.catch(() => undefined);
  return decode(await AsyncStorage.getItem(KEY));
};
export function save(p: Progress): Promise<void> {
  // Capture now; callers may already be rendering a newer state when this runs.
  const snapshot = JSON.stringify(p);
  const write = tail.catch(() => undefined).then(() => AsyncStorage.setItem(KEY, snapshot));
  tail = write;
  return write;
}
export function resetGame(g: Game): Game {
  return {
    ...g,
    board: clone(g.initial),
    history: [],
    moves: 0,
    solution: createGame(g.mode, g.level, g.seed).solution,
  };
}
