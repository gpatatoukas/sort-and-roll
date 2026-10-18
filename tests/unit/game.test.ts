import { describe, expect, test } from '@jest/globals';
import {
  clone,
  complete,
  createGame,
  dateKey,
  legalMoves,
  play,
  pour,
  removeColour,
  restart,
  seedFor,
  solve,
  solved,
  stars,
  activatePower,
  weekKey,
  type Board,
  type Mode,
} from '../../src/engine/game';
const board = (...rows: number[][]): Board =>
  rows.map((water) => ({ water, hidden: [], lock: null }));
describe('pouring rules', () => {
  test('largest matching top group, capacity, immutable inputs', () => {
    const before = board([1, 2, 2], [2, 2, 2], []),
      snapshot = clone(before);
    expect(pour(before, 0, 1)).toEqual(board([1, 2], [2, 2, 2, 2], []));
    expect(pour(before, 0, 2)).toEqual(board([1], [2, 2, 2], [2, 2]));
    expect(before).toEqual(snapshot);
  });
  test('invalid targets and sources leave state intact', () => {
    const b = board([1], [2, 2, 2, 2], []);
    for (const [a, c] of [
      [-1, 0],
      [0, 10],
      [0, 0],
      [2, 0],
      [0, 1],
      [1, 0],
    ])
      expect(pour(b, a, c)).toBeNull();
    b[2].lock = 1;
    expect(pour(b, 0, 2)).toBeNull();
    expect(pour(b, 2, 0)).toBeNull();
  });
  test('exposes hidden top and permanently unlocks matching bottles', () => {
    const b = board([2, 1], [1, 1, 1], []);
    b[0].hidden = [0];
    b[2].lock = 1;
    expect(pour(b, 0, 1)).toEqual(board([2], [1, 1, 1, 1], []));
  });
  test('completion needs full bottles', () => {
    expect(complete(board([1, 1])[0])).toBe(false);
    expect(solved(board([1, 1, 1, 1], [], [2, 2, 2, 2]))).toBe(true);
    expect(solved(board([1, 2, 1, 2], [], []))).toBe(false);
    expect(legalMoves(board([1], [2], []))).toEqual([
      [0, 2],
      [1, 2],
    ]);
  });
});
describe('constructive generation', () => {
  for (const mode of ['relaxed', 'challenge', 'daily', 'weekly'] as Mode[])
    test(`${mode} puzzles have a replayable solution across progression`, () => {
      for (const level of [1, 9, 10, 11, 24, 50, 99])
        for (let seed = 1; seed <= 8; seed++) {
          const g = createGame(mode, level, seed);
          expect(g.solution.length).toBeGreaterThan(0);
          expect(solved(g.board)).toBe(false);
          const end = g.solution.reduce((b, m) => {
            const next = pour(b, ...m);
            expect(next).not.toBeNull();
            return next!;
          }, g.board);
          expect(solved(end)).toBe(true);
          expect(createGame(mode, level, seed)).toEqual(g);
        }
    });
  test('first ten challenge levels avoid hidden colours and locks', () => {
    for (let level = 1; level <= 10; level++)
      expect(
        createGame('weekly', level, level).board.every((b) => !b.hidden.length && b.lock === null),
      ).toBe(true);
  });
  test('solver returns executable path and bounded failure', () => {
    const b = board([1, 2, 1, 2], [2, 1, 2, 1], [], []);
    const moves = solve(b)!;
    expect(moves.length).toBeGreaterThan(0);
    expect(solved(moves.reduce((state, move) => pour(state, ...move)!, b))).toBe(true);
    expect(solve(b, 0)).toBeNull();
    expect(solve(board([1, 1, 1, 1], [], []))).toEqual([]);
    expect(solve(board([1, 2, 1, 2], [2, 1, 2, 1], [3, 3, 3, 3]))).toBeNull();
  });
});
describe('sessions and tools', () => {
  test('play, undo, restart and recorded solution', () => {
    const g = createGame('relaxed', 1, 15);
    expect(play(g, [-1, 0])).toBe(g);
    expect(activatePower(g, 'undo')).toBe(g);
    const moved = play(g, g.solution[0]);
    expect(moved.moves).toBe(1);
    expect(moved.solution).toEqual(g.solution.slice(1));
    const undone = activatePower(moved, 'undo');
    expect(undone.board).toEqual(g.board);
    expect(undone.moves).toBe(0);
    expect(restart(moved)).toEqual(g);
    const other = legalMoves(g.board).find(
      (m) => m[0] !== g.solution[0][0] || m[1] !== g.solution[0][1],
    );
    if (other) expect(play(g, other).solution).toEqual([]);
    const end = g.solution.reduce(play, g);
    expect(solved(end.board)).toBe(true);
    expect(play(end, [0, 1])).toBe(end);
    expect(activatePower(end, 'bottle')).toBe(end);
    expect(removeColour(end, 1)).toBe(end);
  });
  test('bottle limits, reveal and removal', () => {
    const g = createGame('challenge', 24, 5);
    const expanded = activatePower(activatePower(g, 'bottle'), 'bottle');
    expect(expanded.board.length).toBe(g.board.length + 2);
    expect(activatePower(expanded, 'bottle')).toBe(expanded);
    const revealed = activatePower(g, 'reveal');
    expect(revealed.board.every((b) => !b.hidden.length)).toBe(true);
    expect(activatePower(revealed, 'reveal')).toBe(revealed);
    expect(activatePower(g, 'hint')).toBe(g);
    const removed = removeColour(g, 1);
    expect(removed.board.every((b) => !b.water.includes(1))).toBe(true);
    expect(removeColour(g, 99)).toBe(g);
    expect(stars({ ...g, moves: g.par })).toBe(3);
    expect(stars({ ...g, moves: Math.ceil(g.par * 1.5) })).toBe(2);
    expect(stars({ ...g, moves: g.par * 2 })).toBe(1);
  });
  test('UTC keys and reproducible string seeds', () => {
    expect(dateKey(new Date('2026-10-18T23:00Z'))).toBe('2026-10-18');
    expect(weekKey(new Date('2026-10-18T23:00Z'))).toBe('2026-10-12');
    expect(weekKey(new Date('2026-10-19T00:00Z'))).toBe('2026-10-19');
    expect(seedFor('daily:2026-10-18')).toBe(seedFor('daily:2026-10-18'));
    expect(seedFor('a')).not.toBe(seedFor('b'));
  });
});

