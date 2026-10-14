# NAAN v18.6 — Evidence-Based Audit and Targeted Fixes

**Base build:** `NAAN_v18_5_SHOTGUN_MODEL_REPLACED.zip` (uploaded game archive).

**Scope:** Visual reference review (the existing offscreen FPS hip/ADS renders), import/rendering logic, shotgun viewmodel state, torch/light alignment, GLB metadata, JS syntax, isolated weapon-state tests, and deployment integrity. **NOT** a completed in-browser playthrough. No whole-game bug-free or FPS guarantee is made.

## Bugs found and actually fixed

1. **Quality-switch texture disposal / broken imported models (high).** `assets/js/imported-models.js` previously called `release(old)` when switching Full/Lite. `I.clone()` shares materials and textures with the source template; disposing the old texture can invalidate live meshes, including the shotgun, torch, and nun. Replaced eager disposal with a bounded cache keyed by import name/file. This preserves live resources and avoids repeated network/decoding work when toggling quality. **Trade-off:** both Full and Lite variants can remain in GPU memory after a quality switch. Reload the page after changing down to Low if memory pressure is significant.
2. **Repeated material shader invalidation / avoidable stutter (medium).** `tuneViewmodelRoot()` called from a repeated guard forcibly set `needsUpdate=true` for metal-bearing viewmodel materials every time, even if nothing changed. It now rebuilds only when the environment map actually changes, and updates its intensity only when different.
3. **Shotgun muzzle offset updated before camera recoil/ADS (medium).** The attached muzzle marker could use the prior frame's camera-root transform. Moved the muzzle-position calculation to after root positioning and recoil. The actual gameplay hitscan uses separate camera-ray logic, which was not modified.
4. **Stale reload/recoil transform on shotgun model replacement (medium).** A Full/Lite swap copied the previous weapon's current position and rotation into the replacement; if made during reload, its temporary rotated pose could persist. Newly installed shotgun groups now start at neutral local transforms.
5. **Flashlight alignment regression from v18.3 (medium).** The v18.5 branch lacked the earlier lens-following update, leaving a mostly fixed light offset for the imported left-hand torch. Restored it for v18.5's actual installation flag (`player.__naanTorchHand`): the spotlight, aim target and volumetric cone follow the GLB lens during sway/bob/camera motion. The fallback procedural flashlight behavior remains unchanged when that GLB is missing.

## Source/asset tests completed

- **19 JavaScript sources:** 8 `index.html` inline script blocks + 11 local `assets/js/*.js`; `node --check` passed for all.
- **22 GLB files:** glTF 2.0 header, byte length, JSON chunk, scene/mesh/nodes validity checked; 0 invalid headers.
- **3 isolated regression tests** (see `tests/*.cjs`) passed: combined shotgun installation/replacement, duplicate prevention and separate-hand preservation; shotgun equip/holster/switch state; torch lens-to-camera position correction. These use instrumented object mocks, *not WebGL*.
- **Source ZIP integrity** verified with archive CRC.
- **Static visual evidence:** `docs/shotgun-preview/hip-fire.png` and `aim-down-sights.png` show the imported FPS assembly rendered *offscreen* in the previous v18.5 geometry check, not an actual gameplay browser screenshot. No change was made to the base shotgun camera offsets or the uploaded GLB meshes/textures in this patch.
- **Browser limitation:** Chromium 144 was available, but headless navigation/screenshot attempts timed out, including with `xvfb-run`. No actual in-game frame, on-device FPS, console log from active gameplay, pointer lock, audio, GPU/WebGL shader compilation, or full mission playthrough could be validated here.

## Known limitations — not silently marked fixed

- **Rigid combined shotgun mesh:** the uploaded `shotgun hand(1).glb` contains a *single rigid mesh*. The game's pump animation drives an invisible helper but does not physically slide the visible pump; finger movement and actual shell insertion cannot be made accurate without mesh separation/rigging. Firing/reload **state transitions** were unit-tested, but the visible animation is not fixed.
- **Open sleeve ends / baked appearance:** the combined hand model can reveal cut arm/sleeve geometry at extreme viewing angles. Its single material applies common roughness across skin, clothing and shotgun; it is not fully physically accurate. These are source-asset issues, not resolved by merely moving the camera.
- **Gameplay/regression coverage gap:** random room generation, 4 endings, puzzle progression, AI chase/collisions, save/continue, Android touch controls, and real browser Low/High/Ultra visuals were **not** executed. No claim is made that these systems are bug-free.
- **Memory trade-off:** Quality variant caching keeps old shared textures alive rather than corrupting existing viewmodels. A hard browser reload after lowering graphics is the simplest way to ensure release of high-tier GPU textures.

## Browser playtest checklist (not performed)

1. Open game on HTTP/Netlify; verify main menu, New Game and Continue and browser console (no uncaught errors).
2. Acquire shotgun, compare hip-fire with ADS; ensure no second pair of hands, proper grip, hand/sleeve ends below screen edge at 16:9 and mobile aspect ratios.
3. Fire, reload several shells, switch shotgun→pistol→shotgun, holster/unholster, pause/restart, change Low↔High quality mid-run.
4. Walk/sprint/crouch with the flashlight while inspecting light/lens and beam near walls; check shadows/overexposure in each quality setting.
5. Finish one mission/ending and load a save; record frame timing, device/GPU and any console errors.

**Do not treat syntax/metadata checks as gameplay proof.**
