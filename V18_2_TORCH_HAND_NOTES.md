# NAAN 18.2 — uploaded torch-hand model

The first-person left arm (hand, sleeve and torch) is now `hand_holding_torch_model.glb`, shipped as:

- `assets/models/hand_holding_torch.glb` — original upload, 2048 px texture (used on Medium, High, Ultra)
- `assets/models/hand_holding_torch_lite.glb` — identical geometry, 1024 px texture (used on Low; saves about 16 MB GPU memory)

Replaced: the left-arm procedural sleeve, hand and cylinder torch. Unchanged: the right hand, all weapon viewmodels (which hide the torch arm, as before), torch light, beam, battery, flicker and sway.

Placement (tunable in `NAANImported.torchHandCfg`, `assets/js/imported-models.js`): scale 0.22 (palm about 8 cm, matching the other hands), +90 deg yaw so the forearm runs forward with the palm facing right (the model is a left hand), then aim -0.25 rad (toward the crosshair), pitch -0.10 rad and a small offset. This is a rigid transform; the model's pose is not edited. The lens glow disc sits on the model's real torch face.

If the GLB is missing or fails to load, the previous built-in hand and torch remain.

Verified in headless Chromium: model installs, torch on/off, arm hides when a weapon is drawn and returns on holster, full-resolution file parses (80,000 triangles), no page errors. Not tested on a physical device.
