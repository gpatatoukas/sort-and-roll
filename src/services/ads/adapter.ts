import type { AdsAdapter, AdSnapshot } from './types';
const snapshot: AdSnapshot = {
  enabled: false,
  showing: false,
  rewarded: 'unavailable',
  interstitial: 'unavailable',
  privacyRequired: false,
};
// Browser ads are genuinely unavailable; no simulated video grants rewards.
export const BANNER_HEIGHT = 0;
export const adsAdapter: AdsAdapter = {
  subscribe: () => () => {},
  getSnapshot: () => snapshot,
  initialize: async () => {},
  reloadRewarded() {},
  showRewarded: async () => ({ earned: false, transaction: '' }),
  showInterstitial: async () => false,
  showPrivacyOptions: async () => {},
};
