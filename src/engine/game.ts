export const CAPACITY = 4;
export type Mode = 'relaxed' | 'challenge' | 'daily' | 'weekly';
export type Power = 'undo' | 'hint' | 'bottle' | 'reveal' | 'remove';
export type Move = readonly [number, number];
export type Bottle = { water: number[]; hidden: number[]; lock: number | null };
export type Board = Bottle[];
export type Game = {
  mode: Mode;
  level: number;
  seed: number;
  board: Board;
  initial: Board;
  history: Board[];
  moves: number;
  par: number;
  solution: Move[];
};
export const clone = (board: Board): Board =>
  board.map((b) => ({ ...b, water: [...b.water], hidden: [...b.hidden] }));
export const complete = (b: Bottle) =>
  b.water.length === CAPACITY && b.water.every((c) => c === b.water[0]);
export const solved = (board: Board) => board.every((b) => b.water.length === 0 || complete(b));
export function pour(board: Board, from: number, to: number): Board | null {
  const a = board[from],
    b = board[to];
  if (
    !a ||
    !b ||
    from === to ||
    a.lock !== null ||
    b.lock !== null ||
    !a.water.length ||
    b.water.length === CAPACITY
  )
    return null;
  const colour = a.water[a.water.length - 1];
  if (b.water.length && b.water[b.water.length - 1] !== colour) return null;
  let run = 1;
  while (a.water[a.water.length - run - 1] === colour) run++;
  const count = Math.min(run, CAPACITY - b.water.length);
  const next = clone(board);
  next[from].water.splice(-count);
  next[from].hidden = next[from].hidden.filter((i) => i < next[from].water.length - 1);
  next[to].water.push(...Array<number>(count).fill(colour));
  const completed = new Set(next.filter(complete).map((bottle) => bottle.water[0]));
  next.forEach((bottle) => {
    if (bottle.lock !== null && completed.has(bottle.lock)) bottle.lock = null;
  });
  return next;
}
export function legalMoves(board: Board): Move[] {
  const moves: Move[] = [];
  board.forEach((_, a) =>
    board.forEach((__, b) => {
      if (pour(board, a, b)) moves.push([a, b]);
    }),
  );
  return moves;
}
const key = (board: Board) =>
  board
    .map((b) => `${b.lock ?? 'x'}:${b.water.join('')}`)
    .sort()
    .join('|');
