This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md


## Engineering standards inherited from Block and Roll

These rules are adapted from Block and Roll's technical spec and architecture,
testing and review documents. Product behaviour comes from Sort and Roll's own
spec; historical Block and Roll implementation notes are not current requirements.

### Architecture

- Use strict TypeScript. Keep engine and policy transitions pure and immutable.
- `src/app/` contains routes; `src/features/game/` contains interaction and UI;
  `src/engine/` contains pouring rules, puzzle generation, solving and undo;
  `src/policies/` contains rewards and ad eligibility; `src/storage/` contains
  validation, migrations and persistence; `src/services/` contains platform adapters;
  `src/config/` contains validated configuration.
- Engine and policies must not import React, React Native, Expo, UI, storage,
  native SDKs or network code. Enforce the boundary with ESLint when configuring it.
- Inject clocks, seeded randomness, storage and ad contracts. Keep native SDK
  imports behind native/web adapters. Start with local state unless complexity
  justifies additional state management.
- Keep animation state separate from logical game state. Avoid React updates on
  every animation frame; gameplay input must not stall decorative animations.
- Respect safe areas, varying screen sizes, accessibility and reduced motion.

### State and persistence

- Validate saved games, configuration and SDK inputs at runtime. Do not use unsafe
  assertions to conceal invalid data.
- Version saved records and define migration/recovery for malformed, unsupported
  and future versions. Validate bottle capacities, colours, inventories and progress.
- Serialize transitions and asynchronous save writes so older writes cannot
  overwrite newer state. Save related game/reward state together.
- Bind asynchronous actions to the relevant session. Grant each earned reward at
  most once, persist deduplication and handle interruptions and repeated taps.
- Keep generation deterministic with replayable seeds and bounded work. Verify
  solvability rather than assuming randomly mixed bottles are solvable.

### Verification

- Run lint, typecheck and affected tests before declaring implementation complete.
- Use Jest in a Node environment for pure engine/policy tests, separate from
  React Native component tests; Playwright for browser regression; Maestro for
  native flows; Stryker for engine/policy mutation testing when configured.
- Test explicit outcomes independently of production helpers: legal/illegal pours,
  capacity and matching-colour rules, solved detection, hidden/locked bottles,
  undo, power-up spending, immutable inputs, seeded replay and save/restore.
- Test corrupted saves, stale writes, duplicate reward callbacks, dismissal without
  reward, failed ads and interrupted sessions. Use fake clocks/promises instead of
  real network requests or sleeps in unit tests.
- Inherit the target gates: 90% branch coverage for engine/policies and 80%
  globally; mutation failure threshold 80%, target 90%. Establish tooling and a
  baseline before claiming these gates pass. Engine/policy changes need focused
  mutation evidence; review survivors and timeouts.
- Never delete failing tests, lower gates or broaden waits merely to make checks
  pass. Inspect visual changes and diagnose failures.
- Browser tests and bundle exports do not prove physical-device behaviour. Verify
  native interactions, animations, persistence, audio, haptics and ads on iOS and
  Android, and report any missing evidence explicitly.

### Dependencies, advertising and releases

- Use Node LTS, one package manager and its committed lockfile. Check Expo package
  compatibility and run Expo Doctor for dependency/native configuration changes.
- Rebuild native binaries after native dependency or config-plugin changes.
- Keep development/test and production ad configuration explicit. Web ad doubles
  are test infrastructure; never silently grant production rewards without the
  native SDK's earned-reward callback.
- Keep rewarded ads optional and explain the reward. Handle consent, failures,
  cancellation and interstitial suppression through explicit policies.
- Sort and Roll needs its own application identifiers, EAS project and AdMob IDs.
  Do not reuse Block and Roll's identifiers or signing configuration.
- Keep secrets out of source, fixtures, logs and screenshots. Public client
  configuration is not secret storage.
- Preserve unrelated user changes. Document behaviour, validation, migrations,
  limitations and asset/audio provenance. Use the project's verified scripts.
- Build, submit, publish or enable live ads only within the user's authorised task.
