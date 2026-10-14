/* NAAN Fear Director v1.1
 * Additive module: slow-burn horror pacing for NAAN (loaded after the main script).
 *  - Granny is held dormant (and hidden) until the player has had time to explore, then released.
 *  - A seeded "director" fires hand-built scares, spaced by a tension model, with a per-run use cap.
 *  - Granny is made nearly blind (the tape says she has no eyes); noise is what draws her.
 * Tune with window.__FEAR_CFG = {...} BEFORE this script loads. Debug: F9, or window.__FEAR_DIRECTOR__.
 */
(() => {
  'use strict';
  if (window.__FEAR_DIRECTOR__) return;

  const CFG = Object.assign({
    enabled: true,
    wakeMin: 300,          // earliest Granny can be released (seconds of run time)
    wakeMax: 780,          // latest she is released even if the player has made no progress
    progressItems: 3,      // inventory size that counts as "enough progress" to release after wakeMin
    blind: true, blindRange: 2.6, blindDark: 1.8,
    firstScare: [40, 70],  // seconds of active play before the first scare
    gapQuiet: [55, 120], gapPresence: [40, 90], gapHunt: [150, 260],
    bigGap: 110,           // min seconds between two "big" scares
    roomSettle: 4,         // no scare until the player has been in a room this long
    releaseLead: 5.5,      // seconds of dread between the tell and Granny appearing
    debug: false
  }, window.__FEAR_CFG || {});
  if (!CFG.enabled) return;

  const ACTIVE = new Set(['playing', 'note', 'pick', 'keypad']);
  const ABSORB = new Set(['note', 'pick', 'keypad']);
  const DEAD_STATES = ['menu', 'loading', 'error'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mulberry = a => { const next = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; next.state = () => a >>> 0; return next; };

  let N = null, R = null, last = performance.now(), panel = null;
  const rr = ([a, b]) => a + R.rng() * (b - a);
  const say = (t, s) => { try { N.say(t, s); } catch (e) { } };

  /* ---------- audio ---------- */
  const audioOk = () => { const a = N && N.audio; return !!(a && a.ready && a.ctx); };
  const env = (g, t, peak, att, dec) => { g.gain.setValueAtTime(1e-4, t); g.gain.linearRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(1e-4, t + att + dec); };

  function thud(x, z, vol, delay = 0, occ = true, f0 = 95) {
    if (!audioOk()) return;
    const a = N.audio, c = a.ctx, t = c.currentTime + delay, out = a._out(x, z, vol, occ);
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .42, t + .18);
    const g = c.createGain(); env(g, t, .9, .008, .26); o.connect(g); g.connect(out); o.start(t); o.stop(t + .3);
    const n = a._noiseSrc(1), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = f0 > 140 ? 900 : 260;
    const g2 = c.createGain(); env(g2, t, .5, .006, .12); n.connect(f); f.connect(g2); g2.connect(out); n.start(t); n.stop(t + .16);
  }
  function knock(x, z, count = 3) {
    const gaps = [0, .43, .81, 1.3, 1.6]; for (let i = 0; i < count; i++) thud(x, z, .85, gaps[i], false, 175);
  }
  function creak(x, z, vol = .5, delay = 0) {
    if (!audioOk()) return;
    if(window.__NAAN_AUDIO__?.play("wood_creak",{x,z,volume:vol,delay,caption:"Wood creaks"}))return;
    const a = N.audio, c = a.ctx, t = c.currentTime + delay, out = a._out(x, z, vol, true);
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(62, t); o.frequency.linearRampToValueAtTime(98, t + 1.1);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 9;
    const g = c.createGain(); env(g, t, .16, .25, .9); o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 1.3);
  }
  function whisper(x, z, vol = .6) {
    if (!audioOk()) return;
    const a = N.audio, c = a.ctx, t0 = c.currentTime, out = a._out(x, z, vol, false);
    let t = t0 + .05; const syl = 5 + Math.floor(R.rng() * 3);
    for (let i = 0; i < syl; i++) {
      const d = .12 + R.rng() * .22, n = a._noiseSrc(.9 + R.rng() * .3);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 3.2;
      f1.frequency.setValueAtTime(1500 + R.rng() * 900, t); f1.frequency.linearRampToValueAtTime(1100 + R.rng() * 700, t + d);
      const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 700 + R.rng() * 300; f2.Q.value = 2;
      const g = c.createGain(); env(g, t, .55, .03, d); n.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out); n.start(t); n.stop(t + d + .1);
      t += d + .04 + R.rng() * .1;
    }
  }
  function musicBox(x, z) {
    if (!audioOk()) return;
    const a = N.audio, c = a.ctx, out = a._out(x, z, .5, true);
    const melody = [0, 3, 7, 12, 10, 7, 3, 5, 7, 3, 0, -2, 0, 3];
    const len = 9 + Math.floor(R.rng() * 3); let t = c.currentTime + .1, gap = .36;
    for (let i = 0; i < len; i++) {
      const f = 880 * Math.pow(2, melody[i % melody.length] / 12);
      [[1, .22], [2.01, .07]].forEach(([m, v]) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
        const g = c.createGain(); env(g, t, v, .004, .85); o.connect(g); g.connect(out); o.start(t); o.stop(t + .95);
      });
      t += gap; gap *= 1.07;       // winds down, then stops mid-phrase
    }
  }
  function overhead(px, pz) {
    const ang = R.rng() * Math.PI * 2, dx = Math.cos(ang), dz = Math.sin(ang), steps = 6 + Math.floor(R.rng() * 3);
    for (let i = 0; i < steps; i++) {
      const o = (i - steps / 2) * 1.15; thud(px + dx * o, pz + dz * o, .75, i * 1.05, true, 70 + (i % 2) * 14);
    }
    creak(px, pz, .45, steps * .5);
  }

  /* ---------- geometry helpers ---------- */
  const fwdOf = p => [-Math.sin(p.yaw), -Math.cos(p.yaw)];
  function losClear(x0, z0, x1, z1) {
    const bx = N.G.world.boxes || [];
    for (const b of bx) {
      if (b.open || b.noLOS || b.h < 1.5 || b.y0 > 1.2) continue;
      const minx = b.x - b.w / 2, maxx = b.x + b.w / 2, minz = b.z - b.d / 2, maxz = b.z + b.d / 2;
      let u0 = 0, u1 = 1; const dx = x1 - x0, dz = z1 - z0;
      for (const [s, d, mn, mx] of [[x0, dx, minx, maxx], [z0, dz, minz, maxz]]) {
        if (Math.abs(d) < 1e-9) { if (s < mn || s > mx) { u0 = 2; break; } continue; }
        let a = (mn - s) / d, c = (mx - s) / d; if (a > c) [a, c] = [c, a];
        u0 = Math.max(u0, a); u1 = Math.min(u1, c); if (u0 > u1) break;
      }
      if (u0 <= u1 && u0 > .02 && u1 < .98) return false;
    }
    return true;
  }
  const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  function offAxis(p, x, z) { const f = fwdOf(p), dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz) || 1; return Math.acos(clamp((f[0] * dx + f[1] * dz) / d, -1, 1)); }
  function pickRoom({ min = 4, max = 18, minAng = 0, maxAng = Math.PI, los = null } = {}) {
    const p = N.G.player, c = [];
    for (const r of N.G.world.rooms) {
      const x = r.x + r.w / 2, z = r.z + r.d / 2, d = dist(x, z, p.pos.x, p.pos.z), a = offAxis(p, x, z);
      if (d < min || d > max || a < minAng || a > maxAng) continue;
      if (los !== null && losClear(p.pos.x, p.pos.z, x, z) !== los) continue;
      c.push({ x, z, r, d });
    }
    return c.length ? c[Math.floor(R.rng() * c.length)] : null;
  }

  /* ---------- effects ---------- */
  const bump = v => { if (R) R.nerve = clamp(R.nerve + v, 0, .75); };
  function lampsNear(maxD, filter) {
    const p = N.G.player, out = [];
    for (const l of N.G.world.lamps) { const d = dist(l.x, l.z, p.pos.x, p.pos.z); if (d <= maxD && (!filter || filter(l, d))) out.push(l); }
    return out.sort((a, b) => dist(a.x, a.z, p.pos.x, p.pos.z) - dist(b.x, b.z, p.pos.x, p.pos.z));
  }
  function flickerLamps(lamps, dur, killFor = 0) {
    if (!lamps.length) return;
    let t = 0, k = 0, on = true; const tail = killFor, total = dur + tail;
    R.fx.push({
      cancel() { lamps.forEach(l => l.__dead = false); },
      update(dt) {
        t += dt; k -= dt;
        if (t < dur) { if (k <= 0) { k = .05 + R.rng() * .16; on = R.rng() < .38; } lamps.forEach(l => l.__dead = !on); }
        else if (t < total) lamps.forEach(l => l.__dead = true);
        else { lamps.forEach(l => l.__dead = false); return true; }
        return false;
      }
    });
  }
  function torchStutter() {
    const p = N.G.player; if (!p.torchOn || p.battery < 8) return false;
    p.torchOn = false; try { N.audio.torchClick(false); } catch (e) { }
    let t = 0, done = false;
    R.fx.push({
      cancel() { if (!done && p.battery > 0) p.torchOn = true; },
      update(dt) { t += dt; if (t >= .55) { if (!p.torchOn && p.battery > 0) { p.torchOn = true; try { N.audio.torchClick(true); } catch (e) { } } done = true; return true; } return false; }
    });
    return true;
  }
  function hideGranny() {
    const g = R.granny; if (!g || !g.obj) return;
    g.obj.visible = false;
  }
  function showFigure(x, z, kind, maxT) {
    const g = R.granny, p = N.G.player; if (!R.gate || R.figure) return false;
    g.x = x; g.z = z; g.yaw = Math.atan2(p.pos.x - x, p.pos.z - z);
    g.obj.position.set(x, 0, z); g.obj.rotation.y = g.yaw; g.obj.visible = true;
    R.figure = { kind, t: 0, gaze: 0, maxT, x, z }; return true;
  }
  function hideFigure() {
    const g = R.granny, h = R.home; R.figure = null;
    if (!g || !h) return; g.x = h.x; g.z = h.z; g.obj.position.set(h.x, 0, h.z); g.obj.visible = false;
  }
  function updateFigure(dt) {
    const f = R.figure; if (!f) return; const p = N.G.player; f.t += dt;
    const a = offAxis(p, f.x, f.z); f.gaze = a < .3 ? f.gaze + dt : 0;
    const looked = (f.kind === 'peripheral' && f.gaze > .25), spent = f.t > f.maxT;
    if (looked || spent) { if (looked) { thud(f.x, f.z, .3, 0, true, 60); bump(.1); } hideFigure(); }
  }


  /* ---------- v1.1: visual + audio effects ---------- */
  const T3 = () => N.__three;
  function addGroup(g) { N.G.world.root.add(g); }
  function disposeGroup(g) {
    try {
      N.G.world.root.remove(g);
      g.traverse(o => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    } catch (e) { }
  }
  const shake = (m, t) => { try { N.G.player.shake(m, t); } catch (e) { } };
  const flash = v => { try { N.G.dreadFlash = Math.max(N.G.dreadFlash || 0, v); } catch (e) { } };

  /* wet footprints: a trail between you and a door, revealed only while you are looking away */
  function footprints() {
    const T = T3(), w = N.G.world, p = N.G.player; if (!T || !w.root || R.prints) return false;
    const cand = [];
    for (const d of w.doors || []) {
      const dd = dist(d.x, d.z, p.pos.x, p.pos.z);
      if (dd < 6 || dd > 13 || offAxis(p, d.x, d.z) < .9) continue;
      const sx = d.x + (p.pos.x - d.x) / dd * (dd - 3.2), sz = d.z + (p.pos.z - d.z) / dd * (dd - 3.2);
      if (!losClear(sx, sz, d.x, d.z) || blocked(sx, sz)) continue;
      cand.push({ d, sx, sz });
    }
    if (!cand.length) return false;
    const c = cand[Math.floor(R.rng() * cand.length)], dx = c.d.x - c.sx, dz = c.d.z - c.sz, len = Math.hypot(dx, dz) || 1;
    const n = clamp(Math.round(len / .75), 4, 9), heading = Math.atan2(-dx, -dz), nx = -dz / len, nz = dx / len;
    const geo = new T.PlaneGeometry(.17, .38);
    const mat = new T.MeshStandardMaterial({ color: 0x7a1411, emissive: 0x2c0604, emissiveIntensity: 1, roughness: .3, metalness: 0, transparent: true, opacity: 0, depthWrite: false });
    const grp = new T.Group(), pts = [];
    for (let i = 0; i < n; i++) {
      const u = (i + .5) / n, side = (i % 2 ? 1 : -1) * .14, x = c.sx + dx * u + nx * side, z = c.sz + dz * u + nz * side;
      const m = new T.Mesh(geo, mat); m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, heading + (R.rng() - .5) * .25, 0);
      m.position.set(x, .014, z); grp.add(m); pts.push({ x, z });
    }
    addGroup(grp); R.prints = grp;
    const mid = pts[pts.length >> 1]; let t = 0, fade = 0, age = 0, shown = false, said = false, done = false;
    const finish = () => { if (done) return; done = true; disposeGroup(grp); R.prints = null; };
    R.fx.push({
      cancel: finish,
      update(dt) {
        t += dt;
        if (!shown) {
          if (offAxis(p, mid.x, mid.z) > .8) { shown = true; } else if (t > 10) { finish(); return true; }
        }
        if (shown) { fade = Math.min(1, fade + dt / 2); age += dt; }
        mat.opacity = (age > 80 ? Math.max(0, 1 - (age - 80) / 10) : fade) * .9;
        if (!said && fade > .5 && pts.some(q => dist(q.x, q.z, p.pos.x, p.pos.z) < 2.2)) { said = true; say('Wet footprints. Still warm.', 3); bump(.1); }
        if (age > 90) { finish(); return true; }
        return false;
      }
    });
    bump(.04); return true;
  }

  /* a pure-black silhouette far down a sightline; gone the moment you really look at it */
  function shadowFigure() {
    const T = T3(), w = N.G.world; if (!T || !w.root || R.shadow) return false;
    const s = figSpot(9, 17, 0, .5); if (!s) return false;
    const mat = new T.MeshBasicMaterial({ color: 0x000000 }), grp = new T.Group();
    const body = new T.Mesh(new T.CapsuleGeometry(.24, 1.35, 4, 8), mat); body.position.set(0, 1.0, 0);
    const head = new T.Mesh(new T.SphereGeometry(.17, 10, 8), mat); head.position.set(0, 1.95, .02);
    /* faint cold rim (back-faces, slightly larger) so the black shape still reads against a dark hall */
    const rim = new T.MeshBasicMaterial({ color: 0x35465c, side: 1 });
    const rb = new T.Mesh(body.geometry, rim); rb.position.set(0, 1.0, 0); rb.scale.set(1.22, 1.04, 1.22);
    const rh = new T.Mesh(head.geometry, rim); rh.position.set(0, 1.95, .02); rh.scale.set(1.28, 1.28, 1.28);
    grp.add(rb); grp.add(rh); grp.add(body); grp.add(head); grp.position.set(s.x, 0, s.z); addGroup(grp); R.shadow = grp;
    const p = N.G.player; let t = 0, gaze = 0, done = false;
    const finish = () => { if (done) return; done = true; disposeGroup(grp); R.shadow = null; };
    R.fx.push({
      cancel: finish,
      update(dt) {
        t += dt; gaze = offAxis(p, s.x, s.z) < .3 ? gaze + dt : 0;
        if (gaze > .35) { thud(s.x, s.z, .35, 0, true, 55); bump(.16); finish(); return true; }
        if (t > 10) { finish(); return true; }
        return false;
      }
    });
    bump(.05); return true;
  }

  /* every lamp dies, torch cuts out, a whisper arrives from behind */
  function blackout() {
    const lamps = N.G.world.lamps || [], p = N.G.player; if (!lamps.length) return false;
    const mine = lamps.filter(l => !l.moon && !l.__dead), hadTorch = !!p.torchOn && p.battery > 0;
    if (!mine.length) return false;
    mine.forEach(l => { l.__dead = true; });
    if (hadTorch) { p.torchOn = false; try { N.audio.torchClick(false); } catch (e) { } }
    let t = 0, whispered = false, done = false;
    const restore = () => {
      if (done) return; done = true; mine.forEach(l => { l.__dead = false; });
      if (hadTorch && !p.torchOn && p.battery > 0) { p.torchOn = true; try { N.audio.torchClick(true); } catch (e) { } }
    };
    R.fx.push({
      cancel: restore,
      update(dt) {
        t += dt;
        if (!whispered && t > 2.4) { whispered = true; const f = fwdOf(p); whisper(p.pos.x - f[0] * 1.4, p.pos.z - f[1] * 1.4, .6); shake(.01, .3); }
        if (t >= 8) { restore(); return true; }
        return false;
      }
    });
    bump(.18); return true;
  }

  /* sound falls away to almost nothing, then something lands right behind you */
  function silenceDrop() {
    if (!audioOk() || R.quiet) return false;
    const a = N.audio, v0 = a.volume, p = N.G.player; let t = 0, hit = false, done = false;
    R.quiet = true; a.setVolume(v0 * .04);
    const restore = () => { if (done) return; done = true; R.quiet = false; try { a.setVolume(v0); } catch (e) { } };
    R.fx.push({
      cancel: restore,
      update(dt) {
        t += dt;
        if (!hit && t >= 3) {
          hit = true; restore(); const f = fwdOf(p);
          thud(p.pos.x - f[0] * 1.6, p.pos.z - f[1] * 1.6, 1, .12, false, 80);
          setTimeout(() => { flash(.9); shake(.06, .4); }, 120); bump(.2);
        }
        return hit && t > 3.6;
      }
    });
    return true;
  }

  function breath(x, z) {
    if (!audioOk()) return;
    const a = N.audio, c = a.ctx, out = a._out(x, z, .55, false); let t = c.currentTime + .05;
    for (let i = 0; i < 3; i++) {
      const inh = .9 + R.rng() * .3, exh = 1.3 + R.rng() * .4;
      [[inh, 1700, .5], [exh, 1000, .7]].forEach(([d, fc, pk]) => {
        const n = a._noiseSrc(1), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fc; f.Q.value = 1.1;
        const g = c.createGain(); env(g, t, pk, d * .45, d * .55); n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + d + .15); t += d + .1;
      });
      t += .45;
    }
  }
  function followedSteps() {
    const p = N.G.player, f = fwdOf(p);
    [6, 4.5, 3.1, 1.9].forEach((d, i) => thud(p.pos.x - f[0] * d, p.pos.z - f[1] * d, .55, i * .66, false, 112 + (i % 2) * 14));
  }
  function glitchFlash() {
    const p = N.G.player; let t = 0, second = false;
    flash(.5); shake(.012, .18);
    if (audioOk()) {
      const a = N.audio, c = a.ctx, out = a._out(p.pos.x, p.pos.z, .3, false), n = a._noiseSrc(1.6), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
      const g = c.createGain(); env(g, c.currentTime, .6, .005, .14); n.connect(f); f.connect(g); g.connect(out); n.start(c.currentTime); n.stop(c.currentTime + .2);
    }
    R.fx.push({ cancel() { }, update(dt) { t += dt; if (!second && t > .28) { second = true; flash(.8); shake(.02, .2); } return t > .5; } });
    bump(.08); return true;
  }
  const DREAD_LINES = ["Don't turn around.", 'It is behind the door.', 'You were never alone in here.', 'Stop moving. Listen.', 'Something is counting your steps.'];

  /* ---------- scares ---------- */
  const SCARES = [
    {
      id: 'knock', minAct: 1, maxUses: 3, cd: 120, w: 3, audio: true,
      can: () => !!pickRoom({ min: 5, max: 16 }),
      fire() { const r = pickRoom({ min: 5, max: 16 }); if (!r) return false; knock(r.x, r.z, 3); bump(.06); return true; }
    },
    {
      id: 'whisper', minAct: 2, maxUses: 3, cd: 150, w: 2, audio: true, big: true,
      fire() { const p = N.G.player, f = fwdOf(p); whisper(p.pos.x - f[0] * 1.5, p.pos.z - f[1] * 1.5, .55); bump(.1); try { p.shake(.008, .25); } catch (e) { } return true; }
    },
    {
      id: 'overhead', minAct: 2, maxUses: 3, cd: 140, w: 3, audio: true,
      fire() { const p = N.G.player; overhead(p.pos.x, p.pos.z); if (R.rng() < .5) say('Footsteps. Above the ceiling.', 3); bump(.1); return true; }
    },
    {
      id: 'music_box', minAct: 2, maxUses: 1, cd: 999, w: 2, audio: true,
      can: () => !!pickRoom({ min: 9, max: 30 }),
      fire() { const r = pickRoom({ min: 9, max: 30 }); if (!r) return false; musicBox(r.x, r.z); bump(.12); return true; }
    },
    {
      id: 'door_opens', minAct: 1, maxUses: 2, cd: 140, w: 2,
      can: () => !!doorPick(false),
      fire() { const d = doorPick(false); if (!d) return false; d.open = true; try { N.audio.doorMove(true, d.x, d.z, false); } catch (e) { } bump(.08); return true; }
    },
    {
      id: 'door_slams', minAct: 2, maxUses: 2, cd: 160, w: 2, big: true,
      can: () => !!doorPick(true),
      fire() { const d = doorPick(true); if (!d) return false; d.open = false; try { N.audio.doorSlam(d.x, d.z, false); } catch (e) { } bump(.14); try { N.G.player.shake(.016, .25); } catch (e) { } return true; }
    },
    {
      id: 'lamp_flicker', minAct: 1, maxUses: 4, cd: 100, w: 3,
      can: () => lampsNear(12).length > 0,
      fire() { const l = lampsNear(12).slice(0, 3); if (!l.length) return false; flickerLamps(l, 1.6 + R.rng() * 1.2); bump(.07); return true; }
    },
    {
      id: 'lamps_die_behind', minAct: 2, maxUses: 1, cd: 999, w: 1, big: true,
      can: () => lampsBehind().length >= 1,
      fire() { const l = lampsBehind().slice(0, 3); if (!l.length) return false; flickerLamps(l, 1.2, 12 + R.rng() * 8); bump(.15); return true; }
    },
    { id: 'torch_stutter', minAct: 1, maxUses: 3, cd: 130, w: 2, can: () => !!N.G.player.torchOn && N.G.player.battery > 8, fire() { if (!torchStutter()) return false; bump(.07); return true; } },
    {
      id: 'peripheral', minAct: 2, maxUses: 2, cd: 200, w: 2, big: true, gated: true,
      can: () => R.gate && !R.figure && !!figSpot(6, 10, .85, 1.5),
      fire() { const s = figSpot(6, 10, .85, 1.5); if (!s) return false; return showFigure(s.x, s.z, 'peripheral', 5); }
    },
    {
      id: 'sighting', minAct: 2, maxUses: 1, cd: 999, w: 6, big: true, gated: true,
      can: () => R.gate && !R.figure && N.G.runTime >= CFG.wakeMin * .8 && !!figSpot(11, 17, 0, .45),
      fire() {
        const s = figSpot(11, 17, 0, .45); if (!s || !showFigure(s.x, s.z, 'sighting', 9)) return false;
        const near = lampsNear(18); let t = 0, went = false;
        R.fx.push({
          cancel() { },
          update(dt) {
            t += dt;
            if (!went && t > 2.4) { went = true; flickerLamps(near.slice(0, 4), .9, .5); hideFigure(); bump(.2); }
            return went;
          }
        });
        return true;
      }
    },
    {
      id: 'call_from_hiding', minAct: 2, maxUses: 2, cd: 180, w: 2, audio: true, big: true,
      can: () => !!hidePick(),
      fire() { const h = hidePick(); if (!h) return false; whisper(h.x, h.z, .7); R.lure = { x: h.x, z: h.z, until: R.clock + 30 }; bump(.1); return true; }
    },
    { id: 'footprints', minAct: 2, maxUses: 2, cd: 200, w: 2, can: () => !R.prints, fire: footprints },
    { id: 'shadow_figure', minAct: 2, maxUses: 3, cd: 170, w: 3, big: true, can: () => !R.shadow && !R.figure && !!figSpot(9, 17, 0, .5), fire: shadowFigure },
    { id: 'blackout', minAct: 2, maxUses: 1, cd: 999, w: 2, big: true, can: () => (N.G.world.lamps || []).length > 0, fire: blackout },
    { id: 'silence_drop', minAct: 2, maxUses: 2, cd: 200, w: 2, big: true, can: () => audioOk() && !R.quiet, fire: silenceDrop },
    { id: 'breath_behind', minAct: 2, maxUses: 2, cd: 160, w: 2, audio: true, big: true, can: audioOk, fire() { const p = N.G.player, f = fwdOf(p); breath(p.pos.x - f[0] * .7, p.pos.z - f[1] * .7); bump(.12); shake(.006, .3); return true; } },
    { id: 'followed_steps', minAct: 2, maxUses: 2, cd: 150, w: 2, audio: true, can: audioOk, fire() { followedSteps(); bump(.12); return true; } },
    { id: 'glitch_flash', minAct: 1, maxUses: 3, cd: 120, w: 2, fire: glitchFlash },
    { id: 'dread_text', minAct: 1, maxUses: 4, cd: 90, w: 3, audio: true, fire() { say(DREAD_LINES[Math.floor(R.rng() * DREAD_LINES.length)], 3); bump(.04); return true; } }
  ];

  function doorPick(wantOpen) {
    const p = N.G.player, f = fwdOf(p), c = [];
    for (const d of N.G.world.doors || []) {
      if (d.locked || (d.collider && d.collider.locked) || !!d.open !== wantOpen) continue;
      const dd = dist(d.x, d.z, p.pos.x, p.pos.z); if (dd < 3.5 || dd > 12) continue;
      const dx = d.x - p.pos.x, dz = d.z - p.pos.z, dot = (f[0] * dx + f[1] * dz) / (dd || 1);
      if (dot > .25 && losClear(p.pos.x, p.pos.z, d.x, d.z)) continue; // never in plain view
      c.push(d);
    }
    return c.length ? c[Math.floor(R.rng() * c.length)] : null;
  }
  function lampsBehind() {
    const p = N.G.player, f = fwdOf(p);
    return lampsNear(16, (l, d) => d > 4 && ((l.x - p.pos.x) * f[0] + (l.z - p.pos.z) * f[1]) / d < -.2 && !l.__dead);
  }
  function hidePick() {
    const p = N.G.player, c = [];
    for (const h of N.G.world.hides || []) { const d = dist(h.x, h.z, p.pos.x, p.pos.z); if (d > 4 && d < 11 && offAxis(p, h.x, h.z) > 1.0) c.push(h); }
    return c.length ? c[Math.floor(R.rng() * c.length)] : null;
  }
  function blocked(x, z) {
    for (const b of N.G.world.boxes || []) {
      if (b.open || b.y0 > 1.7 || b.y0 + b.h < .1) continue;
      if (Math.abs(x - b.x) < b.w / 2 + .35 && Math.abs(z - b.z) < b.d / 2 + .35) return true;
    }
    return false;
  }
  /* ray-march outward along the view direction (+/- an angle band) and return the farthest clear point in [min,max] metres */
  function figSpot(min, max, minAng, maxAng) {
    const p = N.G.player; let best = null;
    for (let k = 0; k < 20; k++) {
      const yy = p.yaw + (R.rng() < .5 ? -1 : 1) * (minAng + R.rng() * (maxAng - minAng)), fx = -Math.sin(yy), fz = -Math.cos(yy);
      for (let d = max; d >= min; d -= 1.5) {
        const x = p.pos.x + fx * d, z = p.pos.z + fz * d;
        if (blocked(x, z) || !losClear(p.pos.x, p.pos.z, x, z)) continue;
        if (!best || d > best.d) best = { x, z, d };
        break;
      }
      if (best && best.d >= max - 2) break;
    }
    return best;
  }

  /* ---------- run lifecycle ---------- */
  function newRun() {
    const S = N.G, g = S.granny, proto = Object.getPrototypeOf(g);
    endRun();
    if (!proto.__fdWake) {
      const orig = proto.wake; proto.__fdWake = orig;
      proto.wake = function () { if (R && R.gate && this === N.G.granny) return; return orig.call(this); };
    }
    if (!g.__fdAnim) {
      g.__fdAnim = true; const an = g.animate;
      g.animate = function (dt, p) { an.call(this, dt, p); if (R && R.granny === this && R.gate && !R.figure) this.obj.visible = false; };
    }
    const seed = (Number.isFinite(S.seedNum) ? S.seedNum : 1) >>> 0;
    R = {
      world: S.world, granny: g, rng: mulberry(seed ^ 0x9E3779B9), clock: 0, gate: true, released: false, releasing: null,
      next: 0, lastScare: -999, lastBig: -999, uses: {}, cool: {}, nerve: 0, roomId: null, roomT: 0, fx: [], figure: null, lure: null, shadow: null, prints: null, quiet: false, tremT: 0,
      wasAbs: false, relT: 0, home: { x: g.x, z: g.z }, fired: []
    };
    R.next = rr(CFG.firstScare);
    const saved=S.fearDirectorRestore;S.fearDirectorRestore=null;
    if(saved?.v===1){
      const num=(v,f=0)=>Number.isFinite(v)?Math.max(0,Math.min(1e7,v)):f;
      R.clock=num(saved.clock);R.next=Math.max(R.clock,num(saved.next,R.clock+40));R.lastScare=Number.isFinite(saved.lastScare)?saved.lastScare:-999;R.lastBig=Number.isFinite(saved.lastBig)?saved.lastBig:-999;
      R.nerve=clamp(num(saved.nerve),0,1);if(Number.isInteger(saved.rng))R.rng=mulberry(saved.rng>>>0);
      for(const scare of SCARES){if(Number.isFinite(saved.uses?.[scare.id]))R.uses[scare.id]=clamp(saved.uses[scare.id]|0,0,scare.maxUses);if(Number.isFinite(saved.cool?.[scare.id]))R.cool[scare.id]=num(saved.cool[scare.id])}
      R.released=saved.released===true;R.gate=!R.released;R.relT=num(saved.relT);R.next=Math.max(R.next,R.clock+3);
      if(R.released){g.obj.visible=true;proto.__fdWake.call(g)}
    }
    if(R.gate)hideGranny();
  }
  function endRun() {
    if (!R) return;
    R.fx.forEach(f => { try { f.cancel && f.cancel(); } catch (e) { } });
    try { if (R.figure) hideFigure(); } catch (e) { }
    R = null;
  }

  function farRoom() {
    const p = N.G.player; let best = null, bd = -1;
    for (const r of N.G.world.rooms) { const x = r.x + r.w / 2, z = r.z + r.d / 2, d = dist(x, z, p.pos.x, p.pos.z) + R.rng() * 2; if (d > bd) { bd = d; best = { x, z }; } }
    return best;
  }
  function startRelease() {
    if (R.releasing) return;
    window.__NAAN_AUDIO__?.event("release");
    const p = N.G.player; R.releasing = { t: 0 };
    if (R.figure) hideFigure();
    const far = farRoom() || { x: p.pos.x, z: p.pos.z };
    for (let i = 0; i < 4; i++) thud(far.x, far.z, .9, i * 1.1, true, 62);
    creak(far.x, far.z, .6, 2);
    flickerLamps(lampsNear(14).slice(0, 4), 2.2, 2);
    say('The floor creaks. Not from you.', 4); bump(.2);
  }
  function completeRelease() {
    const g = R.granny, far = farRoom(); if (far) { g.x = far.x; g.z = far.z; g.obj.position.set(far.x, 0, far.z); }
    g.obj.visible = true; R.gate = false; R.released = true; R.relT = R.clock; R.releasing = null;
    const orig = Object.getPrototypeOf(g).__fdWake; orig.call(g);
    bump(.25);
  }

  function gap(act) { return rr(act === 1 ? CFG.gapQuiet : act === 2 ? CFG.gapPresence : CFG.gapHunt); }

  /* cancel every running effect at once (restores volume, lamps, torch; removes meshes) */
  function windDown() {
    if (!R) return;
    R.fx.forEach(f => { try { f.cancel && f.cancel(); } catch (e) { } }); R.fx = [];
    try { if (R.figure) hideFigure(); } catch (e) { }
  }
  const WIND_STATES = new Set(['end', 'endcine', 'struggle']);
  function tick(dt) {
    const S = N.G;
    if (S && R && (DEAD_STATES.includes(S.state) || WIND_STATES.has(S.state) || (S.player && (S.player.mode === 'dead' || S.player.mode === 'grabbed')))) windDown();
    if (!S || !S.world || !S.granny || !S.player || DEAD_STATES.includes(S.state)) { if (R && (!S || !S.world)) endRun(); return; }
    if (!R || R.world !== S.world) newRun();
    if (!ACTIVE.has(S.state)) return;
    const g = S.granny, p = S.player, rt = S.runTime || 0, abs = ABSORB.has(S.state);

    if (CFG.blind && window.__ET__) { const G = window.__ET__.granny; G.sightRange = CFG.blindRange; G.sightRangeDark = CFG.blindDark; }
    if (R.gate && !R.figure) hideGranny();
    if (S.introT >= 0 || (S.v72 && S.v72.cinematic)) return;     // leave the intro alone

    R.clock += dt;
    const room = S.world.roomAt(p.pos.x, p.pos.z), rid = room ? room.id : null;
    if (rid !== R.roomId) { R.roomId = rid; R.roomT = R.clock; }
    if (abs && !R.wasAbs) R.absorbT = R.clock;
    R.wasAbs = abs;

    const act = R.released ? 3 : (rt >= CFG.wakeMin * .5 ? 2 : 1);
    const base = act === 1 ? .04 : act === 2 ? .12 : .18;
    R.nerve += (base - R.nerve) * Math.min(1, dt * .05);
    S.__dm = Math.max(S.__dm || 0, R.nerve * .85);            // feeds the game's own dread / heartbeat / grain

    R.fx = R.fx.filter(f => !f.update(dt));
    updateFigure(dt);
    if (R.nerve > .45 && p.mode === 'walk') { R.tremT -= dt; if (R.tremT <= 0) { R.tremT = 1.1 + R.rng(); shake(.003 + (R.nerve - .45) * .012, .5); } }

    if (R.lure) {
      if (R.clock > R.lure.until) R.lure = null;
      else if (dist(p.pos.x, p.pos.z, R.lure.x, R.lure.z) < 1.5) {
        knock(R.lure.x, R.lure.z, 2); torchStutter(); bump(.15); try { p.shake(.02, .3); } catch (e) { } R.lure = null;
      }
    }

    if (R.gate) {
      const prog = S.inventory && S.inventory.size >= CFG.progressItems || S.chainCut || S.power;
      if (!R.releasing && (rt >= CFG.wakeMax || (rt >= CFG.wakeMin && prog))) startRelease();
      if (R.releasing) { R.releasing.t += dt; if (R.releasing.t >= CFG.releaseLead) completeRelease(); }
    }

    if (room?.safe) return; // The refuge must remain a genuine pacing break.
    if (R.releasing || R.clock < R.next - (abs ? 15 : 0)) return;
    if (g.isDangerous || g.state === 'stalk' || p.mode === 'dead' || p.mode === 'grabbed') return;
    if (R.released && R.clock - R.relT < 30) return;
    if (R.clock - R.roomT < CFG.roomSettle && !abs) return;
    if (p.mode !== 'walk' && !abs) return;

    const pool = SCARES.filter(s => act >= s.minAct && (R.uses[s.id] || 0) < s.maxUses && R.clock - (R.cool[s.id] || -999) > s.cd &&
      !(s.gated && !R.gate) && !(s.big && R.clock - R.lastBig < CFG.bigGap) && !(abs && !s.audio) && (!s.can || s.can()));
    if (!pool.length) { R.next = R.clock + 8; return; }
    let tot = 0; pool.forEach(s => tot += s.w * (abs && s.audio ? 2.5 : 1));
    let roll = R.rng() * tot, pick = pool[0];
    for (const s of pool) { roll -= s.w * (abs && s.audio ? 2.5 : 1); if (roll <= 0) { pick = s; break; } }
    let ok = false; try { ok = pick.fire(); } catch (e) { console.warn('[fear] scare failed', pick.id, e); }
    if (!ok) { R.next = R.clock + 6; return; }
    window.__NAAN_AUDIO__?.event("scare");
    R.uses[pick.id] = (R.uses[pick.id] || 0) + 1; R.cool[pick.id] = R.clock; R.lastScare = R.clock;
    if (pick.big) R.lastBig = R.clock; R.fired.push(pick.id + '@' + Math.round(R.clock));
    R.next = R.clock + gap(act);
  }

  /* ---------- debug ---------- */
  function drawPanel() {
    if (!CFG.debug) { if (panel) panel.style.display = 'none'; return; }
    if (!panel) {
      panel = document.createElement('pre');
      panel.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99999;margin:0;padding:6px 8px;background:rgba(0,0,0,.7);color:#9f9;font:11px/1.35 monospace;pointer-events:none;white-space:pre';
      document.body.appendChild(panel);
    }
    panel.style.display = 'block';
    if (!R) { panel.textContent = 'fear: no run'; return; }
    const S = N.G;
    panel.textContent = 'fear director\nrun ' + (S.runTime | 0) + 's  clock ' + (R.clock | 0) + 's  act ' + (R.released ? 3 : S.runTime >= CFG.wakeMin * .5 ? 2 : 1) +
      '\nnerve ' + R.nerve.toFixed(2) + '  gate ' + R.gate + (R.releasing ? ' RELEASING' : '') + '\nnext scare in ' + Math.max(0, R.next - R.clock | 0) + 's' +
      '\nlast: ' + R.fired.slice(-4).join(', ');
  }
  window.addEventListener('keydown', e => { if (e.code === 'F9') { CFG.debug = !CFG.debug; e.preventDefault(); } });

  window.__FEAR_DIRECTOR__ = {
    cfg: CFG,
    snapshot(){if(!R||R.world!==N?.G?.world)return null;return {v:1,released:R.released,clock:R.clock,next:R.next,lastScare:R.lastScare,lastBig:R.lastBig,nerve:R.nerve,relT:R.relT,rng:R.rng.state(),uses:{...R.uses},cool:{...R.cool}}},
    get state() { return R; },
    fire(id) { if (!R) return false; const s = SCARES.find(x => x.id === id); return s ? !!s.fire() : false; },
    release() { if (R && R.gate) startRelease(); },
    skipTo(sec) { if (N && N.G) N.G.runTime = sec; },
    step(dt) { if (!N) N = window.__NAAN__; if (N) tick(dt); },   // manual stepping for tests
    scares: SCARES.map(s => s.id)
  };

  /* ---------- boot ---------- */
  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now;
    if (!N) { N = window.__NAAN__; if (!N) return; }
    if(document.hidden)return;
    try { tick(dt); drawPanel(); } catch (e) { if (!loop.warned) { loop.warned = true; console.warn('[fear] tick error', e); } }
  }
  requestAnimationFrame(loop);
})();
