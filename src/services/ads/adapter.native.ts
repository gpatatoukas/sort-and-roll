import { getAdUnits, getTestDeviceIdentifiers } from './config';
import { AppState } from 'react-native';
import type * as GoogleAds from 'react-native-google-mobile-ads';
import type { AdSnapshot, AdsAdapter, RewardResult } from './types';

let sdk: typeof GoogleAds | null = null;
export const getAdsSDK = () => sdk;
export const BANNER_HEIGHT = 50;
let snapshot: AdSnapshot = {
  enabled: false,
  showing: false,
  rewarded: 'loading',
  interstitial: 'loading',
  privacyRequired: false,
};
const listeners = new Set<() => void>();
const publish = (patch: Partial<AdSnapshot>) => {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
};
let initialization: Promise<void> | null = null;
let rewarded: GoogleAds.RewardedAd | null = null;
let interstitial: GoogleAds.InterstitialAd | null = null;
let rewardLoadedAt = 0;
let interstitialLoadedAt = 0;
let transactionNumber = 0;
let settleReward: ((earned: boolean) => void) | null = null;
let settleInterstitial: ((shown: boolean) => void) | null = null;
let earned = false;
let opened = false;
let onEarnReward: ((transaction: string) => void) | null = null;
let rewardTransaction = '';
let requestOptions: { requestNonPersonalizedAdsOnly?: boolean } = {};
export const getCurrentAdRequestOptions = () => requestOptions;
function logAdEvent(
  placement: string,
  event: string,
  error?: { code?: string; reason?: string; phase?: string },
) {
  if (error) {
    console.warn(`[ads] ${placement} ${event}`, {
      reason: error.reason ?? error.code ?? 'unknown',
      phase: error.phase ?? 'unknown',
    });
    return;
  }
  console.info(`[ads] ${placement} ${event}`);
}
async function updateRequestOptions() {
  if (!sdk) return;
  try {
    const gdprApplies = await sdk.AdsConsent.getGdprApplies();
    if (!gdprApplies) {
      requestOptions = {};
      return;
    }
    const choices = await sdk.AdsConsent.getUserChoices();
    requestOptions = { requestNonPersonalizedAdsOnly: !choices.selectPersonalisedAds };
  } catch {
    // Privacy-safe fallback if consent details can't be read.
    requestOptions = { requestNonPersonalizedAdsOnly: true };
  }
}
function loadRewarded() {
  if (
    !sdk ||
    !snapshot.enabled ||
    snapshot.showing ||
    (snapshot.rewarded === 'loading' && rewarded)
  )
    return;
  rewarded?.destroy();
  earned = false;
  const ad = sdk.RewardedAd.createForAdRequest(getAdUnits(sdk.TestIds)!.rewarded, requestOptions);
  rewarded = ad;
  publish({ rewarded: 'loading' });
  logAdEvent('rewarded', 'request started');
  ad.addAdEventListener(sdk.RewardedAdEventType.LOADED, () => {
    rewardLoadedAt = Date.now();
    publish({ rewarded: 'ready' });
    logAdEvent('rewarded', 'loaded');
  });
  ad.addAdEventListener(sdk.RewardedAdEventType.EARNED_REWARD, () => {
    if (earned || !settleReward) return;
    earned = true;
    logAdEvent('rewarded', 'reward earned');
    onEarnReward?.(rewardTransaction);
  });
  ad.addAdEventListener(sdk.AdEventType.IMPRESSION, () => logAdEvent('rewarded', 'impression'));
  ad.addAdEventListener(sdk.AdEventType.OPENED, () => logAdEvent('rewarded', 'opened'));
  ad.addAdEventListener(sdk.AdEventType.CLOSED, () => {
    const result = earned;
    logAdEvent('rewarded', 'closed');
    publish({ showing: false, rewarded: 'loading' });
    settleReward?.(result);
    settleReward = null;
    rewarded = null;
    ad.destroy();
    loadRewarded();
  });
  ad.addAdEventListener(sdk.AdEventType.ERROR, (error) => {
    logAdEvent('rewarded', 'error', error);
    publish({ ...(snapshot.rewarded === 'showing' ? { showing: false } : {}), rewarded: 'failed' });
    settleReward?.(earned);
    settleReward = null;
    rewarded = null;
    ad.destroy();
  });
  ad.load();
}
function loadInterstitial() {
  if (!sdk || !snapshot.enabled || snapshot.showing) return;
  interstitial?.destroy();
  const ad = sdk.InterstitialAd.createForAdRequest(getAdUnits(sdk.TestIds)!.interstitial, requestOptions);
  interstitial = ad;
  publish({ interstitial: 'loading' });
  logAdEvent('interstitial', 'request started');
  ad.addAdEventListener(sdk.AdEventType.LOADED, () => {
    interstitialLoadedAt = Date.now();
    publish({ interstitial: 'ready' });
    logAdEvent('interstitial', 'loaded');
  });
  ad.addAdEventListener(sdk.AdEventType.OPENED, () => {
    opened = true;
    logAdEvent('interstitial', 'opened');
  });
  ad.addAdEventListener(sdk.AdEventType.IMPRESSION, () => logAdEvent('interstitial', 'impression'));
  ad.addAdEventListener(sdk.AdEventType.CLOSED, () => {
    logAdEvent('interstitial', 'closed');
    publish({ showing: false, interstitial: 'loading' });
    settleInterstitial?.(opened);
    settleInterstitial = null;
    interstitial = null;
    ad.destroy();
    loadInterstitial();
  });
  ad.addAdEventListener(sdk.AdEventType.ERROR, (error) => {
    logAdEvent('interstitial', 'error', error);
    publish({
      ...(snapshot.interstitial === 'showing' ? { showing: false } : {}),
      interstitial: 'failed',
    });
    settleInterstitial?.(opened);
    settleInterstitial = null;
    interstitial = null;
    ad.destroy();
  });
  ad.load();
}
export const adsAdapter: AdsAdapter = {
  subscribe(callback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
  getSnapshot: () => snapshot,
  initialize() {
    return (initialization ??= (async () => {
      try {
        // Dynamic import lets an older dev binary keep playing until rebuilt.
        sdk = await import('react-native-google-mobile-ads');
        if (!getAdUnits(sdk.TestIds)) throw new Error('Invalid ad configuration.');
        publish({ showing: true });
        try {
          await sdk.AdsConsent.gatherConsent();
        } catch {
          /* Check prior-session consent below. */
        }
        const consent = await sdk.AdsConsent.getConsentInfo();
        publish({
          showing: false,
          privacyRequired: consent.privacyOptionsRequirementStatus === 'REQUIRED',
        });
        if (!consent.canRequestAds) {
          publish({ rewarded: 'unavailable', interstitial: 'unavailable' });
          return;
        }
        await updateRequestOptions();
        await sdk.default().setRequestConfiguration({
          maxAdContentRating: sdk.MaxAdContentRating.G,
          testDeviceIdentifiers: getTestDeviceIdentifiers(),
        });
        await sdk.default().initialize();
        publish({ enabled: true });
        loadRewarded();
        loadInterstitial();
      } catch {
        publish({
          enabled: false,
          showing: false,
          rewarded: 'unavailable',
          interstitial: 'unavailable',
        });
      }
    })());
  },
  reloadRewarded() {
    if (!snapshot.enabled) {
      initialization = null;
      void adsAdapter.initialize();
    } else loadRewarded();
  },
  async showRewarded(onEarn) {
    if (
      !rewarded ||
      snapshot.showing ||
      snapshot.rewarded !== 'ready' ||
      AppState.currentState !== 'active'
    )
      return { earned: false, transaction: '' };
    if (Date.now() - rewardLoadedAt > 55 * 60000) {
      loadRewarded();
      return { earned: false, transaction: '' };
    }
    const ad = rewarded;
    earned = false;
    const transaction = `reward:${Date.now()}:${++transactionNumber}`;
    rewardTransaction = transaction;
    onEarnReward = onEarn;
    publish({ showing: true, rewarded: 'showing' });
    return new Promise<RewardResult>((resolve) => {
      settleReward = (result) => resolve({ earned: result, transaction });
      try {
        void ad.show().catch((error) => {
          logAdEvent('rewarded', 'show failed', error);
          publish({ showing: false, rewarded: 'failed' });
          settleReward?.(earned);
          settleReward = null;
          rewarded = null;
          ad.destroy();
        });
      } catch {
        logAdEvent('rewarded', 'show failed');
        publish({ showing: false, rewarded: 'failed' });
        settleReward?.(earned);
        settleReward = null;
        rewarded = null;
        ad.destroy();
      }
    });
  },
  async showInterstitial() {
    if (
      !interstitial ||
      snapshot.showing ||
      snapshot.interstitial !== 'ready' ||
      AppState.currentState !== 'active'
    ) {
      if (snapshot.enabled && !snapshot.showing && snapshot.interstitial === 'failed')
        loadInterstitial();
      return false;
    }
    if (Date.now() - interstitialLoadedAt > 55 * 60000) {
      loadInterstitial();
      return false;
    }
    const ad = interstitial;
    opened = false;
    publish({ showing: true, interstitial: 'showing' });
    return new Promise<boolean>((resolve) => {
      settleInterstitial = resolve;
      void ad.show().catch((error) => {
        logAdEvent('interstitial', 'show failed', error);
        publish({ showing: false, interstitial: 'failed' });
        settleInterstitial?.(false);
        settleInterstitial = null;
        interstitial = null;
        ad.destroy();
      });
    });
  },
  async showPrivacyOptions() {
    if (!sdk || snapshot.showing) return;
    publish({ showing: true });
    try {
      await sdk.AdsConsent.showPrivacyOptionsForm();
    } finally {
      const consent = await sdk.AdsConsent.getConsentInfo();
      publish({
        showing: false,
        privacyRequired: consent.privacyOptionsRequirementStatus === 'REQUIRED',
      });
      if (!consent.canRequestAds) {
        rewarded?.destroy();
        interstitial?.destroy();
        rewarded = null;
        interstitial = null;
        publish({ enabled: false, rewarded: 'unavailable', interstitial: 'unavailable' });
      } else {
        // Consent may have changed; discard pre-consent cached ads.
        rewarded?.destroy();
        interstitial?.destroy();
        rewarded = null;
        interstitial = null;
        publish({ enabled: false, rewarded: 'loading', interstitial: 'loading' });
        initialization = null;
        await adsAdapter.initialize();
      }
    }
  },
};