describe('regressions exposed by mutation review', () => {
  test('keeps hidden layers below the newly exposed top and rejects locked sources', () => {
    const b = board([1, 2, 3, 4], [4], []);
    b[0].hidden = [0, 1, 2];
    b[2].lock = 1;
    const copy = clone(b);
    expect(copy).toEqual(b);
    copy[0].hidden.push(3);
    expect(b[0].hidden).toEqual([0, 1, 2]);
    const next = pour(b, 0, 1)!;
    expect(next[0]).toEqual({ water: [1, 2, 3], hidden: [0, 1], lock: null });
    expect(next[2].lock).toBe(1);
    b[0].lock = 2;
    expect(pour(b, 0, 1)).toBeNull();
  });
  test('pins independently reviewed seed-42 opening and difficulty progression', () => {
    const g = createGame('relaxed', 1, 42);
    expect(g.board).toEqual(board([1, 1, 2], [2], [1, 2], [1, 2]));
    expect(g.solution).toEqual([
      [3, 1],
      [1, 2],
      [0, 1],
      [2, 1],
      [2, 0],
      [3, 0],
    ]);
    expect(g.initial).toEqual(g.board);
    expect(g.par).toBe(6);
    expect(g.seed).toBe(42);
    expect(g.level).toBe(1);
    expect(createGame('relaxed', 12, 42).board).toHaveLength(4);
    expect(createGame('relaxed', 13, 42).board).toHaveLength(5);
    expect(createGame('challenge', 15, 42).board).toHaveLength(5);
    expect(createGame('challenge', 16, 42).board).toHaveLength(6);
    const later = createGame('challenge', 24, 42);
    expect(later.board).toEqual([
      { water: [1, 1, 4, 3], hidden: [0, 1, 2], lock: null },
      { water: [2, 2, 4], hidden: [0, 1], lock: null },
      { water: [3, 2], hidden: [0], lock: null },
      { water: [4, 4, 1, 3], hidden: [0, 1, 2], lock: null },
      { water: [2, 1, 3], hidden: [0, 1], lock: null },
      { water: [], hidden: [], lock: 2 },
    ]);
    expect(
      createGame('relaxed', 24, 42).board.every((b) => b.lock === null && !b.hidden.length),
    ).toBe(true);
    expect(createGame('challenge', 25, 42).board.every((b) => !b.hidden.length)).toBe(true);
  });
  test('undo restores the latest of several snapshots and decrements exactly once', () => {
    const g = createGame('relaxed', 1, 42),
      one = play(g, g.solution[0]),
      two = play(one, one.solution[0]);
    const undone = activatePower(two, 'undo');
    expect(undone.board).toEqual(one.board);
    expect(undone.moves).toBe(1);
    expect(undone.history).toEqual([g.board]);
    expect(undone.solution).toEqual([]);
    const many = { ...g, history: Array.from({ length: 100 }, () => clone(g.board)), moves: 100 };
    expect(play(many, g.solution[0]).history).toHaveLength(100);
    const deviation = play(g, [0, 1]);
    expect(deviation.solution).toEqual([]);
    expect(play(deviation, [2, 1]).solution).toEqual([]);
  });
  test('tool transitions preserve other colours and clear stale history', () => {
    const g = createGame('challenge', 24, 42),
      moved = play(g, g.solution[0]);
    const extra = activatePower(moved, 'bottle');
    expect(extra.board).toEqual([...moved.board, { water: [], hidden: [], lock: null }]);
    expect(extra.history).toEqual([]);
    expect(extra.solution).toEqual([]);
    expect(activatePower(moved, 'reveal').history).toEqual([]);
    const custom = { ...g, board: board([1, 2, 1], [2, 3], []), history: [g.board] };
    custom.board[1].lock = 2;
    custom.board[2].lock = 3;
    expect(removeColour(custom, 2)).toEqual({
      ...custom,
      board: [
        { water: [1, 1], hidden: [], lock: null },
        { water: [3], hidden: [], lock: null },
        { water: [], hidden: [], lock: 3 },
      ],
      history: [],
      solution: [],
    });
  });
});
