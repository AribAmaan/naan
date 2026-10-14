# NAAN 18.0 — full item realism pass

Built 10 October 2026, continuing the v17.8 gameplay fixes.

This is a broad visual upgrade, **not a claim of photorealistic replacement artwork for every model**. The original nun, hand and gun source meshes remain. Their topology, texture resolution and limited rigging still constrain close-up realism. No Meshy job was submitted: its CLI reported no authenticated profile.

## What changed

- A new local `assets/js/realism-v18.js` applies the visual pass without another animation loop or additional real-time lights.
- All 36 furniture factories receive material, geometric or detail treatment. Procedural boxes have physical-size bevels; upholstery gets softer corners. The existing 12 imported furniture models receive semantic wood/fabric/brass finish improvements where those materials exist.
- Eight families have newly authored procedural forms: washer, rocking chair, coatstand, barrel, wine rack, armchair, hanging bulb and utility sink.
- The washer has circular door seals, a control dial and lower vents. The rocker has curved runners and spindles. The barrel has a bulging profile, hoops and lid. The sink has a hollow basin, legs, tap and trap pipe.
- Imported bed pillows are now rounded rectangular forms instead of oval cushions. Mattresses, blankets and seating have restrained woven texture; wood grain and metal finishes are less noisy.
- Clock faces have Roman numerals and minute divisions. Workbenches have shaped tools and vice details. Crates, filing cabinets, trunks, breakers, refrigerators and toyboxes have additional hardware or labels.
- Picture frames now display an original generated period portrait. The image is bundled locally at `assets/portrait-v18.png`; it needs no generation service at runtime.
- Interior and exit doors have bevelled panels, hinges, escutcheons and knobs on both sides. The existing opening, locking, chain and board gameplay contracts remain.
- All six original pickups receive geometry or finish treatment: cutters, crowbar, note, key, fuse and bottle. Notes have a slight curl; fuses and bottles have dedicated labels.
- Survival-prop boxes have bevelled edges. Medical kits, music boxes, lockets, bandages, tonic and winder receive details. Pistol cartridge noses are rounded; ammunition packaging now says 9 mm Luger, matching the actual semi-automatic pistol.
- Dropped weapons use the same model scale as their held counterparts. Hand normals are smoothed across duplicated UV-seam vertices after grip deformation; sleeves have more radial segments and modest cloth folds. The nun's exposed face/hand regions have a different roughness response from the habit.
- Tile surfaces have narrower grout and restrained colour variation; floorboards have long grain, staggered joints and reduced normal-map exaggeration. Plaster relief is reduced. Existing room lighting, fog, shadow tiers, reflections and effects remain.

## Validation

| Check | Result |
|---|---|
| Inline and external JavaScript syntax | 19 scripts passed |
| Item studio renders | 128 cases: 64 families at Low and High |
| Non-finite positions / factory failures | None in the 128 cases |
| Final utility-sink recheck | Both quality tiers passed |
| Original furniture/pickup collision and interaction metadata | All 84 comparable cases match the previous audit |
| Startup and gameplay regressions | 22 checks passed, including all four quality tiers and five additional layout seeds |
| Active AI / restart / modal / hand animation regressions | 11 checks passed |
| Automated director-paced escape, WARD-13 | Reached escape ending after approximately 233 m of simulated movement; 23 doors |
| Continue during active director run | Release state and completed escape prerequisites restored |
| Final nun shader render and room captures | No recorded browser/shader errors |

The escape run traversed the house using simulated input and exercised pickups, held actions, power, the exit code, final note, Continue and ending. It is an automated controlled run, not a complete human playthrough. Rendering used Chromium with SwiftShader. These results do not establish frame rates on the HP ProBook, Android or iOS.

## Coverage

