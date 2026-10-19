# Sort and Roll advertising

Google Mobile Ads 17.3 is installed. Development uses Google sample ad units. The
`android-test` EAS profile creates an installable APK with test ads. The `production`
profile builds a Play AAB with Sort & Roll live ad units on Android and iOS. Web has
no ads and cannot grant rewards. Expo Go does not contain the native SDK; use an EAS
build to test ads on a device.

- A standard 320 × 50 banner appears below the power-up panel during play only.
- A depleted power-up’s accessible label and bottom hint explain the exchange:
  tap + to watch an ad for one charge. The tap goes directly to the rewarded ad.
  If it is still loading or unavailable, no reward is granted; tap again later.
- All five tools receive one charge per completed rewarded ad. Free starting
  inventory, level gifts, daily gifts and free restart remain available.
- Earned-reward callbacks grant immediately; closing early grants nothing.
  Transactions and inventory save atomically, with duplicates ignored. Session
  checks prevent late callbacks from changing a different puzzle. A killed app
  before the local save completes is not server-verifiable; no server was added.
- Every fifth puzzle completion creates one interstitial opportunity. It is
  consumed and saved before presenting at Next or Back, never during a pour.
  Restart/unfinished exits do not count. A rewarded ad on that completed puzzle
  suppresses the interstitial. Missed opportunities are not queued into later play.
- UMP consent is gathered before SDK initialization or ad requests. Privacy choices
  appear in Settings whenever UMP requires them. Consent changes discard cached ads.
  Requests currently ask for nonpersonalized ads and G-rated creatives. No ATT
  prompt or permission bypass is implemented; IDFA-dependent advertising needs
  separate iOS release review. Audio and haptics pause during full-screen ads.

## Sort & Roll AdMob configuration

The production EAS profile contains the public Sort & Roll AdMob app and unit IDs:

- Android app: `ca-app-pub-2084024586103993~4553935558`
- Android banner: `ca-app-pub-2084024586103993/8719666416`
- Android rewarded: `ca-app-pub-2084024586103993/1736200529`
- Android interstitial: `ca-app-pub-2084024586103993/5483873842`
- iOS app: `ca-app-pub-2084024586103993~3240853881`
- iOS banner: `ca-app-pub-2084024586103993/1743194522`
- iOS rewarded: `ca-app-pub-2084024586103993/9294206475`
- iOS interstitial: `ca-app-pub-2084024586103993/6995346196`
- Privacy policy: `https://pixel-pulse.xyz/privacy`

All IDs are public client configuration, not credentials. Keep the Android app ID in
sync with the Android app registered in AdMob. The `android-test` profile is for
installable device testing and uses Google test ads; `production` is for store builds
and requests live ads. Do not submit or publish a build until the store declarations,
consent message and device testing are complete.

EAS project linking and Android signing credentials are managed in the developer's
Expo account. Google Play submission is configured separately and is not automated
by these build profiles.
