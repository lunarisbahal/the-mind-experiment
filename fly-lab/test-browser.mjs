// Browser tests use a synthetic entry fixture. Production legal/age gates remain intact.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=fileURLToPath(new URL('./test-results/',import.meta.url));
await mkdir(out,{recursive:true});const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser,page;const evidence={checks:[],errors:[]};
async function check(name,fn){const value=await fn();evidence.checks.push({name,value});console.log('PASS',name,JSON.stringify(value??true));}
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:8765/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:0.5,acceptDownloads:true});page.on('pageerror',e=>evidence.errors.push(e.message));
 const replies=[];let residentFail=false,residentSends=0;
 await page.route('https://*.lunarisbahal.workers.dev/**',async route=>{
  const request=route.request();if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type'}});
  const path=new URL(request.url()).pathname;
  if(['/subject','/graduates','/graduatesay','/subjectsay'].includes(path)){
   const chat=request.method()==='POST';if(chat){residentSends++;await new Promise(r=>setTimeout(r,1200));}
   const data=path==='/subject'?{name:'Test subject',roster:[{name:'Test graduate'}]}:path==='/graduates'?{graduates:[{name:'Test graduate',stories:[]}]}:{reply:'I am an online AI resident. Explore the next visible plaque.'};
   return route.fulfill({status:chat&&residentFail?503:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify(data)});
  }
  const payload=request.postDataJSON();let content;
  if(payload.messages[0]?.content?.includes('LANGUAGE PLANNER')){
   const context=JSON.parse(payload.messages.at(-1).content),screen=context.screen;
   const target=screen.buttons.find(b=>/Speak it|Submit|^send$|^gönder$/i.test(b.label))||screen.buttons.find(b=>/continue|close|back/i.test(b.label))||screen.buttons[0];
   content=JSON.stringify({kind:screen.field?'write':'click',button:target?.id||0,text:'I am a simulated agent learning to explore this game.',understanding:'Ekranda keşif için bir soru var.',note:'Görünen soruyu cevaplayıp devam et.',memory:'A simulated practice response was submitted.'});
  }else content=payload.messages.at(-1)?.content?.includes('connection test')?'LINE_OK':'You can continue exploring the visible game and look for the next plaque.';
  replies.push({planner:payload.messages[0]?.content?.includes('LANGUAGE PLANNER'),content});
  await route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({choices:[{message:{content}}]})});
 });
 await page.goto('http://127.0.0.1:8765/fly-lab/');await page.waitForFunction(()=>document.querySelector('#game').contentWindow?.FlyGame);
 let game=page.frames().find(f=>f!==page.mainFrame());
 await check('original game and isolated saves',async()=>{
  assert(await game.locator('#startBtn').isVisible());await page.evaluate(()=>localStorage.setItem('owner-save','untouched'));
  assert.equal(await game.evaluate(()=>localStorage.getItem('owner-save')),null);assert(await game.locator('#gl canvas').count());return true;
 });
 await check('Start loads the network and opens native entry without bypassing consent',async()=>{
  await page.locator('#network').selectOption('subset');await page.locator('#pace').selectOption('750');
  await page.waitForFunction(()=>!document.querySelector('#start').disabled);await page.locator('#start').click();
  await game.locator('button[onclick="Legal.accept(Legal._cb)"]').waitFor({state:'visible',timeout:45000});
  assert.equal(await game.evaluate(()=>Game.running),false);assert.equal(await page.locator('#action-history li').count(),0);
  // Local test fixture records prior acknowledgements, then follows the native entry callback.
  // No production consent is accepted and Game.running is never forced by this fixture.
  await game.evaluate(()=>{localStorage.setItem('it041_legal_ok',Legal.V);localStorage.setItem('it041_age21','1');Game._introShown=true;S.flags._tutDone=true;S.flags._tutArmed=false;window.__obDone=true;UI.closeDoc();Legal._cb();});
  await game.waitForFunction(()=>Game.running);return {nativeEntry:true,consentGatePreserved:true};
 });
 await page.waitForFunction(()=>document.querySelectorAll('#action-history li').length===10,null,{timeout:90000});
 await check('last ten actions stay attached to their feedback IDs',async()=>{
  await page.locator('#history-freeze').check();
  const chosen=page.locator('#action-history li').filter({hasText:'FlyWire'}).first();const id=await chosen.getAttribute('data-action-id');const text=await chosen.locator('div').innerText();
  const before=await page.locator('#stats').innerText();await page.waitForFunction(before=>document.querySelector('#stats').innerText!==before,before,{timeout:60000});assert.equal(await chosen.locator('div').innerText(),text);
  await chosen.getByRole('button',{name:`Eylem ${id}: İyi`,exact:true}).click();await page.waitForFunction(()=>document.querySelector('#learning').textContent.includes('Geri bildirim: 1'));
  assert(await page.locator('#start').isDisabled(),'Feedback must not pause the agent');assert(await chosen.getByRole('button',{name:`Eylem ${id}: İyi`,exact:true}).isDisabled());return {gradedId:id,frozen:true,stillRunning:true};
 });
 await check('teacher movement is learned and autonomy resumes',async()=>{
  await page.locator('#teacher').check();assert(await page.locator('#start').isDisabled());
  await game.evaluate(()=>{['riteModal','cipherModal','mirrorModal','docModal','dlg','aelius'].forEach(id=>document.getElementById(id).style.display='none');Game.setModal(false);});
  const before=await game.evaluate(()=>({x:S.px,z:S.pz}));await page.locator('[data-teach="0"]').click();await page.waitForFunction(()=>document.querySelector('#learning').textContent.includes('Öğretim: 1'));await page.waitForTimeout(650);
  const after=await game.evaluate(()=>({x:S.px,z:S.pz}));assert(Math.hypot(after.x-before.x,after.z-before.z)>.05);
  await page.locator('#teacher').uncheck();assert(await page.locator('#start').isDisabled());return {moved:true,resumed:true};
 });
 await page.locator('#stop').click();await page.locator('#language').check();
 await check('native narration advances through its keyboard control',async()=>{
  await game.evaluate(()=>{Dlg.open([['TEST','Read this first line.'],['TEST','The next line is visible.']]);});await page.locator('#start').click();
  await game.waitForFunction(()=>document.getElementById('dlgText').innerText.includes('next line'),null,{timeout:30000});await page.locator('#stop').click();
  await game.evaluate(()=>{document.getElementById('dlg').style.display='none';Game.setModal(false);});return true;
 });
 await check('text decisions fill and submit a native rite without manual restart',async()=>{
  await game.evaluate(()=>{const id=Object.keys(RITES).find(k=>RITES[k].kind==='text'&&S.rites[k]===undefined);window.__testRite=id;Rite.form(id);Rite.cur=id;});
  await page.locator('#start').click();await page.waitForFunction(()=>{const g=document.querySelector('#game').contentWindow;return g.S.rites[g.__testRite]!==undefined;},null,{timeout:35000});
  assert(await page.locator('#start').isDisabled());assert(replies.some(x=>x.planner));return {nativeRiteCompleted:true,stillRunning:true};
 });
 await page.locator('#stop').click();
 await game.evaluate(()=>{['riteModal','docModal','dlg','aelius'].forEach(id=>document.getElementById(id).style.display='none');Game.setModal(false);});
 await check('game Mirror and agent share the repaired AI transport',async()=>{
  await game.evaluate(()=>{Mirror.open('aelius');});await game.locator('#mirrorInput').fill('I am a simulated agent. Where can I explore next?');await game.locator('#mirrorSend').click();
  await game.waitForFunction(()=>!Mirror.busy&&Mirror.hist.aelius.some(m=>m.role==='assistant'&&m.content.includes('continue exploring')));
  assert.equal(await game.evaluate(()=>FlyGame.aiError),null);await page.locator('#exit-mirror').click();return {realNativeMirrorUI:true,transportMocked:true};
 });
 await check('language agent talks to native online residents and waits for their reply',async()=>{
  await game.evaluate(async()=>{await Roster.load();Roster.chat(0);});
  assert(await game.locator('#ghSay').isVisible());const before=residentSends;
  await page.locator('#start').click();await game.waitForFunction(()=>FlyOnline.pending===1,null,{timeout:35000});
  assert(await game.evaluate(()=>FlyGame.describe().busy));
  assert.equal(await game.evaluate(()=>{const v=FlyGame.describe();return FlyGame.choose(v.key,{kind:'write',text:'duplicate',button:0});}),false);
  await game.waitForFunction(()=>document.getElementById('ghLog')?.textContent.includes('online AI resident'),null,{timeout:15000});await page.locator('#stop').click();
  assert((await page.locator('#dialogue-journal').innerText()).includes('Ekranda keşif için bir soru var.'));assert((await page.locator('#dialogue-journal').innerText()).includes('I am a simulated agent learning to explore this game.'));await page.waitForFunction(()=>document.querySelector('#dialogue-journal').textContent.includes('online AI resident'));assert.equal(residentSends-before,1);assert.equal(await game.evaluate(()=>FlyOnline.pending),0);await game.evaluate(()=>UI.closeDoc());
  return {nativeResidentUI:true,LLMSubmitted:true,duplicatePrevented:true,transportMocked:true};
 });
 await check('unavailable subject service cannot invent a reply or complete the task',async()=>{
  residentFail=true;
  await game.evaluate(()=>{House._taskSubjectLive({task:{en:'Ask the subject what to explore.',tr:'Deneğe sor.'}},0);});
  await game.locator('#tslIn').fill('I am a simulated agent learning this game. Which clue should I explore next?');
  await game.evaluate(()=>House._tslSay());
  assert.equal(await game.evaluate(()=>House._tsl.ex),0);assert.equal(await game.locator('#tslNext button').count(),0);
  assert((await game.locator('#tslLog').innerText()).includes('503'));assert.equal(await game.evaluate(()=>FlyOnline.pending),0);
  residentFail=false;await game.locator('#tslIn').fill('I am a simulated agent learning this game. Which clue should I explore next?');await game.evaluate(()=>House._tslSay());
  assert.equal(await game.evaluate(()=>House._tsl.ex),1);assert.equal(await game.locator('#tslNext button').count(),1);await game.evaluate(()=>UI.closeDoc());return true;
 });
 await check('teacher can submit an explicit visible dialogue example',async()=>{
  await game.evaluate(()=>{UI.doc('Practice','<p>Choose your next direction.</p><button onclick="S.flags.flyTeacherChoice=true;UI.closeDoc()">Explore the path</button>');});
  await page.locator('#teacher').check();await page.locator('#dialogue-teach').getByRole('button',{name:'Explore the path'}).click();
  assert(await game.evaluate(()=>S.flags.flyTeacherChoice));await page.locator('#teacher').uncheck();return true;
 });
 await check('full connectome still generates actual game movement',async()=>{
  await page.locator('#language').check();await page.locator('#network').selectOption('full');await page.locator('#load').click();await page.waitForFunction(()=>document.querySelector('#scope').textContent.includes('139.255')&&!document.querySelector('#start').disabled,null,{timeout:150000});
  await page.locator('#start').click();await page.waitForFunction(()=>/Adım: (?:[8-9]|\d{2,})/.test(document.querySelector('#stats').textContent),null,{timeout:90000});await page.locator('#stop').click();
  const event=page.waitForEvent('download');await page.locator('#export').click();const d=await event;await d.saveAs(out+'/trajectory.json');const j=JSON.parse(await readFile(out+'/trajectory.json','utf8'));
  assert(j.records.some((r,i)=>i&&Math.hypot(r.x-j.records[i-1].x,r.z-j.records[i-1].z)>.05));assert.equal(j.neurons,139255);return {neurons:j.neurons,steps:j.records.length};
 });
 await page.screenshot({path:out+'/stable-gameplay.png',fullPage:true});
 await check('policy and progress restore automatically after reopening',async()=>{
  await page.locator('#network').selectOption('subset');await page.locator('#load').click();await page.waitForFunction(()=>!document.querySelector('#start').disabled);
  await game.evaluate(()=>{S.flags.flySavedProgress='yes';});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('flywire-game-v1')).state.flags.flySavedProgress==='yes');
  await page.reload();await page.waitForFunction(()=>document.querySelector('#scope').textContent.includes('668')&&!document.querySelector('#start').disabled,null,{timeout:45000});
  game=page.frames().find(f=>f!==page.mainFrame());await game.waitForFunction(()=>!!window.FlyGame);await game.waitForFunction(()=>Game.running);await page.waitForFunction(()=>/Adım: [1-9]/.test(document.querySelector('#stats').textContent));
  assert.equal(await game.evaluate(()=>JSON.parse(localStorage.getItem('it041_sw_v1')).flags.flySavedProgress),'yes');assert((await page.locator('#learning').innerText()).includes('Geri bildirim: 1'));assert.equal(await page.evaluate(()=>localStorage.getItem('owner-save')),'untouched');assert((await page.locator('#dialogue-journal').innerText()).includes('online AI resident'));return true;
 });
 await check('WebGL failure is explicit and produces no ghost learning steps',async()=>{
  const blocked=await chromium.launch({headless:true,args:['--disable-webgl']});
  try{const tab=await blocked.newPage();await tab.goto('http://127.0.0.1:8765/fly-lab/');await tab.waitForFunction(()=>document.querySelector('#game').contentWindow?.FlyGame);await tab.locator('#network').selectOption('subset');await tab.locator('#start').click();await tab.waitForFunction(()=>document.querySelector('#status').textContent.includes('WebGL'));assert.equal(await tab.locator('#action-history li').count(),0);assert(await tab.locator('#start').isEnabled());return true;}finally{await blocked.close();}
 });
 // Separate real-browser network probe; do not turn an upstream outage into a passing AI claim.
 const live=await browser.newPage();evidence.liveResponses=[];live.on('response',async response=>{if(/^https:\/\/it041-(?:konsey|mirror)\.lunarisbahal\.workers\.dev\/?(?:mirror)?$/.test(response.url())){const sample={url:response.url(),status:response.status(),body:(await response.text().catch(()=>'' )).slice(0,2000)};evidence.liveResponses.push(sample);console.log('LIVE_RESPONSE',JSON.stringify(sample));}});await live.route('https://lunarisbahal.github.io/the-mind-experiment/fly-lab/**',async route=>{
  const path=new URL(route.request().url()).pathname.split('/fly-lab/')[1]||'index.html';if(path.includes('..'))return route.abort();
  try{const body=await readFile(root+'fly-lab/'+path);return route.fulfill({body,contentType:path.endsWith('.mjs')?'text/javascript':path.endsWith('.json')?'application/json':'text/html'});}catch{return route.continue();}
 });
 await live.goto('https://lunarisbahal.github.io/the-mind-experiment/fly-lab/');await live.locator('#test-ai').click();
 await live.waitForFunction(()=>!document.querySelector('#test-ai').disabled,null,{timeout:60000});evidence.liveRelay=await live.locator('#ai-status').innerText();console.log('LIVE_RELAY',evidence.liveRelay);
 if(evidence.liveRelay.startsWith('AI hattı yanıt verdi:')){try{evidence.livePlanner=await live.evaluate(async()=>{const {decide}=await import('./dialogue.mjs?v=0.5.2');return decide(window.LabRelay,{panel:'docModal',text:'Practice: Write one brief sentence describing what you will explore next as a simulated game agent.',buttons:[{id:0,label:'Submit'},{id:1,label:'Step back'}],field:{maxLength:240,value:''}},'',[],AbortSignal.timeout(60000));});console.log('LIVE_PLANNER',JSON.stringify(evidence.livePlanner));}catch(e){evidence.livePlannerError=e.message;console.log('LIVE_PLANNER_ERROR',e.message);}}
 try{
  await live.waitForFunction(()=>document.querySelector('#game').contentWindow?.FlyOnline,null,{timeout:45000});
  evidence.liveResident=await live.evaluate(async()=>{const w=document.querySelector('#game').contentWindow,base='https://it041-konsey.lunarisbahal.workers.dev';const roster=await (await w.fetch(base+'/subject?lang=en')).json();const reply=await (await w.fetch(base+'/subjectsay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'I am a simulated FlyWire game agent testing the online connection. What should I look for when exploring this game? Please answer briefly.',lang:'en'})})).json();return {rosterLoaded:!!roster,reply:reply.reply};});
  console.log('LIVE_RESIDENT',JSON.stringify(evidence.liveResident));
 }catch(e){evidence.liveResidentError=e.message;console.log('LIVE_RESIDENT_ERROR',e.message);}
 await live.close();
 evidence.success=true;
}catch(e){evidence.success=false;evidence.failure=e.stack;if(page)evidence.state=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,ai:document.querySelector('#ai-status')?.textContent,stats:document.querySelector('#stats')?.textContent,history:document.querySelector('#action-history')?.innerText,frozen:document.querySelector('#history-freeze')?.checked,view:document.querySelector('#game')?.contentWindow?.FlyGame?.describe()})).catch(()=>null);console.error(e.stack,JSON.stringify(evidence.state));process.exitCode=1;if(page)await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});}
finally{await writeFile(out+'/evidence.json',JSON.stringify(evidence,null,2));if(browser)await browser.close();server.kill();}
