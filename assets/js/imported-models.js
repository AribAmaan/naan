/* NAAN 8.6: local, textured static GLB assets. No CDN or API key. */
(()=>{'use strict';
const state={status:'loading',models:{},errors:{},files:{},tier:null};
// Loaded GLB templates share textures/materials with their live clones. Keep one template
// per quality variant; freeing the previous variant on tier change invalidated live textures.
const templateCache=new Map();
const T=()=>window.__NAAN__.__three;
async function parse(buffer){
 const Q=T(),dv=new DataView(buffer);if(buffer.byteLength<20||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid GLB header');
 let json,bin;for(let o=12;o<buffer.byteLength;){let n=dv.getUint32(o,true),type=dv.getUint32(o+4,true);o+=8;if(o+n>buffer.byteLength)throw Error('Truncated GLB');if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,o,n)));if(type===0x004e4942)bin=buffer.slice(o,o+n);o+=n;}
 if(!json||!bin)throw Error('Invalid GLB');if(json.skins?.length>1||json.animations?.length)throw Error('Unsupported skinned GLB');
 const arrays={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
 function attr(id){let a=json.accessors[id],v=json.bufferViews[a.bufferView],C=arrays[a.componentType],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];if(!C||!size||v.byteStride||a.sparse)throw Error('Unsupported accessor');return new Q.BufferAttribute(new C(bin,(v.byteOffset||0)+(a.byteOffset||0),a.count*size),size,!!a.normalized);}
 const imgs=await Promise.all((json.images||[]).map(im=>new Promise((resolve,reject)=>{let v=json.bufferViews[im.bufferView],url=URL.createObjectURL(new Blob([new Uint8Array(bin,v.byteOffset||0,v.byteLength)],{type:im.mimeType})),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Model texture decode failed'))};img.src=url;})));
 const texCache=new Map(),filterMap={9728:1003,9729:1006,9984:1004,9985:1007,9986:1005,9987:1008};
 function desiredAniso(){let q=window.__NAAN__?.settings?.quality||'medium',want=q==='ultra'?16:q==='high'?12:q==='medium'?4:2,max=window.__NAAN__?.renderer?.capabilities?.getMaxAnisotropy?.()||want;return Math.max(1,Math.min(want,max));}
 function tex(info,color){if(!info)return null;let key=info.index+':'+color;if(texCache.has(key))return texCache.get(key);let d=json.textures[info.index],image=imgs[d.source??d.extensions?.EXT_texture_webp?.source];if(!image)throw Error('Missing texture');let tx=new Q.Texture(image),sam=json.samplers?.[d.sampler]||{};tx.flipY=false;tx.colorSpace=color?'srgb':'';tx.wrapS=({10497:1000,33071:1001,33648:1002})[sam.wrapS??10497];tx.wrapT=({10497:1000,33071:1001,33648:1002})[sam.wrapT??10497];if(filterMap[sam.magFilter])tx.magFilter=filterMap[sam.magFilter];if(filterMap[sam.minFilter])tx.minFilter=filterMap[sam.minFilter];tx.anisotropy=desiredAniso();tx.generateMipmaps=true;tx.needsUpdate=true;texCache.set(key,tx);return tx;}
 const mats=(json.materials||[{}]).map((d,mi)=>{let p=d.pbrMetallicRoughness||{},factor=p.baseColorFactor||[1,1,1,1],m=new Q.MeshStandardMaterial({map:tex(p.baseColorTexture,true),metalness:p.metallicFactor??1,roughness:p.roughnessFactor??1,metalnessMap:tex(p.metallicRoughnessTexture,false),roughnessMap:tex(p.metallicRoughnessTexture,false),normalMap:tex(d.normalTexture,false),side:d.doubleSided?Q.DoubleSide:0,transparent:d.alphaMode==='BLEND',depthWrite:d.alphaMode!=='BLEND',alphaTest:d.alphaMode==='MASK'?(d.alphaCutoff??.5):0,opacity:factor[3]});m.color.setRGB(...factor.slice(0,3));if(d.normalTexture){const scale=d.normalTexture.scale??1;m.normalScale.set(scale,scale)}m.dithering=true;m.name=d.name||('Imported material '+mi);m.userData.naanShared=true;m.userData.noDetail=true;return m;});
 const nodes=json.nodes.map(n=>{let group=new Q.Group();group.name=n.name||'';if(n.mesh!==undefined)for(let p of json.meshes[n.mesh].primitives){if((p.mode??4)!==4)throw Error('Expected triangles');let g=new Q.BufferGeometry();for(let [k,name] of [['POSITION','position'],['NORMAL','normal'],['TEXCOORD_0','uv'],['JOINTS_0','naanIdx'],['WEIGHTS_0','naanW']])if(p.attributes[k]!==undefined)g.setAttribute(name,attr(p.attributes[k]));if(p.indices!==undefined)g.setIndex(attr(p.indices));if(!g.attributes.normal||!g.attributes.normal.array.some(x=>x!==0))g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();group.add(new Q.Mesh(g,mats[p.material??0]));}if(n.matrix){group.matrix.fromArray(n.matrix);group.matrix.decompose(group.position,group.quaternion,group.scale)}else{if(n.translation)group.position.fromArray(n.translation);if(n.rotation)group.quaternion.fromArray(n.rotation);if(n.scale)group.scale.fromArray(n.scale)}return group;});
 json.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>nodes[i].add(nodes[c])));const root=new Q.Group();for(let i of json.scenes[json.scene||0].nodes)root.add(nodes[i]);root.userData.imageSizes=imgs.map(i=>[i.naturalWidth,i.naturalHeight]);root.userData.rig=json.skins?.[0]?.extras?.naanRig||null;return root;
}
// Ground furniture against the visible floor (y=.012), not an arbitrary export origin.
function prepareFurniture(root,key){
 window.__NAAN_REALISM__?.imported(root,key);
 const Q=T();root.updateMatrixWorld(true);const b=new Q.Box3().setFromObject(root),floor=.014;
 if(key==='table'){const height=b.max.y-b.min.y;if(height>0)root.scale.y*= (.805-floor)/height;root.updateMatrixWorld(true);b.setFromObject(root)}
 root.position.y+=floor-b.min.y;root.updateMatrixWorld(true);return root;
}
function clone(key){let src=state.models[key];if(!src)return null;let o=src.clone(true);o.traverse(m=>{if(m.isMesh){m.geometry=m.geometry.clone();m.castShadow=true;m.receiveShadow=true;m.userData.imported=true;}});o.userData.imported=key;return o;}
/* Texture memory: the GPU keeps every texture as uncompressed RGBA plus mipmaps (~21 MB at 2048x2048, ~5.6 MB at 1024x1024),
   whatever the file size on disk. hands/shotgun/revolver ship at <=1024. The nun ships at 2048 (nun.glb) and 1024 (nun_lite.glb);
   Low quality, which the game already selects for phones and low-core/low-memory devices, loads nun_lite.glb. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function gameApi(){for(let i=0;i<200&&!window.__NAAN__?.__three;i++)await sleep(50);if(!window.__NAAN__?.__three)throw Error('Game API unavailable');}
const wantTier=()=>window.__NAAN__?.settings?.quality==='low'?'lite':'full';
function release(root){root?.traverse(o=>{if(!o.isMesh)return;o.geometry?.dispose();const m=o.material;if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose()}})}
function adapt(key,root){root.traverse(o=>{if(!o.isMesh)return;let m=o.material;if(key==='nun'){m.metalness=0;m.roughness=.84}else if(key==='hands'){m.metalness=0;m.roughness=.64;if(m.normalMap)m.normalScale.set(.65,.65)}else if(key==='torchhand'||key==='shotgunhand'){m.metalness=0;m.roughness=.78;m.side=2}else if(key==='revolver'){m.metalness=.52;m.roughness=.48}else if(key==='shotgun'){m.metalness=1;m.roughness=1}m.dithering=true;})}
async function loadKey(key){
 const files=key==='nun'?(state.tier==='lite'?['nun_lite','nun']:['nun','nun_lite']):key==='torchhand'?(state.tier==='lite'?['hand_holding_torch_lite','hand_holding_torch']:['hand_holding_torch','hand_holding_torch_lite']):key==='shotgunhand'?(state.tier==='lite'?['shotgun_hand_lite','shotgun_hand_full']:['shotgun_hand_full','shotgun_hand_lite']):[key];let last;
 for(const file of files){try{const id=key+':'+file;let root=templateCache.get(id);
  if(!root){const r=await fetch('assets/models/'+file+'.glb',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);root=await parse(await r.arrayBuffer());adapt(key,root);root.userData.file=file;templateCache.set(id,root);}
  state.models[key]=root;state.files[key]=file;delete state.errors[key];return}catch(e){last=e}}
 if(!state.models[key]){state.errors[key]=last.message;console.warn('Using built-in '+key+' model:',last.message)}
}
async function run(){
 await gameApi();state.tier=wantTier();state.status='loading';const nunFile=state.tier==='lite'?'nun_lite':'nun';
 const torchFile=state.tier==='lite'?'hand_holding_torch_lite':'hand_holding_torch';const shotgunHandFile=state.tier==='lite'?'shotgun_hand_lite':'shotgun_hand_full';
 await Promise.allSettled(['nun','revolver','hands','shotgun','torchhand','shotgunhand'].map(key=>!state.models[key]||(key==='nun'&&state.files.nun!==nunFile)||(key==='torchhand'&&state.files.torchhand!==torchFile)||(key==='shotgunhand'&&state.files.shotgunhand!==shotgunHandFile)?loadKey(key):Promise.resolve()));
 state.status=Object.keys(state.errors).length?'partial':'ready';
}
let chain=null;
// Reading .ready starts loading on first use and reloads only the nun if the quality tier changed since (e.g. the player lowered quality).
function sync(){if(chain&&(!window.__NAAN__?.settings||(state.tier===wantTier()&&state.status!=='partial')))return chain;chain=(chain||Promise.resolve()).then(run);return chain}
Object.defineProperty(state,'ready',{get:sync,enumerable:true});
function textureReport(){const out={tier:state.tier,models:{}};let total=0;for(const [key,root] of Object.entries(state.models)){let mb=0;const dims=[];for(const [w,h] of root.userData.imageSizes||[]){mb+=w*h*4*1.333/1048576;dims.push(w+'x'+h)}out.models[key]={file:root.userData.file,textures:dims,estimatedGpuMB:+mb.toFixed(1)};total+=mb}out.totalEstimatedGpuMB=+total.toFixed(1);return out}
window.NAANImported={state,parse,clone,release,prepareFurniture,textureReport,get ready(){return sync()}};
sync(); // start loading during the menu so the loading screen rarely waits.
})();

/* Adapt the user's static meshes to the existing gameplay rig. */
(()=>{'use strict';
const I=window.NAANImported,Q=()=>window.__NAAN__.__three,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{let t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
function meshes(root){let out=[];root.traverse(o=>{if(o.isMesh)out.push(o)});return out;}
function strip(root){for(let o of meshes(root)){o.parent.remove(o);o.geometry.dispose();}}
function geometry(key){let model=I.clone(key);if(!model)return null;let mesh=meshes(model)[0];return mesh;}
function subset(g,predicate){
 const T=Q(),ix=g.index?.array||Array.from({length:g.attributes.position.count},(_,i)=>i),p=g.attributes.position,indices=[],vertices=[],remap=new Map();
 for(let i=0;i<ix.length;i+=3){let a=ix[i],b=ix[i+1],c=ix[i+2];if(!predicate((p.getX(a)+p.getX(b)+p.getX(c))/3,(p.getY(a)+p.getY(b)+p.getY(c))/3,(p.getZ(a)+p.getZ(b)+p.getZ(c))/3,a,b,c))continue;
  for(const id of [a,b,c]){if(!remap.has(id)){remap.set(id,vertices.length);vertices.push(id)}indices.push(remap.get(id))}
 }
 const copy=new T.BufferGeometry();for(const [name,attr]of Object.entries(g.attributes)){let data=new attr.array.constructor(vertices.length*attr.itemSize);for(let i=0;i<vertices.length;i++)for(let c=0;c<attr.itemSize;c++)data[i*attr.itemSize+c]=attr.array[vertices[i]*attr.itemSize+c];copy.setAttribute(name,new T.BufferAttribute(data,attr.itemSize,attr.normalized))}
 copy.setIndex(indices);copy.computeBoundingBox();copy.computeBoundingSphere();return copy;
}
I.hand=(api,side)=>{
 let m=geometry('hands');if(!m)return null;const T=Q(),g=new T.Group(),sourceSide=-side;
 let part=subset(m.geometry,x=>x*sourceSide>0);m.geometry.dispose();m.geometry=part;
 part.translate(-sourceSide*.32,0,0);part.rotateY(Math.PI);part.scale(.32,.32,.32);part.computeVertexNormals();smoothHandNormals(part);part.computeBoundingSphere();g.add(m);
 // Sleeve continues the model's own cuff (centre measured at x=+-.026,y=-.005, radius ~.036, colour ~rgb(27,31,38)); it flares toward the camera (+z) instead of away from it.
 let sleeve=new T.Mesh(new T.CylinderGeometry(.052,.027,.30,24,10),new T.MeshStandardMaterial({color:0x1c2128,roughness:.95}));const sp=sleeve.geometry.attributes.position;
 for(let i=0;i<sp.count;i++){const x=sp.getX(i),y=sp.getY(i),z=sp.getZ(i),a=Math.atan2(z,x),w=Math.sin((y+.15)/.30*Math.PI),f=1+.028*w*Math.sin(y*115+a*2)+.018*w*Math.sin(a*5);sp.setXYZ(i,x*f,y,z*f);}
 sleeve.geometry.computeVertexNormals();smoothHandNormals(sleeve.geometry);sleeve.rotation.x=Math.PI/2;sleeve.position.set(side*.020,-.004,.26);g.add(sleeve);
 g.userData.referenceHands=true;g.userData.imported='hands';g.name=side<0?'Imported left hand':'Imported right hand';g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.userData.noSSAO=true;}});return g;
};
// UV seams split the source hand into duplicate vertices. Average normals across
// coincident positions after bending, without merging UVs or changing topology.
function smoothHandNormals(geo){
 const p=geo.attributes.position,n=geo.attributes.normal,groups=new Map();
 for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');let ids=groups.get(k);if(ids)ids.push(i);else groups.set(k,[i]);}
 for(const ids of groups.values()){if(ids.length<2)continue;let x=0,y=0,z=0;for(const i of ids){x+=n.getX(i);y+=n.getY(i);z+=n.getZ(i);}const l=Math.hypot(x,y,z);if(l>.00001)for(const i of ids)n.setXYZ(i,x/l,y/l,z/l);}
 n.needsUpdate=true;
}
// Uploaded left hand holding the torch (hand_holding_torch.glb), used as the first-person torch arm.
// Source axes: forearm runs along +X toward the hand, palm faces +Z, thumb +Y, torch head points +X/+Y (about 23 deg up).
// The mesh is baked here (no per-frame work): yaw +90 deg sends the forearm forward (-Z) with the palm facing +X, which is correct for a
// left hand; scale .22 gives a real-world palm width of about 8 cm, matching the game's other hands; the origin moves to the fist.
I.torchHandCfg={scale:.22,yaw:Math.PI/2,aim:-.25,pitch:-.10,offset:[0,.05,-.09],grip:[.438,-.004,-.145],face:[.955,.31,-.215],axis:[.906,.382,-.181],faceRadius:.125};
I.torchHand=api=>{
 let m=geometry('torchhand');if(!m)return null;const T=Q(),c=I.torchHandCfg,g=new T.Group(),geo=m.geometry,Y=new T.Vector3(0,1,0),X=new T.Vector3(1,0,0),yaw=c.yaw+c.aim;
 // rigid placement only: the hand/finger pose inside the model is untouched. aim turns the hand toward the crosshair, pitch trims the torch angle.
 geo.translate(-c.grip[0],-c.grip[1],-c.grip[2]);geo.rotateY(yaw);geo.rotateX(c.pitch);geo.scale(c.scale,c.scale,c.scale);
 geo.computeVertexNormals();smoothHandNormals(geo);geo.computeBoundingBox();geo.computeBoundingSphere();g.add(m);
 // torch face position and direction in the same baked space, for the lens glow
 const face=new T.Vector3(c.face[0]-c.grip[0],c.face[1]-c.grip[1],c.face[2]-c.grip[2]).applyAxisAngle(Y,yaw).applyAxisAngle(X,c.pitch).multiplyScalar(c.scale);
 const axis=new T.Vector3(...c.axis).normalize().applyAxisAngle(Y,yaw).applyAxisAngle(X,c.pitch);
 g.userData.lens={position:face.addScaledVector(axis,.002),axis,radius:c.faceRadius*c.scale};
 g.position.set(...c.offset);
 g.userData.referenceHands=true;g.userData.imported='torchhand';g.name='Imported left hand holding torch';
 g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.userData.noSSAO=true;}});return g;
};
// Bend the existing finger surface into a grip. Cache each pose; no vertex work in steady-state frames.
I.poseHand=(hand,amount)=>{
 const mesh=hand?.children.find(o=>o.isMesh&&o.userData.imported);if(!mesh||hand.userData.gripAmount===amount)return;
 const geo=mesh.geometry,p=geo.attributes.position,rest=hand.userData.gripRest||(hand.userData.gripRest=p.array.slice()),side=hand.name.includes('right')?1:-1;
 // Source fingers spread along Y, with the palm normal along X. Curl in XZ,
 // preserving the separation of the four digits instead of folding them in YZ.
 for(let i=0;i<p.count;i++){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],sx=x*side;
  const weight=smooth(-.030,-.060,z)*(1-(1-smooth(-.045,-.025,sx))*smooth(-.064,-.044,z));
  const l=Math.max(0,-.050-z),r=.027/Math.max(.1,amount),angle=Math.min(2.85,l/r);
  const originalCenter=.006-.006*(l/.06)-.033*Math.pow(l/.10,2),offset=sx-originalCenter;
  const nx=.006-r*(1-Math.cos(angle))+offset*Math.cos(angle),nz=-.050-r*Math.sin(angle)-offset*Math.sin(angle);
  p.setXYZ(i,x+(side*nx-x)*weight,y,z+(nz-z)*weight);
 }
 // Thumb opposition is restrained and does not pull the fingertip into the palm.
 for(let i=0;i<p.count;i++){const x=rest[i*3],z=rest[i*3+2],w=(1-smooth(-.052,-.032,x*side))*smooth(-.005,-.038,z)*smooth(-.064,-.049,z);if(w>0)p.setXYZ(i,p.getX(i)+side*.009*w*amount,p.getY(i),p.getZ(i)-.006*w*amount);}
 p.needsUpdate=true;geo.computeVertexNormals();smoothHandNormals(geo);geo.computeBoundingBox();geo.computeBoundingSphere();hand.userData.gripAmount=amount;
};

