/* NAAN — adjustable touch controls (CODM-style HUD layout editor)
 * - Every touch button can be dragged, resized, made transparent or hidden.
 * - Extra buttons: second FIRE (left thumb), HOLSTER, weapon slots 1/2/3.
 * - Move stick: floating or fixed.
 * - Separate layouts for landscape and portrait, saved in localStorage.
 * Open from CONTROLS -> "CUSTOMIZE TOUCH CONTROLS" or from the PAUSE menu.
 */
(function () {
  'use strict';
  var KEY = 'naan.hud.v1';
  var $ = function (id) { return document.getElementById(id); };
  var tc = $('touch-controls');
  if (!tc) return;
  var app = $('app') || document.body;

  /* ---------- give the id-less buttons ids so we can address them ---------- */
  var torchEl = tc.querySelector('[data-code="KeyF"]'); if (torchEl && !torchEl.id) torchEl.id = 'touch-torch';
  var throwEl = tc.querySelector('[data-code="KeyQ"]'); if (throwEl && !throwEl.id) throwEl.id = 'touch-throw';

  /* ---------- icons ---------- */
  var S0 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var IC = {
    fire: '<svg viewBox="0 0 24 24"><path d="M12 1.6c2.7 2.1 3.9 4.7 3.9 7.8V15H8.1V9.4c0-3.1 1.2-5.7 3.9-7.8z" fill="currentColor"/><rect x="7.5" y="16.4" width="9" height="6" rx="1.1" fill="currentColor"/></svg>',
    aim: S0 + '<circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    reload: S0 + '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.5 3.5v5h-5"/></svg>',
    crouch: S0 + '<circle cx="14.5" cy="4.8" r="1.9" fill="currentColor"/><path d="M13.6 8.2 9.8 11l-2.7 5 4.2 1.2M9.8 11l4.9 2.2 3.2 5.2M7.1 16l-1.4 4.2"/></svg>',
    run: S0 + '<path d="M5.5 5.5 12 12l-6.5 6.5M12.5 5.5 19 12l-6.5 6.5"/></svg>',
    use: S0 + '<path d="M8 12.5V6.3a1.6 1.6 0 0 1 3.2 0V11M11.2 10.5V4.8a1.6 1.6 0 0 1 3.2 0v5.7M14.4 10.5V6.6a1.6 1.6 0 0 1 3.2 0V14a6.5 6.5 0 0 1-6.5 6.5h-.6a5.3 5.3 0 0 1-4.2-2.1L3.9 14.8a1.6 1.6 0 0 1 2.5-1.9L8 14.5"/></svg>',
    torch: S0 + '<path d="M8.5 2.5h7l1.2 4.5H7.3z"/><path d="M8 7v13.2a1.3 1.3 0 0 0 1.3 1.3h5.4a1.3 1.3 0 0 0 1.3-1.3V7"/><path d="M12 11v3"/></svg>',
    throwg: S0 + '<path d="M10.2 2.5h3.6v4.2l2 3v11a1.3 1.3 0 0 1-1.3 1.3H9.5a1.3 1.3 0 0 1-1.3-1.3v-11l2-3z"/><path d="M8.4 13.5h7.2"/></svg>',
    swap: S0 + '<path d="M4 8h14.5l-3-3M20 16H5.5l3 3"/></svg>',
    pack: S0 + '<path d="M7 8.5a5 5 0 0 1 10 0V20a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20z"/><path d="M9.5 14h5M10 3.8V2.5h4v1.3"/></svg>',
    holster: S0 + '<path d="M3 9h12.5l1.5 2.5H21V15h-6.2l-1 3.6a1.2 1.2 0 0 1-1.2.9H9.6a1.2 1.2 0 0 1-1.2-1.5L9 15H3z"/></svg>'
  };
  function numIcon(n) { return '<svg viewBox="0 0 24 24"><text x="12" y="17.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="17" fill="currentColor">' + n + '</text></svg>'; }

  /* ---------- control table ---------- */
  // kind: stick | btn | key (alias to key) | fwd (alias to existing button)
  var CT = [
    { id: 'stick', name: 'MOVE STICK', req: 1 },
    { id: 'fire', name: 'FIRE', el: 'touch-fire', ic: 'fire', lb: 'FIRE' },
    { id: 'fire2', name: 'FIRE (LEFT)', kind: 'fwd', fwd: 'touch-fire', ic: 'fire', lb: 'FIRE' },
    { id: 'ads', name: 'AIM', el: 'touch-ads', ic: 'aim', lb: 'AIM' },
    { id: 'reload', name: 'RELOAD', el: 'touch-reload', ic: 'reload', lb: 'RELOAD' },
    { id: 'crouch', name: 'CROUCH', el: 'touch-crouch', ic: 'crouch', lb: 'CROUCH' },
    { id: 'run', name: 'SPRINT', el: 'touch-run', ic: 'run', lb: 'SPRINT' },
    { id: 'use', name: 'USE / HOLD', el: 'touch-use', ic: 'use', lb: 'USE' },
    { id: 'torch', name: 'TORCH', el: 'touch-torch', ic: 'torch', lb: 'TORCH' },
    { id: 'throwg', name: 'THROW', el: 'touch-throw', ic: 'throwg', lb: 'THROW' },
    { id: 'swap', name: 'SWAP WEAPON', el: 'touch-swap', ic: 'swap', lb: 'SWAP' },
    { id: 'pack', name: 'SURVIVAL PACK', el: 'touch-inv', ic: 'pack', lb: 'PACK' },
    { id: 'pause', name: 'PAUSE', el: 'touch-pause', req: 1, noicon: 1 },
    { id: 'holster', name: 'HOLSTER', kind: 'key', code: 'KeyH', ic: 'holster', lb: 'HOLSTER' },
    { id: 'slot1', name: 'WEAPON SLOT 1', kind: 'key', code: 'Digit1', num: 1, lb: 'REVOLVER' },
    { id: 'slot2', name: 'WEAPON SLOT 2', kind: 'key', code: 'Digit2', num: 2, lb: 'SHOTGUN' },
    { id: 'slot3', name: 'WEAPON SLOT 3', kind: 'key', code: 'Digit3', num: 3, lb: 'FLARE' }
  ];
  var BY = {}; CT.forEach(function (c) { BY[c.id] = c; });

  /* ---------- presets (x,y = centre as fraction of screen; s = size scale; o = opacity; v = visible) ---------- */
  function P(x, y, s, o, v) { return { x: x, y: y, s: s, o: o == null ? 0.9 : o, v: v !== false }; }
  var CODM = {
    land: {
      stick: P(.16, .70, 1.1), fire2: P(.06, .40, 1), run: P(.20, .40, 1),
      fire: P(.89, .64, 1.3, .95), ads: P(.78, .585, 1), throwg: P(.79, .36, 1), reload: P(.91, .35, 1),
      crouch: P(.965, .87, 1), torch: P(.82, .85, 1), use: P(.71, .78, 1.1), swap: P(.72, .46, 1),
      pack: P(.90, .09, 1), pause: P(.965, .09, 1),
      holster: P(.28, .12, 1, .9, false), slot1: P(.40, .90, 1, .9, false), slot2: P(.50, .90, 1, .9, false), slot3: P(.60, .90, 1, .9, false)
    },
    port: {
      stick: P(.25, .85, 1), fire2: P(.10, .60, 1), run: P(.30, .62, 1),
      fire: P(.80, .78, 1.3, .95), ads: P(.57, .72, 1), throwg: P(.62, .58, 1), reload: P(.88, .62, 1),
      crouch: P(.92, .92, 1), torch: P(.74, .92, 1), use: P(.52, .86, 1.05), swap: P(.50, .64, 1),
      pack: P(.78, .06, 1), pause: P(.92, .06, 1),
      holster: P(.36, .52, 1, .9, false), slot1: P(.16, .955, 1, .9, false), slot2: P(.34, .955, 1, .9, false), slot3: P(.52, .955, 1, .9, false)
    }
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function defaults() { return { v: 1, skin: 'icons', labels: true, stick: 'float', land: clone(CODM.land), port: clone(CODM.port) }; }

  /* ---------- storage ---------- */
  function load() {
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && r.v === 1) {
        var d = defaults();
        r.skin = r.skin === 'classic' ? 'classic' : 'icons';
        r.labels = r.labels !== false;
        r.stick = r.stick === 'fixed' ? 'fixed' : 'float';
        ['land', 'port'].forEach(function (o) {
          if (r[o] === null) return;
          if (!r[o] || typeof r[o] !== 'object') r[o] = d[o];
          CT.forEach(function (c) { if (!r[o][c.id]) r[o][c.id] = clone(CODM[o][c.id]); });
        });
        return r;
      }
    } catch (e) { }
    return defaults();
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } }
  var data = load();

  /* ---------- styles ---------- */
  var css = document.createElement('style'); css.id = 'naan-hud-css';
  css.textContent = [
    '#touch-controls.hud-icons button.hudb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0;color:#f3f3ee;background:rgba(18,20,24,.55);border:1.5px solid rgba(255,255,255,.38);box-shadow:inset 0 0 0 2px rgba(0,0,0,.22),0 2px 10px rgba(0,0,0,.45);text-shadow:none}',
    '#touch-controls button.hudb .hi{display:block;width:46%;height:46%;pointer-events:none}',
    '#touch-controls button.hudb .hi svg{width:100%;height:100%;display:block;overflow:visible}',
    '#touch-controls button.hudb .hl{font:700 8px/1 system-ui,sans-serif;letter-spacing:.06em;pointer-events:none;opacity:.85}',
    '#touch-controls.hud-nolabel button.hudb .hl,#touch-controls button.hudb.hud-sm .hl,#touch-controls #touch-fire .hl,#touch-controls #hud-fire2 .hl{display:none}',
    '#touch-controls #touch-fire .hi,#touch-controls #hud-fire2 .hi{width:50%;height:50%}',
    '#touch-controls.hud-icons #touch-use{border:1.5px solid rgba(255,255,255,.38);background:rgba(18,20,24,.55)}',
    '#touch-controls.hud-icons #touch-fire{border:3px solid #f2b52a!important;background:rgba(28,24,16,.55)!important;box-shadow:0 0 12px rgba(242,181,42,.35),inset 0 0 0 2px rgba(0,0,0,.25)}',
    '#touch-controls.hud-icons #hud-fire2{border:2px solid rgba(255,255,255,.55)}',
    '#touch-controls.hud-icons button.hudb.pressed,#touch-controls.hud-icons button.hudb.selected{background:rgba(255,255,255,.34);border-color:#fff}',
    '#touch-controls #hud-fire2,#touch-controls [data-hud="x"]{width:calc(var(--action)*1.15);height:calc(var(--action)*1.15)}',
    '#touch-controls [data-hud="x"]{z-index:3;pointer-events:auto;touch-action:none}',
    /* editor */
    '#hud-ed{position:absolute;inset:0;z-index:70;touch-action:none;user-select:none;-webkit-user-select:none;background:rgba(0,0,0,.38);background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:40px 40px;font-family:system-ui,sans-serif;color:#eee}',
    '#hud-ed .hud-h{position:absolute;border:2px dashed rgba(255,255,255,.5);border-radius:50%;touch-action:none;cursor:grab;box-sizing:border-box}',
    '#hud-ed .hud-h.sel{border:2px solid #f2b52a;box-shadow:0 0 0 3px rgba(242,181,42,.25)}',
    '#hud-ed .hud-h.off{border-color:rgba(255,255,255,.25)}',
    '#hud-ed .hud-h .tag{display:none;position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;font:700 8px system-ui;letter-spacing:.08em;white-space:nowrap;color:#fff;background:rgba(0,0,0,.6);padding:1px 4px;border-radius:3px;pointer-events:none}',
    '#hud-ed .hud-h.sel .tag{display:block}',
    '#hud-ed .hud-h.off .tag::after{content:" · HIDDEN";color:#f2b52a}',
    '#hud-ed-panel{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:min(300px,86vw);max-height:calc(100% - 16px);overflow:auto;background:rgba(10,11,14,.93);border:1px solid rgba(242,181,42,.55);border-radius:10px;padding:10px 12px;box-shadow:0 6px 24px rgba(0,0,0,.6);font-size:11px;letter-spacing:.04em}',
    '@media(orientation:portrait){#hud-ed-panel{top:11%}}',
    '#hud-ed-panel h3{font:700 12px system-ui;letter-spacing:.14em;color:#f2b52a;margin:0 0 2px}',
    '#hud-ed-panel .sub{opacity:.65;margin-bottom:8px;line-height:1.35;font-size:10px}',
    '#hud-ed-panel .row{display:flex;align-items:center;gap:8px;margin:7px 0}',
    '#hud-ed-panel .row>span{width:62px;opacity:.8}',
    '#hud-ed-panel .row output{width:34px;text-align:right;opacity:.8}',
    '#hud-ed-panel input[type=range]{flex:1;min-width:0;accent-color:#f2b52a;height:22px}',
    '#hud-ed-panel .seg{display:flex;gap:6px;flex:1}',
    '#hud-ed-panel button{flex:1;font:700 10px system-ui;letter-spacing:.1em;color:#eee;background:#1d2026;border:1px solid #454a54;border-radius:6px;padding:9px 6px;touch-action:manipulation}',
    '#hud-ed-panel button.on{background:#f2b52a;color:#111;border-color:#f2b52a}',
    '#hud-ed-panel button.pri{background:#2b6b3a;border-color:#3d9a54}',
    '#hud-ed-panel button.dng{background:#4a1d1d;border-color:#7a2f2f}',
    '#hud-ed-panel .foot{display:flex;gap:6px;margin-top:10px}',
    '#hud-ed-panel .name{font:700 12px system-ui;letter-spacing:.1em;margin:4px 0 2px}',
    '#hud-ed-toast{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:#2b6b3a;color:#fff;padding:8px 14px;border-radius:6px;font:700 11px system-ui;letter-spacing:.08em}',
    '.hud-launch{margin-top:10px}'
  ].join('\n');
  document.head.appendChild(css);
  var stickCss = document.createElement('style'); stickCss.id = 'naan-hud-stick'; document.head.appendChild(stickCss);

  /* ---------- element access + extra buttons ---------- */
  var elCache = {};
  function el(id) {
    var c = BY[id]; if (!c) return null;
    if (id === 'stick') return $('move-stick');
    if (c.el) return $(c.el);
    return elCache[id] || null;
  }

  function mkExtra(c) {
    var b = document.createElement('button');
    b.id = 'hud-' + c.id; b.type = 'button'; b.dataset.hud = 'x'; b.setAttribute('aria-label', c.name);
    tc.appendChild(b); elCache[c.id] = b;
    var live = {};
    function down(e) {
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch (x) { }
      b.classList.add('pressed');
      var sid = 100000 + e.pointerId; live[e.pointerId] = sid;
      if (c.kind === 'fwd') {
        var t = $(c.fwd); if (t) t.dispatchEvent(new PointerEvent('pointerdown', { pointerId: sid, pointerType: 'touch', bubbles: true, cancelable: true }));
      } else if (c.kind === 'key') {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: c.code, key: c.code, bubbles: true, cancelable: true }));
      }
    }
    function up(e) {
      var sid = live[e.pointerId]; if (sid == null) return; delete live[e.pointerId];
      b.classList.remove('pressed');
      if (c.kind === 'fwd') {
        var t = $(c.fwd); if (t) t.dispatchEvent(new PointerEvent('pointerup', { pointerId: sid, pointerType: 'touch', bubbles: true, cancelable: true }));
      } else if (c.kind === 'key') {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: c.code, key: c.code, bubbles: true, cancelable: true }));
      }
    }
    b.addEventListener('pointerdown', down);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, up); });
    return b;
  }
  CT.forEach(function (c) { if (c.kind) mkExtra(c); });

  /* ---------- skin (icons / classic text) ---------- */
  function setSkin() {
    var icons = data.skin === 'icons';
    tc.classList.toggle('hud-icons', icons);
    tc.classList.toggle('hud-nolabel', !data.labels);
    CT.forEach(function (c) {
      if (c.id === 'stick' || c.noicon) return;
      var b = el(c.id); if (!b) return;
      if (b.dataset.orig == null) b.dataset.orig = c.kind ? c.lb : b.textContent;
      var want = icons ? 'i' : 't';
      if (b.dataset.skin === want) return;
      b.dataset.skin = want;
      if (icons) {
        var svg = c.num ? numIcon(c.num) : IC[c.ic];
        b.innerHTML = '<i class="hi">' + svg + '</i><b class="hl">' + c.lb + '</b>';
        b.classList.add('hudb');
      } else {
        b.textContent = b.dataset.orig;
        b.classList.remove('hudb', 'hud-sm');
      }
    });
  }

  /* ---------- measurement helpers ---------- */
  function baseSize(id) {
    var b = el(id); if (!b) return [54, 54];
    var sw = b.style.width, sh = b.style.height;
    b.style.width = ''; b.style.height = '';
    var cs = getComputedStyle(b), w = parseFloat(cs.width), h = parseFloat(cs.height);
    b.style.width = sw; b.style.height = sh;
    if (!(w > 0)) w = 54; if (!(h > 0)) h = w;
    return [w, h];
  }
  function stickBase() {
    var b = $('move-stick'), prev = stickCss.textContent; stickCss.textContent = '';
    var w = parseFloat(getComputedStyle(b).width); stickCss.textContent = prev;
    return w > 0 ? w : 118;
  }
  function curO() { return innerWidth >= innerHeight ? 'land' : 'port'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var MARGIN = 6;

  function clearOverrides() {
    CT.forEach(function (c) {
      if (c.id === 'stick') return;
      var b = el(c.id); if (!b) return;
      ['left', 'top', 'right', 'bottom', 'width', 'height', 'opacity', 'display'].forEach(function (p) { b.style[p] = ''; });
      b.classList.remove('hud-sm');
    });
    stickCss.textContent = '';
    var z = $('move-zone'), lp = $('look-pad');
    if (z) ['left', 'top', 'width', 'height'].forEach(function (p) { z.style[p] = ''; });
    if (lp) lp.style.left = '';
  }

  /* ---------- apply layout ---------- */
  function applyAll(editing) {
    setSkin();
    var o = curO(), L = data[o], W = innerWidth, H = innerHeight;
    if (!L) {
      clearOverrides();
      CT.forEach(function (c) { if (c.kind) { var b = el(c.id); if (b) b.style.display = editing ? '' : 'none'; } });
      return;
    }
    CT.forEach(function (c) {
      var g = L[c.id]; if (!g) return;
      if (c.id === 'stick') {
        var sz = stickBase() * g.s;
        var l = clamp(g.x * W - sz / 2, MARGIN, W - sz - MARGIN), t = clamp(g.y * H - sz / 2, MARGIN, H - sz - MARGIN);
        stickCss.textContent = '#touch-controls #move-stick{left:' + l + 'px;top:' + t + 'px;bottom:auto;right:auto;width:' + sz + 'px;height:' + sz + 'px;opacity:' + g.o + '}' +
          '#touch-controls #stick-knob{width:' + (sz * .4) + 'px;height:' + (sz * .4) + 'px;left:calc(50% - ' + (sz * .2) + 'px);top:calc(50% - ' + (sz * .2) + 'px)}';
        var z = $('move-zone'), lp = $('look-pad');
        if (data.stick === 'fixed') {
          if (z) { z.style.left = l + 'px'; z.style.top = t + 'px'; z.style.width = sz + 'px'; z.style.height = sz + 'px'; }
          if (lp) lp.style.left = '0px';
        } else {
          if (z) ['left', 'top', 'width', 'height'].forEach(function (p) { z.style[p] = ''; });
          if (lp) lp.style.left = '';
        }
        return;
      }
      var b = el(c.id); if (!b) return;
      var bs = baseSize(c.id), w = bs[0] * g.s, h = bs[1] * g.s;
      var left = clamp(g.x * W - w / 2, MARGIN, W - w - MARGIN), top = clamp(g.y * H - h / 2, MARGIN, H - h - MARGIN);
      b.style.left = left + 'px'; b.style.top = top + 'px'; b.style.right = 'auto'; b.style.bottom = 'auto';
      b.style.width = w + 'px'; b.style.height = h + 'px';
      b.classList.toggle('hud-sm', Math.min(w, h) < 48);
      if (g.v) { b.style.opacity = g.o; b.style.display = ''; }
      else if (editing) { b.style.opacity = .3; b.style.display = ''; }
      else { b.style.display = 'none'; b.style.opacity = g.o; }
    });
  }

  /* snapshot current on-screen (CSS) positions into a layout, used for the "classic" layout */
  function snapshotFromDOM(o) {
    var W = innerWidth, H = innerHeight, L = {};
    CT.forEach(function (c) {
      var b = el(c.id), r = b && b.getBoundingClientRect();
      if (c.id === 'stick') { var sb = stickBase(); L.stick = P(clamp((r.left + r.width / 2) / W, 0.04, .5), (r.top + r.height / 2) / H, r.width / sb || 1, 1, true); return; }
      if (c.kind || !r || !r.width) { L[c.id] = clone(CODM[o][c.id]); if (c.kind) L[c.id].v = false; return; }
      var bs = baseSize(c.id);
      L[c.id] = P((r.left + r.width / 2) / W, (r.top + r.height / 2) / H, r.width / bs[0] || 1, 1, true);
    });
    return L;
  }

  /* ---------- editor ---------- */
  var ed = null;
  function openEditor(from) {
    if (ed) return;
    ed = { snap: JSON.stringify(data), sel: null, from: from || null, handles: {}, wasHidden: tc.classList.contains('hidden'), prevDisplay: tc.style.display };
    var swap = $('touch-swap'); ed.swapHidden = swap && swap.classList.contains('hidden');
    if (from) from.classList.add('hidden');
    tc.classList.remove('hidden'); tc.style.display = 'block';
    if (swap) swap.classList.remove('hidden');
    ensureLayout();

    var root = document.createElement('div'); root.id = 'hud-ed';
    var panel = document.createElement('div'); panel.id = 'hud-ed-panel';
    root.appendChild(panel); app.appendChild(root);
    ed.root = root; ed.panel = panel;
    CT.forEach(function (c) {
      var h = document.createElement('div'); h.className = 'hud-h'; h.dataset.id = c.id;
      var tg = document.createElement('div'); tg.className = 'tag'; tg.textContent = c.name; h.appendChild(tg);
      root.insertBefore(h, panel); ed.handles[c.id] = h; wireHandle(h, c);
    });
    root.addEventListener('pointerdown', function (e) { if (e.target === root) { ed.sel = null; renderPanel(); syncHandles(); } });
    ed.onResize = function () { ensureLayout(); applyAll(true); syncHandles(); renderPanel(); };
    addEventListener('resize', ed.onResize); addEventListener('orientationchange', ed.onResize);
    applyAll(true); syncHandles(); renderPanel();
  }

  function ensureLayout() {
    var o = curO();
    if (!data[o]) { clearOverrides(); data[o] = snapshotFromDOM(o); }
    applyAll(true);
  }

  function syncHandles() {
    if (!ed) return;
    var o = curO(), L = data[o];
    CT.forEach(function (c) {
      var b = el(c.id), h = ed.handles[c.id]; if (!b || !h) return;
      var r = b.getBoundingClientRect(), pad = Math.max(0, (44 - Math.min(r.width, r.height)) / 2);
      h.style.left = (r.left - pad) + 'px'; h.style.top = (r.top - pad) + 'px';
      h.style.width = (r.width + pad * 2) + 'px'; h.style.height = (r.height + pad * 2) + 'px';
      h.classList.toggle('sel', ed.sel === c.id);
      h.classList.toggle('off', !L[c.id].v);
      h.style.zIndex = ed.sel === c.id ? 5 : 1;
    });
  }

  function wireHandle(h, c) {
    var drag = null;
    h.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      try { h.setPointerCapture(e.pointerId); } catch (x) { }
      var g = data[curO()][c.id];
      drag = { id: e.pointerId, ox: g.x * innerWidth - e.clientX, oy: g.y * innerHeight - e.clientY, moved: false };
      if (ed.sel !== c.id) { ed.sel = c.id; renderPanel(); }
      syncHandles();
    });
    h.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      var o = curO(), g = data[o][c.id], W = innerWidth, H = innerHeight;
      var nx = (e.clientX + drag.ox) / W, ny = (e.clientY + drag.oy) / H;
      if (Math.abs(nx - g.x) * W + Math.abs(ny - g.y) * H > 0.5) drag.moved = true;
      g.x = clamp(nx, 0.02, 0.98); g.y = clamp(ny, 0.02, 0.98);
      if (c.id === 'stick') g.x = Math.min(g.x, 0.5);
      applyAll(true); syncHandles();
    });
    var end = function (e) { if (drag && e.pointerId === drag.id) drag = null; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { h.addEventListener(t, end); });
  }

  function seg(opts, val, cb) {
    var d = document.createElement('div'); d.className = 'seg';
    opts.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; if (o[0] === val) b.className = 'on';
      b.addEventListener('click', function () { cb(o[0]); }); d.appendChild(b);
    });
    return d;
  }
  function row(label, node) { var r = document.createElement('div'); r.className = 'row'; var s = document.createElement('span'); s.textContent = label; r.appendChild(s); r.appendChild(node); return r; }
  function slider(min, max, val, fmt, cb) {
    var w = document.createElement('div'); w.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;min-width:0';
    var i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.value = val;
    var out = document.createElement('output'); out.textContent = fmt(val);
    i.addEventListener('input', function () { out.textContent = fmt(+i.value); cb(+i.value); });
    w.appendChild(i); w.appendChild(out); return w;
  }

  function renderPanel() {
    if (!ed) return;
    var p = ed.panel, o = curO(), L = data[o]; p.innerHTML = '';
    var h = document.createElement('h3'); h.textContent = 'CUSTOMIZE CONTROLS'; p.appendChild(h);
    var sub = document.createElement('div'); sub.className = 'sub';
    sub.textContent = (o === 'land' ? 'LANDSCAPE' : 'PORTRAIT') + ' layout · drag a button to move it · tap one to edit it';
    p.appendChild(sub);

    if (ed.sel) {
      var c = BY[ed.sel], g = L[c.id];
      var nm = document.createElement('div'); nm.className = 'name'; nm.textContent = c.name; p.appendChild(nm);
      p.appendChild(row('SIZE', slider(50, 220, Math.round(g.s * 100), function (v) { return v + '%'; }, function (v) { g.s = v / 100; applyAll(true); syncHandles(); })));
      p.appendChild(row('OPACITY', slider(15, 100, Math.round(g.o * 100), function (v) { return v + '%'; }, function (v) { g.o = v / 100; applyAll(true); })));
      if (!c.req) {
        p.appendChild(row('SHOWN', seg([[1, 'ON'], [0, 'OFF']], g.v ? 1 : 0, function (v) { g.v = !!v; applyAll(true); syncHandles(); renderPanel(); })));
      }
      if (c.id === 'stick') {
        p.appendChild(row('MODE', seg([['float', 'FLOATING'], ['fixed', 'FIXED']], data.stick, function (v) { data.stick = v; applyAll(true); renderPanel(); })));
        var hint = document.createElement('div'); hint.className = 'sub';
        hint.textContent = data.stick === 'fixed' ? 'Fixed: the stick stays put; touch inside it to move.' : 'Floating: the stick appears wherever your thumb lands on the left side.';
        p.appendChild(hint);
      }
    } else {
      p.appendChild(row('STYLE', seg([['icons', 'ICONS'], ['classic', 'TEXT']], data.skin, function (v) { data.skin = v; applyAll(true); syncHandles(); renderPanel(); })));
      p.appendChild(row('LABELS', seg([[1, 'ON'], [0, 'OFF']], data.labels ? 1 : 0, function (v) { data.labels = !!v; applyAll(true); renderPanel(); })));
      var pr = document.createElement('div'); pr.className = 'seg';
      var b1 = document.createElement('button'); b1.type = 'button'; b1.textContent = 'CODM LAYOUT';
      b1.addEventListener('click', function () { data[o] = clone(CODM[o]); data.skin = 'icons'; ed.sel = null; applyAll(true); syncHandles(); renderPanel(); });
      var b2 = document.createElement('button'); b2.type = 'button'; b2.textContent = 'OLD LAYOUT';
      b2.addEventListener('click', function () { data[o] = null; clearOverrides(); data[o] = snapshotFromDOM(o); ed.sel = null; applyAll(true); syncHandles(); renderPanel(); });
      pr.appendChild(b1); pr.appendChild(b2); p.appendChild(row('PRESET', pr));
    }
    var f = document.createElement('div'); f.className = 'foot';
    var bs = document.createElement('button'); bs.type = 'button'; bs.className = 'pri'; bs.textContent = 'SAVE';
    bs.addEventListener('click', function () { var ok = persist(); closeEditor(true, ok); });
    var bc = document.createElement('button'); bc.type = 'button'; bc.textContent = 'CANCEL';
    bc.addEventListener('click', function () { data = JSON.parse(ed.snap); closeEditor(false); });
    f.appendChild(bs); f.appendChild(bc); p.appendChild(f);
  }

  function closeEditor(saved, ok) {
    if (!ed) return;
    removeEventListener('resize', ed.onResize); removeEventListener('orientationchange', ed.onResize);
    ed.root.remove();
    tc.style.display = ed.prevDisplay || '';
    if (ed.wasHidden) tc.classList.add('hidden');
    var swap = $('touch-swap'); if (swap && ed.swapHidden) swap.classList.add('hidden');
    if (ed.from) ed.from.classList.remove('hidden');
    ed = null;
    applyAll(false);
    if (saved) toast(ok ? 'LAYOUT SAVED' : 'COULD NOT SAVE (STORAGE BLOCKED)');
  }
  function toast(msg) {
    var t = document.createElement('div'); t.id = 'hud-ed-toast'; t.textContent = msg; t.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:80;background:#2b6b3a;color:#fff;padding:8px 14px;border-radius:6px;font:700 11px system-ui;letter-spacing:.08em;pointer-events:none';
    app.appendChild(t); setTimeout(function () { t.remove(); }, 1600);
  }

  /* ---------- launch buttons ---------- */
  function addLaunch(panelSel, beforeId, id) {
    var panel = document.querySelector(panelSel); if (!panel || $(id)) return;
    var b = document.createElement('button'); b.id = id; b.type = 'button'; b.className = 'hud-launch'; b.textContent = 'CUSTOMIZE TOUCH CONTROLS';
    var ref = beforeId && $(beforeId);
    if (ref && ref.parentNode === panel) panel.insertBefore(b, ref); else panel.appendChild(b);
    b.addEventListener('click', function () { openEditor(panel.closest('.overlay')); });
  }
  addLaunch('#controls .panel', 'btn-controls-back', 'btn-hud-edit');
  addLaunch('#pause .panel', 'btn-resume', 'btn-hud-edit-pause');

  /* ---------- boot ---------- */
  var rz = null;
  function relayout() { if (ed) return; clearTimeout(rz); rz = setTimeout(function () { applyAll(false); }, 60); }
  addEventListener('resize', relayout); addEventListener('orientationchange', relayout);
  applyAll(false);
  window.__naanHud = { open: function () { openEditor(null); }, data: function () { return data; }, apply: function () { applyAll(false); } };
})();
