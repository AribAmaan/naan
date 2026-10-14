/* NAAN v16: Four additional self-contained PBR GLBs, collision-preserving.
 * Existing v15 assets remain untouched. HIGH/ULTRA only; MEDIUM/LOW procedural.
 * All shapes are cached after one import. No external API/service required.
 */
(()=>{'use strict';
  const specs={
    chair:{file:'v16_victorian_chair',bounds:[-.235,.235,-.25,.2375],collider:[.48,.50]},
    dresser:{file:'v16_victorian_dresser',bounds:[-.66,.66,-.305,.341],collider:[1.34,.62]},
    stove:{file:'v16_victorian_stove',bounds:[-.3625,.3625,-.354,.3985],collider:[.75,.72]},
    bathSet:{file:'v16_victorian_bath_suite',bounds:[-1.37,1.275,-.855,.855],collider:[2.62,1.83]}
  };
  const models=Object.create(null),inflight=Object.create(null),status=Object.create(null),errors=Object.create(null);
  for(const k of Object.keys(specs))status[k]='pending';
  let placements=0;
  const enabled=q=>q==='high'||q==='ultra';
  async function load(k){
    if(models[k])return true;
    if(inflight[k])return inflight[k];
    inflight[k]=(async()=>{
      try{
        const r=await fetch('assets/models/'+specs[k].file+'.glb',{signal:AbortSignal.timeout(14000)});
        if(!r.ok)throw Error('HTTP '+r.status);
        const mesh=await window.NAANImported.parse(await r.arrayBuffer());
        window.NAANImported.prepareFurniture(mesh,k);
        const parts=[];
        mesh.traverse(o=>{
          if(!o.isMesh)return;
          const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.userData=g.userData||{};g.userData.naanImportedFurniture=true;
          g.computeBoundingBox();g.computeBoundingSphere();
          for(const m of (Array.isArray(o.material)?o.material:[o.material])){
            if(!m)continue;m.userData=m.userData||{};m.userData.naanShared=true;
          }
          parts.push({geo:g,mat:o.material});
        });
        if(!parts.length)throw Error('No renderable meshes');
        models[k]=parts;status[k]='ready';delete errors[k];return true;
      }catch(e){status[k]='fallback';errors[k]=String(e.message||e);console.warn('NAAN v16 procedural fallback:',k,errors[k]);return false;}
      finally{delete inflight[k];}
    })();
    return inflight[k];
  }
  async function readyFor(q){
    if(!enabled(q))return {quality:q,status:'procedural',assets:0};
    await Promise.all(Object.keys(specs).map(load));
    return {quality:q,status:Object.values(status).every(s=>s==='ready')?'ready':'partial',assets:Object.keys(models).length};
  }
  function available(k,q){return !!specs[k]&&enabled(q)&&!!models[k];}
  function inject(k,batch,x,z,ry){
    const spec=specs[k],parts=models[k];
    if(!spec||!parts?.length)return 0;
    // Hard footprint limits: visual content must stay inside original X/Z collider.
    const [xmin,xmax,zmin,zmax]=spec.bounds,[cw,cd]=spec.collider;
    // Scale by furthest *edge from origin*, not overall width: asymmetric
    // furniture could otherwise extend beyond one side of the collider.
    const sx=Math.min(1,(cw*.5-.014)/Math.max(Math.abs(xmin),Math.abs(xmax)));
    const sz=Math.min(1,(cd*.5-.014)/Math.max(Math.abs(zmin),Math.abs(zmax)));
    if(!(sx>0&&sz>0))throw Error('Invalid model scale');
    for(const {geo,mat} of parts)batch.add(geo,mat,x,0,z,ry,0,0,sx,1,sz);
    placements++;return parts.length;
  }
  window.__NAAN_V16_ASSETS={readyFor,available,inject,
    status:()=>({states:{...status},errors:{...errors},loaded:Object.keys(models).length,placements})};
})();
