// CI-only integration fixtures; never injected into the delivered laboratory.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=fileURLToPath(new URL('./test-results/',import.meta.url));
await mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser,page;const evidence={checks:[],errors:[],startedAt:new Date().toISOString()};
async function check(name,fn){const value=await fn();evidence.checks.push({name,value});console.log('PASS',name,JSON.stringify(value??true));}
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8765/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 page.on('pageerror',e=>evidence.errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/fly-lab/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#game').contentWindow?.FlyGame&&document.querySelector('#game').contentWindow?.Game,null,{timeout:60000});
 const game=page.frames().find(f=>f!==page.mainFrame());assert(game);
 await check('real 3D game initializes',async()=>{
  const state=await game.evaluate(()=>({three:!!window.THREE,canvas:!!document.querySelector('#gl canvas'),running:Game.running,ready:!!window.FlyGame}));
  assert(state.three&&state.canvas&&state.ready);assert.equal(state.running,false);return state;
 });
 await check('game entry remains available',async()=>{assert(await game.locator('#startBtn').isVisible());return true;});
 await check('temporary storage does not change owner save',async()=>{
  await page.evaluate(()=>localStorage.setItem('fly-e2e-owner-save','original'));
  const value=await game.evaluate(()=>{const old=localStorage.getItem('fly-e2e-owner-save');localStorage.setItem('fly-e2e-owner-save','simulation');return old;});
  assert.equal(value,null);assert.equal(await page.evaluate(()=>localStorage.getItem('fly-e2e-owner-save')),'original');return true;
 });
 // Initialize a synthetic test session directly; do not accept an agreement for a real user.
 await game.evaluate(()=>{document.getElementById('intro').style.display='none';Game.running=true;Game.setModal(false);S.flags._tutDone=true;window.__obDone=true;});
 await page.locator('#network').selectOption('subset');await page.locator('#load').click();await page.waitForFunction(()=>document.querySelector('#scope').textContent.includes('668'));
 await check('bundled real circuit starts',()=>page.locator('#scope').innerText());
 await check('existing game collision loop responds to agent keys',async()=>{
  await game.evaluate(()=>{window.__flyTestBefore={x:S.px,z:S.pz};FlyGame.act(0);});
  await page.waitForTimeout(800);
  const moved=await game.evaluate(()=>Math.hypot(S.px-window.__flyTestBefore.x,S.pz-window.__flyTestBefore.z));assert(moved>.1,'No 3D movement from key action');return {distance:moved};
 });
 await page.locator('#start').click();await page.waitForFunction(()=>/Adım: (?:[8-9]|\d{2,})/.test(document.querySelector('#stats').textContent),null,{timeout:30000});
 await page.locator('#stop').click();
 await check('pause releases keys and stops decisions',async()=>{
  const before=await page.locator('#stats').innerText();const at=await game.evaluate(()=>({x:S.px,z:S.pz}));await page.waitForTimeout(1000);
  assert.equal(await page.locator('#stats').innerText(),before);const after=await game.evaluate(()=>({x:S.px,z:S.pz}));assert(Math.hypot(at.x-after.x,at.z-after.z)<.05);return {stats:before,at,after};
 });
 await check('trajectory can be exported',async()=>{
  const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;await d.saveAs(out+'/trajectory-subset.json');
  const j=JSON.parse(await readFile(out+'/trajectory-subset.json','utf8'));assert(j.records.length>=8);assert.equal(j.neurons,668);assert(j.records.every(r=>r.activity.every(Number.isFinite)));return {steps:j.records.length,neurons:j.neurons};
 });
 await page.screenshot({path:out+'/subset-gameplay.png',fullPage:true});
 await check('live monitor receives actual activity',async()=>{assert.equal(await page.locator('#brain-view').getAttribute('data-samples'),'128');assert(Number(await page.locator('#traces').getAttribute('data-updates'))>=8);return true;});
 await check('human feedback updates a specific action once',async()=>{
  await page.locator('#good').click();await page.waitForFunction(()=>document.querySelector('#learning').textContent.includes('Geri bildirim: 1'));
  assert(await page.locator('#good').isDisabled());assert(await page.locator('#stop').isDisabled());return await page.locator('#feedback-target').innerText();
 });
 await check('teacher demonstration trains the policy',async()=>{
  await page.locator('#teacher').check();assert(await page.locator('#start').isDisabled());
  await page.locator('[data-teach="0"]').click();await page.waitForFunction(()=>document.querySelector('#learning').textContent.includes('Öğretim: 1'));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('flywire-policy-v1:subset:flywire:41')));
  assert.equal(saved.teachCount,1);assert.equal(saved.feedbackCount,1);assert(saved.policy.flat().every(Number.isFinite));
  await writeFile(out+'/model-subset.json',JSON.stringify(saved));await page.locator('#teacher').uncheck();return {demonstrations:saved.teachCount,feedback:saved.feedbackCount};
 });
 await check('model import validates atomically and restores weights',async()=>{
  const before=await page.evaluate(()=>localStorage.getItem('flywire-policy-v1:subset:flywire:41'));
  await page.locator('#import-model').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"wrong"}')});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('uyumsuz'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('flywire-policy-v1:subset:flywire:41')),before);
  await page.locator('#import-model').setInputFiles(out+'/model-subset.json');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('karar katmanı yüklendi'));
  const event=page.waitForEvent('download');await page.locator('#save-model').click();const d=await event;await d.saveAs(out+'/model-export.json');
  assert.deepEqual(JSON.parse(await readFile(out+'/model-export.json','utf8')),JSON.parse(before));return true;
 });

 await check('text puzzles pause the agent',async()=>{
  await game.evaluate(()=>{Cipher.open('s1');});await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Metin / şifre'));assert(await page.locator('#stop').isDisabled());return true;
 });
 await game.evaluate(()=>{document.getElementById('cipherModal').style.display='none';Game.setModal(false);});
 await page.locator('#network').selectOption('full');await page.locator('#load').click();
 await page.waitForFunction(()=>document.querySelector('#scope').textContent.includes('139.255'),null,{timeout:150000});
 await check('complete neuron set loads in worker',()=>page.locator('#scope').innerText());
 await page.locator('#start').click();await page.waitForFunction(()=>/Adım: (?:[8-9]|\d{2,})/.test(document.querySelector('#stats').textContent),null,{timeout:90000});await page.locator('#stop').click();
 await page.screenshot({path:out+'/full-gameplay.png',fullPage:true});
 await check('full network produces movement and exportable trajectory',async()=>{
  const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;await d.saveAs(out+'/trajectory-full.json');
  const j=JSON.parse(await readFile(out+'/trajectory-full.json','utf8'));assert.equal(j.neurons,139255);assert(j.records.length>=8);assert(j.records.every(r=>r.activity.every(Number.isFinite)));
  const moved=j.records.some((r,i)=>i&&Math.hypot(r.x-j.records[i-1].x,r.z-j.records[i-1].z)>.05);assert(moved,'No movement while full network controlled game');
  return {neurons:j.neurons,edges:j.edges,steps:j.records.length,moved};
 });
 await check('policy survives page reload separately from game storage',async()=>{
  // Save subset as last configuration; reopening must auto-load it without a load click.
  await page.locator('#network').selectOption('subset');await page.locator('#load').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('karar katmanı yüklendi'));
  await game.evaluate(()=>{S.px=150;S.pz=121;S.flags.flyTestMarker='retained';});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('flywire-game-v1'))?.state?.flags?.flyTestMarker==='retained');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('karar katmanı yüklendi'),null,{timeout:30000});
  const label=await page.locator('#learning').innerText();assert(label.includes('Öğretim: 1')&&label.includes('Geri bildirim: 1'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('fly-e2e-owner-save')),'original');
  const newGame=page.frames().find(f=>f!==page.mainFrame());
  await newGame.waitForFunction(()=>!!window.FlyGame);
  const state=await newGame.evaluate(()=>JSON.parse(localStorage.getItem('it041_sw_v1')));
  assert.equal(state.flags.flyTestMarker,'retained');assert.equal(state.px,150);assert.equal(state.pz,121);
  // Complete a synthetic entry fixture; production gates remain untouched.
  await newGame.evaluate(()=>{Object.assign(S,JSON.parse(localStorage.getItem('it041_sw_v1')));document.getElementById('intro').style.display='none';Game.running=true;Game.setModal(false);});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Keşfediyor'),null,{timeout:30000});await page.locator('#stop').click();
  return {label,gameRestored:true,autoStarted:true};
 });
 evidence.success=true;
}catch(e){evidence.success=false;evidence.failure=e.stack;console.error(e.stack);if(page)await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;
}finally{await writeFile(out+'/evidence.json',JSON.stringify(evidence,null,2));if(browser)await browser.close();server.kill();}
