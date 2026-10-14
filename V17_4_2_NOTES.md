# NAAN v17.4.2 — front-door interaction fix

Changed one line in the interaction picker (`Wu`, index.html). Nothing else differs from v17.4.1.

**Problem:** at the front door the chain, boards, keypad, exit door and final note sit within ~0.3 m of each other.
Aiming straight at the chain picked the chain only ~25% of the time (the note won ~50%, the keypad ~25%); boards ~21%.

**Fix:** padlock/chain/boards get a -0.7 priority bonus; the keypad gets +0.9 until chain and boards are done;
the final note drops its pickup bonus and gets +0.9 until the door is unlocked (bonus restored after unlock).

**Measured (aim directly at target, sampled positions 0.5-1.8 m, 4 seeds):**
chain 25% -> ~95%, boards 21% -> ~95%, keypad 66% -> 100%, padlock 96-100% -> 98-100%.
Escape path re-run through the patched selector (chain, boards, keypad, note, exit): end card shown, save cleared, no page errors.
All 8 preset seeds load with no page errors.

**Known / unchanged:** padlock vs music box on CELLAR are 1.5 m apart; targeting there is only marginally better.
Not verified: real keyboard/mouse, touch, audio, real-GPU performance.
Test-harness note: a bare requestPointerLock() call outside a user gesture hangs headless Chromium; not a game bug.