I.gun=(api,kind)=>{
 if(!['revolver','shotgun'].includes(kind))return null;let mesh=geometry(kind);if(!mesh)return null;const T=Q(),root=new T.Group();root.name=kind==='revolver'?'Imported service pistol':'Imported pump shotgun';root.userData.__v74ModelOverhaul=1;root.userData.imported=kind;let g=mesh.geometry;
 g.rotateY(Math.PI);let scale=kind==='shotgun'?1.25:.25;g.scale(scale,scale,scale);g.translate(0,kind==='shotgun'?-.045:-.052,kind==='shotgun'?-.214:-.035);
 if(kind==='shotgun'){
  // Select the wooden fore-end; remaining barrel and magazine tube stay fixed.
  const uv=g.attributes.uv,tx=mesh.material.map;let pixels=tx?.userData?.naanSamplePixels;
  if(!pixels&&tx?.image){const c=document.createElement('canvas');c.width=tx.image.width;c.height=tx.image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(tx.image,0,0);pixels={data:ctx.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height};tx.userData.naanSamplePixels=pixels;}
  const woodAt=(a,b,c)=>{if(!pixels||!uv)return null;let red=0,green=0,blue=0;for(const i of[a,b,c]){const u=Math.max(0,Math.min(.99999,uv.getX(i))),v=Math.max(0,Math.min(.99999,uv.getY(i))),off=(Math.floor(v*pixels.h)*pixels.w+Math.floor(u*pixels.w))*4;red+=pixels.data[off];green+=pixels.data[off+1];blue+=pixels.data[off+2];}return red>green*1.16&&red>blue*1.35&&red>65;};
  // The old bounding box also selected the fixed magazine tube inside the pump.
  // Use the authored wood colour where available, with a radial fallback.
  const isPump=(x,y,z,a,b,c)=>z>-.63&&z<-.34&&y<.043&&y>-.095&&Math.hypot(x,y-.058)>.029&&(Math.hypot(x,y+.008)>.036||woodAt(a,b,c)===true);
  const pumpGeo=subset(g,isPump),bodyGeo=subset(g,(x,y,z,a,b,c)=>!isPump(x,y,z,a,b,c));g.dispose();mesh.geometry=bodyGeo;root.add(mesh);
  const pump=new T.Mesh(pumpGeo,mesh.material);root.add(pump);const bolt=new T.Group();root.add(bolt);
  const shell=new T.Mesh(new T.CylinderGeometry(.011,.011,.057,12),new T.MeshStandardMaterial({color:0x913b22,roughness:.45}));shell.rotation.x=Math.PI/2;shell.visible=false;shell.userData.naanAxialShell=true;
  const base=new T.Mesh(new T.CylinderGeometry(.0113,.0113,.010,16),new T.MeshStandardMaterial({color:0xa98c48,metalness:.82,roughness:.34}));base.position.y=-.024;const primer=new T.Mesh(new T.CylinderGeometry(.003,.003,.001,12),new T.MeshStandardMaterial({color:0xbcb7a6,metalness:.8,roughness:.3}));primer.position.y=-.0295;shell.add(base,primer);root.add(shell);
  root.userData.v72Parts={pump,bolt,reloadShell:shell,pumpBaseZ:0,pumpStroke:.105,boltBaseZ:0,external:true};
 }else{
  // The uploaded asset is a semi-automatic service pistol (despite the legacy internal key "revolver").
  // Keep the slide as a real moving part and add a magazine that can leave the grip during reloads.
  const isSlide=(x,y,z)=>y>.006;const slideGeo=subset(g,isSlide),bodyGeo=subset(g,(x,y,z)=>!isSlide(x,y,z));g.dispose();mesh.geometry=bodyGeo;root.add(mesh);const slide=new T.Mesh(slideGeo,mesh.material);root.add(slide);root.userData.importedSlide=slide;
  const magMat=new T.MeshStandardMaterial({color:0x15181b,metalness:.42,roughness:.44});magMat.dithering=true;
  const magazine=new T.Mesh(new T.BoxGeometry(.027,.078,.027),magMat);magazine.position.set(0,-.103,.049);magazine.rotation.x=-.22;magazine.userData.dynamic=true;root.add(magazine);
  const cylinder=new T.Group(),cylPivot=new T.Group();cylPivot.add(cylinder);root.add(cylPivot);root.userData.v72Parts={cylinder,cylPivot,magazine,magBaseY:-.103,magBaseZ:.049,slide,slideBaseZ:0,pistol:true,external:true};
 }
 root.userData.muzzle=kind==='shotgun'?[0,.065,-.840]:[0,.024,-.160];root.userData.eject=kind==='shotgun'?[.05,.025,-.095]:[.021,.018,-.012];
 root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.userData.noSSAO=true;}});return root;
};
// v18.5: new unified FPS shotgun-and-hands GLB; forward axis is -Z, sight and muzzle anchors calibrated to this mesh.
// Do not rotate like shotgun.glb: the source includes the hands, gunstock and supporting palm in one authored grip.
I.installCombinedShotgun=api=>{
 const v=api?.G?.v72,p=api?.player,old=v?.vm?.shotgun,root=p?.v72GunRoot;
 if(!v||!old||!root||!I.state.models.shotgunhand)return !!old?.userData?.combinedShotgun;
 if(old.userData?.combinedShotgun&&old.userData.modelFile===I.state.files.shotgunhand)return true;
 let newGun=null;
 try{
  const T=Q(),src=I.clone('shotgunhand');if(!src)return false;
  newGun=new T.Group();newGun.name='Shotgun and anatomically attached FPS hands';
  newGun.userData.combinedShotgun=true;newGun.userData.imported='shotgunhand';newGun.userData.modelFile=I.state.files.shotgunhand;
  newGun.userData.__v74ModelOverhaul=1;
  newGun.userData.muzzle=[.120,.326,-.559];newGun.userData.eject=[.14,.26,-.14];
  src.name='Textured connected hands and pump shotgun';newGun.add(src);
  // The supplied mesh is rigid. Retain the original weapon state's pump/bolt/reload-shell targets
  // as separate helper objects so the existing reload/pump logic remains safe, without double-rendering the old gun.
  const pump=new T.Group(),bolt=new T.Group();pump.name='Legacy pump stroke state';bolt.name='Legacy bolt state';newGun.add(pump,bolt);
  const sm=new T.MeshStandardMaterial({color:0x942e20,metalness:.15,roughness:.51});
  const shell=new T.Mesh(new T.CylinderGeometry(.012,.012,.059,10),sm);shell.name='Visible shell during reload';shell.rotation.x=Math.PI/2;shell.userData.naanAxialShell=true;shell.visible=false;
  const rim=new T.Mesh(new T.CylinderGeometry(.012,.012,.007,10),new T.MeshStandardMaterial({color:0xb4a16b,metalness:.65,roughness:.42}));rim.position.y=-.030;shell.add(rim);newGun.add(shell);
  newGun.userData.v72Parts={pump,bolt,reloadShell:shell,pumpBaseZ:0,boltBaseZ:0,pumpStroke:0,external:true,rigid:true};
  newGun.position.set(0,0,0);newGun.rotation.set(0,0,0);newGun.scale.setScalar(1.30);newGun.visible=old.visible;
  // The imported hands for revolver/flare must remain alive when the old shotgun group is disposed.
  for(const h of Object.values(v.vmHands||{})){if(h?.parent===old)root.add(h);}
  root.add(newGun);if(p.viewLightRig)tuneViewmodelRoot(api,newGun);root.remove(old);v.vm.shotgun=newGun;
  old.traverse(o=>{if(o.isMesh){o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m&&!m.userData?.naanShared)m.dispose?.()}});
  v.hudSig=null;return true;
 }catch(err){console.warn('Combined shotgun grip could not be installed:',err);if(newGun?.parent)newGun.parent.remove(newGun);return false;}
};
function tuneViewmodelRoot(api,root){if(!root)return;const q=api.settings?.quality||'medium',want=q==='ultra'?16:q==='high'?12:q==='medium'?4:2,max=api.renderer.capabilities.getMaxAnisotropy?.()||want,an=Math.min(want,max),env=window.__rp?.rt?.texture||null;root.traverse(o=>{o.layers.set(2);if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;o.userData.noSSAO=true;o.renderOrder=10000;for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(!m)continue;m.dithering=true;if(m.metalness>.12){const intensity=q==='ultra'?.72:q==='high'?.58:.38;if(m.envMap!==env){m.envMap=env;m.needsUpdate=true}if(m.envMapIntensity!==intensity)m.envMapIntensity=intensity;}for(const x of Object.values(m))if(x?.isTexture&&x.anisotropy!==an){x.anisotropy=an;x.needsUpdate=true}}});}
function installViewmodelPass(api){const post=api.post,passes=post?.composer?.passes;if(!passes||passes.some(p=>p?.__naanViewmodelPass))return;const pass={__naanViewmodelPass:true,enabled:true,needsSwap:false,renderToScreen:false,setSize(){},dispose(){},render(renderer,writeBuffer,readBuffer){const c=api.camera,scene=api.scene,mask=c.layers.mask,bg=scene.background,clear=renderer.autoClear;try{renderer.setRenderTarget(this.renderToScreen?null:readBuffer);renderer.autoClear=false;renderer.clearDepth();scene.background=null;c.layers.set(2);renderer.render(scene,c)}finally{scene.background=bg;c.layers.mask=mask;renderer.autoClear=clear}}};const anchor=post.bloom||post.grade,idx=anchor?passes.indexOf(anchor):-1;passes.splice(idx>=0?idx:Math.max(1,passes.length-1),0,pass);}
I.lightViewmodels=api=>{const p=api.player,v=api.G.v72;if(!p?.v72GunRoot||!p.fpRig)return;const T=Q();if(!p.viewLightRig){const rig=new T.Group();rig.name='viewmodel-lighting';const ambient=new T.AmbientLight(0xaeb9c6,.46),key=new T.DirectionalLight(0xffe5ca,1.25),fill=new T.DirectionalLight(0x8ea6c5,.42);key.position.set(-.55,.95,.25);key.target.position.set(0,-.12,-.7);fill.position.set(.65,.2,.15);fill.target.position.set(0,-.18,-.55);for(const l of [ambient,key,key.target,fill,fill.target])l.layers.set(2);rig.add(ambient,key,key.target,fill,fill.target);p.camera.add(rig);p.camera.layers.disable(2);p.viewLightRig=rig;}
 tuneViewmodelRoot(api,p.v72GunRoot);tuneViewmodelRoot(api,p.fpRig);v.muzzleLight?.layers.enable(0);installViewmodelPass(api);
};
// Medium/High/Ultra insert the viewmodel before bloom/grade so weapons and hands receive the same AA and colour pipeline as the world.
// Low has no post stack, so retain the old direct clear-depth fallback there.
I.renderViewmodel=api=>{if(!api?.player?.viewLightRig)return;if(api.post?.composer?.passes?.some(p=>p?.__naanViewmodelPass))return;const r=api.renderer,c=api.camera,mask=c.layers.mask,clear=r.autoClear,target=r.getRenderTarget(),background=api.scene.background;try{r.setRenderTarget(null);r.autoClear=false;api.scene.background=null;r.clearDepth();c.layers.set(2);r.render(api.scene,c);}finally{api.scene.background=background;c.layers.mask=mask;r.autoClear=clear;r.setRenderTarget(target);}};
I.animateWeapons=api=>{let v=api.G.v72,p=v?.vm?.revolver?.userData?.v72Parts,slide=v?.vm?.revolver?.userData.importedSlide;if(slide&&!v?.reloading)slide.position.z=(p?.slideBaseZ||0)+(v.active==='revolver'?Math.max(0,v.weaponKick||0)*.034:0);};
I.disposeInstance=rig=>{let m=rig?.importedMesh;if(!m)return;m.material.dispose();m.customDepthMaterial?.dispose();m.customDistanceMaterial?.dispose();};
I.nun=(api,rig)=>{
 let mesh=geometry('nun');if(!mesh)return rig;const info=I.state.models.nun?.userData.rig;
 if(!info||!mesh.geometry.attributes.naanW)return rig; // asset without a skeleton: keep the built-in nun
 strip(rig.root);const T=Q(),g=mesh.geometry,S=1.84,Y0=.92144,P=p=>new T.Vector3(p[0]*S,p[1]*S+Y0,p[2]*S);
 g.scale(S,S,S);g.translate(0,Y0,0);g.computeBoundingSphere();
 // Give exposed face and hands a softer skin response than the woven habit.
 // This bind-pose attribute follows the same rig deformation as the source mesh.
 const positions=g.attributes.position,skinSurface=new Float32Array(positions.count);
 for(let i=0;i<positions.count;i++){const x=Math.abs(positions.getX(i)),y=positions.getY(i),z=positions.getZ(i);const face=(1-smooth(.074,.112,x))*smooth(1.52,1.59,y)*(1-smooth(1.77,1.82,y))*smooth(.055,.095,z);const hand=smooth(.20,.245,x)*(1-smooth(.30,.34,x))*smooth(.76,.83,y)*(1-smooth(1.15,1.22,y));skinSurface[i]=Math.max(face,hand);}
 g.setAttribute('naanSkinSurface',new T.BufferAttribute(skinSurface,1));
 // ---- skeleton: fitted joints of the uploaded mesh, parented into the existing gameplay rig so hitboxes and old pivots keep working
 const N=info.names,at=n=>N.indexOf(n),R=info.rest.map(P),bones=N.map(n=>new T.Group());bones.forEach((b,i)=>b.name='bone_'+N[i]);
 const B=n=>bones[at(n)];
 rig.body.add(B('pelvis'));B('pelvis').position.copy(R[0]);
 const chest=B('chest');B('pelvis').add(chest);chest.position.copy(R[1]).sub(R[0]);
 const sub=(child,parent,pi,ci)=>{parent.add(child);child.position.copy(R[ci]).sub(R[pi]);};
 sub(rig.head,chest,1,at('head'));sub(B('hood'),chest,1,at('hood'));
 for(const [k,side] of [['l','l'],['r','r']]){
  sub(rig.arms[k].pivot,chest,1,at('arm_'+side));
  sub(B('fore_'+side),rig.arms[k].pivot,at('arm_'+side),at('fore_'+side));
  B('fore_'+side).add(rig.arms[k].hand);rig.arms[k].hand.position.set(0,-.30,.01); // wrist sits at the end of the forearm
  sub(rig.legs[k],B('pelvis'),0,at('thigh_'+side));
  sub(B('shin_'+side),rig.legs[k],at('thigh_'+side),at('shin_'+side));
 }
 // bone objects that already exist in the rig stand in for the matching skeleton joints
 bones[at('head')]=rig.head;bones[at('arm_l')]=rig.arms.l.pivot;bones[at('arm_r')]=rig.arms.r.pivot;bones[at('thigh_l')]=rig.legs.l;bones[at('thigh_r')]=rig.legs.r;
 rig.body.add(mesh);rig.root.updateMatrixWorld(true);
 const body=rig.body,bind=bones.map(b=>body.matrixWorld.clone().invert().multiply(b.matrixWorld).invert()),uniform={value:bones.map(()=>body.matrix.clone().identity())},tmp=body.matrix.clone(),inv=body.matrix.clone();
 const NJ=bones.length;
 const header='attribute vec4 naanIdx;\nattribute vec4 naanW;\nuniform mat4 naanJ['+NJ+'];\nmat4 naanSkin(){return naanJ[int(naanIdx.x+.5)]*naanW.x+naanJ[int(naanIdx.y+.5)]*naanW.y+naanJ[int(naanIdx.z+.5)]*naanW.z+naanJ[int(naanIdx.w+.5)]*naanW.w;}\n';
 function deform(mat){mat.onBeforeCompile=s=>{s.uniforms.naanJ=uniform;s.vertexShader='attribute float naanSkinSurface; varying float vNaanSkinSurface;\n'+header+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvNaanSkinSurface=naanSkinSurface;');s.fragmentShader='varying float vNaanSkinSurface;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,clamp(roughnessFactor*.72,.43,.68),vNaanSkinSurface);');s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(mat3(naanSkin())*objectNormal);').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=(naanSkin()*vec4(transformed,1.0)).xyz;');};mat.customProgramCacheKey=()=>'naan-nun-skin12-v180-surface';return mat;}
 mesh.material=deform(mesh.material.clone());mesh.material.userData.naanShared=true; // private shader; texture ownership stays with the template
 mesh.customDepthMaterial=deform(new T.MeshDepthMaterial({depthPacking:3201}));mesh.customDistanceMaterial=deform(new T.MeshDistanceMaterial());
 mesh.frustumCulled=false;mesh.userData.noSSAO=true;mesh.name='Imported textured nun (12-bone skin)';
 // The skinned mesh is excluded from SSAO (the override material cannot reproduce the deformation); a soft contact patch keeps her grounded.
 try{const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d'),gr=cx.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(0,0,0,.78)');gr.addColorStop(.55,'rgba(0,0,0,.34)');gr.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gr;cx.fillRect(0,0,128,128);const tx=new T.CanvasTexture(cv),mat=new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,opacity:(api.settings?.quality==='high'||api.settings?.quality==='ultra')?.16:.27});mat.userData.naanShared=false;const sh=new T.Mesh(new T.PlaneGeometry(.78,.56),mat);sh.rotation.x=-Math.PI/2;sh.position.set(0,.020,.015);sh.userData.noSSAO=true;sh.renderOrder=2;rig.root.add(sh);rig.contactShadow=sh}catch(e){}
 rig.updateImported=()=>{rig.root.updateMatrixWorld(true);inv.copy(body.matrixWorld).invert();for(let i=0;i<NJ;i++)uniform.value[i].copy(inv).multiply(bones[i].matrixWorld).multiply(bind[i]);};
 mesh.onBeforeRender=rig.updateImported;mesh.onBeforeShadow=rig.updateImported;
 // ---- pose layer: runs after the game's own animate() and adds the joints the old rig never had (knees, elbows, hips, spine, hood).
 // The game still decides gait phase, head tracking, chase/stun state; this layer only distributes that motion across the skeleton.
 const dmp=(c,t,k,dt)=>c+(t-c)*(1-Math.exp(-k*dt)),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),st={hood:0,elL:-.1,elR:-.1,knL:0,knR:0};
 rig.pose=(gr,dt)=>{
  if(!(dt>0))return;const r=gr.gait||0,sp=gr.speed||0,moving=sp>.05,a=moving?cl(sp/3.4,.32,1.18):.045,sr=Math.sin(r),cr=Math.cos(r),
   chase=gr.state==='chase'||gr.state==='grab',fall=gr.fallT||0,ck=gr.clock||0,hy=gr.headYaw||0;
  const body=rig.body,pel=B('pelvis'),leg={l:rig.legs.l,r:rig.legs.r},shin={l:B('shin_l'),r:B('shin_r')};
  // legs: hip swing + knee flexion during the swing phase (foot clears the floor); kneel when stunned
  leg.l.rotation.x=sr*.34*a-fall*.95;leg.r.rotation.x=-sr*.34*a-fall*.95;
  st.knL=dmp(st.knL,Math.max(0,-cr)*.62*a+.03+fall*1.5,16,dt);st.knR=dmp(st.knR,Math.max(0,cr)*.62*a+.03+fall*1.5,16,dt);
  shin.l.rotation.x=st.knL;shin.r.rotation.x=st.knR;leg.l.rotation.z=.012;leg.r.rotation.z=-.012;
  // pelvis rotates against the shoulders; hips drop on the unsupported side
  pel.rotation.y=sr*.07*a;pel.rotation.z=sr*.035*a;
  chest.rotation.y=-sr*.09*a+hy*.14;chest.rotation.z=-pel.rotation.z*.8;chest.rotation.x=(chase?.10:.02)+Math.sin(ck*1.6)*.011+fall*.10;
  body.position.y+=fall*.30; // stock fall drops the whole body 0.42 m; with real knee/hip folding that over-sinks her into the floor
  rig.head.rotation.y=hy-chest.rotation.y;                                  // net head yaw still equals the tracked yaw
  // arms: right arm now counter-swings too (original held it static); elbows flex with the swing and when reaching
  const swL=-sr*.28*a,swR=sr*.22*a;
  if(!chase)rig.arms.r.pivot.rotation.x=dmp(rig.arms.r.pivot.rotation.x,swR-.06,7,dt);
  const reach=chase?-.30+Math.sin(ck*9)*.05:0;
  st.elL=dmp(st.elL,chase?reach:-.10-Math.max(0,-swL)*1.0-fall*.6,9,dt);st.elR=dmp(st.elR,chase?reach-.06:-.10-Math.max(0,swR)*1.0-fall*.6,9,dt);
  B('fore_l').rotation.x=st.elL;B('fore_r').rotation.x=st.elR;
  B('fore_l').rotation.z=.04;B('fore_r').rotation.z=-.04;
  // hood/veil trails the head turn and sways with the stride
  st.hood=dmp(st.hood,hy,3.5,dt);const hood=B('hood');hood.rotation.y=(st.hood-chest.rotation.y)*.45;hood.rotation.x=rig.head.rotation.x*.5+Math.sin(r*.58)*.03*a;hood.rotation.z=-rig.head.rotation.z*.4;
  rig.updateImported();
 };
 rig.root.userData.imported='nun';rig.root.name='Uploaded Nun • 12-bone skin';rig.importedMesh=mesh;rig.bones=bones;return rig;
};
})();
