# Sort and Roll advertising

Google Mobile Ads 17.3 is installed. Android and iOS use Google sample app/ad IDs
by default. Development always selects test ad units. Web has no ads and cannot
grant rewards. An older native binary without the module keeps playing without ads.
Rebuild the native app before testing the SDK; Expo Go does not contain it.

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

## Own AdMob setup

Create separate Sort and Roll apps in AdMob for Android and iOS, with Banner,
Rewarded and Interstitial units for each. Publish the consent message for each app.
Do not select partner bidding when using AdMob directly.

Provide these build environment variables for each platform, replacing ANDROID
with IOS for Apple builds:

```
ANDROID_ADS_MODE=live
ANDROID_ADMOB_APP_ID=ca-app-pub-…~…
ANDROID_ADMOB_BANNER_ID=ca-app-pub-…/…
ANDROID_ADMOB_REWARDED_ID=ca-app-pub-…/…
ANDROID_ADMOB_INTERSTITIAL_ID=ca-app-pub-…/…
ANDROID_PRIVACY_POLICY_URL=https://your-site/privacy
```

Keep `ADS_MODE=test` until ready to release. Dynamic app config validates live IDs,
rejects Block and Roll’s existing IDs/units, and requires HTTPS policy configuration.
No EAS project, credentials or production build was created by this change.

Before release: update the privacy policy to cover Sort and Roll, complete store
ad/data disclosures, confirm publisher app-ads.txt and store website association,
and test banners, successful/closed/failed rewarded ads, duplicate callbacks,
interstitial cadence, consent refusal/revocation, offline operation, audio recovery
and small-screen layout on rebuilt Android and iOS apps. Bundles and web tests do
not establish physical-device behaviour or AdMob account readiness.
