# NAAN — Shotgun Grip / Camera Rig Repair (v18.4)

## Root cause

The game uses three separate positioning layers:

1. `index.html` / `__v72Update()` — sets `S.player.v72GunRoot.position` using hip-fire and ADS camera offsets, then applies recoil to the root rotation.
2. `index.html` / `__v72UpdateHands()` — independently interpolates the left and right viewmodel hands toward positions defined for the previous shotgun geometry and even re-parents them under the selected weapon.
3. `index.html` / `buildViewmodel()` — swaps procedural gun geometry with imported meshes after the gameplay rig is constructed, but kept the inherited camera and hand positions.

Consequently the imported shotgun could render while the two independently animated hands failed to make an anatomically correct grip. Model forearms also extended too far back to fit the previous camera offset.

## Changes

- Added your `shotgun hand.glb` as a **unified hand/shotgun GLB**. The source asset's orientation points forward along the game's negative-Z camera axis, so it is **not rotated like the original shotgun.glb**.
- Installed the combined model in the existing `v.vm.shotgun` slot when asset loading completes, without rebuilding the whole game session. Repeated installation is idempotent.
- The old **separate** gun hands are hidden **only** while the combined shotgun is equipped; they still work with the pistol/flare gun. The old shotgun body is removed to prevent overlapping models.
- The new model has a 1.30 viewmodel scale to move its authored hand-cut geometry toward the edge of the player view.
- Tuned separate aiming targets (camera-relative, metres):

  | State | Root X | Root Y | Root Z |
  | --- | ---: | ---: | ---: |
  | Shotgun hip-fire | +0.05 | -0.55 | -0.80 |
  | Shotgun ADS | -0.117 | -0.321 | -0.70 |
  | Other guns | Unchanged | Unchanged | Unchanged |

- Kept the existing recoil, firing, eject, ammo, reload timing, and switching systems. When the model is unified, its hands follow recoil/reload with the gun instead of floating away.
- Updated muzzle flash/light anchor calculation to transform the model's muzzle coordinates **through gun scale, position and rotation into the camera's gun rig**.
- Added working shell / pump state proxies, so pump/reload updates don't access missing objects.
- Added optimized meshes from the uploaded source: standard (265k triangles / 2048² texture) and Low (100k triangles / 1024² texture), to reduce download and memory costs. The source GLB isn't included again inside the ZIP.

## Verification

- Full and Lite GLBs validated for mesh bounds, triangle indices, UVs, images, and importable glTF 2.0 bufferViews.
- All 8 inline JS scripts plus every `assets/js/*.js` file passed `node --check`.
- Node integration test passed for one-time installation, old-hand ownership preservation, imported model attachment, and pump/bolt/shell state objects.
- Geometry was previewed with an offscreen mesh renderer in simulated FPS hip-fire and ADS framing.

## Limitations / remaining visual work

- The uploaded GLB is an **image-to-3D reconstruction** and has visible texture artifacts, irregular geometry and open/cut forearm ends in the asset itself. These can't be fixed merely by changing transform offsets. In-game results will still reflect those underlying source-model imperfections.
- The user-supplied GLB is a rigid single mesh; the pump helper tracks gameplay timing but **does not physically slide the wooden pump**. True pumping would need separate skinned/rigged or split geometry and a bone/transform hierarchy.
- Chromium was present, but local browser navigation was blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`), and WebGL context creation failed in the isolated page. No in-browser screenshot, full playthrough, or device FPS number is claimed.
- Check in Chrome on your device: equip shotgun, hip-fire, ADS, fire, pump, reload, swap to pistol and back, hide, and restart. Check both Low and High quality if possible.
- On a quality-tier asset reload, the combined shotgun is replaced by the corresponding Full/Lite version instead of retaining the old quality mesh indefinitely.
