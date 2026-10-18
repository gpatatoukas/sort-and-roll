# Sort and Roll

A colourful water sort puzzle for iOS, Android and web, built with Expo SDK 58.

Use Node 24 LTS (24.11 or newer; `.nvmrc` selects the locally available 24.21.0).

```sh
nvm use
npm ci
npm start
```

Tap a bottle, then a matching colour or empty bottle. Long-press a power-up for
its explanation. Restart is free; progress and settings save independently per mode.

```sh
npm run typecheck
npm run lint
npm run test:coverage
npm run test:mutation
npm run test:e2e:web
```

Browser tests start Expo on port 8096. Install Chromium with
`npx playwright install chromium` if required. New native dependencies require a
fresh native development build; Expo Go compatibility depends on bundled modules.

See [the product spec](docs/product-spec.md) for agreed behaviour and remaining
release work, and [AGENTS.md](AGENTS.md) for architecture and verification rules.
The game includes its own offline music, liquid sound effects and soft haptics,
with independent saved switches in Settings. Native development binaries made
before the audio/SVG modules were installed need rebuilding. No EAS build is
started by these changes.

The collection has 16 illustrated backgrounds with permanent level-based unlocks,
including Halloween at 40 completions and Christmas at 80.

Google Mobile Ads is integrated with test ads by default. See [ad setup](docs/ads.md)
for Sort and Roll’s own AdMob IDs and native testing. Do not reuse another
application’s ad units or signing configuration.
