import type { Power } from '../engine/game';
export type AdProgress = {
  rewardTransactions: string[];
  rewardAtCompletion: number;
  interstitialPending: boolean;
};
export const initialAdProgress = (): AdProgress => ({
  rewardTransactions: [],
  rewardAtCompletion: -1,
  interstitialPending: false,
});
export function decodeAdProgress(value: unknown): AdProgress {
  if (!value || typeof value !== 'object') return initialAdProgress();
  const v = value as Record<string, unknown>;
  if (
    !Array.isArray(v.rewardTransactions) ||
    !v.rewardTransactions.every((t) => typeof t === 'string' && t.length > 0) ||
    !Number.isSafeInteger(v.rewardAtCompletion) ||
    Number(v.rewardAtCompletion) < -1 ||
    typeof v.interstitialPending !== 'boolean'
  )
    return initialAdProgress();
  return {
    rewardTransactions: v.rewardTransactions.slice(-1000),
    rewardAtCompletion: Number(v.rewardAtCompletion),
    interstitialPending: v.interstitialPending,
  };
}
export function earnedPower<
  T extends { ads: AdProgress; inventory: Record<Power, number>; completed: number },
>(p: T, power: Power, transaction: string): T {
  if (!transaction || p.ads.rewardTransactions.includes(transaction) || p.inventory[power] >= 9999)
    return p;
  return {
    ...p,
    inventory: { ...p.inventory, [power]: p.inventory[power] + 1 },
    ads: {
      ...p.ads,
      rewardTransactions: [...p.ads.rewardTransactions, transaction].slice(-1000),
      rewardAtCompletion: p.completed,
    },
  };
}
export function completionAds(ads: AdProgress, completed: number): AdProgress {
  return {
    ...ads,
    interstitialPending: completed % 5 === 0 && ads.rewardAtCompletion !== completed - 1,
  };
}
