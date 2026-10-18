# Sort and Roll branding and store assets

Generated using the built-in image generation tool, then resized and composited
with `scripts/generate-branding.cjs`. Original source masters and the exact
prompts are retained in `assets/branding/source/` and
`docs/store/image-prompts.md`. The transparent bottle emblem retains its alpha
channel. No Block and Roll artwork is reused.

The app configuration uses the 1024 app icon, Android adaptive foreground and
monochrome artwork, light and dark splash artwork, and favicon. The home screen
uses the same bottle emblem. Updating an installed native launcher icon or
splash requires a new native build; Metro updates the home logo.

Android has its icon, Play feature graphic and six web phone previews. The
previews are drafts; capture final screenshots from the Android app before
uploading. iOS has its 1024 icon and six ad-free iPhone 17 Pro simulator
screenshots at 1206 × 2622. The current iOS config is iPhone only, so there is
no iPad screenshot set. The App Store does not require a feature graphic.

`assets/branding/` contains reusable logo lockups and runtime art. The exact
store sizes live in `assets/store/`. Generated SVG intermediates are temporary
files. Unused old Expo launcher and splash images and the old Icon Composer
package were removed; template images still referenced by existing starter
components were kept.

Re-export the branding files with `node scripts/generate-branding.cjs` (requires
`ffmpeg` and `rsvg-convert`). This does not call an image API or generate new
artwork. Store screenshots are native simulator or actual app captures, not
generated UI artwork. No store upload or build was started.
