const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(__dirname+'/../index.html','utf8');const start=s.indexOf('syncTorchLens(){');const end=s.indexOf('shake(e=.06',start);
assert.ok(start>0 && end>start);
const method=s.slice(start,end);
class V {constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){Object.assign(this,{x,y,z});return this}copy(v){return this.set(v.x,v.y,v.z)}}
const C=vm.runInNewContext('(class PlayerShim {'+method+'})',{L:V,Number});const p=new C;
p.__naanTorchHand={};p.flLens={isObject3D:true,getWorldPosition(out){out.set(.45,-.31,-1.3)}};
p.camera={worldToLocal(v){return v.set(v.x-.1,v.y+.01,v.z+.2)}};
p.torch={position:new V()};p.torchTarget={position:new V()};p.beam={position:new V()};p.beamLenVisual=5.5;p.beamLen=9;
p.syncTorchLens();assert.equal(p.torch.position.x,.35);assert.equal(p.torch.position.z,-1.1);
assert.equal(p.torchTarget.position.z,-4.1);assert.equal(p.beam.position.z,-3.85);
// Unavailable lens must not alter torch or throw.
p.flLens=null;p.syncTorchLens();assert.equal(p.torch.position.x,.35);
console.log('PASS flashlight lens-to-camera conversion, beam origin and safe fallback');
