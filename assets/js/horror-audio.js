/* NAAN v8.7.1 — adaptive sample score (v8.7.1: UI-screen ducking, load retry, menu buffer release). Uses the game's one AudioContext/master.
 * Local assets only; no runtime API, subscription or network service required.
 */
(() => {
  'use strict';
  if (window.__NAAN_AUDIO__) return;
  const names = ['menu','exploration','dread','chase','safe_room','convent_air','nun_breath','wood_creak','door_slam','discovery'];
  const music = new Set(['menu','exploration','dread','chase','safe_room']);
  const live = new Set(['playing','pick','keypad','note','struggle']);
  // v8.7.1: puzzle / inventory / files overlays freeze the game but are not a pause. Duck the score
  // instead of cutting it. Opened from the pause menu they stay silent like pause itself.
  const soft = new Set(['puzzle','inventory','files']);
  const softOpen = S => S.state==='puzzle' || (S.state==='inventory' && S.v72?.uiReturn!=='paused') || (S.state==='files' && S.v72?.filesReturn!=='paused');
  const isLive = S => live.has(S.state) || (soft.has(S.state) && softOpen(S));
  const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
  const prefs = {music:.65, atmosphere:.75, captions:false, gentle:false};
  try { const p=JSON.parse(localStorage.getItem('naan.audio.v87')||'{}');
    for(const k of ['music','atmosphere']) if(Number.isFinite(p[k]))prefs[k]=clamp(p[k]);
    for(const k of ['captions','gentle']) if(typeof p[k]==='boolean')prefs[k]=p[k];
  } catch (_) {}
  const buffers=new Map(), pending=new Map(), failed=new Set(), layers=new Map(), voices=new Set();
  let N, ctx, musicBus, fxBus, filter, output, started=false, menuMuted=false, menuReleased=false, leftMenuAt=-1, lastRetry=0;
  const retries=new Map();
  let world=null, mode='silent', chaseUntil=0, breathAt=0, stingAt=-100, lastStingTime=-100, duckUntil=0;
  let lastState='', lastTime=0, endingKind='', captionUntil=0, captionEl, loadQueue=Promise.resolve();
  const stats={loaded:0,failed:[],state:'silent',targets:{},transitions:0};
  function ramp(param,value,time=.4){
    const now=ctx.currentTime;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);
    else { const v=param.value;param.cancelScheduledValues(now);param.setValueAtTime(v,now); }
    param.setTargetAtTime(value,now,Math.max(.015,time));
  }
  function load(name){
    if(buffers.has(name))return Promise.resolve(buffers.get(name));
    if(pending.has(name))return pending.get(name);
    if(failed.has(name)||!ctx)return Promise.resolve(null);
    // Decode serially, outside the frame loop. Bad files never block game startup.
    const job=loadQueue.then(async()=>{
      for(const ext of ['ogg','mp3']){
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
        try {
          const response=await fetch('assets/audio/'+name+'.'+ext,{signal:controller.signal});
          if(!response.ok)throw new Error('HTTP '+response.status);
          const b=await ctx.decodeAudioData(await response.arrayBuffer());
          buffers.set(name,b);stats.loaded=buffers.size;return b;
        }catch(_){ /* portable codec fallback */ }finally{clearTimeout(timer);}
      }
      failed.add(name);stats.failed=[...failed];return null;
    });
    loadQueue=job.catch(()=>null);pending.set(name,job);return job;
  }
  // v8.7.1: a network blip must not leave the score on procedural fallback for the whole session.
  function retryFailed(){
    if(!ctx||!failed.size||document.hidden)return;
    for(const n of [...failed]){
      const k=retries.get(n)||0;if(k>=2)continue;
      retries.set(n,k+1);failed.delete(n);pending.delete(n);stats.failed=[...failed];load(n);
    }
  }
  function prime(){
    N=window.__NAAN__;if(!N)return false;
    try {
      N.audio.init();N.audio.resume();ctx=N.audio.ctx;if(!ctx)return false;
      if(started)return true;
      output=ctx.createGain();output.gain.value=0;output.connect(N.audio.master);
      filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=18000;filter.connect(output);
      musicBus=ctx.createGain();musicBus.gain.value=prefs.music;musicBus.connect(filter);
      fxBus=ctx.createGain();fxBus.gain.value=prefs.atmosphere;fxBus.connect(filter);
      started=true;lastRetry=ctx.currentTime;
      // First-click menu, then gameplay beds and short cues; one cache per session.
      for(const n of names)load(n);
      return true;
    }catch(e){console.warn('[audio] using procedural fallback',e.message);return false;}
  }
  function stopLayer(name){const l=layers.get(name);if(!l)return;
    try{l.source.stop();l.source.disconnect();l.gain.disconnect();}catch(_){}layers.delete(name);
  }
  function stopVoice(v){try{v.source.stop();}catch(_){}v.cleanup();}
  function stop(){for(const n of [...layers.keys()])stopLayer(n);for(const v of [...voices])stopVoice(v);}
  function layer(name,target,fade){
    if(target<.004)target=0; // asymptotic decay must still let idle loops stop
    let l=layers.get(name);
    if(target>0&&!l&&buffers.has(name)){
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffers.get(name);source.loop=true;
      gain.gain.value=0;source.connect(gain);gain.connect(music.has(name)?musicBus:fxBus);
      source.start();l={source,gain,target:0,zeroAt:0};layers.set(name,l);
    }
    if(!l)return;
    if(Math.abs(l.target-target)>.002){ramp(l.gain.gain,target,fade);l.target=target;l.zeroAt=target===0?ctx.currentTime:0;}
    if(target===0&&ctx.currentTime-l.zeroAt>Math.max(2,fade*7))stopLayer(name);
  }
  function caption(text,x,z){
    if(!prefs.captions||!text)return;
    if(!captionEl){captionEl=document.createElement('div');captionEl.id='audio-caption';captionEl.setAttribute('role','status');document.body.append(captionEl);}
    let direction='';const p=N?.player;
    if(p&&Number.isFinite(x)&&Number.isFinite(z)){
      const dx=x-p.pos.x,dz=z-p.pos.z,d=Math.hypot(dx,dz)||1;
      const side=(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/d;
      const front=(-dx*Math.sin(p.yaw)-dz*Math.cos(p.yaw))/d;
      direction=side<-.35?' · left':side>.35?' · right':front<-.35?' · behind':' · ahead';
    }
    captionEl.textContent=text+direction;captionEl.hidden=false;captionUntil=performance.now()+2400;
  }
  function spatial(v){
    const p=N.player;if(!p)return;
    const q=v.follow?N.granny:v;
    if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.z))return;
    const dx=q.x-p.pos.x,dz=q.z-p.pos.z,d=Math.hypot(dx,dz)||.001;
    const oc=clamp(N.audio.occl?.(q.x,q.z)||0);
    ramp(v.pan.pan,clamp((dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/d,-.92,.92),.05);
    ramp(v.gain.gain,v.volume/(1+d*.24+d*d*.014)*(1-oc*.65),.08);
    ramp(v.low.frequency,Math.max(450,14000-d*400-oc*8500),.08);
  }
  function play(name,opts={}){
    if(!started||!buffers.has(name)||document.hidden||N.audio._muted||voices.size>=6)return false;
    if(!isLive(N.G)&&N.G.state!=='endcine')return false;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),low=ctx.createBiquadFilter();
    source.buffer=buffers.get(name);source.playbackRate.value=opts.rate||1;
    low.type='lowpass';low.frequency.value=15000;gain.gain.value=opts.volume??.45;
    source.connect(low);low.connect(gain);gain.connect(pan);pan.connect(fxBus);
    const v={source,gain,pan,low,x:opts.x,z:opts.z,follow:opts.follow,volume:opts.volume??.45,
      cleanup(){voices.delete(v);for(const n of [source,gain,pan,low])try{n.disconnect();}catch(_){}}};
    voices.add(v);source.onended=v.cleanup;spatial(v);source.start(ctx.currentTime+(opts.delay||0));
    if(!opts.delay)caption(opts.caption,opts.x,opts.z);return true;
  }
  function sting(){
    if(!started||!buffers.has('discovery'))return false;
    if(ctx.currentTime-lastStingTime<5)return true;
    if(!play('discovery',{volume:prefs.gentle?.18:.34}))return false;
    lastStingTime=ctx.currentTime;duckUntil=ctx.currentTime+1.2;return true;
  }
  function tick(){
    if(!started)return;
    const S=N.G,p=N.player,g=N.granny,fd=window.__FEAR_DIRECTOR__?.state;
    const now=ctx.currentTime, state=S.state, rt=S.runTime||0;
    if(captionEl&&performance.now()>captionUntil)captionEl.hidden=true;
    if(world!==S.world||rt<lastTime-.5){stop();world=S.world;chaseUntil=0;breathAt=rt+12;stingAt=-100;lastStingTime=-100;lastState='';endingKind='';}
    lastTime=rt;
    const menu=state==='menu'&&!document.getElementById('menu')?.classList.contains('hidden');
    const active=isLive(S)&&p&&g;
    const ending=state==='endcine'||state==='end';
    if(S.v72?.endCine?.kind)endingKind=S.v72.endCine.kind;
    if(menu&&N.audio._muted)N.audio.setMuted(false);
    if(document.hidden||(!menu&&!active&&!ending)){
      output.gain.cancelScheduledValues(now);output.gain.value=0;stop();mode='silent';stats.state=mode;stats.targets={};
      if(captionEl)captionEl.hidden=true;lastState=state;return;
    }
    // Housekeeping (v8.7.1): reload failed assets, and free the ~18 MB decoded menu loop while playing.
    if(now-lastRetry>30){lastRetry=now;retryFailed();}
    if(menu){
      leftMenuAt=-1;
      if(menuReleased){if(buffers.has('menu')||failed.has('menu'))menuReleased=false;else load('menu');}
    }else if(leftMenuAt<0)leftMenuAt=now;
    else if(now-leftMenuAt>45&&buffers.has('menu')&&!layers.has('menu')){buffers.delete('menu');pending.delete('menu');menuReleased=true;}
    const room=active?S.world?.roomAt(p.pos.x,p.pos.z):null;
    const hidden=active&&p.mode==='hidden', safe=!!room?.safe;
    const released=!fd?.gate&&g?.state!=='dormant';
    const danger=active&&released&&(g.isDangerous||state==='struggle');
    if(danger)chaseUntil=rt+3.5;
    const chasing=active&&!safe&&(danger||rt<chaseUntil);
    const distance=active&&released?Math.hypot(g.x-p.pos.x,g.z-p.pos.z):999;
    const threat=active?Math.max(clamp((18-distance)/15),clamp(fd?.nerve||0)*.55):0;
    let next=menu?'menu':ending?'ending':safe?'safe':chasing?'chase':hidden?'hiding':threat>.26?'uneasy':'exploration';
    if(next!==mode){stats.transitions++;if(next==='chase'&&rt-stingAt>18){
      sting();stingAt=rt;
    }mode=next;}
    const targets={menu:0,exploration:0,dread:0,chase:0,safe_room:0,convent_air:0};
    if(menu)targets.menu=menuMuted?0:.40;
    else if(ending){targets[endingKind==='lullaby'?'safe_room':'dread']=.28;}
    else if(safe){targets.safe_room=.32;targets.convent_air=.07;}
    else {
      // Sparse opening, breathing space between swells, no location leak while dormant.
      const opening=clamp((rt-6)/24), space=.70+.30*Math.sin(rt*.035)**2;
      targets.convent_air=.15;
      targets.exploration=(chasing?.025:.23)*opening*space;
      targets.dread=chasing?.12:threat*.30;
      targets.chase=chasing?(prefs.gentle?.32:.43):0;
      if(hidden){targets.exploration*=.4;targets.dread*=.6;targets.chase*=.55;}
      if(S.v72?.cinematic)targets.exploration*=.6;
    }
    const absorbed=['note','keypad','pick'].includes(state)||soft.has(state);
    const duck=(now<duckUntil?.36:1)*(fd?.quiet?.06:1)*(absorbed?.58:1);
    for(const n of Object.keys(targets))layer(n,targets[n]*duck,n==='chase'&&chasing?.28:1.2);
    ramp(output.gain,1,.15);ramp(musicBus.gain,prefs.music,.1);ramp(fxBus.gain,prefs.atmosphere,.1);
    ramp(filter.frequency,hidden?2700:18000,.25);
    // Preserve the old ambience only when the replacement is unavailable.
    if(menu&&!buffers.has('menu')&&!menuReleased)N.audio.startAmbience();
    const amb=N.audio.loops?.amb;
    if(amb?.out)ramp(amb.out.gain,menu?(menuMuted||buffers.has('menu')||menuReleased?0:.35):buffers.has('exploration')&&buffers.has('convent_air')?0:1,.8);
    if(buffers.has('safe_room')&&N.audio.loops?.safeMusic)N.audio.stopSafeLullaby();
    if(active&&!safe&&!fd?.gate&&distance<14&&distance>2.3&&rt>=breathAt&&!absorbed){
      play('nun_breath',{x:g.x,z:g.z,follow:true,volume:.5,caption:'Ragged breathing'});breathAt=rt+18+Math.random()*14;
    }
    for(const v of voices)spatial(v);
    if(state==='end'&&lastState!=='end')for(const v of [...voices])stopVoice(v);
    lastState=state;stats.state=mode;stats.targets=targets;
  }
  function event(kind){
    if(!started)return;
    duckUntil=ctx.currentTime+(kind==='release'?4:1.6);
  }
  function installSettings(){
    const back=document.getElementById('btn-settings-back');if(!back)return;
    const block=document.createElement('div');block.id='horror-audio-settings';
    block.innerHTML='<label>Music <output id="out-score"></output><input id="set-score" type="range" min="0" max="100"></label><label>Atmosphere &amp; sampled effects <output id="out-atmos"></output><input id="set-atmos" type="range" min="0" max="100"></label><label class="check">Directional sound captions <input id="set-audio-captions" type="checkbox"></label><label class="check">Softer chase &amp; discovery stings <input id="set-gentle-audio" type="checkbox"></label>';
    back.before(block);
    for(const [id,key,out] of [['set-score','music','out-score'],['set-atmos','atmosphere','out-atmos'],['set-audio-captions','captions'],['set-gentle-audio','gentle']]){
      const el=document.getElementById(id);if(out){el.value=Math.round(prefs[key]*100);document.getElementById(out).value=el.value;}else el.checked=prefs[key];
      el.addEventListener('input',()=>{prefs[key]=out?Number(el.value)/100:el.checked;if(out)document.getElementById(out).value=el.value;
        if(!prefs.captions&&captionEl)captionEl.hidden=true;try{localStorage.setItem('naan.audio.v87',JSON.stringify(prefs));}catch(_){} });
    }
  }
  window.__NAAN_AUDIO__={prime,play,sting,event,stop,load,has:n=>buffers.has(n),prefs,stats,
    setMenuMuted(v){menuMuted=!!v;},
    inspect(){return {...stats,loops:layers.size,voices:voices.size,decodedBytes:[...buffers.values()].reduce((s,b)=>s+b.length*b.numberOfChannels*4,0),context:ctx?.state};},tick};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(output)output.gain.value=0;if(started)ctx.suspend().catch(()=>{});}else if(started)N.audio.resume();});
  window.addEventListener('pagehide',stop);
  window.addEventListener('pointerdown',prime,{passive:true});window.addEventListener('keydown',prime,{passive:true});
  installSettings();setInterval(tick,100);
})();
