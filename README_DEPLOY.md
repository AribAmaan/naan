# NAAN v18.1 — realism and weapon animation corrections

Extract this archive and host its contents with `index.html` at the website root. It is a static site: no compilation or backend is required. Keep the `assets` directory beside `index.html`.

For local play, run `python3 -m http.server 8080` from the extracted folder, then open `http://localhost:8080`. Use HTTP hosting; opening the HTML directly can block model loading.

Start a **new game** after updating. Furniture dimensions and placement changed, so older saved layouts are not a reliable comparison. Choose High or Ultra before starting for the imported furniture assets. Low and Medium retain simpler procedural furniture. Changes to furniture quality take effect when a new house is generated.

This build includes the v18.0 furniture, pickup, material, door and environment pass, plus corrected hand grips, shotgun fore-end separation, pump travel and reload-shell attachment. See `V18_1_PRECISION_REPORT.md` for current changes and verification, and `V18_0_REALISM_REPORT.md` for the inherited item coverage. Older release notes describe historical work; their test claims were not all repeated in this pass.

The current build passed 19 JavaScript syntax checks and 42 browser checks across four quality presets, five additional generated layouts, core doors/hiding/weapons, weapon motion, capture, break-free, death/restart and save continuity. A scripted escape with active AI, normal horror-director release and Continue reached the ending card. A full human playthrough and physical-device performance assessment remain outstanding. Original character and weapon artwork still limits close-up realism; this update does not make every asset photorealistic.

## v18.5 shotgun-hand replacement

This build replaces the previous combined shotgun/hands asset with the latest supplied `shotgun hand(1).glb`, adjusts its hip/ADS camera offsets and aligns its muzzle location. See `SHOTGUN_REPLACEMENT_V18_5.md` for precise changes, limitations and test notes.
