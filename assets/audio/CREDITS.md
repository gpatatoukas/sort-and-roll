# Sort and Roll original audio

Created for Pixel Pulse's Sort and Roll on 18 October 2026. No Block and Roll
recordings, third-party music, samples or stock sound effects are used.

- `tideglass.mp3`: original 53⅓-second stereo loop, 72 BPM. Sparse felt-key melody,
  sustained Dmaj9 / Gmaj9 / Bm7 / Asus2 chords and circular room reflections.
- `select.wav`: small water droplet.
- `pour.wav`: filtered liquid noise and soft bubbling, timed to the visible stream.
- `settle.wav`: quiet glass landing tone.
- `bottle.wav`: two-note completion chime.
- `win.wav`: four-note resolved celebration.
- `tool.wav`: short, airy glass flourish.
- `invalid.wav`: muted low tap for an unavailable pour.

Sources are reproducible using `python3 scripts/generate-audio.py` (Python standard
library plus ffmpeg with libmp3lame). Assets are bundled for offline playback.
Runtime levels intentionally keep music below effects. No recording, microphone
permission, background media service or remote music streaming is required.
