# Firebase Analytics

Firebase Analytics is optional until its Firebase Android config file is
available. To activate it for an Android build, register this app in Firebase
and place the generated file at `config/firebase/google-services.json`:

- Android package: `com.pixelpulse.sortandroll`
- `FIREBASE_ANALYTICS_ENABLED=true`
- The production EAS profile enables `FIREBASE_ANALYTICS_ENABLED=true`.

For iOS Analytics as well, register bundle ID `com.gpatatoukas.sort-and-roll`
and also provide `FIREBASE_IOS_CONFIG=<path to GoogleService-Info.plist>`.

The Firebase config file contains non-secret project/app identifiers and is
included with the app for EAS builds. Rebuild the Android app; an OTA update
cannot add native Firebase modules. Also enable Google Analytics for the Firebase
project and link this AdMob app in AdMob's **Settings → Linked services**.
Analytics events and AdMob user metrics will appear after the updated app is
installed and used, once reporting has processed the data.

This uses the native Firebase Analytics SDK because the Firebase JavaScript SDK
does not provide Analytics for mobile apps. See [Expo's Firebase guide](https://docs.expo.dev/guides/using-firebase/)
and [Firebase's AdMob linking instructions](https://support.google.com/firebase/answer/6387949?hl=en).
