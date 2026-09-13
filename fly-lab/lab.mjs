import {createMonitor} from './visual.mjs';
const $=id=>document.getElementById(id),frame=$('game');
const FULL='https://raw.githubusercontent.com/snedea/flybrain/9191824d17871b7851645782d53d23f213ddb938/data/connectome.bin.gz';
let worker,ready=false,active=false,pending=false,run=0,records=[],seen=new Set(),previous=null,stepTimer,lastObservation,identity={},autoWaiting=false,checkpoint=null,restoring=false,lastAction=null;
const monitor=createMonitor($('brain-view'),$('fly-view'),$('traces'));
const status=t=>$('status').textContent=t;
function stop(){active=false;monitor.setRunning(false);run++;clearTimeout(stepTimer);frame.contentWindow?.FlyGame?.release();previous=null;if(ready)worker?.postMessage({type:'forget-transition'});$('start').disabled=!ready;$('stop').disabled=true;controls();saveGame();}
function log(t){$('log').textContent=(t+'\n'+$('log').textContent).slice(0,2500);}
const names=['ileri','sol','geri','sağ','etkileşim','bekle / kapat'];
const storageKey=()=>`flywire-policy-v1:${identity.network}:${identity.mode}:41`;
function controls(){
 $('exit-mirror').disabled=!frame.contentWindow?.FlyGame?.observe().mirror;
 const usable=ready&&!restoring&&!pending;
 $('start').disabled=!usable||active||$('teacher').checked;
 $('teacher').disabled=!ready||restoring;
 for(const b of document.querySelectorAll('[data-teach]'))b.disabled=!usable||!$('teacher').checked||identity.mode==='random';
 $('good').disabled=$('bad').disabled=!usable||!lastAction||lastAction.graded||identity.mode==='random';
 $('save-model').disabled=!checkpoint||restoring;
 $('import-model').disabled=!usable||active;
}
function saveGame(){
 try{const g=frame.contentWindow?.FlyGame?.checkpoint();if(g){localStorage.setItem('flywire-game-v1',JSON.stringify(g));$('game-save-status').textContent='Deney ilerlemesi kaydedildi'+(g.interior?' · yeniden açılış dış kapıdan.':'.');}}
 catch{$('game-save-status').textContent='Oyun ilerlemesi kaydedilemedi; tarayıcı depolamasını kontrol et.';}
}
function keep(c){
 checkpoint=c;$('learning').textContent=`Öğretim: ${c.teachCount} · Geri bildirim: ${c.feedbackCount}`;
 try{localStorage.setItem(storageKey(),JSON.stringify(c));$('save-status').textContent='Model bu tarayıcıda otomatik kaydedildi.';}
 catch{$('save-status').textContent='Tarayıcıya kaydedilemedi. Kaybetmemek için modeli indir.';}
 controls();saveGame();
}
function download(data,name){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('teacher').onchange=()=>{autoWaiting=false;stop();lastAction=null;$('feedback-target').textContent='Henüz değerlendirilecek ajan eylemi yok.';controls();status($('teacher').checked?'Öğretmen modu: hareket düğmeleriyle örnek göster.':'Öğretmen modu kapalı. Ajanı başlatabilirsin.');};
for(const b of document.querySelectorAll('[data-teach]'))b.onclick=()=>{
 if(!ready||pending||restoring||!$('teacher').checked)return;
 const g=frame.contentWindow.FlyGame,o=g?.observe();
 if(!o?.ready||o.needsText){status(o?.needsText?'Metin / şifre gerekiyor. Elle devam et.':'Önce oyunun girişini tamamla.');return;}
 const action=Number(b.dataset.teach);if(o.modal&&action<4){status('Açık iletişim kutusunda etkileşim veya kapat seç.');return;}stop();
 if(!g.act(action))return;
 pending=true;lastAction=null;controls();worker.postMessage({type:'teach',obs:o.features,action,token:run});
};
for(const [id,value] of [['good',1],['bad',-1]])$(id).onclick=()=>{
 if(!lastAction||lastAction.graded||pending||!ready)return;
 const target=lastAction;stop();target.graded=true;controls();
 worker.postMessage({type:'feedback',id:target.id,value});
 $('feedback-target').textContent=`Adım ${target.id} · ${names[target.action]}: ${value===1?'iyi':'kötü'} olarak işaretlendi.`;
 status('Geri bildirim verildi. Devam etmek için Başlat.');
};
$('save-model').onclick=()=>{if(checkpoint)download(checkpoint,'flywire-model-'+Date.now()+'.json');};
$('import-model').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;stop();restoring=true;controls();
 try{if(file.size>200000)throw Error('Model dosyası çok büyük');const c=JSON.parse(await file.text());lastAction=null;worker.postMessage({type:'restore',checkpoint:c});}
 catch(err){restoring=false;status(err.message);controls();}finally{e.target.value='';}
};
controls();
// All game storage is scoped to this iframe's lifetime; no existing player save is read.
// Disable social/API traffic in the lab, while permitting same-origin static assets.
const isolation=`(()=>{function memory(){const m=new Map();return new Proxy({getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]??null,get length(){return m.size;}},{get:(t,p)=>p in t?t[p]:m.get(String(p)),set:(t,p,v)=>{m.set(String(p),String(v));return true;}});}for(const k of ['localStorage','sessionStorage'])Object.defineProperty(window,k,{value:memory()});const original=window.fetch.bind(window);window.fetch=(u,o)=>{const url=new URL(typeof u==='string'?u:u.url,document.baseURI);if(url.origin!==new URL(document.baseURI).origin||!['GET','HEAD'].includes((o?.method||'GET').toUpperCase()))return Promise.reject(new Error('Laboratory: remote services disabled'));return original(u,o);};window.WebSocket=class{constructor(){throw Error('Laboratory: multiplayer disabled');}};window.EventSource=class{constructor(){throw Error('Laboratory: remote services disabled');}};window.XMLHttpRequest=class{open(){throw Error('Laboratory: remote services disabled');}};Object.defineProperty(navigator,'sendBeacon',{value:()=>false});window.open=()=>null;})();`;
async function loadGame(){
 const [a,b]=await Promise.all([fetch('../index.html'),fetch('./bridge.js')]);if(!a.ok||!b.ok)throw Error('Oyun dosyası yüklenemedi');
 const [source,bridge]=await Promise.all([a.text(),b.text()]);
 const base=new URL('../',location.href).href;
 let gameSeed='';let resumeGame=false;
 try{const g=JSON.parse(localStorage.getItem('flywire-game-v1'));if(g?.format==='flywire-game-v1'&&g.state&&typeof g.state==='object'){
 const escaped=JSON.stringify(JSON.stringify(g.state)).replaceAll('<','\\u003c');gameSeed='localStorage.setItem("it041_sw_v1",'+escaped+');';resumeGame=true;$('game-save-status').textContent='Kayıtlı deney ilerlemesi bulundu.';}}
 catch{$('game-save-status').textContent='Kayıtlı oyun ilerlemesi okunamadı.';}
 frame.onload=()=>{if(resumeGame&&$('auto-resume').checked)frame.contentWindow?.FlyGame?.resume();};
 frame.srcdoc=source.replace('<head>','<head><base href="'+base+'"><script>'+isolation+gameSeed+'<\/script>')+'<script>'+bridge+'<\/script>';
 status('Oyunun girişini tamamla ve ağı yükle.');
 try{const config=JSON.parse(localStorage.getItem('flywire-last-config'));if(config){$('auto-resume').checked=config.auto!==false;if(['full','subset'].includes(config.network)&&['flywire','shuffled','random'].includes(config.mode)){$('network').value=config.network;$('mode').value=config.mode;if($('auto-resume').checked){autoWaiting=true;$('load').click();}}}}catch{}

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
 previous=o;lastObservation={x:o.x,z:o.z,interior:o.interior,modal:o.modal,reward};pending=true;controls();
 worker.postMessage({type:'step',obs:o.features,reward,learn:identity.mode!=='random',token});
}
$('load').onclick=async()=>{
 stop();checkpoint=null;lastAction=null;restoring=false;$('teacher').checked=false;worker?.terminate();worker=null;ready=false;pending=false;controls();$('load').disabled=true;$('start').disabled=true;
 records=[];seen=new Set();previous=null;$('export').disabled=true;
 $('scope').textContent='Ağ yüklenmedi';$('stats').textContent='Henüz adım yok.';
 monitor.reset();$('activity').getContext('2d').clearRect(0,0,$('activity').width,$('activity').height);
 try{
  const network=$('network').value,mode=$('mode').value;try{localStorage.setItem('flywire-last-config',JSON.stringify({network,mode,auto:$('auto-resume').checked}));}catch{}identity={network,mode,seed:41,startedAt:new Date().toISOString(),source:network==='full'?FULL:'DesktopFly circuit 10a7d0726571881e77e93e33bd7a23d900025e49'};
  let buffer;if(network==='full'){status('139.255 nöronluk veri indiriliyor…');const r=await fetch(FULL,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Tam veri indirilemedi: '+r.status);buffer=await r.arrayBuffer();}
  status('Ağ hazırlanıyor…');worker=new Worker('./worker.mjs',{type:'module'});
  worker.onerror=e=>{stop();worker?.terminate();worker=null;ready=false;$('start').disabled=true;$('load').disabled=false;status('Model hatası: '+e.message);};
  worker.onmessage=({data:d})=>{
   if(d.type==='request-error'){pending=false;restoring=false;status(d.message);controls();return;}
   if(d.checkpoint)keep(d.checkpoint);
   if(d.type==='saved'){controls();return;}
   if(d.type==='restored'){restoring=false;lastAction=null;status('Kaydedilen karar katmanı yüklendi. Devam edebilirsin.');controls();return;}
   if(d.type==='taught'){monitor.update(d.activity,d.action);pending=false;status('Örnek öğrenildi: '+names[d.action]);controls();return;}
   if(d.type==='error'){stop();worker?.terminate();worker=null;ready=false;$('start').disabled=true;$('load').disabled=false;status('Hata: '+d.message);return;}
   if(d.type==='ready'){ready=true;identity={...identity,neurons:d.neurons,edges:d.edges};$('scope').textContent=d.neurons.toLocaleString('tr')+' nöron · '+d.edges.toLocaleString('tr')+' bağlantı';$('start').disabled=false;$('load').disabled=false;status('Ağ hazır. Girişi tamamladıysan başlat.');
    try{const saved=localStorage.getItem(storageKey());if(saved){restoring=true;worker.postMessage({type:'restore',checkpoint:JSON.parse(saved)});}else worker.postMessage({type:'snapshot'});}
    catch{$('save-status').textContent='Eski kayıt okunamadı; modeli dosyadan yükleyebilirsin.';restoring=false;worker.postMessage({type:'snapshot'});}
    controls();return;}
   if(d.type==='step'){
    pending=false;controls();if(!active||d.token!==run)return;
    const current=frame.contentWindow.FlyGame.observe();
    if(!current.ready||current.needsText){stop();status(current.needsText?'Metin / şifre gerekiyor. Elle devam edip ajanı yeniden başlatabilirsin.':'Oyun durakladı.');return;}
    frame.contentWindow.FlyGame.act(d.action);monitor.update(d.activity,d.action);lastAction={id:d.steps,action:d.action,graded:false};$('feedback-target').textContent=`Adım ${d.steps} · ${names[d.action]} hareketini değerlendir.`;controls();
    records.push({...lastObservation,step:d.steps,action:d.action,probabilities:d.probabilities,activity:d.activity});
    $('export').disabled=false;$('stats').textContent='Adım: '+d.steps+' · Keşfedilen hücre: '+seen.size+'\nEylem: '+['ileri','sol','geri','sağ','etkileşim','bekle / kapat'][d.action];
    const c=$('activity'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#8ce4c3';d.activity.forEach((v,i)=>ctx.fillRect(i*c.width/d.activity.length,50-Math.max(0,v)*45,Math.max(1,c.width/d.activity.length-1),Math.max(1,Math.abs(v)*45)));
    if(records.length>5000)records.shift();
    stepTimer=setTimeout(()=>cycle(run),400);
   }
  };
  worker.postMessage({type:'init',seed:41,mode,buffer},buffer?[buffer]:[]);
 }catch(e){worker?.terminate();worker=null;ready=false;status(e.message+' — alt devreyi seçerek tekrar deneyebilirsin.');$('load').disabled=false;$('start').disabled=true;}
};
$('start').onclick=()=>{if(!worker||!ready||active||restoring||$('teacher').checked)return;autoWaiting=false;active=true;monitor.setRunning(true);run++;$('start').disabled=true;$('stop').disabled=false;status('Keşfediyor · karar katmanı öğreniyor');cycle(run);};
$('stop').onclick=()=>{autoWaiting=false;stop();status('Duraklatıldı.');};
$('export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify({experiment:'do-loon-ai-flywire-v0.4.1',...identity,records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='flywire-deney-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('exit-mirror').onclick=()=>{autoWaiting=false;stop();if(frame.contentWindow?.FlyGame?.closeMirror())status('Ayna kapatıldı. Keşfe devam etmek için Başlat.');controls();};
$('auto-resume').onchange=()=>{if(!$('auto-resume').checked)autoWaiting=false;try{localStorage.setItem('flywire-last-config',JSON.stringify({network:identity.network||$('network').value,mode:identity.mode||$('mode').value,auto:$('auto-resume').checked}));}catch{}};
setInterval(()=>{if(document.hidden)return;saveGame();controls();if(autoWaiting&&ready&&!pending&&!restoring&&!$('teacher').checked&&frame.contentWindow?.FlyGame?.observe().ready){autoWaiting=false;$('start').click();}},2000);
window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active&&$('auto-resume').checked)autoWaiting=true;stop();status('Sekme gizlendi; deney duraklatıldı.');}});
loadGame().catch(e=>status(e.message));
