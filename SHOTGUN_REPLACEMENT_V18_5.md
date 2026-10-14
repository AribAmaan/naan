# NAAN v18.5 — shotgun-and-hands model replacement

## Input and replacement

- New supplied source: `shotgun hand(1).glb` (12,764,692 bytes; SHA-256: `1a823505335b3ee1f225f0d437c71debb600dfc5bc9152255feb1c06f7a85fdc`).
- Previous game build: `NAAN_v18_4_SHOTGUN_GRIP_CAMERA_FIXED.zip`.
- Replaced `assets/models/shotgun_hand_full.glb` and `assets/models/shotgun_hand_lite.glb` with geometry-identical exports from the new GLB. One mesh, 30,266 vertices, 50,000 triangles, original topology, UVs, normals, node transform and baked colors unchanged; only the large 4096px base-color texture was downsampled.
- Full: 2048² texture (4.52 MB file); Lite: 1024² texture (2.25 MB file); no geometry was decimated. Both are significantly smaller than the prior build's shotgun-hand variants.

## Rig integration and alignment

The existing combined-shotgun installation in `assets/js/imported-models.js` still owns the gun and both hands as one rigid assembly. Only the selected shotgun uses the combined model. The revolver and flare gun keep their own hand meshes. Torch and weapon switching logic are unchanged.

The model's baked pose has a different muzzle and sightline than the earlier GLB. Updated the model-local muzzle from `[.090, .247, -.632]` to `[.120, .326, -.559]`; ejection anchor is now `[.14, .26, -.14]`.

In `index.html`, the combined-shotgun camera root has these targets (metres, camera-local, before bob/recoil):

| State | X | Y | Z |
|---|---:|---:|---:|
| Hip | +.025 | -.550 | -.800 |
| Aim down sights | -.158 | -.457 | -.700 |

They are fitted against the new model's actual muzzle axis. No offsets for other weapons were changed. The static mesh is left unrotated, as its glTF node already defines the FPS-forward direction.

## Verification performed

- Both GLBs decode as valid glTF 2.0; source vs exports verified for identical mesh accessor data, transforms, and triangle indices.
- Full and Lite textures decode to their stated sizes.
- 8 inline JS scripts in `index.html` and 11 `assets/js` scripts all pass `node --check`.
- Offscreen geometry render checked the new asset in hip-fire and ADS camera projections; ADS front sight aligns with the camera centre. Visual preview files are included under `docs/shotgun-preview/`.
- Chrome/Chromium browser gameplay could **not** be tested: local navigation failed with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. No full playthrough, interaction test, or FPS benchmark is claimed.

## Limitations

- Uploaded GLB is a **single rigid mesh** (gun and hands together). Animating the pump slide independently, finger movements and true shell insertion requires a new rig or separation of source geometry. Existing shot/reload timings and effect proxies remain functional in code, but do not deform the GLB.
- The model still has open geometry at the wrist/sleeve ends and minor baked texture artifacts visible at extreme camera poses. The camera placement makes them less intrusive in the view preview but does not remodel the source.
- In-game appearance depends on actual field-of-view, recoil, post-processing, viewport size and model-loading success; test hip/ADS, fire, pump/reload, holster, switch to pistol and back, Low and High quality, restart/new game.

## Deployment

Extract ZIP and upload all site files to Netlify with `index.html` at the site root. Do **not** drop only the GLB into an old package because this version also adjusts camera and muzzle coordinates. Existing save files are untouched; clear browser cache/hard reload to ensure the new GLB and JavaScript are requested.
