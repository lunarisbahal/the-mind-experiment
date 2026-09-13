const $=id=>document.getElementById(id),frame=$('game');
const FULL='https://raw.githubusercontent.com/snedea/flybrain/9191824d17871b7851645782d53d23f213ddb938/data/connectome.bin.gz';
let worker,ready=false,active=false,pending=false,run=0,records=[],seen=new Set(),previous=null,stepTimer,lastObservation,identity={};
const status=t=>$('status').textContent=t;
function stop(){active=false;run++;clearTimeout(stepTimer);frame.contentWindow?.FlyGame?.release();previous=null;if(ready)worker?.postMessage({type:'forget-transition'});$('start').disabled=!ready;$('stop').disabled=true;}
function log(t){$('log').textContent=(t+'\n'+$('log').textContent).slice(0,2500);}
// All game storage is scoped to this iframe's lifetime; no existing player save is read.
// Disable social/API traffic in the lab, while permitting same-origin static assets.
const isolation=`(()=>{function memory(){const m=new Map();return new Proxy({getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]??null,get length(){return m.size;}},{get:(t,p)=>p in t?t[p]:m.get(String(p)),set:(t,p,v)=>{m.set(String(p),String(v));return true;}});}for(const k of ['localStorage','sessionStorage'])Object.defineProperty(window,k,{value:memory()});const original=window.fetch.bind(window);window.fetch=(u,o)=>{const url=new URL(typeof u==='string'?u:u.url,document.baseURI);if(url.origin!==new URL(document.baseURI).origin||!['GET','HEAD'].includes((o?.method||'GET').toUpperCase()))return Promise.reject(new Error('Laboratory: remote services disabled'));return original(u,o);};window.WebSocket=class{constructor(){throw Error('Laboratory: multiplayer disabled');}};window.EventSource=class{constructor(){throw Error('Laboratory: remote services disabled');}};window.XMLHttpRequest=class{open(){throw Error('Laboratory: remote services disabled');}};Object.defineProperty(navigator,'sendBeacon',{value:()=>false});window.open=()=>null;})();`;
async function loadGame(){
 const [a,b]=await Promise.all([fetch('../index.html'),fetch('./bridge.js')]);if(!a.ok||!b.ok)throw Error('Oyun dosyası yüklenemedi');
 const [source,bridge]=await Promise.all([a.text(),b.text()]);
 const base=new URL('../',location.href).href;
 frame.srcdoc=source.replace('<head>','<head><base href="'+base+'"><script>'+isolation+'<\/script>')+'<script>'+bridge+'<\/script>';
 status('Oyunun girişini tamamla ve ağı yükle.');
}
function cycle(token){
 if(!active||token!==run)return;
 if(pending){stepTimer=setTimeout(()=>cycle(token),100);return;}
 const g=frame.contentWindow.FlyGame;if(!g){stop();status('Oyun bağlantısı hazır değil.');return;}
 const o=g.observe();if(!o.ready){stop();status('Önce oyunun girişini tamamla.');return;}
 if(o.needsText){stop();status('Metin / şifre gerekiyor. Elle devam edip ajanı yeniden başlatabilirsin.');log(o.text);return;}
 const cell=[o.interior,Math.floor(o.x/5),Math.floor(o.z/5)].join(':');
 let reward=previous?(seen.has(cell)?-.01:1):0;seen.add(cell);
 if(previous&&Math.hypot(o.x-previous.x,o.z-previous.z)<.03&&!o.modal)reward-=.02;
 previous=o;lastObservation={x:o.x,z:o.z,interior:o.interior,modal:o.modal,reward};pending=true;
 worker.postMessage({type:'step',obs:o.features,reward,learn:identity.mode!=='random',token});
}
$('load').onclick=async()=>{
 stop();worker?.terminate();worker=null;ready=false;pending=false;$('load').disabled=true;$('start').disabled=true;
 records=[];seen=new Set();previous=null;$('export').disabled=true;
 $('scope').textContent='Ağ yüklenmedi';$('stats').textContent='Henüz adım yok.';
 $('activity').getContext('2d').clearRect(0,0,$('activity').width,$('activity').height);
 try{
  const network=$('network').value,mode=$('mode').value;identity={network,mode,seed:41,startedAt:new Date().toISOString(),source:network==='full'?FULL:'DesktopFly circuit 10a7d0726571881e77e93e33bd7a23d900025e49'};
  let buffer;if(network==='full'){status('139.255 nöronluk veri indiriliyor…');const r=await fetch(FULL,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Tam veri indirilemedi: '+r.status);buffer=await r.arrayBuffer();}
  status('Ağ hazırlanıyor…');worker=new Worker('./worker.mjs',{type:'module'});
  worker.onerror=e=>{stop();worker?.terminate();worker=null;ready=false;$('start').disabled=true;$('load').disabled=false;status('Model hatası: '+e.message);};
  worker.onmessage=({data:d})=>{
   if(d.type==='error'){stop();worker?.terminate();worker=null;ready=false;$('start').disabled=true;$('load').disabled=false;status('Hata: '+d.message);return;}
   if(d.type==='ready'){ready=true;identity={...identity,neurons:d.neurons,edges:d.edges};$('scope').textContent=d.neurons.toLocaleString('tr')+' nöron · '+d.edges.toLocaleString('tr')+' bağlantı';$('start').disabled=false;$('load').disabled=false;status('Ağ hazır. Girişi tamamladıysan başlat.');return;}
   if(d.type==='step'){
    pending=false;if(!active||d.token!==run)return;
    const current=frame.contentWindow.FlyGame.observe();
    if(!current.ready||current.needsText){stop();status(current.needsText?'Metin / şifre gerekiyor. Elle devam edip ajanı yeniden başlatabilirsin.':'Oyun durakladı.');return;}
    frame.contentWindow.FlyGame.act(d.action);
    records.push({...lastObservation,step:d.steps,action:d.action,probabilities:d.probabilities,activity:d.activity});
    $('export').disabled=false;$('stats').textContent='Adım: '+d.steps+' · Keşfedilen hücre: '+seen.size+'\nEylem: '+['ileri','sol','geri','sağ','etkileşim','bekle / kapat'][d.action];
    const c=$('activity'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#8ce4c3';d.activity.forEach((v,i)=>ctx.fillRect(i*c.width/d.activity.length,50-Math.max(0,v)*45,Math.max(1,c.width/d.activity.length-1),Math.max(1,Math.abs(v)*45)));
    if(records.length>=5000){stop();status('5.000 adımlık oturum tamamlandı. Kaydı indirebilirsin.');return;}
    stepTimer=setTimeout(()=>cycle(run),400);
   }
  };
  worker.postMessage({type:'init',seed:41,mode,buffer},buffer?[buffer]:[]);
 }catch(e){worker?.terminate();worker=null;ready=false;status(e.message+' — alt devreyi seçerek tekrar deneyebilirsin.');$('load').disabled=false;$('start').disabled=true;}
};
$('start').onclick=()=>{if(!worker||!ready||active)return;active=true;run++;$('start').disabled=true;$('stop').disabled=false;status('Keşfediyor · karar katmanı öğreniyor');cycle(run);};
$('stop').onclick=()=>{stop();status('Duraklatıldı.');};
$('export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify({experiment:'do-loon-ai-flywire-v0.2',...identity,records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='flywire-deney-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();status('Sekme gizlendi; deney duraklatıldı.');}});
loadGame().catch(e=>status(e.message));
