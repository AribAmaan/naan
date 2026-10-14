/* NAAN Menu v9 — "The Corridor"
   Additive: rebuilds the main menu around a procedural first-person hallway, keeps every original element/id/listener
   (nodes are MOVED, not cloned), and adds: headphones gate, reactive "she is listening", run memory, door-rush transition. */
(function () {
  'use strict';
  const menu = document.getElementById('menu');
  if (!menu || menu.dataset.v9) return;
  menu.dataset.v9 = '1';
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = Math.random;
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const qs = location.search;
  const AUTO = (navigator.webdriver && !/[?&]gate=1/.test(qs)) || /[?&]nogate/.test(qs);

  /* ---------- run memory ---------- */
  const KEY = 'naan.menu.v9';
  const mem = { n: 0, best: 0, last: null, tape: 0 };
  try { Object.assign(mem, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { } };
  const fmt = s => { s = Math.max(0, s | 0); return String((s / 60) | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- styles ---------- */
  const css = `
#menu.v9{display:block;overflow:hidden;padding:0;background:#020202;color:#e9e0cb;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
#menu.v9 .menu-scrim,#menu.v9 .menu-fog,#menu.v9 .menu-film,#menu.v9 .menu-topline,#menu.v9 .menu-whisper,#menu.v9 #menu-inner{display:none!important}
/* The actual active v9 corridor stays visible. The short menu film projects
   an apparition over the RIGHT wall; a poster replaces it on data saver,
   reduced-motion, autoplay rejection, or decode failure. */
#menu.v9 #menu-video{display:block!important;inset:0;width:100%;height:100%;z-index:1;opacity:.57;filter:brightness(.85) contrast(1.13);transform:scale(1.015);mask-image:linear-gradient(90deg,transparent 30%,rgba(0,0,0,.14) 48%,black 82%)}
#menu.v9.video-failed #menu-video{display:none!important}
#menu.v9 .menu-fallback-house{display:none!important}
#menu.v9.video-failed .menu-fallback-house{display:block!important;inset:0;z-index:1;opacity:.54;mask-image:linear-gradient(90deg,transparent 30%,rgba(0,0,0,.14) 48%,black 82%)}
/* iOS Safari requires the WebKit mask alias for the same soft apparition edge. */
#menu.v9 #menu-video,#menu.v9.video-failed .menu-fallback-house{-webkit-mask-image:linear-gradient(90deg,transparent 30%,rgba(0,0,0,.14) 48%,black 82%)}
@media(max-width:820px) and (orientation:portrait){
  #menu.v9 #menu-video,#menu.v9.video-failed .menu-fallback-house{
    opacity:.32;-webkit-mask-image:linear-gradient(180deg,black 0%,rgba(0,0,0,.15) 45%,transparent 80%);
    mask-image:linear-gradient(180deg,black 0%,rgba(0,0,0,.15) 45%,transparent 80%);
  }
}
@media(max-height:520px){
  #menu.v9 #menu-video,#menu.v9.video-failed .menu-fallback-house{opacity:.35}
}

#nm-art{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;opacity:0;transition:opacity 3.2s ease .2s}
#menu.v9.revealed #nm-art{opacity:1}
#nm-vig{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse 78% 74% at 64% 50%,transparent 32%,rgba(0,0,0,.5) 76%,rgba(0,0,0,.9) 100%),linear-gradient(90deg,rgba(0,0,0,.86) 0,rgba(0,0,0,.55) 30%,rgba(0,0,0,0) 56%)}
#nm-grain{position:absolute;inset:-50%;z-index:2;pointer-events:none;opacity:.085;background-size:160px 160px;animation:nmgrain .9s steps(6) infinite}
@keyframes nmgrain{0%{transform:translate(0,0)}20%{transform:translate(-4%,3%)}40%{transform:translate(3%,-5%)}60%{transform:translate(-2%,-3%)}80%{transform:translate(5%,2%)}100%{transform:translate(0,0)}}
#nm-top{position:absolute;left:0;right:0;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:26px clamp(22px,6vw,96px);font-size:11px;letter-spacing:.28em;color:#6a6458;text-transform:uppercase}
#nm-listen{display:flex;align-items:center;gap:12px;color:#b5ab98}
#nm-dot{width:7px;height:7px;border-radius:50%;background:#b3261c;box-shadow:0 0 calc(7px + var(--heard,0)*20px) rgba(210,44,30,calc(.45 + var(--heard,0)*.55));animation:nmbeat 2.1s ease-in-out infinite;transform:scale(calc(1 + var(--heard,0)*.7))}
@keyframes nmbeat{0%,100%{opacity:.55}50%{opacity:1}}
#nm-listen-txt{transition:color .2s}
#nm-listen.hot #nm-listen-txt{color:#d8392b}
#nm-main{position:absolute;z-index:5;left:clamp(22px,6vw,96px);top:50%;transform:translateY(-52%);width:min(500px,calc(100vw - 44px))}
.nm-r{opacity:0;transform:translateY(12px);transition:opacity 1.5s ease,transform 1.5s ease;transition-delay:var(--d,0s)}
#menu.v9.revealed .nm-r{opacity:1;transform:none}
#menu.v9.fast .nm-r{transition-delay:0s!important;transition-duration:.3s!important}
#nm-kicker{font-size:11px;letter-spacing:.44em;color:#7a7367;margin-bottom:20px}
#menu.v9 .title-container{margin:0;padding:0;text-align:left}
#menu.v9 #title-glitch{position:relative;margin:0;padding:0;font:400 clamp(64px,min(11.2vw,19vh),168px)/.94 Georgia,"Times New Roman",serif;letter-spacing:.14em;text-indent:0;text-align:left;color:#ece3cf;text-shadow:0 0 64px rgba(150,30,22,.38),0 3px 0 rgba(0,0,0,.7);animation:nmtitle 8s infinite}
@keyframes nmtitle{0%,100%{opacity:1}46%{opacity:1}47%{opacity:.84}48%{opacity:1}49%{opacity:.9}50%{opacity:1}}
#menu.v9 #title-glitch::before,#menu.v9 #title-glitch::after{content:attr(data-text);position:absolute;left:0;top:0;opacity:0;pointer-events:none;text-shadow:none;animation:none;background:none;width:auto;height:auto;letter-spacing:inherit}
#menu.v9 #title-glitch.nm-glitch::before{opacity:.85;color:#a01c15;transform:translate(-5px,0);clip-path:inset(16% 0 54% 0)}
#menu.v9 #title-glitch.nm-glitch::after{opacity:.7;color:#d8cfb8;transform:translate(6px,0);clip-path:inset(62% 0 6% 0)}
#menu.v9 .title-sub-glitch{margin:16px 0 0;text-align:left;font:11px ui-monospace,monospace;letter-spacing:.72em;color:#ab2a20;text-indent:0;animation:none;text-shadow:none}
#menu.v9 .tag-line{margin:26px 0 0;text-align:left;font:italic 17px/1.7 Georgia,serif;color:#9b9280;letter-spacing:.02em}
#menu.v9 .tag-line span{display:block}
#menu.v9 .tag-line .emphasis{color:#e0d6c0}
#nm-nav{margin-top:34px;display:flex;flex-direction:column;align-items:stretch;counter-reset:nm}
#menu.v9 #nm-nav button.nm-item{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:flex;align-items:baseline;gap:18px;width:100%;padding:15px 0;font:400 clamp(19px,2vw,26px) Georgia,"Times New Roman",serif;letter-spacing:.24em;text-transform:uppercase;color:#a79e8b;border-bottom:1px solid rgba(233,224,203,.1);transition:color .3s,padding-left .45s ease}
#menu.v9 #nm-nav button.nm-item.hidden{display:none!important}
#menu.v9 #nm-nav button.nm-item:not(.hidden){counter-increment:nm}
#menu.v9 #nm-nav button.nm-item::before{content:counter(nm,decimal-leading-zero);font:10px ui-monospace,monospace;letter-spacing:.2em;color:#675f53;transform:translateY(-4px);position:static;background:none;width:auto;height:auto;opacity:1;animation:none;border:0}
#menu.v9 #nm-nav button.nm-item::after{content:'';position:absolute;left:0;bottom:-1px;height:1px;width:0;background:#d23a2c;box-shadow:0 0 14px #d23a2c;transition:width .6s ease;right:auto;top:auto;transform:none;opacity:1;animation:none;font-size:0}
#menu.v9 #nm-nav button.nm-item:hover,#menu.v9 #nm-nav button.nm-item:focus-visible{color:#f1e8d3;padding-left:12px;outline:none}
#menu.v9 #nm-nav button.nm-item:hover::after,#menu.v9 #nm-nav button.nm-item:focus-visible::after{width:100%}
#menu.v9 #btn-play{color:#e8dec8;border-bottom-color:rgba(176,38,28,.55)}
#menu.v9 #nm-nav #btn-play{background:none!important;border:0!important;border-bottom:1px solid rgba(176,38,28,.55)!important;box-shadow:none!important;padding:15px 0!important;color:#e8dec8!important;font:400 clamp(19px,2vw,26px) Georgia,"Times New Roman",serif!important;letter-spacing:.24em!important;transform:none!important;overflow:visible!important;margin:0!important;width:100%!important}
#menu.v9 #nm-nav #btn-play:hover,#menu.v9 #nm-nav #btn-play:focus-visible{background:none!important;box-shadow:none!important;transform:none!important;padding-left:12px!important;color:#fff3dc!important}
#menu.v9 #nm-nav #btn-continue{white-space:nowrap;font-size:clamp(15px,1.5vw,19px)!important;letter-spacing:.2em!important;background:none!important;border:0!important;border-bottom:1px solid rgba(233,224,203,.1)!important;box-shadow:none!important;margin:0!important;width:100%!important;padding:15px 0!important}
#menu.v9 #nm-nav #btn-continue:hover,#menu.v9 #nm-nav #btn-continue:focus-visible{background:none!important;padding-left:12px!important;color:#f1e8d3!important}
#menu.v9 .tag-line .emphasis::before{content:none!important}
#menu.v9 #btn-play .btn-flare{display:none}
#menu.v9 #btn-play .btn-text{all:unset}
.nm-arrow{margin-left:auto;font-family:Georgia,serif;font-size:22px;color:#b3261c;transition:transform .4s ease,color .3s}
#menu.v9 #btn-play:hover .nm-arrow{transform:translateX(8px);color:#e04535}
.nm-meta{margin-left:auto;white-space:nowrap;font:10px ui-monospace,monospace;letter-spacing:.22em;color:#6f685b;text-transform:uppercase}
#nm-sub{display:flex;flex-wrap:wrap;gap:6px 30px;margin-top:20px}
#menu.v9 #nm-sub button{all:unset;cursor:pointer;box-sizing:border-box;font:11px ui-monospace,monospace;letter-spacing:.3em;color:#756e61;text-transform:uppercase;padding:6px 0;border-bottom:1px solid transparent;transition:color .25s,border-color .25s}
#menu.v9 #nm-sub button:hover,#menu.v9 #nm-sub button:focus-visible{color:#e9e0cb;border-color:#a8261d;outline:none}
#btn-lore-tape.unread::after{content:'';display:inline-block;width:5px;height:5px;margin-left:9px;border-radius:50%;background:#c42a20;vertical-align:middle;animation:nmbeat 1.6s infinite}
#nm-dread{margin-top:34px}
#menu.v9 #difficulty-selector{display:flex;flex-wrap:wrap;align-items:center;gap:6px 22px;margin:0;padding:0;border:0;background:none}
#menu.v9 .diff-label{font:10px ui-monospace,monospace;letter-spacing:.34em;color:#5f594e;margin:0}
#menu.v9 .diff-buttons{display:flex;gap:2px;margin:0;padding:0;background:none;border:0}
#menu.v9 .diff-btn{all:unset;cursor:pointer;box-sizing:border-box;font:10px ui-monospace,monospace;letter-spacing:.26em;color:#665f54;text-transform:uppercase;padding:6px 14px 6px 0;transition:color .25s}
#menu.v9 .diff-btn small{display:none}
#menu.v9 .diff-btn:hover{color:#cfc5b0}
#menu.v9 .diff-btn.active{color:#ece3cf}
#menu.v9 .diff-btn.active::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:#b3261c;margin-right:8px;vertical-align:middle;position:static;opacity:1;width:5px}
#menu.v9 .diff-btn.danger.active::before{background:#ff3b2a;box-shadow:0 0 8px #ff3b2a}
#nm-diff-desc{margin-top:8px;font:italic 13px Georgia,serif;color:#6f685b;min-height:18px}
#nm-seed{margin-top:20px}
#menu.v9 #seed-row{margin:0;padding:0;background:none;border:0;width:100%}
#menu.v9 .seed-details{background:none;border:0;padding:0}
#menu.v9 .seed-details summary{cursor:pointer;font:10px ui-monospace,monospace;letter-spacing:.32em;color:#585247;list-style:none}
#menu.v9 .seed-details summary::-webkit-details-marker{display:none}
#menu.v9 .seed-details summary:hover{color:#a79e8b}
#menu.v9 .seed-header{display:none}
#menu.v9 .seed-input-wrap{display:flex;gap:14px;align-items:flex-end;margin-top:12px}
#menu.v9 #seed-input{flex:1;background:transparent;border:0;border-bottom:1px solid rgba(233,224,203,.22);color:#e9e0cb;font:12px ui-monospace,monospace;letter-spacing:.2em;padding:8px 0;outline:none;border-radius:0}
#menu.v9 #btn-seed-random{all:unset;cursor:pointer;font:10px ui-monospace,monospace;letter-spacing:.26em;color:#8a8273;padding:6px 0}
#menu.v9 #btn-seed-random:hover{color:#e9e0cb}
#menu.v9 .seed-tags{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px}
#menu.v9 .seed-tag{font:10px ui-monospace,monospace;letter-spacing:.2em;color:#5f594e;cursor:pointer;background:none;border:0;padding:0}
#menu.v9 .seed-tag:hover{color:#c9bfa9}
#nm-foot{position:absolute;left:0;right:0;bottom:0;z-index:5;display:flex;flex-direction:column;align-items:flex-end;gap:16px;pointer-events:none;padding:26px clamp(22px,6vw,96px)}
#nm-whisper{font:italic 15px/1.65 Georgia,serif;color:#6b655a;max-width:340px;text-align:right}#nm-foot-btns,#nm-whisper{pointer-events:auto}
#nm-whisper b{color:#a8261d;font-weight:400}
#nm-foot-btns{display:flex;gap:10px}
#menu.v9 #btn-fullscreen,#menu.v9 #btn-horror-audio{position:static!important;margin:0!important;transform:none!important;inset:auto!important}
#nm-fade{position:absolute;inset:0;z-index:20;background:#000;opacity:0;pointer-events:none;transition:opacity .5s ease}
#menu.v9.go #nm-fade{opacity:1;transition:opacity .5s ease .95s}
#menu.v9.go #nm-main,#menu.v9.go #nm-top,#menu.v9.go #nm-foot{opacity:0;transition:opacity .6s ease;pointer-events:none}
#nm-gate{position:absolute;inset:0;z-index:30;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;cursor:pointer;transition:opacity 1.8s ease;font:12px ui-monospace,monospace;letter-spacing:.55em;color:#8a8376;text-indent:.55em}
#nm-gate.off{opacity:0;pointer-events:none}
#nm-gate div{opacity:0;animation:nmg 1.6s ease forwards}
#nm-gate div:nth-child(1){animation-delay:.6s}#nm-gate div:nth-child(2){animation-delay:1.9s}
#nm-gate div:nth-child(3){animation:nmg 1.6s ease 3.6s forwards,nmblink 3.2s ease-in-out 5.2s infinite;font-size:10px;color:#5b564c}
@keyframes nmg{to{opacity:1}}
@keyframes nmblink{0%,100%{opacity:1}50%{opacity:.25}}
#menu.v9 button:focus-visible{outline:1px solid #b3261c;outline-offset:4px}
@media(max-width:820px){
 #nm-main{top:auto;bottom:74px;transform:none}
 #nm-kicker,#nm-whisper,#nm-night{display:none}
 #menu.v9 #title-glitch{font-size:clamp(60px,20vw,96px)}
 #menu.v9 .tag-line{font-size:15px;margin-top:16px}
 #nm-nav{margin-top:20px}
 #nm-vig{background:radial-gradient(ellipse 90% 60% at 50% 38%,transparent 25%,rgba(0,0,0,.6) 80%),linear-gradient(0deg,rgba(0,0,0,.92) 0,rgba(0,0,0,.6) 48%,transparent 75%)}
 #nm-dread{margin-top:22px}
 #nm-seed{margin-top:14px}
 #menu.v9 .seed-details summary{padding:10px 0}
 #menu.v9 #seed-input{font-size:16px}
}
@media(max-height:800px) and (min-width:821px){
 #nm-kicker{display:none}#menu.v9 .tag-line{margin-top:14px}#nm-nav{margin-top:22px}#menu.v9 #nm-nav button.nm-item{padding:11px 0!important}#menu.v9 #nm-nav #btn-play{padding:11px 0!important}#nm-dread{margin-top:22px}#nm-seed{margin-top:12px}
}
@media(max-height:520px){
 #menu.v9 #nm-main{top:50%;bottom:auto;transform:translateY(-50%);width:min(500px,calc(100vw - 44px))}
 #nm-top{padding-top:14px}
 #nm-kicker,#nm-whisper,#nm-night,#nm-seed,#nm-diff-desc{display:none}
 #menu.v9 #title-glitch{font-size:clamp(40px,min(11vw,17vh),84px)}
 #menu.v9 .title-sub-glitch{margin-top:8px;letter-spacing:.5em}
 #menu.v9 .tag-line{font-size:13px;margin-top:8px;line-height:1.45}
 #nm-nav{margin-top:10px}
 #menu.v9 #nm-nav button.nm-item,#menu.v9 #nm-nav #btn-play{padding:8px 0!important}
 #nm-sub{margin-top:8px}
 #nm-dread{margin-top:10px}
 #nm-foot{padding-top:10px;padding-bottom:12px}
}
@media(prefers-reduced-motion:reduce){#nm-grain,#nm-dot,#menu.v9 #title-glitch{animation:none!important}.nm-r{transition-duration:.01s!important}}
`;
  const st = document.createElement('style'); st.id = 'nm-style'; st.textContent = css; document.head.appendChild(st);

  /* ---------- DOM ---------- */
  menu.classList.add('v9');
  const mk = (tag, id, cls, html) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const art = mk('canvas', 'nm-art'), vig = mk('div', 'nm-vig'), grain = mk('div', 'nm-grain');
  try { // film-grain tile
    const g = document.createElement('canvas'); g.width = g.height = 128; const gc = g.getContext('2d'), id = gc.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) { const v = rnd() * 255 | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gc.putImageData(id, 0, 0); grain.style.backgroundImage = 'url(' + g.toDataURL() + ')';
  } catch (e) { }
  menu.prepend(art, vig, grain);

  const top = mk('div', 'nm-top', '', '<div id="nm-listen"><span id="nm-dot"></span><b id="nm-listen-txt" style="font-weight:400">SHE IS LISTENING</b><span>· HOUSE 01</span></div><div id="nm-night"></div>');
  const main = mk('div', 'nm-main');
  const kicker = mk('div', 'nm-kicker', 'nm-r', 'A FIRST-PERSON SURVIVAL HORROR'); kicker.style.setProperty('--d', '1.1s');
  const nav = mk('nav', 'nm-nav', 'nm-r'); nav.style.setProperty('--d', '2.5s');
  const sub = mk('div', 'nm-sub');
  const dread = mk('div', 'nm-dread', 'nm-r', '<div id="nm-diff-desc"></div>'); dread.style.setProperty('--d', '3.1s');
  const seedBox = mk('div', 'nm-seed', 'nm-r'); seedBox.style.setProperty('--d', '3.4s');
  const foot = mk('div', 'nm-foot', '', '<div id="nm-whisper" class="nm-r" style="--d:3.8s">If you hear your name from upstairs,<br><b>do not answer.</b></div><div id="nm-foot-btns"></div>');
  const fade = mk('div', 'nm-fade');

  const titleC = menu.querySelector('.title-container'), tag = menu.querySelector('.tag-line');
  const btnC = $('btn-continue'), btnP = $('btn-play'), bS = $('btn-settings'), bK = $('btn-controls'), bT = $('btn-lore-tape');
  const diff = $('difficulty-selector'), seedRow = $('seed-row'), bFS = $('btn-fullscreen'), bAu = $('btn-horror-audio');
  if (titleC) { titleC.classList.add('nm-r'); titleC.style.setProperty('--d', '.3s'); main.append(kicker, titleC); } else main.append(kicker);
  if (tag) { tag.classList.add('nm-r'); tag.style.setProperty('--d', '1.7s'); main.append(tag); }
  [btnP, btnC].forEach(b => { if (!b) return; b.classList.remove('big', 'horror-pulse-btn'); b.classList.add('nm-item'); nav.append(b); });
  if (btnP) btnP.insertAdjacentHTML('beforeend', '<span class="nm-arrow">→</span>');
  if (btnC) btnC.insertAdjacentHTML('beforeend', '<span class="nm-meta" id="nm-cont-meta"></span>');
  [bS, bK, bT].forEach(b => b && sub.append(b)); nav.append(sub);
  main.append(nav);
  if (diff) dread.prepend(diff); main.append(dread);
  if (seedRow) { seedBox.append(seedRow); main.append(seedBox); }
  menu.append(top, main, foot, fade);
  const fb = $('nm-foot-btns'); [bFS, bAu].forEach(b => b && fb.append(b));
  if (bT && !mem.tape) bT.classList.add('unread');

  /* ---------- memory-driven copy ---------- */
  const tagSpans = tag ? tag.querySelectorAll('span') : [];
  function refreshMemory() {
    const L = mem.last; let a, b;
    if (L && /found/i.test(L.title || '')) { a = 'You came back.'; b = 'She remembers where you hid.'; }
    else if (L) { a = 'You got out.'; b = 'The house noticed.'; }
    else if (mem.n > 0) { a = 'Back so soon.'; b = 'The lights are already off.'; }
    if (a && tagSpans[0] && tagSpans[1]) { tagSpans[0].textContent = a; tagSpans[1].textContent = b; }
    const nn = $('nm-night'); if (nn) nn.textContent = mem.n ? 'NIGHT ' + (mem.n + 1) + (mem.best ? ' · LONGEST ' + fmt(mem.best) : '') : 'FIRST NIGHT';
    const m = $('nm-cont-meta');
    if (m) { let t = ''; try { const s = JSON.parse(localStorage.getItem('naan.save.v2') || 'null'); if (s) t = fmt(s.runTime || 0) + ' · ' + ((s.inv || []).length) + ' items'; } catch (e) { } m.textContent = t; }
  }
  refreshMemory();
  let recorded = false;
  setInterval(() => {
    const a = window.__NAAN__;
    if (a && a.G && a.G.state === 'end') {
      if (!recorded) {
        recorded = true; const t = a.G.runTime || 0; mem.best = Math.max(mem.best || 0, Math.round(t));
        mem.last = { t: Math.round(t), title: (($('end-title') || {}).textContent || '').trim(), at: Date.now() }; save(); refreshMemory();
      }
    } else recorded = false;
  }, 1000);

  /* ---------- dread description ---------- */
  const descs = { prayer: 'more forgiving', standard: 'the intended experience', nightmare: 'she hears everything' };
  const dd = $('nm-diff-desc');
  const showDesc = m => { if (dd) dd.textContent = descs[m] || ''; };
  const activeDiff = () => { const a = menu.querySelector('.diff-btn.active'); return a ? a.dataset.diff : 'standard'; };
  menu.querySelectorAll('.diff-btn').forEach(b => {
    b.addEventListener('pointerenter', () => showDesc(b.dataset.diff));
    b.addEventListener('pointerleave', () => showDesc(activeDiff()));
    b.addEventListener('click', () => setTimeout(() => showDesc(activeDiff()), 0));
  });
  setTimeout(() => showDesc(activeDiff()), 50);

  /* ---------- art state ---------- */
  const S = { t: 0, cam: 0, cam0: 0, go: 0, door: 0, hover: false, hoverSpawned: false, mx: 0, my: 0, L: 1, fl: null, nextFl: 6, bigIn: 36, ghost: 0,
    feet: null, nextFeet: 14, heard: 0, heardUntil: 0, heardNow: false, revealed: false, lastAct: performance.now(), idleKnocked: false, nextGlitch: 20 };
  const cx = art.getContext('2d');
  let W = 0, H = 0;
  function resize() {
    const s = clamp(innerWidth * .75, 320, 1280) / Math.max(1, innerWidth);
    W = Math.max(2, Math.round(innerWidth * s)); H = Math.max(2, Math.round(innerHeight * s)); art.width = W; art.height = H;
  }
  resize();
  const dust = Array.from({ length: 46 }, () => ({ x: rnd() * 2 - 1, y: -1 + rnd() * 2.4, z: .8 + rnd() * 6, vx: (rnd() - .5) * .03, vy: -.01 - rnd() * .02, ph: rnd() * 6.28 }));

  /* ---------- audio (own context; created on the gate click) ---------- */
  const A = {
    ctx: null, master: null, noise: null,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      try {
        const c = this.ctx = new AC(); this.master = c.createGain(); this.master.gain.value = .9; this.master.connect(c.destination);
        const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1; this.noise = b; return true;
      } catch (e) { return false; }
    },
    ok() { return this.ctx && this.ctx.state === 'running' && !(bAu && bAu.classList.contains('muted')) && !menu.classList.contains('hidden') && !document.hidden; },
    burst(o) {
      const c = this.ctx, t = c.currentTime + (o.delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; s.loop = true; f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.freq, t);
      if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.a + o.d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.peak, t + o.a); g.gain.exponentialRampToValueAtTime(.0001, t + o.a + o.d);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + o.a + o.d + .1);
    },
    tone(o) {
      const c = this.ctx, t = c.currentTime + (o.delay || 0), os = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.freq, t); if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
      f.type = 'lowpass'; f.frequency.value = o.lp || 400;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.peak, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + o.dur);
      os.connect(f); f.connect(g); g.connect(this.master); os.start(t); os.stop(t + o.dur + .05);
    },
    thud(p) { if (!this.ok()) return; this.tone({ freq: 78, to: 42, peak: p || .2, dur: .16, lp: 220 }); this.burst({ type: 'lowpass', freq: 240, q: .5, peak: (p || .2) * .6, a: .005, d: .09 }); },
    knock() { if (!this.ok()) return; [0, .42, .86].slice(0, rnd() < .5 ? 2 : 3).forEach(d => { this.tone({ freq: 120, to: 55, peak: .34, dur: .12, lp: 320, delay: d }); this.burst({ type: 'lowpass', freq: 380, q: .5, peak: .22, a: .004, d: .07, delay: d }); }); },
    creak() { if (!this.ok()) return; const f = 340 + rnd() * 200; this.burst({ freq: f, to: f * 1.45, q: 16, peak: .05, a: .35, d: 1 }); this.burst({ freq: f * 1.9, to: f * 2.6, q: 18, peak: .022, a: .4, d: .9, delay: .1 }); },
    buzz() { if (!this.ok()) return; this.tone({ freq: 100, peak: .05, dur: .14, type: 'square', lp: 520 }); },
    swell() { if (!this.ok()) return; this.burst({ freq: 260, to: 800, q: .8, peak: .03, a: .8, d: .7 }); },
    door() { if (!this.ok()) return; this.burst({ freq: 190, to: 400, q: 18, peak: .1, a: .3, d: 1.15 }); this.tone({ freq: 52, to: 66, peak: .04, dur: 1.2, type: 'sawtooth', lp: 260 }); }
  };
  const clickInit = () => A.init();

  /* ---------- flicker / feet / apparition ---------- */
  function startFlicker(big) {
    const segs = big ? [[.25, .07], [1, .05], [0, .12], [.7, .05], [0, .7 + rnd() * .6], [1, .08]] : (rnd() < .5 ? [[.3, .06], [1, .05], [.15, .08], [1, .05]] : [[0, .16 + rnd() * .2], [1, .05]]);
    S.fl = { s: segs, i: 0, t: segs[0][1], ghost: big };
    A.buzz();
  }
  function spawnFeet(center) { const d = rnd() < .5 ? 1 : -1; S.feet = center ? { x: 0, dir: 1, ph: 0, wait: 999, stood: 1 } : { x: -.62 * d, dir: d, ph: 0, wait: .5, stood: 0 }; }

  function step(dt) {
    S.t += dt;
    if (S.go > 0) { S.go += dt; const u = clamp(S.go / 1.4, 0, 1); S.cam = S.cam0 + (5.3 - S.cam0) * u * u * u; S.door = lerp(S.door, 1.7, Math.min(1, dt * 4)); }
    else { S.cam = .22 * (1 - Math.cos(S.t * Math.PI * 2 / 80)); S.door = lerp(S.door, S.hover ? 1 : 0, Math.min(1, dt * 2.5)); }
    if (S.revealed && S.go <= 0) {
      if (!reduce) {
        if (!S.fl) { S.nextFl -= dt; if (S.nextFl <= 0) { const big = S.bigIn <= 0; if (big) S.bigIn = 60 + rnd() * 60; else S.bigIn -= 9; startFlicker(big); } }
        else { S.fl.t -= dt; if (S.fl.t <= 0) { S.fl.i++; if (S.fl.i >= S.fl.s.length) { S.fl = null; S.nextFl = 8 + rnd() * 14; } else { const sg = S.fl.s[S.fl.i]; S.fl.t = sg[1]; if (sg[0] > .5) A.buzz(); if (S.fl.ghost && S.fl.i === S.fl.s.length - 1) S.ghost = .3; } } }
        S.nextGlitch -= dt; if (S.nextGlitch <= 0) { S.nextGlitch = 18 + rnd() * 24; glitch(); }
      }
    }
    S.L = S.fl ? S.fl.s[S.fl.i][0] : 1 - .035 * Math.abs(Math.sin(S.t * 23) * Math.sin(S.t * 5.1));
    if (S.ghost > 0) S.ghost -= dt;
    const now = performance.now(); S.heardNow = now < S.heardUntil;
    S.heard = lerp(S.heard, S.heardNow ? 1 : 0, Math.min(1, dt * (S.heardNow ? 8 : 1.6)));
    const dot = $('nm-dot'); if (dot) dot.style.setProperty('--heard', S.heard.toFixed(2));
    const hot = S.heard > .5, L = $('nm-listen'), tx = $('nm-listen-txt');
    if (L && L.classList.contains('hot') !== hot) { L.classList.toggle('hot', hot); if (tx) tx.textContent = hot ? 'SHE HEARD THAT' : 'SHE IS LISTENING'; }
    // feet behind the door
    const f = S.feet;
    if (f) {
      f.wait -= dt;
      if (f.wait <= 0) {
        if (S.heardNow) f.wait = .4;
        else if (S.hover && Math.abs(f.x) < .1) f.wait = .3;
        else {
          f.x += f.dir * .1; f.ph ^= 1; A.thud(.17); f.wait = .62 + rnd() * .3;
          if (Math.abs(f.x) < .12 && !f.stood && !S.hover && rnd() < .75) { f.stood = 1; f.wait = 2.4 + rnd() * 1.8; }
          if (Math.abs(f.x) > .64) S.feet = null;
        }
      }
    } else if (S.revealed && S.go <= 0 && !reduce) {
      if (S.hover && !S.hoverSpawned) { S.hoverSpawned = true; spawnFeet(false); }
      else if (S.t >= S.nextFeet) { S.nextFeet = S.t + 32 + rnd() * 40; spawnFeet(false); }
    }
    for (const p of dust) { p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt; if (p.y < -1.1) { p.y = 1.4; p.x = rnd() * 2 - 1; } if (Math.abs(p.x) > 1.1) p.x = -p.x * .9; }
  }

  /* ---------- drawing ---------- */
  const XW = 1.2, FL = 1.55, CE = -1.1, ZF = 8, DH = 2.05, DW = .5;
  let vpx = 0, vpy = 0, F = 1;
  const pr = (x, y, z) => { const zz = Math.max(.08, z - S.cam); return [vpx + x * F / zz, vpy + y * F / zz]; };
  const poly = (pts, fill, stroke, lw) => { cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])); cx.closePath(); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw || 1; cx.stroke(); } };
  const seg = (a, b, stroke, lw) => { cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.strokeStyle = stroke; cx.lineWidth = lw || 1; cx.stroke(); };
  const lg = (x0, y0, x1, y1, a, b) => { const q = cx.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, a); q.addColorStop(1, b); return q; };
  const glow = (x, y, r, rgb, a) => { if (a <= 0) return; const q = cx.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')'); q.addColorStop(1, 'rgba(' + rgb + ',0)'); cx.fillStyle = q; cx.fillRect(x - r, y - r, r * 2, r * 2); };
  const first = (z0, step) => Math.ceil(z0 / step) * step;

  function door(s, za, zb, ajar) {
    if (za < S.cam + .4) return;
    poly([pr(s * XW, FL, za), pr(s * XW, FL, zb), pr(s * XW, FL - DH, zb), pr(s * XW, FL - DH, za)], '#050403', 'rgba(160,125,85,.24)', 1.5);
    const w = zb - za, m = (y0, y1) => poly([pr(s * XW, y0, za + w * .18), pr(s * XW, y0, za + w * .82), pr(s * XW, y1, za + w * .82), pr(s * XW, y1, za + w * .18)], null, 'rgba(160,125,85,.1)', 1);
    m(FL - DH * .92, FL - DH * .56); m(FL - DH * .46, FL - DH * .1);
    if (ajar) seg(pr(s * XW, FL, za), pr(s * XW, FL - DH, za), 'rgba(255,185,110,.4)', 2);
    const k = pr(s * XW, FL - 1, zb - .1); cx.fillStyle = 'rgba(190,150,90,.35)'; cx.beginPath(); cx.arc(k[0], k[1], Math.max(1, F * .03 / Math.max(.3, zb - S.cam)), 0, 7); cx.fill();
  }
  function picture(s, z0, z1, y0, y1) {
    if (z0 < S.cam + .4) return;
    const a = pr(s * XW, y0, z0), b = pr(s * XW, y1, z1);
    poly([pr(s * XW, y0, z0), pr(s * XW, y0, z1), pr(s * XW, y1, z1), pr(s * XW, y1, z0)], 'rgba(16,12,9,.92)', 'rgba(150,115,70,.38)', 2);
    const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; cx.fillStyle = 'rgba(175,165,145,.07)'; cx.beginPath(); cx.ellipse(c[0], c[1], Math.abs(b[0] - a[0]) * .26, Math.abs(b[1] - a[1]) * .33, 0, 0, 7); cx.fill();
  }
  function stairs() {
    const z0 = 3.0, dz = .32, rise = .17, n = 12, x0 = -XW, x1 = -.42;
    for (let i = n - 1; i >= 0; i--) {
      const za = z0 + i * dz, zb = za + dz, ya = FL - i * rise, yb = FL - (i + 1) * rise;
      if (za < S.cam + .4) continue;
      poly([pr(x0, ya, za), pr(x1, ya, za), pr(x1, yb, za), pr(x0, yb, za)], '#080605');
      poly([pr(x0, yb, za), pr(x1, yb, za), pr(x1, yb, zb), pr(x0, yb, zb)], 'rgba(48,38,28,.55)');
      seg(pr(x0, yb, za), pr(x1, yb, za), 'rgba(195,160,110,.12)', 1.5);
    }
    seg(pr(x1, FL - .95, z0), pr(x1, FL - .95 - n * rise, z0 + n * dz), 'rgba(125,92,60,.55)', 2.2);
    for (let i = 0; i < n; i += 1) { const za = z0 + i * dz + dz * .5; if (za < S.cam + .4) continue; seg(pr(x1, FL - (i + 1) * rise, za), pr(x1, FL - .95 - (i + .5) * rise, za), 'rgba(110,82,55,.32)', 1); }
    { const a = pr(-XW, CE, z0 + 5 * dz), b = pr(-XW, CE, z0 + n * dz + .4);
      poly([a, b, pr(-XW, FL - n * rise + .3, z0 + n * dz + .4), pr(-XW, FL - n * rise + .6, z0 + 5 * dz)], lg(a[0], 0, b[0], 0, 'rgba(0,0,0,0)', 'rgba(0,0,0,.93)')); }
  }

  function render() {
    const t = S.t, L = S.L, port = W < H * .9; F = H * (port ? .78 : 1.05);
    vpx = W * (port ? .5 : .68) + S.mx * W * .012 + Math.sin(t * .31) * W * .0025; vpy = H * (port ? .3 : .5) + S.my * H * .01 + Math.sin(t * .43) * H * .003;
    cx.globalCompositeOperation = 'source-over'; cx.fillStyle = '#030303'; cx.fillRect(0, 0, W, H);
    const zn = S.cam + .3;
    poly([pr(-XW, CE, ZF), pr(XW, CE, ZF), pr(XW, FL, ZF), pr(-XW, FL, ZF)], '#080707');
    poly([pr(-XW, CE, zn), pr(XW, CE, zn), pr(XW, CE, ZF), pr(-XW, CE, ZF)], lg(0, 0, 0, vpy, '#050505', '#0e0c0a'));
    poly([pr(-XW, FL, zn), pr(XW, FL, zn), pr(XW, FL, ZF), pr(-XW, FL, ZF)], lg(0, H, 0, vpy, '#050404', '#120d0a'));
    poly([pr(-XW, CE, zn), pr(-XW, CE, ZF), pr(-XW, FL, ZF), pr(-XW, FL, zn)], lg(0, 0, vpx, 0, '#040506', '#0f0f0e'));
    poly([pr(XW, CE, zn), pr(XW, CE, ZF), pr(XW, FL, ZF), pr(XW, FL, zn)], lg(W, 0, vpx, 0, '#040506', '#0f0f0e'));
    for (const s of [-1, 1]) {
      poly([pr(s * XW, .35, zn), pr(s * XW, .35, ZF), pr(s * XW, FL, ZF), pr(s * XW, FL, zn)], 'rgba(0,0,0,.38)');
      seg(pr(s * XW, .35, zn), pr(s * XW, .35, ZF), 'rgba(150,115,75,.24)', 2);
      seg(pr(s * XW, CE + .18, zn), pr(s * XW, CE + .18, ZF), 'rgba(150,115,75,.12)', 1.5);
      for (let z = first(zn, .3); z < ZF; z += .3) seg(pr(s * XW, CE, z), pr(s * XW, .35, z), 'rgba(190,165,120,.055)', 1);
      for (let z = first(zn, 1.2); z < ZF; z += 1.2) seg(pr(s * XW, .35, z), pr(s * XW, FL, z), 'rgba(0,0,0,.4)', 2);
    }
    for (let i = -6; i <= 6; i++) seg(pr(i * .2, FL, zn), pr(i * .2, FL, ZF), 'rgba(0,0,0,.45)', 1);
    for (let z = first(zn, .9); z < ZF; z += .9) seg(pr(-XW, FL, z), pr(XW, FL, z), 'rgba(0,0,0,.35)', 1);
    poly([pr(-.5, FL, zn), pr(.5, FL, zn), pr(.5, FL, ZF), pr(-.5, FL, ZF)], lg(0, H, 0, vpy, 'rgba(74,12,9,0)', 'rgba(82,14,10,.66)'));
    seg(pr(-.5, FL, zn), pr(-.5, FL, ZF), 'rgba(170,125,70,.24)', 1.5); seg(pr(.5, FL, zn), pr(.5, FL, ZF), 'rgba(170,125,70,.24)', 1.5);
    for (let z = first(zn, 1.4); z < ZF; z += 1.4) seg(pr(-XW, CE, z), pr(XW, CE, z), 'rgba(120,95,65,.11)', 3);
    door(-1, 1.2, 2.1, false); door(1, 2.0, 2.95, false); door(1, 4.5, 5.4, true);
    picture(1, 3.3, 3.85, -.3, .35); picture(1, 6.0, 6.5, -.3, .3);
    stairs();
    // far door
    const gap = .028 + .06 * clamp(S.door, 0, 1.7), dl = (.9 + .1 * Math.sin(t * 3.1) * Math.sin(t * 7.3)) + clamp(S.door - 1, 0, .7) * .3;
    poly([pr(-DW - .09, FL, ZF), pr(DW + .09, FL, ZF), pr(DW + .09, FL - DH - .09, ZF), pr(-DW - .09, FL - DH - .09, ZF)], '#080605', 'rgba(150,115,70,.3)', 2);
    poly([pr(-DW, FL, ZF), pr(DW, FL, ZF), pr(DW, FL - DH, ZF), pr(-DW, FL - DH, ZF)], '#0e0b08', 'rgba(165,128,85,.4)', 1.5);
    [[FL - DH * .93, FL - DH * .56], [FL - DH * .46, FL - DH * .14]].forEach(([y0, y1]) => poly([pr(-DW * .72, y0, ZF), pr(DW * .72, y0, ZF), pr(DW * .72, y1, ZF), pr(-DW * .72, y1, ZF)], null, 'rgba(160,125,85,.12)', 1));
    // bulb light (scaled by flicker)
    const bz = 3.1, bx = Math.sin(t * .9) * .05, bp = pr(bx, CE + .62, bz), cp = pr(bx * .2, CE, bz), zz = Math.max(.3, bz - S.cam);
    cx.globalCompositeOperation = 'lighter';
    glow(bp[0], bp[1], Math.min(W * .5, F * 2.0 / zz), '255,160,85', .15 * L);
    glow(bp[0], bp[1], Math.min(W * .16, F * .5 / zz), '255,215,150', .26 * L);
    cx.globalCompositeOperation = 'source-over';
    seg(cp, bp, 'rgba(120,100,80,.55)', 1.5);
    cx.fillStyle = L > .15 ? 'rgba(255,230,180,' + (.4 + .6 * L).toFixed(2) + ')' : 'rgba(42,36,30,.85)'; cx.beginPath(); cx.arc(bp[0], bp[1], Math.max(2, F * .04 / zz), 0, 7); cx.fill();
    // fog
    cx.globalCompositeOperation = 'lighter';
    glow(vpx + Math.sin(t * .07) * W * .1, vpy + H * .09, W * .42, '120,105,85', .05); glow(vpx - Math.sin(t * .05 + 1) * W * .12, vpy + H * .13, W * .3, '110,95,75', .04);
    cx.globalCompositeOperation = 'source-over';
    if (L < 1) { cx.fillStyle = 'rgba(0,0,0,' + ((1 - L) * .78).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
    // door light
    const gA = pr(-DW, FL - gap, ZF), gB = pr(DW, FL, ZF), gy = gB[1], gh = Math.max(1.2, gB[1] - gA[1]), ppm = F / Math.max(.3, ZF - S.cam);
    cx.globalCompositeOperation = 'lighter';
    const sp = [pr(-DW, FL, ZF), pr(DW, FL, ZF), pr(DW + .55, FL, ZF - 2.8), pr(-DW - .55, FL, ZF - 2.8)];
    poly(sp, lg(0, gy, 0, pr(0, FL, ZF - 2.8)[1], 'rgba(255,175,100,' + (.24 * dl).toFixed(3) + ')', 'rgba(255,185,105,0)'));
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = lg(gA[0], 0, gB[0], 0, 'rgba(255,196,120,' + (.55 * dl).toFixed(2) + ')', 'rgba(255,228,175,' + Math.min(1, .98 * dl).toFixed(2) + ')');
    cx.fillRect(gA[0], gA[1], gB[0] - gA[0], gh);
    if (S.feet) {
      cx.fillStyle = 'rgba(0,0,0,.93)'; const fw = Math.max(2, ppm * .055), f = S.feet;
      [-.075 + f.ph * .035, .075 + f.ph * .035].forEach(o => { const p = pr(f.x + o, FL, ZF); cx.fillRect(p[0] - fw / 2, gA[1] - .5, fw, gh + 1); });
    }
    cx.globalCompositeOperation = 'lighter';
    glow((gA[0] + gB[0]) / 2, gy, Math.min(W * .34, ppm * 2.6), '255,170,90', .26 * dl); glow((gA[0] + gB[0]) / 2, gy, Math.min(W * .7, ppm * 7), '255,160,85', .05 * dl);
    cx.globalCompositeOperation = 'source-over';
    // apparition: long dark habit, backlit by the door
    if (S.ghost > 0 && S.cam < 1) {
      const gz = 5.0, gx = .03, zz2 = Math.max(.4, gz - S.cam), hd = pr(gx, FL - 1.62, gz), r = F * .1 / zz2;
      const sh = [pr(gx - .27, FL - 1.45, gz), pr(gx + .27, FL - 1.45, gz), pr(gx + .22, FL - .9, gz), pr(gx + .34, FL, gz), pr(gx - .34, FL, gz), pr(gx - .22, FL - .9, gz)];
      cx.fillStyle = '#000'; poly(sh, '#000', 'rgba(255,190,120,.22)', 1.2);
      cx.beginPath(); cx.ellipse(hd[0], hd[1], r * 1.15, r * 1.35, .08, 0, 7); cx.fill(); cx.strokeStyle = 'rgba(255,190,120,.22)'; cx.lineWidth = 1.2; cx.stroke();
    }
    // dust
    for (const p of dust) {
      const zz3 = p.z - S.cam; if (zz3 < .45) continue; const q = pr(p.x, p.y, p.z), a = (.18 + .22 * Math.sin(p.ph * 1.7)) * (.5 + .5 * L), sz = clamp(F * .006 / zz3, .7, 2.2);
      cx.fillStyle = 'rgba(235,205,155,' + Math.max(0, a).toFixed(2) + ')'; cx.fillRect(q[0], q[1], sz, sz);
    }
  }

  /* ---------- loop ---------- */
  let raf = 0, last = 0, acc = 0;
  function loop(ts) {
    raf = 0; if (menu.classList.contains('hidden') || document.hidden) return;
    const dt = Math.min(.1, (ts - last) / 1000 || .016); last = ts; acc += dt;
    if (acc >= 1 / 30) { step(acc); render(); acc = 0; }
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !reduce && !menu.classList.contains('hidden') && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  if (reduce) { step(0.016); render(); }
  window.addEventListener('resize', () => { resize(); if (reduce || !raf) render(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  /* ---------- reveal / gate ---------- */
  let gateKey = null;
  function reveal() {
    if (S.revealed) return; S.revealed = true; A.init();
    if (gateKey) { window.removeEventListener('keydown', gateKey, true); gateKey = null; }
    const g = $('nm-gate'); if (g) { g.classList.add('off'); setTimeout(() => g.remove(), 2000); }
    menu.classList.add('revealed'); S.nextFl = 5.5; S.nextFeet = S.t + 13;
    if (A.ctx) A.thud(.1);
    scheduleAmbient(); if (reduce) render();
  }
  if (AUTO) { menu.classList.add('revealed', 'fast'); S.revealed = true; }
  else {
    const gate = mk('div', 'nm-gate', '', '<div>PLAY IN THE DARK.</div><div>WEAR HEADPHONES.</div><div>— CLICK TO BEGIN —</div>');
    menu.append(gate);
    gate.addEventListener('pointerdown', reveal);
    const gk = e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); reveal(); } };
    gateKey = gk;
    window.addEventListener('keydown', gk, true);
  }
  const speedUp = () => { if (S.revealed) menu.classList.add('fast'); };
  menu.addEventListener('pointerdown', () => setTimeout(speedUp, 1200), { passive: true });

  /* ---------- listening / idle ---------- */
  let lx = 0, ly = 0, lt = performance.now(), sp = 0, lastHeardFl = 0;
  window.addEventListener('pointermove', e => {
    const n = performance.now(), dt = Math.max(1, n - lt), d = Math.hypot(e.clientX - lx, e.clientY - ly);
    sp = lerp(sp, d / dt, .35); lx = e.clientX; ly = e.clientY; lt = n;
    S.mx = (e.clientX / innerWidth - .5) * -1; S.my = (e.clientY / innerHeight - .5) * -1; S.lastAct = n; S.idleKnocked = false;
    if (S.revealed && sp > 1.5 && n > S.heardUntil - 1200 && S.go <= 0) {
      const fresh = !S.heardNow; S.heardUntil = n + 2600;
      if (fresh && !S.fl && n - lastHeardFl > 9000 && !reduce) { lastHeardFl = n; startFlicker(false); }
    }
  }, { passive: true });
  ['keydown', 'pointerdown'].forEach(ev => window.addEventListener(ev, () => { S.lastAct = performance.now(); S.idleKnocked = false; }, { passive: true }));
  setInterval(() => {
    if (!S.revealed || menu.classList.contains('hidden')) return;
    if (!S.idleKnocked && performance.now() - S.lastAct > 45000) { S.idleKnocked = true; A.knock(); S.heardUntil = performance.now() + 2200; }
  }, 1000);
  let ambT = 0;
  function scheduleAmbient() {
    clearTimeout(ambT);
    ambT = setTimeout(() => { if (!menu.classList.contains('hidden')) { const r = rnd(); if (r < .6) A.creak(); else if (r < .85) A.knock(); else A.thud(.12); } scheduleAmbient(); }, 26000 + rnd() * 28000);
  }
  function glitch() {
    if (!titleC) return; const h = $('title-glitch'); if (!h) return;
    const words = ['BEHIND', 'HERE', 'LISTEN', 'NAAN'], orig = h.dataset.text || 'NAAN'; h.dataset.text = words[Math.floor(rnd() * words.length)];
    h.classList.add('nm-glitch'); A.buzz();
    setTimeout(() => { h.classList.remove('nm-glitch'); h.dataset.text = orig; }, 170);
  }

  /* ---------- hover on ENTER, door-rush transition ---------- */
  if (btnP) {
    const on = () => { S.hover = true; A.swell(); }, off = () => { S.hover = false; S.hoverSpawned = false; };
    btnP.addEventListener('pointerenter', on); btnP.addEventListener('pointerleave', off); btnP.addEventListener('focus', on); btnP.addEventListener('blur', off);
  }
  if (bT) bT.addEventListener('click', () => { mem.tape = 1; save(); bT.classList.remove('unread'); });
  let passing = false, entering = false;
  nav.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('#btn-play,#btn-continue') : null; if (!b || passing) return;
    /* A save exists: 1st click only shows the 'REPLACE SAVE? CLICK AGAIN' prompt (no door animation, menu stays usable);
       the 2nd click is the confirmation and is allowed to play the animation. */
    if (b === btnP && typeof window.__naanHasSave === 'function' && window.__naanHasSave()) {
      if (!btnP.dataset.arm) return;
      btnP.dataset.ok = '1'; clearTimeout(window.__armT);
    }
    if (b === btnP && (AUTO || reduce)) { mem.n++; save(); return; }
    if (AUTO || reduce) return;
    e.preventDefault(); e.stopImmediatePropagation(); if (entering) return; entering = true;
    A.init(); A.door(); S.cam0 = S.cam; S.go = 1e-6; S.hover = false; spawnFeet(true); menu.classList.add('go');
    setTimeout(() => {
      if (b === btnP) { mem.n++; save(); }
      passing = true; try { b.click(); } finally { passing = false; }
    }, 1500);
    const tryReset = n => {
      if (menu.classList.contains('hidden')) return;
      const ld = $('loading'); const busy = ld && !ld.classList.contains('hidden');
      if (busy && n < 40) { setTimeout(() => tryReset(n + 1), 1000); return; }
      resetEnter();
    };
    setTimeout(() => tryReset(0), 6000);
  }, true);
  function resetEnter() { entering = false; S.go = 0; S.cam0 = 0; S.feet = null; menu.classList.remove('go'); refreshMemory(); start(); }
  new MutationObserver(() => { if (menu.classList.contains('hidden')) { if (entering) resetEnter(); } else { start(); refreshMemory(); } }).observe(menu, { attributes: true, attributeFilter: ['class'] });

  try { step(0.016); render(); } catch (e) { }
  start();
  /* ---------- opening scene: slow fade-in from black ---------- */
  (function introFade() {
    const bars = $('cinema-bars'), hud = $('hud'); if (!bars || !hud || !hud.parentNode) return;
    const f = document.createElement('div'); f.id = 'intro-fade';
    f.style.cssText = 'position:absolute;inset:0;z-index:19;background:#000;opacity:0;pointer-events:none;transition:opacity 2.6s ease';
    hud.parentNode.insertBefore(f, hud);
    let wasOn = false;
    new MutationObserver(() => {
      const on = !bars.classList.contains('hidden');
      if (on && !wasOn) { f.style.transition = 'none'; f.style.opacity = '1'; void f.offsetWidth; f.style.transition = 'opacity 2.6s ease'; setTimeout(() => { f.style.opacity = '0'; }, 40); }
      else if (!on) { f.style.transition = 'none'; f.style.opacity = '0'; }
      wasOn = on;
    }).observe(bars, { attributes: true, attributeFilter: ['class'] });
  })();
  window.__NAAN_MENU__ = { S, step, render, reveal, startFlicker, spawnFeet, glitch, mem, resize };
})();
