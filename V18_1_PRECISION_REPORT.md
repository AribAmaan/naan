# NAAN 18.1 — grip and weapon animation corrections

Built 10 October 2026, continuing the full-item visual pass in 18.0. This archive includes those furniture, pickup, material, door and environment improvements.

## Corrected in this build

- **Finger bending axis:** the imported hand's fingers spread along Y and its palm faces along X. The old deformation curled in YZ, folding sideways across the hand. It now bends in XZ, preserves finger spacing, and uses restrained thumb opposition. Deformed normals remain smoothed across UV seams. Poses are cached rather than recomputed every frame.
- **Weapon grips:** the pistol, shotgun and flare-gun hand positions and rotations are fitted to their actual geometry. The shotgun support palm faces upward beneath the wooden fore-end. Both hands continue to inherit weapon recoil and reload rotation.
- **Shotgun fore-end separation:** the previous selection omitted the upper wood and included part of the fixed magazine tube. The new selection combines the authored wood texture with the measured barrel/tube cross-section. The partition preserves all 27,852 source triangles: 7,436 in the pump and 20,416 in the fixed body. No source triangles are duplicated or discarded.
- **Pump travel:** the imported shotgun's stroke is now 105 mm, replacing the generic 200 mm displacement that overran the space in this mesh. The support hand tracks the moving part. The original fallback gun retains its existing stroke.
- **Reload shell contact:** the imported shotgun shell uses a hand-local attachment throughout the visible insertion phase, eliminating its independent floating path. It gains a brass base and primer. The shell is hidden before presentation, after insertion, on completion and on cancellation. Its cylindrical axis is restored correctly when animation resets.
- **Fallback compatibility:** the procedural fallback shotgun keeps its original hand path; the new shell attachment is specific to the imported model.
- Updated deployment notes to identify the current release and distinguish current verification from historical test reports.

## Final checks

| Check | Result |
|---|---|
| Inline and external JavaScript syntax | 19 scripts passed |
| Startup/gameplay/layout suite | 22 checks passed |
| AI, capture, restart, save continuity and hand animation suite | 11 checks passed |
| Weapon geometry, pump motion, shell phases and cancellation | 9 checks passed |
| Startup quality settings | Low, Medium, High and Ultra |
| Additional generated layouts | WARD-01, 07, 22, 44 and 99; no blocked approaches or missing navigation in the checked targets |
| Pump/hand displacement error | Below 0.1 mm in the sampled runtime checks |
| Shell visibility/contact | Checked at 25%, 50%, 75% and 90% of a shell cycle; single-shell completion and cancellation passed |
| Automated active-AI escape, WARD-13 | Escape ending reached; approximately 233 m simulated movement and 23 doors |
| Continue during escape route | Director release and all completed exit prerequisites restored |
| Recorded browser errors | None across these suites |

The weapon inspection renders include both sides/rear views, the fired pump at maximum sampled displacement, and reload phases. They expose the actual existing meshes under neutral studio lighting; they are not generated concept images.

The 18.0 audit of 128 item/quality combinations and 84 comparable collision/interaction records remains historical evidence for the unchanged furniture pass. That complete furniture audit was not repeated in 18.1. Current startup, layout and escape tests exercise the integrated build.

## Limits and remaining work

The improvements correct identifiable geometry and animation errors; they do **not** make every item hyperrealistic. The original hand, pistol, shotgun and nun source artwork remains. Hands use surface deformation rather than an articulated five-finger skeleton, and close views still reveal anatomy, texture and sleeve limitations. The character keeps its original 12-joint rig. The flare gun retains its procedural geometry. New production-quality source assets are still needed for a substantial further improvement in close-up realism.

Tests ran in controlled Chromium with SwiftShader and simulated input. The escape route uses the game's live AI and normal director release, but it is not a complete human playthrough. All endings, every random seed, physical-device performance and every possible interaction sequence are not verified. The release does not claim that all bugs are eliminated.

## Run

Extract the game ZIP and serve its contents over HTTP with `index.html` at the root. For example, run `python3 -m http.server 8080` in the extracted directory and open `http://localhost:8080`. Keep the entire `assets` directory. Start a new game for visual comparison; choose High or Ultra before starting for the imported furniture.

See `V18_0_REALISM_REPORT.md` in the game for the inherited full-item coverage and generated portrait provenance. No new external model-generation job was used for 18.1.
