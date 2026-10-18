export interface AdUnits {
  banner: string;
  rewarded: string;
  interstitial: string;
}

/** Development always uses SDK test units; releases select their platform config. */
export function resolveAdUnits(
  platform: string,
  development: boolean,
  config: unknown,
  test: AdUnits,
): AdUnits | null {
  if ((platform !== 'android' && platform !== 'ios') || development) return test;
  if (!config || typeof config !== 'object') return test;
  const value = config as Record<string, unknown>;
  if (value.mode === 'test') return test;
  if (value.mode !== 'live') return null;
  const units = [value.banner, value.rewarded, value.interstitial];
  if (
    !units.every(
      (id) =>
        typeof id === 'string' &&
        /^ca-app-pub-\d{16}\/\d{10}$/.test(id) &&
        !id.startsWith('ca-app-pub-3940256099942544/'),
    )
  )
    return null;
  if (new Set(units).size !== 3) return null;
  return {
    banner: value.banner as string,
    rewarded: value.rewarded as string,
    interstitial: value.interstitial as string,
  };
}
