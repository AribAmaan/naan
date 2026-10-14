/* NAAN v17.2 optional art scheduler. Never gate procedural game creation
 * on network availability. Each model family independently caches its results.
 * An unfinished art fetch may complete for a later run, without modifying
 * the active procedural house or resurrecting a cancelled load.
 */
(()=>{'use strict';
  let active=null, attempts=0;
  const state={status:'idle',tier:null,startedAt:0,finishedAt:0,lastWait:null,issues:[]};
  function start(quality){
    const q=(quality==='high'||quality==='ultra')?quality:(quality==='medium'?'medium':'low');
    // Pending loads share one task. Partial/failed tasks retry on the next run.
    if(active&&active.q===q&&state.status!=='partial')return active.promise;
    // Model quality changes can queue fresh work; running fetches are not cancelled
    // since they may be useful in the next generated house.
    const tasks=[];
    function launch(name,task){
      try{tasks.push(Promise.resolve(task()).then(value=>({
        name,
        // Individual providers report 'partial' as a fulfilled promise. Do not
        // mistake this for a fully loaded set of models.
        ok:value!==false&&value?.status!=='partial'&&value?.status!=='fallback'&&value?.status!=='failed'&&
          (name==='characters'||(value!=null&&typeof value==='object'))&&
          (name!=='characters'||window.NAANImported?.state?.status!=='partial'),
        value
      }),error=>({name,ok:false,error:String(error?.message||error)})));}
      catch(error){tasks.push(Promise.resolve({name,ok:false,error:String(error?.message||error)}));}
    }
    state.status='loading';state.tier=q;state.startedAt=Date.now();state.issues=[];attempts++;
    launch('characters',()=>{if(!window.NAANImported)throw Error('character importer unavailable');return window.NAANImported.ready;});
    if(q==='high'||q==='ultra'){
      launch('furniture-v15',()=>{if(!window.__NAAN_V15_ASSETS?.readyFor)throw Error('v15 loader unavailable');return window.__NAAN_V15_ASSETS.readyFor(q)});
      launch('furniture-v16',()=>{if(!window.__NAAN_V16_ASSETS?.readyFor)throw Error('v16 loader unavailable');return window.__NAAN_V16_ASSETS.readyFor(q)});
      launch('furniture-v17',()=>{if(!window.__NAAN_V17_ASSETS__?.readyFor)throw Error('v17 loader unavailable');return window.__NAAN_V17_ASSETS__.readyFor(q)});
    }
    const thisAttempt=attempts;
    const promise=Promise.all(tasks).then(results=>{
      if(thisAttempt===attempts){
        state.issues=results.filter(r=>!r.ok).map(r=>r.name+': '+(r.error||r.value?.status||'partial assets'));
        state.finishedAt=Date.now();state.status=state.issues.length?'partial':'ready';
      }
      return results;
    });
    active={q,promise};return promise;
  }
  async function wait(quality,budgetMs=2400){
    const work=start(quality);
    const budget=Math.max(0,Math.min(Number(budgetMs)||0,8000));
    let timeout;
    try{
      const race=await Promise.race([
        work.then(results=>({timedOut:false,results})),
        new Promise(resolve=>{timeout=setTimeout(()=>resolve({timedOut:true,results:null}),budget)})
      ]);
      state.lastWait={tier:quality,timedOut:race.timedOut,budgetMs:budget};
      return race;
    }finally{clearTimeout(timeout)}
  }
  window.__NAAN_OPTIONAL_ART__={start,wait,status:()=>({...state,attempts})};
  // Begin optional art during the menu. Character model imports may still be
  // waiting for __NAAN__ readiness; never delay the first menu paint.
  setTimeout(()=>start(window.__NAAN__?.settings?.quality||'low'),100);
})();
