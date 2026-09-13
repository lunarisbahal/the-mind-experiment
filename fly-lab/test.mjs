import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Brain,fromJSON,parseBinary} from './brain.mjs';
const g=fromJSON(JSON.parse(readFileSync(new URL('./circuit.json',import.meta.url))));
assert.equal(g.n,668);assert.equal(g.pre.length,18968);
const a=new Brain(g),b=new Brain(g),input=Array.from({length:68},(_,i)=>i/68);
for(let i=0;i<20;i++){const x=a.step(input,i%3===0?1:0),y=b.step(input,i%3===0?1:0);assert.deepEqual(x,y);assert(x.activity.every(Number.isFinite));assert(Math.abs(x.probabilities.reduce((s,v)=>s+v,0)-1)<1e-6);}
const changed=new Brain(g);const zero=new Brain({...g,weight:new Float32Array(g.weight.length)});
assert.notDeepEqual(changed.features(input),zero.features(input),'Measured edges must influence readout');
const shuffled=new Brain(g,41,'shuffled');assert.notDeepEqual(shuffled.post,g.post);assert.deepEqual([...shuffled.post].sort((a,b)=>a-b),[...g.post].sort((a,b)=>a-b));
const before=Array.from(a.policy[0]);a.step(input,2);assert.notDeepEqual(Array.from(a.policy[0]),before,'Learning must update policy');
assert.throws(()=>parseBinary(new ArrayBuffer(8)));
const buf=new ArrayBuffer(26),dv=new DataView(buf);dv.setUint32(0,2,true);dv.setUint32(4,1,true);dv.setUint32(8,0,true);dv.setUint32(12,1,true);dv.setFloat32(16,-3,true);
const bin=parseBinary(buf);assert.equal(bin.n,2);assert.equal(bin.weight[0],-3);assert.equal(bin.post[0],1);
assert.throws(()=>new Brain({...g,post:Uint32Array.from(g.post,()=>999999)}));
console.log('PASS: real-data load, determinism, finite dynamics, connectivity contribution, shuffled control, learning, binary validation.');
