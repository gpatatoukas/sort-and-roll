export const MAX_LIVES = 4;
export const LIFE_REFILL_MS = 30 * 60 * 1000;
const MAX_RECEIPTS = 500;

export type Lives = {
  count: number;
  nextLifeAt: number | null;
  failedAttempts: string[];
  rewardTransactions: string[];
};

export function initialLives(): Lives {
  return { count: MAX_LIVES, nextLifeAt: null, failedAttempts: [], rewardTransactions: [] };
}

export function decodeLives(value: unknown): Lives {
  if (!value || typeof value !== 'object') return initialLives();
  const lives = value as Partial<Lives>;
  if (
    !Number.isInteger(lives.count) ||
    lives.count! < 0 ||
    lives.count! > MAX_LIVES ||
    (lives.nextLifeAt !== null &&
      (!Number.isSafeInteger(lives.nextLifeAt) || Number(lives.nextLifeAt) < 0)) ||
    !Array.isArray(lives.failedAttempts) ||
    !lives.failedAttempts.every((id) => typeof id === 'string') ||
    !Array.isArray(lives.rewardTransactions) ||
    !lives.rewardTransactions.every((id) => typeof id === 'string' && id.length > 0)
  )
    return initialLives();
  return {
    count: lives.count!,
    nextLifeAt: lives.count === MAX_LIVES ? null : lives.nextLifeAt ?? null,
    failedAttempts: lives.failedAttempts.slice(-MAX_RECEIPTS),
    rewardTransactions: lives.rewardTransactions.slice(-MAX_RECEIPTS),
  };
}

export function refreshLives(state: Lives, now: number): Lives {
  if (state.count >= MAX_LIVES) return { ...state, count: MAX_LIVES, nextLifeAt: null };
  const nextLifeAt = state.nextLifeAt ?? now + LIFE_REFILL_MS;
  if (now < nextLifeAt) return state.nextLifeAt === nextLifeAt ? state : { ...state, nextLifeAt };
  const gained = Math.floor((now - nextLifeAt) / LIFE_REFILL_MS) + 1;
  const count = Math.min(MAX_LIVES, state.count + gained);
  return {
    ...state,
    count,
    nextLifeAt: count === MAX_LIVES ? null : nextLifeAt + gained * LIFE_REFILL_MS,
  };
}

export function loseLife(state: Lives, attemptId: string, now: number): Lives {
  const current = refreshLives(state, now);
  if (!attemptId || current.count === 0 || current.failedAttempts.includes(attemptId)) return current;
  return {
    ...current,
    count: current.count - 1,
    nextLifeAt: current.count === MAX_LIVES ? now + LIFE_REFILL_MS : current.nextLifeAt,
    failedAttempts: [...current.failedAttempts, attemptId].slice(-MAX_RECEIPTS),
  };
}

export function grantLife(state: Lives, transaction: string, now: number): Lives {
  const current = refreshLives(state, now);
  if (
    !transaction ||
    current.count >= MAX_LIVES ||
    current.rewardTransactions.includes(transaction)
  )
    return current;
  const count = current.count + 1;
  return {
    ...current,
    count,
    nextLifeAt: count === MAX_LIVES ? null : current.nextLifeAt ?? now + LIFE_REFILL_MS,
    rewardTransactions: [...current.rewardTransactions, transaction].slice(-MAX_RECEIPTS),
  };
}
