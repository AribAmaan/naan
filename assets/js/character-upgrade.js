/* NAAN 8.2 — reference-driven character and first-person assets.
   Authored locally; no network model service or runtime CDN required. */
(()=>{'use strict';
const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let T,shared;
function geo(p,uv,ix){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
function surface(rows,cols,fn){let p=[],uv=[],ix=[];for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const v=fn(i/cols,j/rows);p.push(...v.slice(0,3));uv.push(...v.slice(3,5));}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;ix.push(a,b,a+1,b,b+1,a+1);}return geo(p,uv,ix);}
function add(parent,g,m,p=[0,0,0],r=[0,0,0],s=[1,1,1]){if(m.userData.referenceCloth&&g.attributes.uv&&!g.userData.referenceUV){let uv=g.attributes.uv;for(let i=0;i<uv.count;i++){let u=uv.getX(i),v=uv.getY(i);u=u>1?u%1:u;v=v>1?v%1:v;uv.setXY(i,(1170+u*170)/1448,1-(920-v*350)/1086)}g.userData.referenceUV=true;}let o=new T.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ball(parent,m,p,s){return add(parent,new T.SphereGeometry(1,16,12),m,p,[0,0,0],s);}
function tube(parent,m,pts,r=.004,sides=7){const path=pts.map(p=>new T.Vector3(...p));let p=[],uv=[],ix=[];for(let j=0;j<path.length;j++){let d=path[Math.min(j+1,path.length-1)].clone().sub(path[Math.max(0,j-1)]).normalize(),u=new T.Vector3(0,0,1);if(Math.abs(d.dot(u))>.95)u.set(1,0,0);u.cross(d).normalize();const v=d.clone().cross(u).normalize();for(let i=0;i<=sides;i++){let a=i/sides*TAU,q=path[j].clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r);p.push(q.x,q.y,q.z);uv.push(i/sides,j/(path.length-1));}}for(let j=0;j<path.length-1;j++)for(let i=0;i<sides;i++){let a=j*(sides+1)+i,b=a+sides+1;ix.push(a,a+1,b,a+1,b+1,b);}return add(parent,geo(p,uv,ix),m);}
function rounded(parent,m,w,h,d,p=[0,0,0],r=[0,0,0],bevel=.012){let g=new T.BoxGeometry(w,h,d,4,4,4),a=g.attributes.position;const v=new T.Vector3();let b=Math.min(bevel,w*.45,h*.45,d*.45);for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i),cx=clamp(x,-w/2+b,w/2-b),cy=clamp(y,-h/2+b,h/2-b),cz=clamp(z,-d/2+b,d/2-b);v.set(x-cx,y-cy,z-cz).normalize().multiplyScalar(b);a.setXYZ(i,cx+v.x,cy+v.y,cz+v.z);}g.computeVertexNormals();return add(parent,g,m,p,r);}
function cylinder(parent,m,r1,r2,len,p,rot=[Math.PI/2,0,0],open=false){return add(parent,new T.CylinderGeometry(r1,r2,len,24,1,open),m,p,rot);}
function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;let ctx=c.getContext('2d'),im=ctx.createImageData(512,512),seed=9284;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let y=0;y<512;y++)for(let x=0;x<512;x++){let n=(rand()-.5),f=Math.sin(x*.085+Math.sin(y*.018)*3)*Math.sin(y*.071),rgb;if(kind==='cloth'){let weave=(x%3===0?5:0)+(y%3===0?4:0),wear=Math.max(0,Math.sin(x*.051+Math.cos(y*.043)*3)*Math.sin(y*.029)-.3)*19;rgb=[30+n*17+weave+wear,29+n*15+weave+wear*.77,27+n*14+weave+wear*.55];}else if(kind==='ivory')rgb=[164+f*3+n*20,154+f*3+n*18,142+f*3+n*18];else if(kind==='skin'){let vein=Math.max(0,1-Math.abs(Math.sin(x*.025+Math.sin(y*.025)*1.5))*45)*9;rgb=[155+n*17+f*5-vein,112+n*13+f*5,89+n*13+f*4];}else if(kind==='wood'){let grain=Math.sin(x*.45+Math.sin(y*.005)*2+Math.sin(x*.02)*2);rgb=[70+grain*5+n*6,39+grain*3+n*5,23+grain*2+n*4];}else {let scratch=(y%113===0&&x>90&&x<370)?30:0;rgb=[190+n*12+scratch,195+n*12+scratch,201+n*12+scratch];}let i=(y*512+x)*4;im.data[i]=clamp(rgb[0],0,255);im.data[i+1]=clamp(rgb[1],0,255);im.data[i+2]=clamp(rgb[2],0,255);im.data[i+3]=255;}ctx.putImageData(im,0,0);const t=new T.CanvasTexture(c);t.colorSpace='srgb';t.wrapS=t.wrapT=1000;t.anisotropy=4;return t;}
function materials(){if(shared)return shared;const cloth=texture('cloth'),ivory=texture('ivory'),skin=texture('skin'),wood=texture('wood'),metal=texture('metal');let mk=(p)=>new T.MeshStandardMaterial(p);const photo=new T.Texture();photo.colorSpace='srgb';photo.anisotropy=4;const im=new Image();im.onload=()=>{photo.image=im;photo.needsUpdate=true;window.__NAAN_REFERENCE_READY__=true;};im.onerror=()=>{window.__NAAN_REFERENCE_READY__=false;console.warn('Nun reference texture did not load');};im.src='assets/textures/nun-reference.png';shared={
 cloth:mk({map:photo,bumpMap:cloth,bumpScale:.0007,color:0xffffff,roughness:.98,side:T.DoubleSide}),
 ivory:mk({map:ivory,bumpMap:ivory,bumpScale:.001,color:0xefebe4,roughness:.95,side:T.DoubleSide}),
 skin:mk({map:skin,bumpMap:skin,bumpScale:.00055,roughness:.67}),
 face:mk({map:photo,roughness:.83,side:T.DoubleSide}),
 nail:mk({color:0xa47d68,roughness:.5}),edge:mk({color:0x4e4637,roughness:1}),
 rope:mk({map:ivory,color:0x8e8064,roughness:1}),bead:mk({color:0x171411,roughness:.39}),
 leather:mk({map:cloth,color:0x635547,roughness:.68}),sole:mk({color:0x151311,roughness:.92}),
 steel:mk({map:metal,color:0xaeb3b8,metalness:.65,roughness:.32}),
 blue:mk({map:metal,color:0x7c8793,metalness:.65,roughness:.36}),
 silver:mk({map:metal,color:0xb5b3a6,metalness:.82,roughness:.34}),
 black:mk({color:0x080a0b,roughness:.85}),wood:mk({map:wood,bumpMap:wood,bumpScale:.0006,roughness:.45}),
 brass:mk({color:0xb48b43,metalness:.77,roughness:.3}),red:mk({map:metal,color:0xa73b23,metalness:.15,roughness:.48})};
shared.cloth.userData.referenceCloth=true;for(const m of Object.values(shared))m.userData.naanShared=true;return shared;}
// Merge static siblings by material: garment/bead detail must not become hundreds of draw calls.
function batch(group){let buckets=new Map();for(const o of [...group.children]){if(!o.isMesh||o.userData.dynamic)continue;o.updateMatrix();let a=buckets.get(o.material)||[];a.push(o);buckets.set(o.material,a);}for(const [mat,list] of buckets){if(list.length<2)continue;let pos=[],nor=[],uv=[],ix=[],offset=0;for(const o of list){let g=o.geometry.clone().applyMatrix4(o.matrix),p=g.attributes.position,n=g.attributes.normal,t=g.attributes.uv;pos.push(...p.array);nor.push(...n.array);if(t)uv.push(...t.array);else uv.push(...new Array(p.count*2).fill(0));let ids=g.index?g.index.array:Array.from({length:p.count},(_,i)=>i);for(const i of ids)ix.push(i+offset);offset+=p.count;group.remove(o);g.dispose();o.geometry.dispose();}let g=geo(pos,uv,ix);g.userData.referenceUV=true;g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));add(group,g,mat);}}
function garment(parent,m,y0,y1,r0,r1,depth=.72,folds=18){return add(parent,surface(26,64,(u,v)=>{let a=u*TAU,r=r0+(r1-r0)*v,f=(.009+.01*(1-v))*Math.sin(a*folds+Math.sin(v*4)*.24)+.003*Math.sin(a*folds*2);let hem=(1-v)**12*(.01+.018*Math.sin(a*23)**2);return [Math.sin(a)*(r+f),y0+(y1-y0)*v+hem,Math.cos(a)*(r+f)*depth,u*3,v*3];}),m);}
function cross(parent,m,x,y,z,size=.06){rounded(parent,m,size*.22,size,.012,[x,y,z],[0,0,0],.002);rounded(parent,m,size*.68,size*.19,.014,[x,y+size*.12,z],[0,0,0],.002);}
function fingers(parent,m,nail,side,grip=false){let out=[];for(let i=0;i<4;i++){const f=new T.Group();f.position.set((i-1.5)*.019,grip?0:-.025,0);parent.add(f);const len=[.064,.076,.071,.056][i];const pts=grip?[[0,0,0],[0,-.013,-len*.35],[0,-.04,-len*.6],[0,-.058,-len*.33]]:[[0,0,0],[0,-len*.38,.003],[0,-len*.72,.010],[0,-len,.019]];tube(f,m,pts,[.010,.0105,.0095,.008][i],10);ball(f,m,pts[1],[.010,.010,.010]);ball(f,nail,pts[pts.length-1].map((p,j)=>p+(j===2?.006:0)),[.006,.011,.002]);out.push(f);}return out;}
function nun(api){T=api.__three;const m=materials(),root=new T.Group(),body=new T.Group();root.add(body);root.name='Reference Nun • aged habit';
 garment(body,m.cloth,.10,1.11,.30,.15,.67,21);garment(body,m.cloth,1.07,1.40,.155,.215,.61,13);
 // Draped ivory chest wimple.
 add(body,surface(16,36,(u,v)=>{let x=(u-.5)*2;return[x*(.057+v*.15),1.475-v*.21+.038*v*Math.abs(x),.11+.11*v-.012*x*x,u,v];}),m.ivory);
 const head=new T.Group();head.position.set(0,1.64,.01);body.add(head);
 ball(head,m.skin,[0,-.018,0],[.105,.145,.084]);
 // Curved face surface, UV-projected from the actual supplied close-up.
 const faceGeo=surface(64,48,(u,v)=>{let yy=v,sy=.133-v*.286;
 let width=.105*(.93+.08*Math.sin(v*Math.PI)-.29*Math.exp(-(((v-.94)/.16)**2)));let x=(u-.5)*2*width;
 let z=.06+.022*Math.sqrt(Math.max(0,1-((u-.5)*2)**2));
 const ga=(cx,cy,sx,syy)=>Math.exp(-(((x-cx)/sx)**2)-((yy-cy)/syy)**2);
 z+=.040*ga(0,.50,.016,.20)+.020*ga(0,.625,.022,.075);
 z+=.012*(ga(-.060,.53,.026,.16)+ga(.060,.53,.026,.16));
 z-=.010*(ga(-.044,.31,.024,.065)+ga(.044,.31,.024,.065));
 z+=.008*ga(0,.81,.046,.055)+.010*ga(0,.95,.046,.07);
 let px=224+(u-.5)*2*(v>.75?112-(v-.75)*55:126),py=292+v*344;
 return [x,sy,z,px/1448,1-py/1086];});
 const face=add(head,faceGeo,m.face);face.name='Reference-projected sculpted face';
 // Close-fitting wimple around the face: forehead, sides and under chin.
 add(head,surface(8,48,(u,v)=>{let a=u*TAU,r=1+v*.23,x=Math.sin(a)*.113*r,y=Math.cos(a)*.16*r;return [x,y-.012,.066-v*.027,u,v];}),m.ivory);
 add(head,surface(8,32,(u,v)=>{let a=(u-.5)*Math.PI*.92;return[Math.sin(a)*.126,.137+v*.066,.078+Math.cos(a)*.025,u,v];}),m.ivory);
 // Hood is open at the face, with full volume over the crown and rear.
 const hood=add(head,surface(24,56,(u,v)=>{let a=.98+u*(TAU-1.96),r=.139+v*.013;return [Math.sin(a)*r,.21-v*.39,Math.cos(a)*r*.78-.005,u*2,v];}),m.cloth);
 ball(head,m.cloth,[0,.181,-.035],[.151,.074,.125]);
 const trim=[];for(let j=0;j<=45;j++){let a=.98+j/45*(TAU-1.96);trim.push([Math.sin(a)*.141,.207,Math.cos(a)*.11-.005]);}tube(head,m.edge,trim,.0025);
 const veilPanels=[];
 for(let side of [-1,1]){const panel=new T.Group();panel.position.set(side*.105,1.67,-.01);body.add(panel);
 add(panel,surface(22,18,(u,v)=>{let x=side*(.038+v*.17+u*.045),y=.115-v*.76,z=-.025+Math.cos(u*Math.PI)*.07-.035*v;z+=Math.sin(u*18+v)*.008;return[x,y,z,u,v*2];}),m.cloth);veilPanels.push(panel);}
 add(body,surface(24,48,(u,v)=>{let a=.95+u*(TAU-1.9),r=.146+v*.17;return[Math.sin(a)*r,1.80-v*.83,Math.cos(a)*r*.74-.023,u*3,v*2];}),m.cloth);
 // Rope girdle, knot and hanging ends.
 for(let k=0;k<2;k++){let pts=[];for(let j=0;j<=100;j++){let a=j/100*TAU;pts.push([Math.sin(a)*(.166+.003*Math.sin(a*40+k*Math.PI)),1.095+k*.013+.003*Math.cos(a*40),Math.cos(a)*.127]);}tube(body,m.rope,pts,.006);}
 for(let k=0;k<2;k++){let pts=[];for(let j=0;j<=40;j++){let v=j/40;pts.push([.075+k*.018+Math.sin(v*8)*.008,1.08-v*(.45-k*.10),.143+v*.052]);}tube(body,m.rope,pts,.005);}
 const rosary=new T.Group();body.add(rosary);let chain=[];for(let j=0;j<=40;j++){let u=j/40,x=(u-.5)*.19,y=1.49-.28*Math.sin(u*Math.PI),z=.143+.087*Math.sin(u*Math.PI);chain.push([x,y,z]);if(j%2===0)ball(rosary,m.bead,[x,y,z],[.005,.006,.005]);}tube(rosary,m.bead,chain,.0016);cross(rosary,m.silver,0,1.175,.235,.085);batch(rosary);
 const arms={},legs={};for(const [key,side] of [['l',-1],['r',1]]){const pivot=new T.Group();pivot.position.set(side*.20,1.42,0);body.add(pivot);garment(pivot,m.cloth,-.44,0,.09,.071,.85,10);
 const wrist=new T.Group();wrist.position.set(0,-.455,.008);pivot.add(wrist);ball(wrist,m.skin,[0,-.025,0],[.035,.055,.022]);const fs=fingers(wrist,m.skin,m.nail,side);
 tube(wrist,m.skin,[[side*.023,-.016,0],[side*.049,-.045,.009],[side*.045,-.07,.015]],.011,10);batch(wrist);arms[key]={pivot,hand:wrist,fingers:fs};
 let leg=new T.Group();leg.position.set(side*.095,.43,0);body.add(leg);cylinder(leg,m.cloth,.042,.045,.32,[0,-.14,0],[0,0,0]);ball(leg,m.leather,[0,-.325,.035],[.062,.075,.121]);rounded(leg,m.sole,.12,.023,.235,[0,-.379,.043],[0,0,0],.01);for(let i=0;i<5;i++)tube(leg,m.rope,[[-.022,-.278-i*.011,.077+i*.01],[.022,-.278-i*.011,.077+i*.01]],.0018);batch(leg);legs[key]=leg;}
 const cane=new T.Group(),tip=new T.Group();cane.add(tip);arms.r.hand.add(cane); // compatibility anchors; reference has no cane.
 const mouthGroup=new T.Group();head.add(mouthGroup);batch(head);batch(body);
 const built={root,body,head,hood,wimple:null,mouthGroup,eyes:[],arms,legs,cane,tip,rosary,veilPanels};
 root.userData.antagonist='v82-reference-nun';root.userData.__v74ModelOverhaul=1;root.userData.reference=true;
 return window.NAANImported?.nun(api,built)||built;
}
function hand(api,side){const imported=window.NAANImported?.hand(api,side);if(imported)return imported;T=api.__three;const m=materials(),g=new T.Group();g.name=side<0?'Left anatomical support hand':'Right anatomical grip hand';
 // Smooth tapered forearm and cuff; five curved, proportioned digits.
 cylinder(g,m.cloth,.039,.062,.52,[0,0,.35]);cylinder(g,m.leather,.041,.042,.022,[0,0,.091]);
 cylinder(g,m.skin,.032,.04,.11,[0,0,.040]);ball(g,m.skin,[0,-.002,-.047],[.043,.025,.065]);ball(g,m.skin,[side*.026,-.006,-.049],[.023,.024,.040]);
 for(let i=0;i<4;i++){let x=(i-1.5)*.021,len=[.061,.070,.065,.052][i];tube(g,m.skin,[[x,0,-.083],[x,-.01,-.103],[x,-.037,-.105],[x,-.049,-.081]],i===3?.008:.0095,10);ball(g,m.skin,[x,-.005,-.087],[.010,.010,.010]);ball(g,m.nail,[x,-.052,-.081],[.006,.002,.009]);}
 tube(g,m.skin,[[side*.031,-.008,-.032],[side*.050,-.021,-.055],[side*.047,-.044,-.080],[side*.024,-.052,-.089]],.012,10);ball(g,m.nail,[side*.024,-.055,-.088],[.008,.002,.009]);
 // Dorsal tendons give the hand structure without oversized knuckle spheres.
 for(let i=0;i<3;i++)tube(g,m.skin,[[(i-1)*.017,.020,-.065],[(i-1)*.014,.022,-.028],[(i-1)*.010,.017,.024]],.0018,5);
 batch(g);g.userData.referenceHands=true;return g;}
