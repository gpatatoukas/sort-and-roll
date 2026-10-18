import { getAdUnits } from '../../services/ads/config';

import { getAdsSDK } from '../../services/ads/adapter.native';
import { useAds } from './ads';

export function AdBanner() {
  const { enabled, showing } = useAds();
  const sdk = getAdsSDK();
  if (!enabled || !sdk || showing) return null;
  const units = getAdUnits(sdk.TestIds);
  if (!units) return null;
  const Banner = sdk.BannerAd;
  return (
    <Banner
      unitId={units.banner}
      size={sdk.BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
