# First playable verification — 18 October 2026

Node 24.21.0 LTS; Expo SDK 58. No cloud build or store submission was started.

- TypeScript and Expo lint pass.
- 25 unit tests pass: pure engine, save validation/serialization, rewards, UTC
  rollover, and left/right/vertical bottle-mouth geometry.
- Engine coverage is 100% for statements, branches, functions and lines. Engine
  plus storage: 99.21% statements, 97.65% branches, 96.61% functions, 99.51% lines.
  The 90% engine and 80% overall gates are enabled, not waived.
- Seven Chromium flows pass: real puzzle completion and tenth-level reward,
  reload/restore, daily restart/completion, mode preservation on a 320×568 phone,
  first-use onboarding, and three target-aligned pours (left, right, next row).
  The final suite ran as four unchanged flows plus three focused animation checks.
- Phone home/game and pouring screenshots were inspected. The stream meets the
  target neck to within one CSS pixel; React Native rounds layout measurements.
  The short pouring phase is sampled every 16 ms rather than default polling
  intervals that skip over it. No screenshot baseline was auto-approved.
- Both final Android and iOS JavaScript/Hermes bundle exports pass. This does not
  establish installed native behaviour or hardware haptics.
- Expo dependency check passed against the installed SDK dependency map. Its
  remote version endpoint was unavailable, so this was an offline check.

## Mutation baseline

The first engine mutation run scored 71.27%, below the unchanged 80% failure gate.
Review exposed missing assertions for hidden-layer retention, locked sources,
nonmatching locks, deterministic generation, Undo and tool-state cleanup. Stronger
assertions raised the result to **91.16%**: 319 killed, 11 timed out, 32 survived,
zero uncovered or errored mutants out of 362. Reports remain under ignored
`reports/mutation/`. The engine has not changed since that baseline; later changes
added presentation geometry and tests.

Survivors include solver search ordering/pruning and budget boundaries, generator
loop/candidate guards that later legality checks can reject, state-key formatting,
short-circuit optional chaining, and insufficient assertions for solved-state move
rejection, off-route solution invalidation and deeper Undo history. These are not
all declared equivalent: deeper-history/blocked-state assertions and search-budget
benchmarking remain follow-up test work. The 11 timeouts involve changed loops or
search/generation behaviour; they are detections by timeout, not assertion kills.
Mutation scope is the pure game engine, not storage or UI.

## Still required before release

Physical Android/iOS checks for pouring, safe areas, reduced motion, force-close
recovery and haptics; native regression flows; final artwork and audio; Sort and
Roll's own advertising configuration and SDK/consent/reward tests; dependency audit
review and difficulty/solver profiling. Puzzles have constructive solutions;
reference-route star thresholds are not claimed to be optimal move counts.

## Bottle design and appearance follow-up

- Dark is the default; a missing/invalid legacy appearance field defaults to dark
  without discarding progress. Explicit light selections survive restore.
- Menu/game toggles change the background, text, controls, cards, dialogs, glass
  and status-bar foreground together. Background unlocks retain separate palettes.
- Elixir, Prism and Orb bottles share their artwork with the pouring overlay, so
  their mouth geometry remains consistent while moving.
- 26 unit tests and eight Chromium flows pass. Both final mobile bundle exports,
  lint, typecheck and formatting pass. Light/dark phone screenshots were inspected.
  Physical-device appearance and haptic verification remain pending.

## Audio, seasonal collection and power-up follow-up

- 36 unit tests pass, including playback lifecycle, stale asynchronous rewind
  cancellation, independent mute switches, soft Android/iOS haptic dispatch,
  background gating and all 16 unlock thresholds.
- Ten browser flows pass across the full run and focused follow-up. Browser checks
  call the actual HTML media play method and verify decoded music/effects play,
  mute independently and retain preferences after reload. The initial failed audio
  assertions used the wrong exported filename delimiter and inverted a fixture's
  already-disabled vibration flag; both test assumptions were corrected.
- First-use help, audio Settings and the seasonal gallery were checked at 320×568
  with their dismissal/navigation controls inside the viewport. Existing gameplay,
  themes, mode saves, daily restart and pouring geometry continue to pass.
- Original 53.333-second stereo music loop plus seven effects total less than 1 MB.
  Asset origin and regeneration details are in assets/audio/CREDITS.md. No Block
  and Roll recordings or samples were copied.
- Android/iOS bundle exports include every audio asset and the illustrated icons.
  Config disables recording permissions and background audio services. Native
  binaries created before adding expo-audio/react-native-svg need rebuilding.
- Physical sound balance, silent-mode behaviour, Bluetooth interruptions and
  vibration feel remain device checks. No cloud build or store release was run.
- Seasonal gallery, Christmas game, light/dark controls and large power-up artwork
  were visually inspected. Scenes and icons are static code-authored graphics.

## Ad integration follow-up

- Google Mobile Ads 17.3 installed through Expo; dynamic configuration uses Google
  sample apps/units by default and rejects Block and Roll IDs in live mode.
- Typecheck, lint and diff whitespace checks pass. All 52 unit tests and all 11
  browser flows pass. Policy statement/branch coverage is 100%; focused policy
  mutation score 97.66% (125 killed, 3 survivors, no timeouts/uncovered/errors).
  Reviewed survivors: redundant identifier type check, redundant primitive metadata
  guard, and a remaining malformed transaction-object validation test gap.
- Both Android/iOS bundles export successfully. Expo Doctor passes 20/20 checks.
- Unit SDK doubles cover consent refusal/revocation, duplicate earned callbacks,
  early dismissal, background/expired ads and failed shows. Browser checks prove
  unavailable web ads do not grant charges and depleted tools bypass reward sheets.
- Physical-device ad rendering, consent forms, banner fit with the native slot,
  audio recovery and real AdMob readiness remain unverified. A rebuilt app and
  Sort and Roll's separate AdMob app/unit IDs are needed for that validation.
  No EAS build, submission or live-ad activation was performed.