function gun(api,kind){const imported=window.NAANImported?.gun(api,kind);if(imported)return imported;T=api.__three;let m=materials(),q=new T.Group();q.name='v82 '+kind;q.userData.__v74ModelOverhaul=1;
 const screw=(p,at)=>{cylinder(p,m.silver,.004,.004,.003,at,[0,0,Math.PI/2]);};
 const barrel=(parent,r,len,y,z,mat=m.blue)=>{cylinder(parent,mat,r,r*1.045,len,[0,y,z],[Math.PI/2,0,0],true);cylinder(parent,m.black,r*.76,r*.76,.026,[0,y,z-len/2+.013],[Math.PI/2,0,0],true);add(parent,new T.TorusGeometry(r*.89,r*.105,8,28),m.silver,[0,y,z-len/2]);};
 const grip=(parent,p,tilt=0)=>{rounded(parent,m.blue,.054,.159,.072,p,[tilt,0,0],.018);for(let s of [-1,1])rounded(parent,m.wood,.012,.142,.062,[p[0]+s*.029,p[1],p[2]],[tilt,0,0],.009);};
 const guard=(parent,y,z)=>{let pts=[];for(let j=0;j<=38;j++){let a=j/38*TAU;pts.push([0,y+Math.cos(a)*.035,z+Math.sin(a)*.049]);}tube(parent,m.blue,pts,.0045);tube(parent,m.blue,[[0,y+.027,z],[0,y+.002,z+.009],[0,y-.008,z+.018]],.005);};
 if(kind==='revolver'){
 rounded(q,m.blue,.061,.094,.175,[0,.022,-.020],[0,0,0],.009);barrel(q,.021,.31,.057,-.26);
 rounded(q,m.blue,.018,.012,.30,[0,.079,-.26],[0,0,0],.003);rounded(q,m.blue,.026,.026,.13,[0,.027,-.259],[0,0,0],.004);
 // Open frame exposes the cylinder; no solid box hiding its animation.
 const cp=new T.Group();cp.position.set(-.038,.026,-.092);q.add(cp);const cyl=new T.Group();cyl.position.x=.038;cp.add(cyl);cylinder(cyl,m.steel,.047,.047,.09,[0,0,0]);
 for(let k=0;k<6;k++){let a=k*TAU/6,x=Math.cos(a)*.032,y=Math.sin(a)*.032;cylinder(cyl,m.black,.009,.009,.003,[x,y,-.046]);cylinder(cyl,m.brass,.008,.008,.004,[x,y,.047]);cylinder(cyl,m.silver,.003,.003,.005,[x,y,.050]);}
 batch(cyl);rounded(q,m.blue,.015,.040,.025,[0,.084,.045],[.25,0,0],.003);grip(q,[0,-.105,.073],-.25);guard(q,-.050,-.004);
 for(let p of [[.032,.036,.018],[.032,-.01,.04],[.036,-.105,.073]])screw(q,p);
 rounded(q,m.blue,.011,.018,.025,[0,.086,-.383],[0,0,0],.002);rounded(q,m.blue,.045,.011,.018,[0,.075,.036],[0,0,0],.002);
 q.userData.v72Parts={cylinder:cyl,cylPivot:cp,external:true};
 }else if(kind==='shotgun'){
 rounded(q,m.blue,.084,.11,.27,[0,.015,-.037],[0,0,0],.016);barrel(q,.022,.73,.05,-.475);barrel(q,.017,.56,-.013,-.402);
 // Separate polished bolt inside the receiver's right ejection port.
 rounded(q,m.black,.004,.047,.115,[.043,.026,-.066],[0,0,0],.008);const bolt=rounded(q,m.silver,.004,.035,.080,[.046,.026,-.079],[0,0,0],.005);
 const pump=new T.Group();pump.position.set(0,-.018,-.43);q.add(pump);rounded(pump,m.wood,.081,.076,.20,[0,0,0],[0,0,0],.022);for(let i=0;i<9;i++){let pts=[];for(let j=0;j<=24;j++){let a=j/24*TAU;pts.push([Math.sin(a)*.041,Math.cos(a)*.039,-.08+i*.02]);}tube(pump,m.black,pts,.0017);}batch(pump);
 // Tapered wooden stock built from an oval ring profile.
 add(q,surface(14,28,(u,v)=>{let a=u*TAU,rx=.029+v*.025,ry=.039+v*.057;return[Math.sin(a)*rx,-.015-v*.05+Math.cos(a)*ry,.07+v*.34,u,v];}),m.wood);
 rounded(q,m.black,.109,.184,.022,[0,-.065,.418],[0,0,0],.015);guard(q,-.069,.055);
 ball(q,m.brass,[0,.077,-.81],[.004,.004,.004]);rounded(q,m.blue,.009,.009,.57,[0,.074,-.40],[0,0,0],.002);
 const shell=new T.Group();cylinder(shell,m.red,.011,.011,.057,[0,0,0]);cylinder(shell,m.brass,.012,.012,.012,[0,0,.033]);batch(shell);shell.visible=false;q.add(shell);
 q.userData.v72Parts={pump,bolt,reloadShell:shell,pumpBaseZ:-.43,boltBaseZ:-.079,external:true};bolt.userData.dynamic=true;
 }else{
 rounded(q,m.blue,.063,.077,.15,[0,.016,.015],[0,0,0],.014);barrel(q,.038,.22,.045,-.15,m.red);cylinder(q,m.blue,.041,.041,.024,[0,.045,-.040]);grip(q,[0,-.096,.063],-.20);guard(q,-.041,-.012);cylinder(q,m.silver,.012,.012,.078,[0,-.004,-.07],[0,0,Math.PI/2]);rounded(q,m.blue,.014,.025,.025,[0,.075,.072],[.2,0,0],.003);rounded(q,m.blue,.009,.015,.025,[0,.085,-.229],[0,0,0],.002);
 }
 batch(q);return q;
}
function bind(api){const g=api.granny;if(g.__v82Bound)return;g.__v82Bound=true;const animate=g.animate;g.animate=function(dt,p){animate.call(this,dt,p);if(this.headLight)this.headLight.intensity=0;this.hunch=.035;this.rig.body.rotation.x=(this.state==='stunned'?this.fallT*1.15:.035)+Math.sin(this.gait*2)*.009;this.rig.pose?.(this,dt);};}

