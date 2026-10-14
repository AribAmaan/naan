const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
class Vec {constructor(){this.x=0;this.y=0;this.z=0;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;} setScalar(n){return this.set(n,n,n)}}
class Node {constructor(){this.children=[];this.parent=null;this.position=new Vec;this.rotation=new Vec;this.scale=new Vec;this.userData={};this.visible=true;this.layers={set(n){this.value=n}};this.name='';}add(...children){for(const c of children){c.parent?.remove(c);c.parent=this;this.children.push(c)}return this;}remove(c){this.children=this.children.filter(x=>x!==c);if(c.parent===this)c.parent=null;return this;}traverse(fn){fn(this);this.children.forEach(x=>x.traverse(fn));}updateWorldMatrix(){}getObjectByName(n){return this.children.find(x=>x.name===n);}}
class Mesh extends Node {constructor(g,m){super();this.isMesh=true;this.geometry=g;this.material=m}}
class Material {constructor(opts){Object.assign(this,opts);this.userData={};this.dithering=false;this.needsUpdate=false;this.metalness=opts?.metalness??0;this.envMap=null;this.envMapIntensity=0;}dispose(){this.disposeCalled=true}}
class Geo {dispose(){this.disposed=true}}
const T={Group:Node,Mesh,CylinderGeometry:Geo,MeshStandardMaterial:Material};
const root=new Node,old=new Node;old.name='Old shotgun';old.add(new Mesh(new Geo,new Material({metalness:0})));root.add(old);const left=new Node,right=new Node;old.add(left,right);
const game={G:{v72:{vm:{shotgun:old},vmHands:{l:left,r:right}}},player:{v72GunRoot:root},__three:T};
const api={G:game.G,player:game.player,settings:{quality:'high'},renderer:{capabilities:{getMaxAnisotropy:()=>8}},scene:{},camera:{}};
const importer={state:{models:{shotgunhand:1},files:{shotgunhand:'shotgun_hand_full'}},clone(){let a=new Node;a.add(new Mesh(new Geo,new Material({metalness:0,map:{isTexture:true,anisotropy:1,needsUpdate:false}})));return a}};
const ctxt={window:{NAANImported:importer,__NAAN__:game},console};
const src=fs.readFileSync(__dirname+'/../assets/js/imported-models.js','utf8').split('/* Adapt the user\'s static meshes')[1];
vm.runInNewContext('/* Adapt the user\'s static meshes'+src,ctxt);
assert.equal(importer.installCombinedShotgun(api),true);const installed=api.G.v72.vm.shotgun;
assert.equal(installed.userData.combinedShotgun,true);assert.equal(installed.userData.modelFile,'shotgun_hand_full');
assert.equal(left.parent,root);assert.equal(right.parent,root);assert.equal(old.parent,null);
assert.equal(installed.children.some(c=>c.name==='Textured connected hands and pump shotgun'),true);
assert.equal(importer.installCombinedShotgun(api),true);assert.equal(api.G.v72.vm.shotgun,installed);assert.equal(root.children.filter(c=>c.userData.combinedShotgun).length,1);
// Swap during a reload pose: must reset, not carry over old reload transforms.
installed.position.set(1,2,3);installed.rotation.set(.3,.4,.5);
importer.state.files.shotgunhand='shotgun_hand_lite';assert.equal(importer.installCombinedShotgun(api),true);
const replaced=api.G.v72.vm.shotgun;assert.notEqual(replaced,installed);assert.equal(replaced.position.x,0);assert.equal(replaced.rotation.z,0);
assert.equal(root.children.filter(c=>c.userData.combinedShotgun).length,1);
const m=replaced.children[0].children[0].material; // shared GPU material in clone
api.player.viewLightRig=new Node;
// Calling the installation step repeatedly must not duplicate the gun.
assert.equal(importer.installCombinedShotgun(api),true);
console.log('PASS install/replace/grip hand preservation/duplicate prevention/pose reset');
