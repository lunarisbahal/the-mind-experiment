import {Brain,parseBinary,fromJSON} from './brain.mjs?v=0.5.0';
let brain;
onmessage=async({data:d})=>{try{
 if(d.type==='init'){
  let g;
  if(d.buffer){const raw=await new Response(new Blob([d.buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();g=parseBinary(raw);if(g.n!==139255)throw Error("Expected 139255 neurons in full source");}
  else {const r=await fetch('./circuit.json');if(!r.ok)throw Error('Circuit download failed');g=fromJSON(await r.json());}
  brain=new Brain(g,d.seed,d.mode);postMessage({type:'ready',requestId:d.requestId,neurons:brain.n,edges:brain.m});
 }else if(d.type==='teach'){postMessage({type:'taught',requestId:d.requestId,token:d.token,...brain.teach(d.obs,d.action),checkpoint:brain.checkpoint()});
 }else if(d.type==='feedback'){brain.feedback(d.id,d.value);postMessage({type:'saved',requestId:d.requestId,checkpoint:brain.checkpoint()});
 }else if(d.type==='restore'){brain.restore(d.checkpoint);postMessage({type:'restored',requestId:d.requestId,checkpoint:brain.checkpoint()});
 }else if(d.type==='snapshot'){postMessage({type:'saved',requestId:d.requestId,checkpoint:brain.checkpoint()});
 }else if(d.type==='forget-transition'){if(brain)brain.last=null;
 }else if(d.type==='step'){if(!brain)throw Error('Brain not initialized');postMessage({type:'step',requestId:d.requestId,token:d.token,...brain.step(d.obs,d.reward,d.learn),checkpoint:brain.checkpoint()});}
}catch(e){postMessage({type:['restore','feedback','teach'].includes(d.type)?'request-error':'error',requestId:d.requestId,message:e.message});}};
