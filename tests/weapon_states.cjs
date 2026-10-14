const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
function getFunction(name,next){const i=src.indexOf('function '+name+'(');assert.ok(i>=0,name); const end=src.indexOf('function '+next+'(',i+9);assert.ok(end>i);return src.slice(i,end)}
const funcs=getFunction('__v72WeaponVisible','__v72Reload')+'\n'+getFunction('__v72WeaponAnimUpdate','__v72TriggerHitReaction');
function node(){return {visible:false,position:{z:0,set(){}},rotation:{x:0,y:0,z:0,set(){}},userData:{},children:[]}}
const shot=node(),rev=node(),flare=node(),left=node(),right=node(),p=node(),b=node(),shell=node();
shot.userData={combinedShotgun:true,v72Parts:{pump:p,bolt:b,reloadShell:shell,pumpBaseZ:0,boltBaseZ:0,pumpStroke:0,external:true,rigid:true}};
const v={active:'shotgun',holstered:false,cinematic:false,endCine:null,vm:{shotgun:shot,revolver:rev,flare},vmHands:{l:left,r:right},pumpT:0,reloading:false,weaponKick:0};
const S={v72:v,player:{mode:'walk',fpRig:node()},state:'playing'};
const c={S,Math,window:{NAANImported:{animateWeapons(){}}},__v72UpdateHands(){},__v72ResetWeaponAnim(){},__v72EjectCasing(){},__V72_WEAPON_CFG:{shotgun:{reload:1.2}},__v72Ease:x=>x};
vm.createContext(c);vm.runInContext(funcs,c);
c.__v72WeaponVisible(); assert.equal(shot.visible,true);assert.equal(left.visible,false);assert.equal(right.visible,false);
v.active='revolver';c.__v72WeaponVisible(); assert.equal(rev.visible,true);assert.equal(shot.visible,false);assert.equal(left.visible,true);
v.active='shotgun';v.holstered=true;c.__v72WeaponVisible();assert.equal(shot.visible,false);v.holstered=false;
v.pumpT=.52;c.__v72WeaponAnimUpdate(.24);assert.ok(v.pumpT>0);assert.equal(v.vm.shotgun.userData.v72Parts.pump.position.z,0); // existing rigid proxy stays stationary
v.pumpT=.1;c.__v72WeaponAnimUpdate(.1);assert.equal(v.pumpT,0);assert.equal(p.position.z,0);
console.log('PASS shotgun visibility, weapon switch, holster, rigid pump-state lifetime');
