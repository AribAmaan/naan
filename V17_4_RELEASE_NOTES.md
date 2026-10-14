# NAAN v17.4 — gameplay, visual and QA release report

**Starting point:** `NAAN_v17_3_MEDIUM_LOW_DEBUGGED.zip`. **Changes:** applied to that game; not a redesign, not a separate prototype. **Final package:** `NAAN_v17_4_PLAYABLE_DEBUGGED.zip`.

## Priority 0 / blocker fixes

1. **New-game crash — fixed.** The v17.1 replacement `Lx` returned exit-door nodes but omitted `wallC`, which the actual `qx` world builder reads immediately during new-game startup. Chromium reproduced the `Cannot read properties of undefined (reading 'x')` crash. The constructor now returns `{wallC:{x:baseX,z:baseZ}}`. Replayed new game at Low and High: procedural 3D world created with no JS exception.
2. **Continue after unlock could crash — fixed.** The restored `Lx` was also missing `.disp`, but `__restoreGame` writes `W.exit.disp.material.emissive`. Introduced a small dedicated exit-control indicator mesh with an independent cloned brass material, and returned it on `.disp`. Continued a saved game with chain removed, boards pried, power enabled and keypad unlocked: restore passed.
3. **Continue cinematic/state mismatch — fixed.** Restoring a saved run used to put the opening timer back into progress while v72 UI could continue old cinematic state. It now forces `S.introT=-1`, marks the intro complete and clears cinematic state when a checkpoint is restored.
4. **Completed run could reappear as Continue save — guarded.** Save writer now rejects `endcine` as well as any run that has an ending flag. A live test confirmed an escape clears the save, the end card appears, and Restart creates a clean new house.

## Medium / mobile corrections

5. **Mobile intro skip state — fixed.** Previously skip set the timer to `22.6` seconds and disabled the camera cinematic, permitting the game to run with an intro still pending. It now sets the intro to completed (`-1`), restores first-person camera state and hides cinematic controls immediately; desktop `E` skip follows the same rules.
6. **Touch play verification.** At simulated 740x360 landscape and 390x844 portrait, pointer-driven virtual movement and inventory opening worked. FPS/action/aim/control bounding boxes were inspected. No JS exception in the synthetic mobile sessions. Physical-device tests are still needed.
7. **Combat verification.** The three weapons and ammunition items were picked up, revolver was equipped and fired; loaded ammo decremented, shots counter incremented; reload was invoked and shotgun switching succeeded without a JS exception. This is not a verified real enemy gunfight.

## Visual/asset verification

- Menu loads in virtual-display Chromium with software WebGL (SwiftShader).
- Low-quality first-person room and HUD render without a page exception.
- High-quality 3D room generated using bundled models through a test-only local asset bridge. All four v17, four v16 and four v15 furniture assets were requested and supplied; character/weapon GLBs were requested. The optional-art scheduler reported `ready` in the high-quality test.
- v17.1 GLB parser unit test confirms **11 normal-mapped runtime meshes** across four v17 assets.
- Menu background H.264 clip is **960×540, eight seconds**, present in the deploy archive.
- Browser menu screenshots, Low/High first-person, mobile landscape and portrait evidence supplied in the separate QA ZIP.
- Note: inline `about:blank` harness cannot load relative `<img>` resources normally because browser navigation is enterprise-blocked. The **"Nun reference texture did not load"** warning in this harness cannot be attributed to real deployed hosting.

## Regression/testing results

| Test | Result | Scope |
|---|---|---|
| Existing v7–v17 regression suite | Pass | JS static/VM and engine integration tests (some tests simulate model failures intentionally) |
| v17.1 repaired factories | Pass | Four exit orientations, six pickup families, 11 normal-texture uses |
| New v17.4 source contracts | Pass | World exit contract, indicator material, Continue intro, ending/save guard, touch skip |
| 3,000 house seeds | Pass | 0 disconnected layouts, 0 exterior gaps, 0 absent internal-door layouts |
| 220 room variants | Pass | 0 model exceptions, 0 missing breaker, 0 missing lights, 0 doorway approach failures |
| v17.2–v17.3 fixes | Pass | Menu fallback/autoplay, optional art timeout, provider detection, retry, WebKit CSS |
| All standalone runtime JS files | Pass | `node --check` |
| HTML local references | Pass | 13 referenced files, 0 missing (tested references) |
| Live checkpoint and restart | Pass | Temporary in-memory storage in software WebGL browser |
| Live main escape route | Pass with scope limitation | Actual game interactions invoked programmatically in correct order, not walking to each one |
| Live mobile touch movement | Pass with scope limitation | Synthetic PointerEvents at 740×360 and 390×844; not a phone |
| Live GLB model loading | Pass with scope limitation | Test-only asset fetch bridge, not full Netlify HTTP request |
| Live revolver ammo | Pass | Firing decremented loaded ammo and incremented shots; no enemy-hit verification |

## Deliberate gameplay design, not an established bug

`assets/js/fear-director.js` intentionally holds the nun dormant until **at least 300 seconds of active run time**, potentially up to 780 seconds if progress criteria are not met, with story scares before release. This explains why short smoke tests show the nun as `dormant` even after intro-skip. We preserved the designed pacing; a full-length trial is needed to judge horror tension, difficulty and AI behavior.

## Remaining limitations / priorities

1. **Release QA still required:** finish a full physical player-navigation playthrough in a normally hosted browser without bypassing interaction proximity; include collision on all doors and stairs, hidden collectibles, pickup raycasts and ending triggers.
2. **Long-form AI:** verify nun release after the fear director gate, pursuit/ambush/search, hiding, stunned recovery, and struggle outcomes over 10+ minutes; use several seeds/difficulty presets.
3. **Graphics fidelity:** inspect every room and animated furniture/character skinning on actual discrete and integrated GPUs. This testing used Chromium software rendering, not a hardware FPS benchmark.
4. **Platform/input:** test genuine Android Chrome and Safari/iPhone, multitouch/look controls, safe areas, in-game audio and GPU context loss.
5. **Branching endings:** the main Escape ending was exercised; Lullaby, Hunter, and Keeper deserve individual full progression tests.
6. **Loading environments:** test actual Netlify publication with local URL resources, CDN cache headers, and HTTPS storage persistence.
7. **Performance tuning:** draw-call readings in software WebGL were inconsistent across intro and fully active frames, so cannot be used as dependable HP ProBook/phone fps estimates. GPU benchmarking and targeted culling remain necessary.

**Honest status:** v17.4 removes independently reproduced startup and save-state blockers and exercises all major core systems in a real WebGL-capable browser. It is a materially more playable QA build, **not evidence that every visual/physics/AI bug in a large game has been eliminated**.
