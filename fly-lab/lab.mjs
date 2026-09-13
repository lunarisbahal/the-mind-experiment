import {createMonitor} from './visual.mjs';
import {Relay,decide} from './dialogue.mjs';
import {ActionHistory,renderHistory} from './history.mjs';
const $=id=>document.getElementById(id),frame=$('game');
const FULL='https://raw.githubusercontent.com/snedea/flybrain/9191824d17871b7851645782d53d23f213ddb938/data/connectome.bin.gz';
const monitor=createMonitor($('brain-view'),$('fly-view'),$('traces'));
const names=['ileri','sol','geri','sağ','etkileşim','bekle / kapat'];
let worker,ready=false,wanted=false,teacherBusy=false,run=0,timer,requestId=0;
let checkpoint=null,identity={},records=[],seen=new Set(),previous=null,stuck=0,macro=null;
let history=new ActionHistory(),historyFrozen=false,teacherResume=false,autoWaiting=false,plannerAbort;
let memory='',textRecent=[],lastTextKey='',lastTextAt=0,lastPlannerAt=0,languageExamples=[];
const pending=new Map();
const status=t=>$('status').textContent=t;
const log=t=>$('log').textContent=(t+'\n'+$('log').textContent).slice(0,5000);
const game=()=>frame.contentWindow?.FlyGame;
const storageKey=()=>`flywire-policy-v1:${identity.network}:${identity.mode}:41`;
const relay=new Relay({report:t=>$('ai-status').textContent=t});window.LabRelay=relay;
try{const m=JSON.parse(localStorage.getItem('flywire-language-v1'));memory=m?.memory||'';textRecent=m?.recent||[];languageExamples=m?.examples||[];}catch{}
function remember(){try{localStorage.setItem('flywire-language-v1',JSON.stringify({memory,recent:textRecent.slice(-20),examples:languageExamples.slice(-50)}));}catch{log('Dil belleği kaydedilemedi.');}}
function saveGame(){try{const g=game()?.checkpoint();if(g){localStorage.setItem('flywire-game-v1',JSON.stringify(g));$('game-save-status').textContent='Deney ilerlemesi kaydedildi'+(g.interior?' · yeniden açılış dış kapıdan.':'.');}}catch{$('game-save-status').textContent='Oyun ilerlemesi kaydedilemedi.';}}
function keep(c){checkpoint=c;$('learning').textContent=`Öğretim: ${c.teachCount} · Geri bildirim: ${c.feedbackCount}`;try{localStorage.setItem(storageKey(),JSON.stringify(c));$('save-status').textContent='Model bu tarayıcıda otomatik kaydedildi.';}catch{$('save-status').textContent='Kaydedilemedi; modeli dosya olarak indir.';}controls();}
function controls(){
 $('start').disabled=!ready||wanted||$('teacher').checked;
 $('stop').disabled=!wanted&&!teacherBusy;
 $('teacher').disabled=!ready;
 for(const b of document.querySelectorAll('[data-teach]'))b.disabled=!ready||teacherBusy||!$('teacher').checked||identity.mode==='random';
 $('save-model').disabled=!checkpoint;$('import-model').disabled=!ready||wanted||teacherBusy;
 $('exit-mirror').disabled=!game()?.observe().mirror;
 $('export').disabled=!records.length;
}
function refreshHistory(){if(!historyFrozen)renderHistory($('action-history'),history.recent(),grade);}
$('history-freeze').onchange=()=>{historyFrozen=$('history-freeze').checked;refreshHistory();};
$('action-history').onpointerenter=()=>{historyFrozen=true;$('history-freeze').checked=true;};
$('action-history').onfocusin=()=>{historyFrozen=true;$('history-freeze').checked=true;};
async function grade(id,value){
 const row=history.entries.find(r=>r.id===id);if(!row||row.grade!==null)return;
 row.grade='pending';renderHistory($('action-history'),historyFrozen?Array.from($('action-history').children).map(el=>history.entries.find(r=>r.id===Number(el.dataset.actionId))).filter(Boolean):history.recent(),grade);
 try{
  if(row.source==='FlyWire')await rpc({type:'feedback',id:row.brainStep,value});
  else {languageExamples.push({text:row.context?.slice(0,1600),decision:row.decision,value});remember();}
  row.grade=value;log(`#${row.id} ${row.label}: ${value===1?'iyi':'kötü'} işlendi.`);
 }catch(e){row.grade=null;log(e.message);}
 const ids=Array.from($('action-history').children).map(el=>Number(el.dataset.actionId));renderHistory($('action-history'),ids.map(id=>history.entries.find(r=>r.id===id)).filter(Boolean),grade);
}
function addAction(data){const row=history.add(data);records.push({...row});if(records.length>5000)records.shift();refreshHistory();$('stats').textContent=`Adım: ${history.next-1} · Keşfedilen hücre: ${seen.size}\nEylem: ${row.label} · ${row.source}`;controls();saveGame();return row;}
function rpc(message,transfer=[]){return new Promise((resolve,reject)=>{
 if(!worker)return reject(Error('Ağ hazır değil'));
 const id=++requestId,timeout=setTimeout(()=>{pending.delete(id);reject(Error('Ağ yanıt zaman aşımı'));},90000);pending.set(id,{resolve,reject,timeout});worker.postMessage({...message,requestId:id},transfer);
});}
function pause(message='Duraklatıldı.'){
 wanted=false;autoWaiting=false;run++;clearTimeout(timer);plannerAbort?.abort();game()?.release();monitor.setRunning(false);previous=null;macro=null;
 if(ready)worker?.postMessage({type:'forget-transition'});controls();saveGame();status(message);
}
function schedule(token,delay){clearTimeout(timer);if(wanted&&token===run)timer=setTimeout(()=>tick(token),delay);}
function start(){if(!ready||$('teacher').checked)return;wanted=true;autoWaiting=false;run++;controls();monitor.setRunning(true);tick(run);}
async function textStep(view,token){
 if(!$('language').checked){status('Metin bekliyor · Dil yardımı kapalı. Elle devam edebilirsin.');return 1500;}
 if(view.busy){status('Karakterin AI yanıtını bekliyor…');return 1000;}
 if(view.key===lastTextKey&&Date.now()-lastTextAt<15000){status('Diyalog sonucunu bekliyor…');return 1000;}
 if(!view.buttons.length){status('Diyalog hazırlanıyor…');return 1500;}
 status('Okuyor ve düğme / cevap seçiyor · Dil modeli');
 plannerAbort=new AbortController();
 const d=await decide(relay,view,memory,[...textRecent,...languageExamples.slice(-5)],plannerAbort.signal);
 if(!wanted||token!==run)return 1000;
 if(d.kind==='wait'){status('Dil modeli beklemeyi seçti. Yeniden değerlendirilecek.');return 15000;}
 if(!['click','write'].includes(d.kind)||!game().choose(view.key,d)){status('Ekran değişti; yeniden okuyacak.');return 1000;}
 memory=d.memory||memory;lastTextKey=view.key;lastTextAt=Date.now();
 textRecent.push({screen:view.text.slice(0,1400),decision:d});textRecent=textRecent.slice(-20);remember();
 addAction({label:(d.kind==='write'?'Yaz: '+d.text+' → ':'Tıkla: ')+view.buttons.find(b=>b.id===d.button).label,source:'Dil modeli',context:view.text,decision:d,detail:d.note});
 log(d.note);previous=null;worker?.postMessage({type:'forget-transition'});return 2000;
}
async function tick(token){
 if(!wanted||token!==run)return;
 let delay=Number($('pace').value);
 try{
  const g=game(),o=g?.observe();
  if(!o?.ready){monitor.setRunning(false);status('Oyun girişini / geçişini bekliyor; hazır olunca devam edecek.');schedule(token,1500);return;}
  if(document.hidden){monitor.setRunning(false);status('Sekme görünür olunca otomatik devam edecek.');schedule(token,1500);return;}
  monitor.setRunning(true);
  const view=g.describe();
  if(view.panel){g.release();delay=await textStep(view,token);schedule(token,delay);return;}
  if(o.modal){status('Oyun penceresinin kapanmasını bekliyor…');schedule(token,1500);return;}
  if(previous)stuck=Math.hypot(o.x-previous.x,o.z-previous.z)<.03?stuck+1:0;
  if(stuck>=12&&!macro&&$('language').checked&&Date.now()-lastPlannerAt>30000){
   lastPlannerAt=Date.now();plannerAbort=new AbortController();status('İlerleme için hareket planlıyor · Dil modeli');
   const d=await decide(relay,view,memory,[...textRecent.slice(-3),{stuck,position:[o.x,o.z]}],plannerAbort.signal);
   if(!wanted||token!==run)return;if(d.kind==='move'){macro={action:d.direction,left:d.repeat};memory=d.memory||memory;remember();}stuck=0;
  }
  const cell=[o.interior,Math.floor(o.x/5),Math.floor(o.z/5)].join(':');let reward=previous?(seen.has(cell)?-.01:1):0;if(previous&&stuck)reward-=.02;seen.add(cell);previous=o;
  let result,source='FlyWire';
  if(macro){source='Dil modeli';result=await rpc({type:'teach',obs:o.features,action:macro.action});if(--macro.left<=0)macro=null;}
  else result=await rpc({type:'step',obs:o.features,reward,learn:identity.mode!=='random',token});
  if(!wanted||token!==run)return;
  const now=g.observe();if(!now.ready||now.modal||g.describe().panel){worker.postMessage({type:'forget-transition'});schedule(token,500);return;}
  if(g.act(result.action)){
   monitor.update(result.activity,result.action);addAction({label:names[result.action],source,brainStep:result.steps,action:result.action,x:o.x,z:o.z,activity:result.activity,probabilities:result.probabilities,detail:`x ${o.x.toFixed(1)} · z ${o.z.toFixed(1)} · ödül ${reward.toFixed(2)}`});
  }
  status('Keşfediyor · karar katmanı öğreniyor');
 }catch(e){if(token!==run||!wanted)return;status(e.message+' · 15 saniye sonra yeniden deneyecek.');log(e.message);delay=15000;}
 schedule(token,delay);
}
$('start').onclick=start;$('stop').onclick=()=>pause();
$('teacher').onchange=()=>{if($('teacher').checked){teacherResume=wanted;pause('Öğretmen modu · hareket veya diyalog düğmesiyle göster.');}else if(teacherResume){teacherResume=false;start();}else status('Öğretmen modu kapandı. Başlat ile devam edebilirsin.');controls();};
async function demonstrate(action){
 if(!ready||teacherBusy||!$('teacher').checked||identity.mode==='random')return;
 const g=game(),o=g?.observe();if(!o?.ready){status('Önce oyun girişini tamamla.');return;}
 if(o.modal||g.describe().panel){status('Diyalog açık; aşağıdaki görünür seçeneklerden öğret.');return;}
 teacherBusy=true;controls();
 try{if(g.act(action)){const r=await rpc({type:'teach',obs:o.features,action});monitor.update(r.activity,action);status('Örnek öğrenildi: '+names[action]);addAction({label:names[action],source:'Öğretmen',action,detail:'Gösterilen hareket karar katmanına öğretildi.'});}}
 catch(e){status(e.message);}finally{teacherBusy=false;controls();}
}
for(const b of document.querySelectorAll('[data-teach]'))b.onclick=()=>demonstrate(Number(b.dataset.teach));
let teachingKey='';
function renderTeaching(){
 const root=$('dialogue-teach'),view=game()?.describe();if(!$('teacher').checked||!view?.panel){root.replaceChildren();teachingKey='';return;}if(view.key===teachingKey)return;teachingKey=view.key;root.replaceChildren();
 const p=document.createElement('p');p.textContent=view.text.slice(0,1200);root.append(p);
 const field=document.createElement('textarea');field.placeholder='Örnek cevabını yaz';field.maxLength=view.field?.maxLength||500;if(view.field)root.append(field);
 for(const choice of view.buttons){const b=document.createElement('button');b.textContent=choice.label;b.onclick=()=>{
  const d={kind:view.field&&field.value.trim()?'write':'click',button:choice.id,text:field.value};
  if(!game().choose(view.key,d)){status('Ekran değişti; güncel seçeneği kullan.');return;}
  languageExamples.push({text:view.text.slice(0,1600),decision:d,value:1});remember();addAction({label:choice.label,source:'Öğretmen',context:view.text,decision:d,detail:'Dil karar belleğine örnek eklendi.'});status('Diyalog örneği kaydedildi.');teachingKey='';
 };root.append(b);}
}
function download(data,name){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('save-model').onclick=()=>download(checkpoint,'flywire-model-'+Date.now()+'.json');
$('export').onclick=()=>download({experiment:'flywire-hybrid-v0.5',...identity,records,memory},'flywire-deney-'+Date.now()+'.json');
$('import-model').onchange=async e=>{const f=e.target.files[0];if(!f)return;pause();try{if(f.size>200000)throw Error('Dosya çok büyük');await rpc({type:'restore',checkpoint:JSON.parse(await f.text())});status('Kaydedilen karar katmanı yüklendi.');}catch(err){status(err.message);}finally{e.target.value='';}};
$('exit-mirror').onclick=()=>{game()?.closeMirror();lastTextKey='';status('Ayna kapatıldı.');};
$('test-ai').onclick=async()=>{ $('test-ai').disabled=true;try{const text=await relay.generate([{role:'user',content:'IT-041 connection test. Reply only LINE_OK.'}],16);$('ai-status').textContent='AI hattı yanıt verdi: '+text;}catch(e){$('ai-status').textContent=e.message;}finally{$('test-ai').disabled=false;}};
function saveConfig(){try{localStorage.setItem('flywire-last-config',JSON.stringify({network:$('network').value,mode:$('mode').value,auto:$('auto-resume').checked,language:$('language').checked}));}catch{}}
$('auto-resume').onchange=()=>{if(!$('auto-resume').checked)autoWaiting=false;saveConfig();};$('language').onchange=saveConfig;
$('load').onclick=async()=>{
 pause();ready=false;checkpoint=null;worker?.terminate();for(const p of pending.values()){clearTimeout(p.timeout);p.reject(Error('Model yeniden yükleniyor'));}pending.clear();
 worker=null;records=[];history=new ActionHistory();historyFrozen=false;$('history-freeze').checked=false;seen=new Set();previous=null;stuck=0;macro=null;monitor.reset();$('teacher').checked=false;teacherBusy=false;refreshHistory();$('load').disabled=true;controls();
 const network=$('network').value,mode=$('mode').value;identity={network,mode,seed:41,startedAt:new Date().toISOString()};saveConfig();
 try{
  let buffer;if(network==='full'){status('139.255 nöronluk veri indiriliyor…');const r=await fetch(FULL,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Tam ağ indirilemedi');buffer=await r.arrayBuffer();}
  worker=new Worker('./worker.mjs',{type:'module'});
  worker.onmessage=({data:d})=>{if(d.checkpoint)keep(d.checkpoint);const p=pending.get(d.requestId);if(p){pending.delete(d.requestId);clearTimeout(p.timeout);if(d.type==='error'||d.type==='request-error')p.reject(Error(d.message));else p.resolve(d);}};
  worker.onerror=e=>{for(const p of pending.values()){clearTimeout(p.timeout);p.reject(Error(e.message));}pending.clear();ready=false;pause('Model hatası: '+e.message);};
  const d=await rpc({type:'init',seed:41,mode,buffer},buffer?[buffer]:[]);identity={...identity,neurons:d.neurons,edges:d.edges};$('scope').textContent=d.neurons.toLocaleString('tr')+' nöron · '+d.edges.toLocaleString('tr')+' bağlantı';
  const saved=localStorage.getItem(storageKey());
  if(saved){await rpc({type:'restore',checkpoint:JSON.parse(saved)});status('Kaydedilen karar katmanı yüklendi.');}else{await rpc({type:'snapshot'});status('Ağ hazır. Başlat ile başlayabilirsin.');}
  ready=true;
 }catch(e){status(e.message);log(e.message);}finally{$('load').disabled=false;controls();}
};

const isolation=`(()=>{function memory(){const m=new Map();return new Proxy({getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]??null,get length(){return m.size;}},{get:(t,p)=>p in t?t[p]:m.get(String(p)),set:(t,p,v)=>{m.set(String(p),String(v));return true;}});}for(const k of ['localStorage','sessionStorage'])Object.defineProperty(window,k,{value:memory()});const original=window.fetch.bind(window);window.fetch=(u,o)=>{const url=new URL(typeof u==='string'?u:u.url,document.baseURI);const method=(o?.method||'GET').toUpperCase();const relay=['https://it041-konsey.lunarisbahal.workers.dev/mirror','https://it041-mirror.lunarisbahal.workers.dev/'].includes(url.href)&&method==='POST';if(!relay&&(url.origin!==new URL(document.baseURI).origin||!['GET','HEAD'].includes(method)))return Promise.reject(new Error('Laboratory: remote services disabled'));return original(u,o);};window.WebSocket=class{constructor(){throw Error('Laboratory: multiplayer disabled');}};window.EventSource=class{constructor(){throw Error('Laboratory: remote services disabled');}};window.XMLHttpRequest=class{open(){throw Error('Laboratory: remote services disabled');}};Object.defineProperty(navigator,'sendBeacon',{value:()=>false});window.open=()=>null;})();`;

async function loadGame(){
 const [a,b]=await Promise.all([fetch('../index.html'),fetch('./bridge.js')]);if(!a.ok||!b.ok)throw Error('Oyun dosyası yüklenemedi');
 const [source,bridge]=await Promise.all([a.text(),b.text()]);const base=new URL('../',location.href).href;
 let seed='',savedGame=false;try{const g=JSON.parse(localStorage.getItem('flywire-game-v1'));if(g?.format==='flywire-game-v1'&&g.state){seed='localStorage.setItem("it041_sw_v1",'+JSON.stringify(JSON.stringify(g.state)).replaceAll('<','\\u003c')+');';savedGame=true;}}catch{}
 let config;try{config=JSON.parse(localStorage.getItem('flywire-last-config'));}catch{}
 if(config){$('auto-resume').checked=config.auto!==false;$('language').checked=config.language!==false;}
 frame.onload=()=>{if(savedGame&&$('auto-resume').checked)game()?.resume();};
 frame.srcdoc=source.replace('<head>','<head><base href="'+base+'"><script>'+isolation+seed+'<\/script>')+'<script>'+bridge+'<\/script>';
 status('Oyunun girişini tamamla ve ağı yükle.');
 if(config&&$('auto-resume').checked&&['full','subset'].includes(config.network)&&['flywire','shuffled','random'].includes(config.mode)){
  $('network').value=config.network;$('mode').value=config.mode;await $('load').onclick();autoWaiting=true;
 }
}
setInterval(()=>{saveGame();controls();renderTeaching();if(autoWaiting&&ready&&game()?.observe().ready&&!document.hidden)start();},1000);
window.addEventListener('pagehide',()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden){game()?.release();monitor.setRunning(false);saveGame();}});
controls();loadGame().catch(e=>status(e.message));
