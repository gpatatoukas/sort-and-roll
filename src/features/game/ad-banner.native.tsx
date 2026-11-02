import { getAdUnits } from '../../services/ads/config';
import {
  getAdsSDK,
  getCurrentAdRequestOptions,
} from '../../services/ads/adapter.native';
import { useAds } from './ads';

export function AdBanner() {
  const { enabled } = useAds();
  const sdk = getAdsSDK();
  if (!enabled || !sdk) return null;
  const units = getAdUnits(sdk.TestIds);
  if (!units) return null;
  const Banner = sdk.BannerAd;
  return (
    <Banner
      unitId={units.banner}
      size={sdk.BannerAdSize.BANNER}
      requestOptions={getCurrentAdRequestOptions()}
      onAdLoaded={() => {
            console.info('[ads] banner loaded');
      }}
      onAdImpression={() => {
            console.info('[ads] banner impression');
      }}
      onAdFailedToLoad={(error) => {
            console.warn('[ads] banner load failed', {
          reason: error.reason ?? error.code ?? 'unknown',
          phase: error.phase ?? 'unknown',
        });
      }}
    />
  );
}
