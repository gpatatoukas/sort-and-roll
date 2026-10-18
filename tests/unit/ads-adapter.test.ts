import { expect, jest, test, beforeEach } from '@jest/globals';
jest.mock('../../src/services/ads/config', () => ({
  getAdUnits: () => ({
    banner: 'banner-test',
    rewarded: 'reward-test',
    interstitial: 'interstitial-test',
  }),
  getTestDeviceIdentifiers: () => ['EMULATOR'],
}));
jest.mock('react-native', () => ({ AppState: { currentState: 'active' } }));
jest.mock('react-native-google-mobile-ads', () => {
  const instances: { rewarded: any[]; interstitial: any[] } = { rewarded: [], interstitial: [] };
  const make = (type: 'rewarded' | 'interstitial') => {
    const events: Record<string, (...args: any[]) => void> = {};
    const ad = {
      events,
      addAdEventListener(event: string, listener: (...args: any[]) => void) {
        events[event] = listener;
      },
      destroy: jest.fn(),
      load: jest.fn(),
      show: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    instances[type].push(ad);
    return ad;
  };
  const initialize = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  return {
    __esModule: true,
    instances,
    initialize,
    default: () => ({
      initialize,
      setRequestConfiguration: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    }),
    AdsConsent: {
      gatherConsent: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      showPrivacyOptionsForm: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      getConsentInfo: jest.fn<() => Promise<any>>().mockResolvedValue({
        canRequestAds: true,
        privacyOptionsRequirementStatus: 'NOT_REQUIRED',
      }),
    },
    MaxAdContentRating: { G: 'G' },
    TestIds: { REWARDED: 'reward-test', INTERSTITIAL: 'interstitial-test' },
    AdEventType: { LOADED: 'loaded', CLOSED: 'closed', OPENED: 'opened', ERROR: 'error' },
    RewardedAdEventType: { LOADED: 'rewarded-loaded', EARNED_REWARD: 'earned' },
    RewardedAd: { createForAdRequest: () => make('rewarded') },
    InterstitialAd: { createForAdRequest: () => make('interstitial') },
  };
});
beforeEach(() => {
  jest.resetModules();
});
async function setup() {
  const sdk = (await import('react-native-google-mobile-ads')) as any;
  const { adsAdapter } = await import('../../src/services/ads/adapter.native');
  await Promise.all([adsAdapter.initialize(), adsAdapter.initialize()]);
  return { sdk, adsAdapter };
}
test('reward is earned before dismissal, duplicate callbacks grant once, and dismissal alone grants nothing', async () => {
  const { sdk, adsAdapter } = await setup();
  expect(sdk.initialize).toHaveBeenCalledTimes(1);
  const ad = sdk.instances.rewarded[0];
  ad.events['rewarded-loaded']();
  const grant = jest.fn();
  const result = adsAdapter.showRewarded(grant);
  expect(adsAdapter.getSnapshot().showing).toBe(true);
  ad.events.earned();
  ad.events.earned();
  expect(grant).toHaveBeenCalledTimes(1);
  expect(adsAdapter.getSnapshot().showing).toBe(true);
  const refused = await adsAdapter.showRewarded(grant);
  expect(refused.earned).toBe(false);
  ad.events.closed();
  expect((await result).earned).toBe(true);
  const next = sdk.instances.rewarded[1];
  next.events['rewarded-loaded']();
  const dismissed = adsAdapter.showRewarded(grant);
  next.events.closed();
  expect((await dismissed).earned).toBe(false);
  expect(grant).toHaveBeenCalledTimes(1);
});
test('rewarded load failures do not clear a showing interstitial and show failures release the lock', async () => {
  const { sdk, adsAdapter } = await setup();
  const interstitial = sdk.instances.interstitial[0];
  interstitial.events.loaded();
  const result = adsAdapter.showInterstitial();
  sdk.instances.rewarded[0].events.error();
  expect(adsAdapter.getSnapshot().showing).toBe(true);
  interstitial.events.opened();
  interstitial.events.closed();
  expect(await result).toBe(true);
  expect(adsAdapter.getSnapshot().showing).toBe(false);
  const next = sdk.instances.interstitial[1];
  next.events.loaded();
  next.show.mockRejectedValueOnce(new Error('show failed'));
  expect(await adsAdapter.showInterstitial()).toBe(false);
  expect(adsAdapter.getSnapshot().showing).toBe(false);
});
test('ads are not initialized or requested when consent does not permit requests', async () => {
  const sdk = (await import('react-native-google-mobile-ads')) as any;
  sdk.AdsConsent.getConsentInfo.mockResolvedValue({
    canRequestAds: false,
    privacyOptionsRequirementStatus: 'REQUIRED',
  });
  const { adsAdapter } = await import('../../src/services/ads/adapter.native');
  await adsAdapter.initialize();
  expect(sdk.initialize).not.toHaveBeenCalled();
  expect(sdk.instances.rewarded).toHaveLength(0);
  expect(adsAdapter.getSnapshot().privacyRequired).toBe(true);
  expect((await adsAdapter.showRewarded(jest.fn())).earned).toBe(false);
});

test('privacy revocation destroys cached ads and stops requests', async () => {
  const { sdk, adsAdapter } = await setup();
  sdk.AdsConsent.getConsentInfo.mockResolvedValue({
    canRequestAds: false,
    privacyOptionsRequirementStatus: 'REQUIRED',
  });
  await adsAdapter.showPrivacyOptions();
  expect(sdk.instances.rewarded[0].destroy).toHaveBeenCalledTimes(1);
  expect(sdk.instances.interstitial[0].destroy).toHaveBeenCalledTimes(1);
  expect(adsAdapter.getSnapshot().enabled).toBe(false);
  expect(adsAdapter.getSnapshot().showing).toBe(false);
  expect(adsAdapter.getSnapshot().privacyRequired).toBe(true);
});
test('background and expired ads never show, rejected rewarded shows grant nothing', async () => {
  const { sdk, adsAdapter } = await setup();
  const ad = sdk.instances.rewarded[0];
  ad.events['rewarded-loaded']();
  const rn = await import('react-native');
  Object.assign(rn.AppState, { currentState: 'background' });
  const grant = jest.fn();
  expect((await adsAdapter.showRewarded(grant)).earned).toBe(false);
  expect(ad.show).not.toHaveBeenCalled();
  Object.assign(rn.AppState, { currentState: 'active' });
  ad.show.mockRejectedValueOnce(new Error('failed'));
  expect((await adsAdapter.showRewarded(grant)).earned).toBe(false);
  expect(grant).not.toHaveBeenCalled();
  expect(adsAdapter.getSnapshot().showing).toBe(false);
  adsAdapter.reloadRewarded();
  const next = sdk.instances.rewarded[1];
  next.events['rewarded-loaded']();
  const time = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 56 * 60000);
  expect((await adsAdapter.showRewarded(grant)).earned).toBe(false);
  expect(next.show).not.toHaveBeenCalled();
  time.mockRestore();
});
