// Executed inside the laboratory copy only. Observes public HUD and minimap.
(()=>{
 const held=new Set();let timer;
 const panels=['mirrorModal','cipherModal','riteModal','docModal','dlg','aelius'];
 const event=(type,key)=>window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));
 const release=()=>{clearTimeout(timer);for(const k of held)event('keyup',k);held.clear();};
 const visible=id=>{const e=document.getElementById(id);return e&&e.getClientRects().length?e:null;};
 const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;const ctx=canvas.getContext('2d',{willReadFrequently:true});
 window.FlyGame={
  release,
  describe(){
   const panel=panels.find(visible),root=panel&&visible(panel);
   const buttonNodes=root?Array.from(root.querySelectorAll('button,[role="button"]')).filter(e=>e.getClientRects().length&&!e.disabled):[];
   if(panel==='dlg'){const b=document.getElementById('dlgNext');if(b)buttonNodes.push(b);}
   if(panel==='aelius')buttonNodes.push(root);
   const buttons=buttonNodes.slice(0,24).map((e,id)=>({id,label:(e.innerText||e.textContent||'Devam').trim().slice(0,200)}));
   const input=root?.querySelector('textarea:not([disabled]),input:not([disabled]):not([type="hidden"]):not([type="password"])');
   const field=input&&input.getClientRects().length?{maxLength:input.maxLength>0?input.maxLength:500,value:input.value}:null;
   const text=root?root.innerText.slice(0,4500):['prompt','ctrlhelp'].map(id=>visible(id)?.innerText||'').join(' ').slice(0,1000);
   const key=JSON.stringify({panel:panel||null,text,buttons,field:field?field.maxLength:null});
   return {panel:panel||null,text,buttons,field,key,busy:!!window.Mirror?.busy};
  },
  choose(key,decision){
   const now=this.describe();if(!window.Game?.running||now.key!==key||now.busy)return false;
   const root=now.panel&&visible(now.panel);if(!root)return false;
   if(decision.kind==='write'){
    const field=root.querySelector('textarea:not([disabled]),input:not([disabled]):not([type="hidden"]):not([type="password"])');
    if(!field||!field.getClientRects().length)return false;
    field.value=String(decision.text).slice(0,field.maxLength>0?field.maxLength:500);field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
   }
   const buttons=Array.from(root.querySelectorAll('button,[role="button"]')).filter(e=>e.getClientRects().length&&!e.disabled);
   if(now.panel==='dlg')buttons.push(document.getElementById('dlgNext'));
   if(now.panel==='aelius')buttons.push(root);
   const target=buttons[decision.button];if(!target)return false;
   release();if(now.panel==='dlg'){document.activeElement?.blur();event('keydown','e');event('keyup','e');}else target.click();return true;
  },
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
   if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))document.activeElement.blur();
   const k=['w','a','s','d','e',null][a];if(k){held.add(k);event('keydown',k);timer=setTimeout(release,500);}return true;
  }
 };
 window.addEventListener('blur',release);window.addEventListener('pagehide',release);
})();
// Use the common relay transport from the lab; unrelated remote services stay blocked.
if(window.Mirror&&typeof parent!=='undefined'&&parent.LabRelay){
 const originalGenerate=Mirror.generate.bind(Mirror);
 Mirror.generate=async function(messages,maxTokens){
  window.FlyGame.aiError=null;
  try{return this.cfg?.kind==='relay'?await parent.LabRelay.generate(messages,maxTokens):await originalGenerate(messages,maxTokens);}
  catch(e){window.FlyGame.aiError=e.message;throw e;}
 };
 const originalSend=Mirror.send.bind(Mirror);
 Mirror.send=async function(){
  const historyLength=this.hist[this.cur]?.length||0;
  await originalSend();
  if(window.FlyGame.aiError){
   // Do not treat the game's scripted outage text as an actual AI response.
   const log=document.getElementById('mirrorLog'),lines=log?.querySelectorAll('.mline.them');
   if(lines?.length)lines[lines.length-1].textContent='AI yanıtı alınamadı: '+window.FlyGame.aiError;
   if(this.hist[this.cur]?.length>historyLength)this.hist[this.cur].splice(historyLength);
  }
 };
}
