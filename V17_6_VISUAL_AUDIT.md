# NAAN v17.6 visual repair and debug report

Source: `NAAN_v17_5_VISUAL_PASS(1).zip`. Completed 9 October 2026.

## Findings and repairs

The problems came from both the assets and their integration. Several fixtures were solid boxes rather than hollow forms; some object materials reused a floor-tile generator; placement logic rejected valid furniture along exterior walls. The update addresses these concrete causes.

| Area | Repair |
| --- | --- |
| Missing furniture | Exterior-wall placement now accounts for wall thickness. Tested bedrooms retain beds; wardrobes and bathroom furniture can occupy their intended positions. |
| Beds | Corrected width-to-length proportions for full, single and narrow beds. Visual geometry, collision footprints and decoration positions transform together. |
| Bathroom models | Rebuilt hollow tub/basin geometry in two GLB assets and procedural fallbacks. Added curved rims, retained taps, restored the sink pedestal and bath supports. Replaced the block-shaped procedural toilet. |
| Pickups | Rebuilt the bottle, fuse, key, page, crowbar and cutters with more plausible dimensions and silhouettes. |
| Materials | Removed floor-tile grout from porcelain, enamel, plastic and other object surfaces. Reduced excessive tile bump/specular response. |
| Imported shading | Corrected the tangent-space normal-map Y sign. Imported authored materials no longer receive the generic procedural dirt shader. |
| Grounding | Imported furniture is grounded consistently; table tops align with existing place settings. |
| Contact shadows | Replaced floor-coincident shadow boxes with slightly raised planes, retained contact shadows during imported-model substitution, and prevented transparent shadow planes from casting solid shadow-map silhouettes. |
| Duplicate geometry | Suppressed legacy handles, trims and contents where imported furniture already supplies them; kept table place settings. |
| Wall detail | Exterior-wall coverings and skirting use the proper wall inset instead of being buried behind walls. |
| Quality switching | Reinstalls the viewmodel lighting pass after rebuilding the post-processing chain, without accumulating duplicate passes. |
| Runtime integration | Preserved utility-room animation anchors during world generation and removed an unnecessary nun-model clone used only to read rig metadata. |

## Verification performed on the final code

| Check | Result and scope |
| --- | --- |
| JavaScript syntax | All 8 inline scripts and 10 standalone scripts passed syntax checks. |
| GLB structure | All 18 GLBs passed custom checks for headers/lengths, nonempty mesh primitives, finite positions, attribute counts and valid triangle indices. This is structural validation, not artistic certification. |
| Furniture and pickup audit | 36 furniture factories plus 6 pickup types, each on Low and High: 84 construction/render cases. No browser errors or nonfinite geometry detected. Contact sheets and individual renders are included in the evidence archive. |
| Graphics presets | Low, Medium, High and Ultra started and rendered WARD-13 with optional-asset status ready and no recorded asset issues. |
| Generated layouts | WARD-01, WARD-07, WARD-22, WARD-44 and WARD-99 retained bedroom beds and passed sampled doorway-approach clearance checks. Room navigation checks passed with locks/bolts temporarily cleared in the test harness to isolate layout connectivity. This does not prove every possible seed is clear. |
| Core interactions | Door open/close, hiding/unhiding, pause/resume, pistol fire/reload and shotgun fire/pump checks passed through game APIs. |
| Rig and viewmodels | Nun rig matrices remained finite; quality changes retained exactly one viewmodel pass. Equipped weapon frames were captured. |
| Mobile input | Touch-drag movement changed player position at 740×360 and 390×844 emulated viewports. Both passed without recorded browser errors. |
| In-world inspection | Captured final bedroom, bathroom, kitchen, table, storage and vanity views, alongside isolated model renders. |

Desktop tests used headless Chromium with software WebGL (SwiftShader), local asset routing, controlled simulation steps and explicit renders. The mobile test allowed the normal animation loop and dispatched browser touch events. These are reproducible smoke/regression checks; they are not hardware FPS measurements or a complete manual playthrough.

## Remaining art and test limits

The update improves geometry, scale, materials and placement. It does not replace every original model with a scanned or artist-made photorealistic asset. The original nun, hands, weapons and some furniture still have their source-art limitations; natural hand grips, richer surface detail and fully articulated character animation remain further art work. Low and Medium intentionally use simpler geometry.

A full escape route, old-save migration, long AI chases, every ending, every procedural seed, physical Android/iOS input and GPU performance were not exhaustively tested in this pass. No claim of a completely bug-free game is made. Earlier release notes are retained as historical records only.

## Running the update

Extract the game ZIP and serve its root over HTTP, keeping all asset folders intact. For local testing: `python3 -m http.server 8080`, then open `http://localhost:8080`. Start a new game, selecting High or Ultra first to inspect the imported assets. Existing saved layouts can differ because furniture footprints and placement have changed.

The separate QA archive contains final JSON/log results, audit scripts, individual model renders, contact sheets, final gameplay/mobile frames, selected original scene captures, and a SHA-256 change manifest. The scripts expect sibling `game` and `qa` folders, Playwright and a Chromium installation; adjust the runtime module/executable paths for another machine. Test harness code is not required to play the game.
