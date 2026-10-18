import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveAdUnits } from '../../policies/ad-units';

export function getAdUnits(testIds: { BANNER: string; REWARDED: string; INTERSTITIAL: string }) {
  return resolveAdUnits(Platform.OS, __DEV__, getPlatformAdConfig(), {
    banner: testIds.BANNER,
    rewarded: testIds.REWARDED,
    interstitial: testIds.INTERSTITIAL,
  });
}
export function getPlatformAdConfig() {
  return Platform.OS === 'ios'
    ? Constants.expoConfig?.extra?.iosAds
    : Constants.expoConfig?.extra?.androidAds;
}
export function getTestDeviceIdentifiers(): string[] {
  const configured = getPlatformAdConfig()?.testDeviceIdentifiers;
  return [
    'EMULATOR',
    ...(Array.isArray(configured)
      ? configured.filter((id): id is string => typeof id === 'string' && !!id)
      : []),
  ];
}
