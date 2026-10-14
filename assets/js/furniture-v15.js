/* NAAN v15: Real, local, texture-mapped GLB furniture; fallback if unavailable.
 * No external service, API key, remote CDN or paid plugin required.
 * Kept separate so the high/ultra assets can be audited and removed safely. */
(()=>{'use strict';
  const cfg={bed:'v15_victorian_bed',sofa:'v15_victorian_sofa',wardrobe:'v15_victorian_wardrobe',table:'v15_victorian_table'};
  const models={},errors={},inflight={};
  const states={bed:'pending',sofa:'pending',wardrobe:'pending',table:'pending'};
  let injectCount=0;
  const enabled=q=>q==='high'||q==='ultra';
  async function load(key){
    if(models[key])return true;
    if(inflight[key])return inflight[key];
    inflight[key]=(async()=>{
      try{
        const response=await fetch('assets/models/'+cfg[key]+'.glb',{signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw Error('HTTP '+response.status);
        const mesh=await window.NAANImported.parse(await response.arrayBuffer());
        window.NAANImported.prepareFurniture(mesh,key);
        const shapes=[];
        mesh.traverse(o=>{if(o.isMesh){
          const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);geo.userData=geo.userData||{};geo.userData.naanImportedFurniture=true;
          geo.computeBoundingBox();geo.computeBoundingSphere();
          // Meshes and materials remain cached. The game owns only geometry copies.
          o.material.userData=o.material.userData||{};
          o.material.userData.naanShared=true;
          shapes.push({geo,mat:o.material});
        }});
        if(!shapes.length)throw Error('GLB contains no meshes');
        models[key]=shapes;states[key]='ready';return true;
      }catch(e){states[key]='fallback';errors[key]=String(e.message||e);console.warn('Using original NAAN furniture',key,errors[key]);return false;}
      finally{delete inflight[key];}
    })();
    return inflight[key];
  }
  async function readyFor(quality){
    if(!enabled(quality))return {quality,status:'procedural',assets:0};
    await Promise.all(Object.keys(cfg).map(load));
    return {quality,status:Object.values(states).every(v=>v==='ready')?'ready':'partial',assets:Object.keys(models).length};
  }
  function available(name,q){return enabled(q)&&!!models[name];}
  function inject(name,batch,x,z,ry,args){
    const meshes=models[name];if(!meshes||!meshes.length)return 0;
    // Game's dining table can be variable size; match the existing collider.
    // Conservative bounds measured from largest origin-relative extent on both
    // sides of each axis; asymmetric headboards must not overhang colliders.
    // Keep the entire 3D mesh inside its original X/Z collider; don't cause
    // a new hidden wall or shoulder snag when assets replace procedural shapes.
    const bounds={bed:[2.14,1.68,2.08,1.53],sofa:[2.16,1.02,2.08,.96],
      wardrobe:[1.47,.852,1.28,.68],table:[1.523,.90,args[0]??1.5,args[1]??.9]};
    const [meshW,meshD,collW,collD]=bounds[name];
    const sx=(collW-.035)/meshW,sz=(collD-.035)/meshD;
    const sy=name==='wardrobe'?.97:1;
    for(const {geo,mat} of meshes)batch.add(geo,mat,x,0,z,ry,0,0,sx,sy,sz);
    injectCount++;
    return meshes.length;
  }
  window.__NAAN_V15_ASSETS={readyFor,available,inject,
    status:()=>({states:{...states},errors:{...errors},modelsLoaded:Object.keys(models).length,placements:injectCount})};
})();
