# NAAN v17.4.3 — aim-based interaction picking

Changed one expression in the interaction picker (`Wu`, index.html). Nothing else differs from v17.4.2.

**Problem:** the picker scored candidates as `distance - 0.9*cos(angle)`. At close range cos(angle) barely differs
between objects a few tenths of a metre apart, so the *nearest* object won regardless of where you looked
(v17.4.2 only patched the front-door cluster with per-tag bonuses). Items beside or inside furniture,
the fusebox, the music-box winder / ritual note pair, the shrine and hiding spots were all affected.

**Fix:** score is now `distance + 8*angle` (angle in radians, computed with acos). Where you point decides;
distance breaks ties. All v17.4.2 per-tag bonuses and gating (chain/boards/padlock bonus, keypad until chain+boards,
final note until door unlocked then favoured) are unchanged.

**Measured** (aim straight at each interactable from 0.5-1.8 m, 16 bearings, clear line of sight, all 8 preset seeds, 5 escape stages):
overall pick accuracy 89.9% -> 96.4% (95.1% with +/-6 deg aim jitter; 89.9% before).
Key targets: hiding spots 47 -> 79%, fusebox 72 -> 92%, music-box winder 76 -> 91%, ritual note 79 -> 92%, shrine 82 -> 94%,
page 4 78 -> 93%, keypad (once chain+boards are done) 82 -> 93%, padlock 98 -> 99%, chain/boards 100%.
No interaction type got worse. On CELLAR the padlock is no longer confused with the music box.
Remaining misses are objects physically within a few centimetres of each other (e.g. winder / ritual note, shrine / locket)
and hiding spots that have a pickup placed in or beside them (the pickup wins by design).

**Regression:** scripted real escape through the picker (chain -> boards -> keypad 1968 -> note -> exit) reaches the ending
cinematic and clears the save on all 8 preset seeds; no page errors on any seed.

**Closed, not bugs:**
- Menu video does not play in the headless test browser because it lacks H.264 support. The file is valid
  (H.264 High, 960x540, 8 s, moov atom first). The poster image and CSS fallback cover browsers that cannot play it.
- Continue after reading the final note: the save stores every interactable's enabled flag, so the note stays gone.

**Not verified:** real keyboard/mouse feel, touch, audio, real-GPU frame rate. The Hunter / Lullaby / Keeper endings were
not replayed end to end; the picker change only affects which object is selected, and every object they use
(music box, mirror, shrine, locket, winder, letter) is picked at least as reliably as before.