// Bounded DFS; bottle permutation symmetry dramatically reduces duplicate states.
export function solve(board: Board, budget = 16000): Move[] | null {
  const visited = new Set<string>();
  let remaining = budget;
  function search(current: Board, path: Move[]): Move[] | null {
    if (solved(current)) return path;
    if (--remaining < 0 || path.length > 90) return null;
    const state = key(current);
    if (visited.has(state)) return null;
    visited.add(state);
    const moves = legalMoves(current).filter(
      ([a, b]) => !(complete(current[a]) && !current[b].water.length),
    );
    moves.sort((a, b) => current[b[1]].water.length - current[a[1]].water.length);
    for (const move of moves) {
      const next = pour(current, ...move)!;
      const found = search(next, [...path, move]);
      if (found) return found;
    }
    return null;
  }
  return search(board, []);
}
export function createGame(mode: Mode, level: number, seed: number): Game {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const difficulty =
    mode === 'relaxed'
      ? Math.min(6, 2 + Math.floor((level - 1) / 12))
      : Math.min(6, 3 + Math.floor((level - 1) / 15));
  let board: Board = Array.from({ length: difficulty + 2 }, (_, i) => ({
    water: i < difficulty ? Array<number>(4).fill(i + 1) : [],
    hidden: [],
    lock: null,
  }));
  let solution: Move[] = [];
  const seen = new Set<string>([key(board)]);
  // Only accept a reverse step if an actual maximum-run pour exactly restores
  // its predecessor. Reversing the recorded steps is a constructive proof.
  const levelRamp = mode === 'relaxed' ? Math.min(18, Math.floor((level - 1) / 4)) : 0;
  for (let step = 0; step < 18 + difficulty * 7 + levelRamp; step++) {
    const candidates: { board: Board; move: Move }[] = [];
    for (let a = 0; a < board.length; a++)
      for (let b = 0; b < board.length; b++) {
        if (a === b || !board[a].water.length || board[b].water.length === CAPACITY) continue;
        const colour = board[a].water.at(-1)!;
        for (
          let count = 1;
          count <= Math.min(board[a].water.length, CAPACITY - board[b].water.length);
          count++
        ) {
          if (!board[a].water.slice(-count).every((c) => c === colour)) break;
          const candidate = clone(board);
          candidate[a].water.splice(-count);
          candidate[b].water.push(...Array<number>(count).fill(colour));
          if (seen.has(key(candidate))) continue;
          const restored = pour(candidate, b, a);
          if (restored && JSON.stringify(restored) === JSON.stringify(board))
            candidates.push({ board: candidate, move: [b, a] });
        }
      }
    if (!candidates.length) break;
    const chosen = candidates[Math.floor(random() * candidates.length)];
    board = chosen.board;
    seen.add(key(board));
    solution.unshift(chosen.move);
  }
  if (
    mode === 'daily' ||
    (mode === 'challenge' && level > 10) ||
    (mode === 'relaxed' && level >= 25)
  ) {
    const locked = clone(board);
    const target = locked.findIndex((b) => b.water.length === 0);
    if (target >= 0) {
      locked[target].lock = 1 + Math.floor(random() * difficulty);
      const path = solve(locked, 5000);
      if (path) {
        board = locked;
        solution = path;
      }
    }
    if (
      (mode === 'daily' && level >= 25) ||
      (level % 3 === 0 && (mode === 'challenge' || level >= 25))
    )
      board = board.map((b) => ({ ...b, hidden: b.water.map((_, i) => i).slice(0, -1) }));
  }
  return {
    mode,
    level,
    seed,
    board,
    initial: clone(board),
    moves: 0,
    history: [],
    par: Math.max(1, solution.length),
    solution,
  };
}
export function play(game: Game, move: Move): Game {
  if (solved(game.board)) return game;
  const next = pour(game.board, ...move);
  if (!next) return game;
  const follows = game.solution[0]?.[0] === move[0] && game.solution[0]?.[1] === move[1];
  return {
    ...game,
    board: next,
    moves: game.moves + 1,
    history: [...game.history, clone(game.board)].slice(-100),
    solution: follows ? game.solution.slice(1) : [],
  };
}
export function restart(game: Game): Game {
  return createGame(game.mode, game.level, game.seed);
}
export function activatePower(game: Game, power: Power): Game {
  if (solved(game.board)) return game;
  if (power === 'undo') {
    const board = game.history.at(-1);
    return board
      ? {
          ...game,
          board: clone(board),
          moves: Math.max(0, game.moves - 1),
          history: game.history.slice(0, -1),
          solution: [],
        }
      : game;
  }
  if (power === 'bottle')
    return game.board.length < game.initial.length + 2
      ? {
          ...game,
          board: [...clone(game.board), { water: [], hidden: [], lock: null }],
          solution: [],
          history: [],
        }
      : game;
  if (power === 'reveal')
    return game.board.some((b) => b.hidden.length)
      ? { ...game, board: game.board.map((b) => ({ ...b, hidden: [] })), history: [] }
      : game;
  return game;
}
export function removeColour(game: Game, colour: number): Game {
  if (solved(game.board) || !game.board.some((b) => b.water.includes(colour))) return game;
  const board = game.board.map((b) => ({
    water: b.water.filter((c) => c !== colour),
    hidden: [],
    lock: b.lock === colour ? null : b.lock,
  }));
  return { ...game, board, history: [], solution: [] };
}
export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
export function weekKey(date: Date) {
  const d = new Date(`${dateKey(date)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return dateKey(d);
}
export function seedFor(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function stars(game: Game) {
  return game.moves <= game.par ? 3 : game.moves <= Math.ceil(game.par * 1.5) ? 2 : 1;
}
