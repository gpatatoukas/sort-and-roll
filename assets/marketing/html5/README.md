# Sort & Roll playable ad concepts

Four mobile-first HTML5 playable prototypes, adapted to bottle sorting. Tap a bottle to select it, then tap a bottle with the same top colour or an empty bottle. A completed bottle is capped and can no longer be selected.

## Preview

Open `index.html` in a browser, or serve this folder over HTTP to preview on a phone. The four concepts are `01-sort-a-bottle.html`, `02-daily-colour-mix.html`, `03-extra-bottle.html`, and `04-perfect-bottle-run.html`.

## Google Ads upload

The `google-ads-upload/` folder has one self-contained ZIP per playable. Each ZIP contains a portrait `index.html` with the `ad.orientation` tag and its local CSS and JavaScript. The packages omit a custom exit script so Google Ads can supply its own Install call-to-action. Google currently documents portrait/landscape App campaign playable orientation metadata, responsive layouts, a 5 MB ZIP cap, and up to 512 files per ZIP. Run each ZIP through Google Ads’ HTML5 Validator and wait for Google’s upload review before using it.

The puzzles are lightweight DOM/CSS interactions with no external assets or libraries.
