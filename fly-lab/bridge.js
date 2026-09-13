// Executed inside the laboratory copy only. Observes public HUD and minimap.
(()=>{
 const held=new Set();let timer;
 const event=(type,key)=>window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));
 const release=()=>{clearTimeout(timer);for(const k of held)event('keyup',k);held.clear();};
 const visible=id=>{const e=document.getElementById(id);return e&&e.getClientRects().length?e:null;};
 const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;const ctx=canvas.getContext('2d',{willReadFrequently:true});
 window.FlyGame={
  release,
  checkpoint(){
   if(!window.Game?.running)return null;
   // Preserve the native save schema. Interior sessions resume at their outdoor entry.
   return {format:'flywire-game-v1',state:JSON.parse(JSON.stringify(window.S)),savedAt:new Date().toISOString(),interior:!!window.W3?.inInterior};
  },
  closeMirror(){const modal=visible('mirrorModal');if(!modal)return false;const button=modal.querySelector('button[onclick="Mirror.close()"]');if(!button)return false;release();button.click();return true;},
  resume(){if(window.Game&&!window.Game.running)window.Game.start(true);},
  observe(){
   const s=window.S||{},w=window.W3||{},p=w.inInterior&&w.IP?w.IP:s;
   const minimap=document.getElementById('minimap'),pixels=new Array(64).fill(0);
   try{if(minimap){ctx.drawImage(minimap,0,0,8,8);const d=ctx.getImageData(0,0,8,8).data;for(let i=0;i<64;i++)pixels[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/765;}}catch{}
   const modals=['docModal','riteModal','cipherModal','mirrorModal','dlg'].filter(visible);
   const ready=!!window.Game?.running;
   return {ready,mirror:!!visible('mirrorModal'),modal:!!window.Game?.modal,needsText:!!(visible('riteModal')||visible('cipherModal')||visible('mirrorModal')),x:p.px||0,z:p.pz||0,interior:!!w.inInterior,
    features:[...pixels,Math.tanh((p.px||0)/200),Math.tanh((p.pz||0)/200),+!!w.inInterior,+!!window.Game?.modal],
    text:modals.map(id=>visible(id).innerText).join('\n').slice(0,2000)};
  },
  act(a){release();if(!window.Game?.running)return false;
   const o=this.observe();if(o.needsText)return false;
   if(o.modal){if(a===4)event('keydown','e');else if(a===5)event('keydown','Escape');return true;}
   const k=['w','a','s','d','e',null][a];if(k){held.add(k);event('keydown',k);timer=setTimeout(release,350);}return true;
  }
 };
 window.addEventListener('blur',release);window.addEventListener('pagehide',release);
})();
