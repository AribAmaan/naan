# NAAN v17.8 — active AI and save continuity

Updated 10 October 2026 (India). Includes the v17.6 and v17.7 repairs.

## Fixes

**Continue no longer resets an active hunt to the quiet opening.** The horror director previously rebuilt its state with the nun hidden and its release gate enabled, even when loading a save made after release. Saves now include the release flag, director clock, next scare time, cooldown/use counters, tension and random-generator state. Continue restores these values. A quiet-opening save remains quiet; a post-release save restores a visible, awake nun without repeating the release sequence. This does not persist the exact chase target or position of the enemy.

**Both intro skip paths call the normal wake method.** The engine's keyboard and touch skip paths previously omitted the call made by normal intro completion. This affected operation without an initialized horror director. The normal director intentionally delays release and still intercepts that wake call while its opening gate is active; the patch does not remove the designed quiet opening.

**Adjusted imported hand poses.** Reoriented and repositioned both weapon hands toward the pistol grip and shotgun stock/fore-end. Retained the source mesh, cached finger deformation, weapon-parented reload motion and synchronized pump movement from v17.7. These remain fitted poses with imperfect finger contact, not newly sculpted or fully finger-rigged assets.

## Completed browser runs

| Run | Result |
| --- | --- |
| Immediate active-AI stress route | Reached ESCAPE ALONE after approximately 243 m of collision-based traversal. The nun's normal AI updates remained enabled, with patrol, investigation, chase, capture, stun and search observed. The controller broke free from 16 captures using simulated Space presses. No invulnerability, health refill or AI-freeze override was used. The delayed horror director was not stepped in this stress run. |
| Normal director-paced route | Used default director settings and stepped the director with gameplay. After collecting three items, the controller waited in place until the normal timed release. It then completed the fuse, pages, chain, boards, keypad and final-note sequence with the released nun active. Approximately 233 m travelled; no captures occurred in this sampled run. |
| Post-release Continue | Before the fix, inspection returned `directorReleased=false` and `directorGate=true`. After the fix, Continue returned `directorReleased=true` and `directorGate=false`, while retaining escape progress. The run then reached the ending card and cleared its save. |
| Quiet-opening Continue | Retained the unreleased state, clock, next-scare schedule and random-generator state. |
| Input and lifecycle checks | Keyboard and touch intro-skip fallback wake, live chase/capture/break-free, lockpick pause/resume, capture during lockpicking, lethal struggle, clean restart, hand parenting, pump synchronization, reload cancellation and High-quality nun shadows passed. |
| Code and browser errors | All 18 scripts passed syntax checks. The completed route/runtime checks recorded no browser errors. |

The active routes used the player movement and collision system, proximity/line-of-sight interaction selection and held interaction inputs. The controller had code access to item locations, directed its own aim and used idealized rapid struggle inputs. Route planning temporarily evaluated candidate positions and restored the player's position before traversing. Timings and rendering were controlled in headless Chromium with software WebGL. These are automated end-to-end runs, not human skill, difficulty-balance or hardware-performance certification.

The immediate-active stress run preceded the director-persistence patch; the normal director-paced run and quiet-state restoration checks passed after that patch. The evidence archive includes the scripts, logs, final JSON results and ending/model/gameplay captures. Scripts expect sibling `game` and `qa-v178` directories, Playwright and Chromium; adjust their runtime paths on another computer.

## Art and testing limits

The original character and weapon artwork remains. Some hand contacts and generated surface details still need an artist-level pass for full realism. Long unscripted human play, every alternate ending, all procedural seeds and physical mobile/GPU performance remain outside these checks. Earlier release reports are retained as historical records.

## Launch

Extract the game archive and serve its contents over HTTP, keeping `index.html` at the root. For local play, run `python3 -m http.server 8080` in that folder and open `http://localhost:8080`. Start a new game on High or Ultra for visual inspection. Director-state persistence applies to saves created by this version; older saves do not contain those new fields.