| Furniture | Treatment |
|---|---|
| breaker | Bevels, switches, fasteners and plate |
| bed | Imported pillow replacement; wood, fabric and hardware finish |
| cot | Mattress, bevels and surface finish |
| wardrobe | Imported surface finish; procedural bevels |
| table | Imported surface finish; procedural bevels |
| chair | Imported surface finish; procedural bevels |
| dresser | Imported surface finish; procedural bevels |
| sofa | Imported upholstery finish; procedural cushion bevels |
| rocker | Curved runners, spindles, arms and cushion |
| clock | Printed dial, minute divisions and pendulum |
| shelfUnit | Imported finish; fallback cans and storage box |
| rug | Edge fringe; existing central pattern retained |
| painting | Original portrait, inset frame and brass trim |
| kitchenRun | Cabinet finish and procedural bevels; existing sink retained |
| stove | Surface treatment and fallback circular burner rings |
| fridge | Vent slots, plate and bevels |
| bathSet | Existing curved basins retained; glazing and hardware finish |
| toilet | Glazing and small hardware detail |
| washer | Circular door, seals, controls and vents |
| workbench | Hanging tools, vice and edge finish |
| crate | Plank edges and nail heads |
| barrel | Bulging body, hoops, rivets and lid |
| bulb | Smoother shade, rolled edge and bulb |
| coatstand | Bent hooks and shaped feet |
| trunk | Rivets, carrying hardware and bevels |
| toybox | Hinges, handle recess and bevels |
| vanity | Imported finish and fallback bevels |
| wineRack | Open shelves and cylindrical bottle bodies/necks |
| utilitySink | Hollow basin, pipe trap, tap and metal stand |
| filingCabinet | Label holders, handles and bevels |
| hearth | Rounded log forms and surface finish |
| bedSingle | Soft bedding bevels and surface finish |
| bedNarrow | Soft bedding bevels and surface finish |
| armchair | Rolled arms, cushions, feet and upholstery buttons |
| bathCompact | Existing curved bath retained; glaze/hardware finish |
| pedestalSink | Existing curved basin retained; glaze/hardware finish |

The additional studio cases cover six puzzle pickups; three weapon pickups; ammunition, shells and flares; bandage, tonic, battery and medkit; locket and winder; music-box, mirror and shrine puzzles; and seven document variants. Document layouts, flare-gun geometry, mirror-puzzle geometry and shrine geometry largely retain their established designs; the pass does not claim these were entirely rebuilt.

## Remaining art limitations

- The nun still uses the original textured source mesh and 12-joint rig. There is no newly sculpted face, facial rig or cloth simulation.
- Hands still use the original static source mesh with procedural grip deformation, not a new anatomically rigged five-finger asset. Extreme poses can still expose source-art limitations.
- Pistol and shotgun keep their original source topology and texture resolution. They have not been replaced by new photogrammetry or production-grade authored assets.
- Most imported furniture geometry remains the original geometry. Materials and selected forms were improved; not every mesh was rebuilt.
- Materials are generated/native textures plus existing imported artwork. This is not a complete scanned PBR asset set. Mirrors on low-end presets retain the game's existing limited reflection treatment.
- A full human playthrough and hardware performance assessment remain unverified.

## Run / deploy

Serve the extracted game folder over HTTP, or deploy its contents to Netlify. Keep the complete `assets` directory beside `index.html`. Do not open the HTML through a file URL: model loading requires HTTP. Existing saves use the existing save format.

## Generated artwork provenance

Built-in image generation was used for `assets/portrait-v18.png`. Prompt:

> Use case: historical-scene. Asset type: in-game oil painting texture for an old Victorian horror house. Create one original believable late nineteenth century oil portrait of a stern elderly woman in a dark high-necked dress, chest-up, natural anatomically accurate face and hands resting together at lower edge, subtly unsettling but no monsters. Traditional painterly realism, muted umber and olive background, warm soft side lighting, aged varnish and fine restrained craquelure. Vertical 3:4 composition, painting fills entire image edge to edge. NO frame, no wall, no room, no text or signature, no borders, no perspective distortion. This image will be mapped flat onto an existing 3D framed painting.