// First-person torch arm: the uploaded hand_holding_torch.glb replaces the left hand, sleeve and the cylinder torch.
// Returns true once installed. Returns false while the model is still loading or unavailable (the built-in hand stays in that case).
function torchHand(api,p){
 if(p.__naanTorchHand)return true;if(!p.leftArm)return false;
 const g=window.NAANImported?.torchHand?.(api);if(!g)return false;
 const pivot=p.leftArm;for(const child of [...pivot.children]){if(child===p.flLens)continue;pivot.remove(child);child.traverse(o=>{o.geometry?.dispose?.()});}
 pivot.add(g);
 // the lens glow now sits on the real torch face and points along the real torch axis
 const L=p.flLens,lens=g.userData.lens;
 if(L&&lens){L.position.copy(lens.position).add(g.position);L.quaternion.setFromUnitVectors(new api.__three.Vector3(0,0,1),lens.axis);L.scale.setScalar(lens.radius/.028);L.material.color.set(0x14181b);}
 p.__naanTorchHand=g;return true;
}
function unarmed(api){T=api.__three;const p=api.player;if(!p?.leftArm)return;if(p.__v82Hands){if(!p.__naanTorchHand)torchHand(api,p);return;}p.__v82Hands=true;const m=materials();
 for(const [pivot,side] of [[p.leftArm,-1],[p.rightArm,1]]){if(side<0&&torchHand(api,p))continue;for(const child of [...pivot.children]){if(child===p.flLens)continue;pivot.remove(child);child.geometry?.dispose();}const h=hand(api,side);h.position.set(side<0?.020:-.020,0,0);pivot.add(h);
 if(side<0){cylinder(pivot,m.blue,.023,.024,.17,[.020,.018,-.082]);cylinder(pivot,m.blue,.033,.024,.05,[.020,.018,-.18]);for(let i=0;i<5;i++)cylinder(pivot,m.black,.024,.024,.003,[.020,.018,-.06-i*.019]);p.flLens.position.set(.020,.018,-.206);}}
}
window.NAANVisuals={nun,hand,gun,bind,unarmed,version:'8.6.1',batch};
})();
