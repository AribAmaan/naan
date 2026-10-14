# NAAN v17.7 — hands, weapons and escape verification

Updated 10 October 2026 (India). Based on the v17.6 repaired build; all earlier furniture and material repairs are retained.

## Changes

- Corrected the imported service pistol's scale: its approximately 43 cm model is now approximately 25 cm long. Resized its added magazine and adjusted the moving slide selection.
- Reduced oversized imported hands and their sleeves. Added cached grip deformations using the original mesh and UVs, with separate pistol and shotgun poses. These are fitted poses, not a new finger-bone rig.
- Hands now inherit the active weapon's rotation during reload. The support hand follows the actual pump displacement instead of a separate, lagging animation curve. Switching weapons during reload resets and reparents the hands.
- Updated muzzle flash, smoke, tracer origin and casing ejection anchors for the resized pistol. Shot hit detection still uses the gameplay aiming ray.
- Preserved the shotgun's authored metallic/roughness texture factors instead of applying a blanket multiplier.
- Compacted split hand, slide and pump geometry so discarded vertices are no longer retained in every mesh. The right-hand subset contains 25,959 vertices, down from the original two-hand buffer of 50,335; rendered triangle selection is retained.
- Raised the nun's contact shadow above the floor and prevented transparent meshes in dynamically marked shadow groups from casting solid shadows. The nun's body continues casting shadows.

## Escape route verification

A Chromium test completed the main escape route on WARD-13. It traversed approximately **233 metres** through the player movement/collision system, opened or unlocked doors, and selected objects through the game's proximity and line-of-sight targeting. It used held E input for the chain and boards.

The run collected cutters, crowbar, key, fuse, four pages and the maintenance card; removed the chain and boards; completed the fuse puzzle using its buttons; entered the discovered keypad code; read the final note; then saved, returned to the title and used Continue. Position, power, chain, boards, keypad and final-note progress survived restoration, with the intro remaining skipped. Leaving through the exit reached the **ESCAPE ALONE ending card** and cleared the Continue save.

This was automated, with controlled simulation timing and code-directed aiming. Candidate route positions were evaluated temporarily and restored for planning; traversal itself used movement input without teleporting between objectives. The nun's AI was held inactive during this route to isolate physical accessibility and puzzle progression. It is therefore evidence of a complete route/puzzle run, not a full human playthrough against an active pursuer.

## Additional verification

| Check | Result |
| --- | --- |
| Live AI chase | In a controlled open-corridor setup, the active nun pursued and captured the player. Keyboard struggle input broke the grip, restored walking and granted recovery time. |
| Lockpick interruption | Pause/resume retained lockpicking. Capture closed the lockpick modal. A lethal failed struggle entered the Keeper ending and cleared the save. |
| Restart after death | New game restored health and unsolved escape state with no leftover lockpick, struggle, note, keypad or inventory modal. |
| Weapon animation | All three equipped weapons retained their hand parents and finite vertex data. Reload tilt, magazine drop, cancellation and switching passed. Pump-hand displacement error stayed below 0.1 mm in the sampled sequence. |
| Nun shadows | High-quality test confirmed a non-casting contact patch at y=0.020 and a shadow-casting body mesh. |
| Graphics and layouts | Repeated the four-preset startup/render checks and five additional seed layout checks. Core door, hiding, firing, reload and quality-switch checks passed. |
| Syntax and errors | All 18 scripts passed final syntax checks. No browser errors were recorded in the completed runtime, route or preset/layout tests. |

Tests ran in headless Chromium using SwiftShader software WebGL. The final transparent-shadow adjustment received its own High-quality runtime check after the broader preset run. The route run preceded the last visual-only hand/mesh/shadow adjustments. Screenshots, scripts, JSON results and a change manifest are included in the QA archive.

## Remaining limits

The nun, hands and weapons retain the original source artwork. Their integration, scale and motion have been repaired, but some finger contact and source-surface quality remain imperfect; this is not a replacement with newly sculpted photorealistic assets. Long uninterrupted pursuit, all alternate endings, all generated seeds, physical mobile devices and hardware FPS are not certified by these tests.

Start a new game on High or Ultra to inspect the imported models. Extract the ZIP and host its contents over HTTP with `index.html` at the root. Local launch: `python3 -m http.server 8080`, then open `http://localhost:8080`. No build step is required.
