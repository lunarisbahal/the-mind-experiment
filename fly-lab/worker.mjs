import {Brain,parseBinary,fromJSON} from './brain.mjs';
let brain;
onmessage=async({data:d})=>{try{
 if(d.type==='init'){
  let g;
  if(d.buffer){const raw=await new Response(new Blob([d.buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();g=parseBinary(raw);if(g.n!==139255)throw Error("Expected 139255 neurons in full source");}
  else {const r=await fetch('./circuit.json');if(!r.ok)throw Error('Circuit download failed');g=fromJSON(await r.json());}
  brain=new Brain(g,d.seed,d.mode);postMessage({type:'ready',neurons:brain.n,edges:brain.m});
 }else if(d.type==='step'){if(!brain)throw Error('Brain not initialized');postMessage({type:'step',token:d.token,...brain.step(d.obs,d.reward,d.learn)});}
}catch(e){postMessage({type:'error',message:e.message});}};
