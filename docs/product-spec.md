# Sort and Roll — product and technical spec v0.1

## Agreed experience

A colourful, playful, mobile-first water sort puzzle from Pixel Pulse. Tap a source
bottle and a destination to pour the largest contiguous top-colour group that fits.
Only matching colours or empty bottles accept a pour. A finished bottle has four
units of one colour. All starting puzzles have a solution without paid tools.

- Relaxed: unlimited time and pours, no stars; mostly gentle puzzles.
- Challenge: gradually more colours and bottles, hidden layers and matching-colour
  locks; one to three stars for pour efficiency, never speed.
- Daily Drop: the same date-seeded puzzle for every player, one completion per UTC
  day, streak and a power-up reward. Restart after a failed approach remains free.
- Weekly Journey: 99 sequential stages per UTC Monday week; progress is local and
  the first ten stages avoid hidden layers and locks. Later difficulty mixes rules.
- Every mode retains its own progress. Restart is free. Settings and cosmetics save.
- Dark appearance is the default, with a saved light/dark toggle on both menu and
  gameplay. Existing saves without an appearance preference migrate to dark without
  resetting their puzzles. Cosmetic backgrounds have both light and dark palettes.
- Glass elixir bottles have rims, neck bands, reflections and shaded liquid. Elixir,
  Prism and Orb silhouettes have previews in the cosmetic picker.
- Undo, Hint, Extra Bottle, Reveal and Colour Pop have consumable inventories.
  Initial prototype allowances: 3 Undo, 3 Hint, 2 Extra Bottle, 2 Reveal, 1 Colour Pop.
  Award one deterministic random power-up every ten completed levels and each daily
  completion. Bottle shapes unlock at 10 and 25 completions. A 16-scene collection
  unlocks across 0–365 completions, including Halloween at 40 and Christmas at 80.
  The paged gallery previews locked scenes and shows remaining levels. Earned
  scenes are permanent and available year-round, with light/dark variants.
- Rewarded ads refill depleted tools. An interstitial is eligible every five level
  completions and must be suppressed immediately after a rewarded ad.
- Original offline music (Tideglass), seven liquid/glass sound effects, and soft
  selection/pouring/completion haptics. Music, effects and vibration have independent
  saved toggles. Mute and backgrounding stop playback; delayed effect requests are
  cancelled after mute. Browser music begins after interaction. Respect reduced motion.
- Power-up controls use larger original water-themed SVG illustrations and charge
  badges. Idle feedback contains no repeated encouragement phrase.

## First playable implementation

Pure immutable TypeScript engine. A seeded reverse generator accepts a scramble
step only when a legal maximum-run pour reproduces its exact predecessor, recording
a constructive solution. A bounded solver supplies hints after off-path play and
verifies optional lock additions. Hidden layers reveal as exposed by pouring.
The source bottle lifts over the measured target opening, tilts left or right to
align its mouth, pours, and returns. Reduced motion skips the flight.
The recorded solution is a reference route, not a proven optimum; current star
thresholds use it as the efficiency benchmark. Hint search may exhaust its budget;
that does not consume a charge or prove a puzzle unsolvable.

Versioned validated AsyncStorage record; serialized writes; modes, inventory and
completion rewards are stored together. Daily seed uses date alone; weekly seed
uses installation identity and Monday date. No backend or account is required.
Completed puzzles credit progress immediately; restarting does not consume tools.

## Remaining release work

Google Mobile Ads integration now includes gameplay banners, one rewarded ad per
charge for all five tools, consent/privacy options, persisted reward deduplication
and an interstitial at every fifth completion’s natural transition, suppressed
after a rewarded ad on that level. Test mode is the default on both platforms;
Sort and Roll’s own AdMob IDs and physical-device ad validation remain required.
Web and older native binaries without the SDK grant no placeholder rewards.
Final app
branding, solver benchmarking, mixed weekly difficulty tuning and full accessibility
review remain follow-up work. Existing Expo starter assets are not final branding.
Establish mutation and native regression baselines before release; no physical
Android/iOS validation or live ad serving is claimed by this first playable.

Engineering standards: ../AGENTS.md. Native and ad integration need device checks.

## Continuous pouring

Pouring lifts and tilts the source over the target, then drains top-colour layers
one by one as the same amount rises in the receiving bottle. A coloured stream
continues through the target neck to its moving liquid surface, with small ripples.
Native-driven transforms synchronize fill levels, flow and bottle motion without
per-frame React state updates. Bigger transfers take longer; reduced motion
commits immediately. Puzzle state is saved once when the bottle returns.
