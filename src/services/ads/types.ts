export type AdStatus = 'unavailable' | 'loading' | 'ready' | 'failed' | 'showing';
export interface AdSnapshot {
  enabled: boolean;
  showing: boolean;
  rewarded: AdStatus;
  interstitial: AdStatus;
  privacyRequired: boolean;
}
export interface RewardResult {
  earned: boolean;
  transaction: string;
}
export interface AdsAdapter {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => AdSnapshot;
  initialize: () => Promise<void>;
  reloadRewarded: () => void;
  showRewarded: (onEarn: (transaction: string) => void) => Promise<RewardResult>;
  showInterstitial: () => Promise<boolean>;
  showPrivacyOptions: () => Promise<void>;
}
