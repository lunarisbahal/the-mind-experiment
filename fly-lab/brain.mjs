// Original rate-reservoir experiment. Anatomy is measured; physiology and I/O are modeled.
export function random(seed=41){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function parseBinary(buffer){
 const v=new DataView(buffer);if(v.byteLength<8)throw Error('Truncated header');
 const n=v.getUint32(0,true),m=v.getUint32(4,true);
 if(n<1||n>200000||m>20000000||v.byteLength!==8+m*12+n*3)throw Error('Invalid connectome format');
 const pre=new Uint32Array(m),post=new Uint32Array(m),weight=new Float32Array(m);
 for(let e=0;e<m;e++){const p=8+12*e;pre[e]=v.getUint32(p,true);post[e]=v.getUint32(p+4,true);weight[e]=v.getFloat32(p+8,true);}
 return {n,pre,post,weight};
}
export function fromJSON(d){return {n:d.neurons.length,pre:Uint32Array.from(d.edges,e=>e[0]),post:Uint32Array.from(d.edges,e=>e[1]),weight:Float32Array.from(d.edges,e=>e[2])};}
export class Brain {
 constructor(g,seed=41,mode='flywire'){
  this.n=g.n;this.m=g.pre.length;this.mode=mode;this.rng=random(seed);this.pre=g.pre;this.post=g.post.slice();this.w=g.weight.slice();
  if(mode==='shuffled')for(let i=this.m-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.post[i],this.post[j]]=[this.post[j],this.post[i]];}
  const norm=new Float32Array(this.n);
  for(let e=0;e<this.m;e++){if(this.pre[e]>=this.n||this.post[e]>=this.n||!Number.isFinite(this.w[e]))throw Error('Invalid edge');norm[this.post[e]]+=Math.abs(this.w[e]);}
  for(let e=0;e<this.m;e++)this.w[e]/=Math.max(1,norm[this.post[e]]);
  this.x=new Float32Array(this.n);this.y=new Float32Array(this.n);this.input=new Float32Array(this.n);
  // Deterministically selected artificial inputs, deliberately not claimed to be sensory anatomy.
  const ids=Array.from({length:this.n},(_,i)=>i),r=random(seed+7);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  this.inputs=ids.slice(0,Math.min(4096,Math.floor(this.n/2)));
  this.outputs=ids.slice(-Math.min(128,Math.floor(this.n/2)));
  this.policy=Array.from({length:6},()=>Float32Array.from({length:this.outputs.length+1},()=> (r()-.5)*.05));
  this.steps=0;this.baseline=0;this.last=null;
 }
 features(obs){
  this.input.fill(0);for(let k=0;k<this.inputs.length;k++)this.input[this.inputs[k]]=.7*(Number(obs[k%obs.length])||0);
  for(let t=0;t<12;t++){
   this.y.set(this.input);
   for(let e=0;e<this.m;e++)this.y[this.post[e]]+=.85*this.w[e]*this.x[this.pre[e]];
   for(let i=0;i<this.n;i++)this.y[i]=.3*this.x[i]+.7*Math.tanh(this.y[i]);
   [this.x,this.y]=[this.y,this.x];
  }
  return [1,...this.outputs.map(i=>this.x[i])];
 }
 step(obs,reward=0,learn=true){
  if(learn&&this.last){const adv=Math.max(-2,Math.min(2,reward-this.baseline));this.baseline=.98*this.baseline+.02*reward;
   for(let a=0;a<6;a++)for(let j=0;j<this.last.f.length;j++)this.policy[a][j]+=.015*adv*((a===this.last.a?1:0)-this.last.p[a])*this.last.f[j];}
  const f=this.features(obs),z=this.policy.map(w=>w.reduce((s,v,j)=>s+v*f[j],0)),mx=Math.max(...z),p=z.map(v=>Math.exp(v-mx)),total=p.reduce((a,b)=>a+b,0);for(let i=0;i<6;i++)p[i]/=total;
  let u=this.rng(),a=5;for(let i=0;i<6;i++){u-=p[i];if(u<=0){a=i;break;}}
  if(this.mode==='random')a=Math.floor(this.rng()*6);
  this.last={f,p,a};this.steps++;
  return {action:a,probabilities:p,activity:f.slice(1),steps:this.steps,neurons:this.n,edges:this.m};
 }
}
