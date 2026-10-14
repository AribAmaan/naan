# NAAN v17.5 — visual pass (on top of v17.4.3)

Only `index.html` changed (plus this file). No gameplay, interaction, save or audio code was touched.

## What changed
- **World-space wall mapping.** Wall boxes used to stretch one texture over each segment (so the wall above a
  window was a different patch from the wall beside it). Wall plaster, wallpaper, wall tile and concrete now
  map one texture tile per 2.8 m (one wall height). Constant: `__NAAN_WALL_TILE` in the v17.5 block.
- **New plaster** (`__naanPlaster`): skim-coat sweeps, tileable tone drift, fine grain (feeds the bump map),
  drip stains, hairline cracks. Wall and ceiling textures doubled (capped at 512).
- **Seam fixes.** Value noise is now tileable (integer scale, octave ratio 2); stain blobs wrap at tile edges;
  ceilings no longer receive the wall-bottom damp band that repeated as a line every 2.2 m.
- **Cracks.** `Kl` draws straighter hairlines that scale with texture size (was a 3 px random walk).
- **Wallpaper.** The saw-tooth "peeling strip" shapes are now faint worn seams.
- **Windows.** Each exterior window pane has an unlit night-view plane behind it (3 tiny canvas textures:
  moon, stars, treeline, bare trees, mist) and a dedicated clearer glass material (`windowGlass`).
  Bottles still use the old `glass` material.

## Side effects to know about
- `Un`, `xn`, `Kl` are shared helpers, so carpet, concrete, floor tile and wallpaper textures also tile
  correctly now and look slightly different.
- Wallpaper motifs are now a fixed physical size (0.7 m cells), not stretched to the wall.

## Tuning knobs
- Wall tile size: `__NAAN_WALL_TILE` (2.8).
- Grain strength: `amp=11` in `__naanPlaster`.
- Window brightness: `color:0xb4bccb` on the night-view materials; glass haze: `opacity:.26` on `windowGlass`.

## Tested
- All 8 inline scripts pass `node --check`.
- Headless Chromium (software GL): game starts with no page/console errors on seeds WARD-13/01/07/22 at
  medium and WARD-13/07 at low; night views, window glass and UV hook present on every run.
- Screenshots reviewed: plaster wall, ceiling, window, hall, kitchen, living-room wallpaper.

## Not tested
- High/Ultra quality, real GPU frame rate and load time, touch devices.
- Escape run / aim-picker regression (code untouched, but not re-run).
- Other wallpaper styles up close (damask, stripe) and bath/workshop/store walls.
