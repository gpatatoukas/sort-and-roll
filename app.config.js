// Public AdMob configuration; each platform must use Sort and Roll's own IDs.
module.exports = ({ config }) => {
  const runtime = {};
  const appIds = {};
  for (const platform of ['android', 'ios']) {
    const prefix = platform.toUpperCase();
    const mode = process.env[`${prefix}_ADS_MODE`] || 'test';
    if (!['test', 'live'].includes(mode))
      throw new Error(`${prefix}_ADS_MODE must be test or live`);
    const appId =
      process.env[`${prefix}_ADMOB_APP_ID`] ||
      (platform === 'ios'
        ? 'ca-app-pub-3940256099942544~1458002511'
        : 'ca-app-pub-3940256099942544~3347511713');
    const units = ['BANNER', 'REWARDED', 'INTERSTITIAL'].map(
      (type) => process.env[`${prefix}_ADMOB_${type}_ID`] || '',
    );
    const privacyPolicyUrl = process.env[`${prefix}_PRIVACY_POLICY_URL`] || '';
    if (!/^ca-app-pub-\d{16}~\d{10}$/.test(appId))
      throw new Error(`Invalid ${prefix} AdMob app ID`);
    if (mode === 'live') {
      const otherGameUnits = [
        '4246588459',
        '5911023919',
        '8505397663',
        '2199396657',
        '7260151649',
        '3213095429',
      ];
      if (
        units.some((id) =>
          otherGameUnits.some((unit) => id === `ca-app-pub-2084024586103993/${unit}`),
        )
      )
        throw new Error('Use Sort and Roll ad units, not Block and Roll units');
      if (
        appId.includes('3940256099942544') ||
        [
          'ca-app-pub-2084024586103993~6453949391',
          'ca-app-pub-2084024586103993~8751442691',
        ].includes(appId)
      )
        throw new Error('Use Sort and Roll app IDs, not sample or Block and Roll IDs');
      if (!privacyPolicyUrl.startsWith('https://'))
        throw new Error('Live ads require a public HTTPS privacy policy');
      if (
        new Set(units).size !== 3 ||
        !units.every(
          (id) =>
            /^ca-app-pub-\d{16}\/\d{10}$/.test(id) && id.startsWith(appId.split('~')[0] + '/'),
        )
      )
        throw new Error(`Set all three ${prefix} ad units`);
    }
    appIds[`${platform}AppId`] = appId;
    runtime[`${platform}Ads`] = {
      mode,
      banner: units[0],
      rewarded: units[1],
      interstitial: units[2],
      privacyPolicyUrl,
    };
  }
  const plugins = (config.plugins || []).filter(
    (p) => (Array.isArray(p) ? p[0] : p) !== 'react-native-google-mobile-ads',
  );
  return {
    ...config,
    plugins: [
      ...plugins,
      ['react-native-google-mobile-ads', { ...appIds, delayAppMeasurementInit: true }],
    ],
    extra: { ...config.extra, ...runtime },
  };
};
