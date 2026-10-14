/* NAAN v17 — four more local GLB furniture types.
 * Kept separate from gameplay: Low/Medium use the original objects;
 * High/Ultra substitute render-only meshes, preserving existing collision,
 * hiding spots, puzzle placements and room traversal metadata.
 */
(()=>{'use strict';
  const specs={
    kitchenRun:{file:'v17_kitchen_cabinetry',bounds:[-1.26,1.26,-.365,.422],collider:[2.4,.74]},
    pedestalSink:{file:'v17_pedestal_sink',bounds:[-.34,.34,-.285,.25],collider:[.72,.54]},
    shelfUnit:{file:'v17_storage_shelf',bounds:[-.70,.70,-.215,.215],collider:[1.4,.44]},
    vanity:{file:'v17_dressing_vanity',bounds:[-.5375,.5375,-.25,.291],collider:[1.08,.50]}
  };
  const meshes=Object.create(null), inflight=Object.create(null),errors=Object.create(null),status=Object.create(null);
  Object.keys(specs).forEach(k=>status[k]='pending');
  let placements=0;
  const enabled=q=>q==='high'||q==='ultra';
  async function load(k){
    if(meshes[k])return true;
    if(inflight[k])return inflight[k];
    inflight[k]=(async()=>{
      try{
        if(!window.NAANImported?.parse)throw Error('GLB parser unavailable');
        const response=await fetch('assets/models/'+specs[k].file+'.glb',{signal:AbortSignal.timeout(14000)});
        if(!response.ok)throw Error('HTTP '+response.status);
        const scene=await window.NAANImported.parse(await response.arrayBuffer());
        window.NAANImported.prepareFurniture(scene,k);
        const parts=[];
        scene.traverse(obj=>{
          if(!obj.isMesh)return;
          const geo=obj.geometry.clone();geo.applyMatrix4(obj.matrixWorld);geo.userData=geo.userData||{};geo.userData.naanImportedFurniture=true;
          geo.computeBoundingBox();geo.computeBoundingSphere();
          for(const mat of(Array.isArray(obj.material)?obj.material:[obj.material])){
            if(!mat)continue;mat.userData=mat.userData||{};mat.userData.naanShared=true;
          }
          parts.push({geo,mat:obj.material});
        });
        if(!parts.length)throw Error('Empty GLB');
        meshes[k]=parts;status[k]='ready';delete errors[k];return true;
      }catch(e){status[k]='fallback';errors[k]=String(e.message||e);console.warn('NAAN v17 fallback:',k,errors[k]);return false;}
      finally{delete inflight[k];}
    })();
    return inflight[k];
  }
  async function readyFor(quality){
    if(!enabled(quality))return {quality,status:'procedural',assets:0};
    await Promise.all(Object.keys(specs).map(load));
    return {quality,status:Object.values(status).every(s=>s==='ready')?'ready':'partial',assets:Object.keys(meshes).length};
  }
  function available(k,quality){return !!specs[k]&&enabled(quality)&&!!meshes[k];}
  function inject(k,batch,x,z,ry,args=[]){
    const spec=specs[k],parts=meshes[k];if(!spec||!parts?.length)return 0;
    const [minX,maxX,minZ,maxZ]=spec.bounds;
    const width=(k==='kitchenRun'||k==='shelfUnit')?(args[0]??spec.collider[0]):spec.collider[0];
    const depth=spec.collider[1];
    if(!Number.isFinite(width)||width<=.18)throw Error('Invalid furniture width');
    const sx=Math.min(1,(width*.5-.017)/Math.max(Math.abs(minX),Math.abs(maxX)));
    const sz=Math.min(1,(depth*.5-.017)/Math.max(Math.abs(minZ),Math.abs(maxZ)));
    if(sx<=0||sz<=0)throw Error('Invalid geometry scale');
    for(const {geo,mat}of parts)batch.add(geo,mat,x,0,z,ry,0,0,sx,1,sz);
    placements++;return parts.length;
  }
  window.__NAAN_V17_ASSETS__={readyFor,available,inject,status:()=>({states:{...status},errors:{...errors},loaded:Object.keys(meshes).length,placements})};
})();
