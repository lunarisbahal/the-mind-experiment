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
 await page.waitForFunction(()=>document.querySelector('#game').contentWindow?.FlyGame&&document.querySelector('#game').contentWindow?.Game,{timeout:60000});
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
 await page.locator('#load').click();await page.waitForFunction(()=>document.querySelector('#scope').textContent.includes('668'));
 await check('bundled real circuit starts',()=>page.locator('#scope').innerText());
 await check('existing game collision loop responds to agent keys',async()=>{
  await game.evaluate(()=>{window.__flyTestBefore={x:S.px,z:S.pz};FlyGame.act(0);});
  await page.waitForTimeout(800);
  const moved=await game.evaluate(()=>Math.hypot(S.px-window.__flyTestBefore.x,S.pz-window.__flyTestBefore.z));assert(moved>.1,'No 3D movement from key action');return {distance:moved};
 });
 await page.locator('#start').click();await page.waitForFunction(()=>/Adım: (?:[8-9]|\d{2,})/.test(document.querySelector('#stats').textContent),{timeout:30000});
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
 await check('text puzzles pause the agent',async()=>{
  await game.evaluate(()=>{Cipher.open('s1');});await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Metin / şifre'));assert(await page.locator('#stop').isDisabled());return true;
 });
 await game.evaluate(()=>{document.getElementById('cipherModal').style.display='none';Game.setModal(false);});
 await page.locator('#network').selectOption('full');await page.locator('#load').click();
 await page.waitForFunction(()=>document.querySelector('#scope').textContent.includes('139.255'),{timeout:150000});
 await check('complete neuron set loads in worker',()=>page.locator('#scope').innerText());
 await page.locator('#start').click();await page.waitForFunction(()=>/Adım: [3-9]/.test(document.querySelector('#stats').textContent),{timeout:60000});await page.locator('#stop').click();
 await page.screenshot({path:out+'/full-gameplay.png',fullPage:true});
 await check('full network produces game actions',()=>page.locator('#stats').innerText());
 evidence.success=true;
}catch(e){evidence.success=false;evidence.failure=e.stack;console.error(e.stack);if(page)await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;
}finally{await writeFile(out+'/evidence.json',JSON.stringify(evidence,null,2));if(browser)await browser.close();server.kill();}
