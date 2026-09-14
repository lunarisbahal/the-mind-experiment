import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const listeners={},events=[],timers=new Map();let t=0;
const elements={};const window={Game:{running:true,modal:false},S:{px:190,pz:120},W3:{},addEventListener:(k,f)=>listeners[k]=f,dispatchEvent:e=>events.push(e)};
const document={getElementById:id=>elements[id]||null,createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8Array(256)})})})};
vm.runInNewContext(readFileSync(new URL('./bridge.js',import.meta.url),'utf8'),{window,document,KeyboardEvent:class{constructor(type,o){Object.assign(this,{type},o);}},setTimeout:f=>{timers.set(++t,f);return t;},clearTimeout:i=>timers.delete(i)});
const g=window.FlyGame;assert.equal(g.observe().features.length,68);assert.equal(g.observe().x,190);
assert(g.act(0));assert.equal(events.at(-1).key,'w');assert.equal(events.at(-1).type,'keydown');g.release();assert.equal(events.at(-1).type,'keyup');assert.equal(timers.size,0);
g.act(1);g.act(2);assert.equal(events.at(-2).type,'keyup');assert.equal(events.at(-2).key,'a');assert.equal(events.at(-1).key,'s');
window.Game.modal=true;g.act(5);assert.equal(events.at(-1).key,'Escape');
elements.cipherModal={getClientRects:()=>[1],innerText:'Cipher'};const count=events.length;assert.equal(g.act(4),false);assert.equal(events.length,count);assert.equal(g.observe().needsText,true);
window.Game.running=false;assert.equal(g.act(0),false);
// Exercise the exact isolation prelude from lab.mjs in a separate VM.
const lab=readFileSync(new URL('./lab.mjs',import.meta.url),'utf8');const code=lab.match(/const isolation=`([\s\S]*?)`;/)[1];
const real=new Map([['user-save','untouched']]);const win={localStorage:real,sessionStorage:real,fetch:async(u,o)=>{o?.signal?.throwIfAborted();return new Response(JSON.stringify({reply:'Live resident reply'}));}};const nav={};
vm.runInNewContext(code,{window:win,navigator:nav,document:{baseURI:'http://localhost/game/'},URL,Map,Proxy,Object,Promise,Error,AbortSignal,Response});
assert.equal(win.localStorage.getItem('user-save'),null);win.localStorage.setItem('user-save','test');assert.equal(real.get('user-save'),'untouched');
assert.throws(()=>new win.WebSocket('wss://example.com'));
await assert.rejects(win.fetch('https://example.com/api'));
await assert.rejects(win.fetch('http://localhost/api',{method:'POST'}));
assert.equal((await win.fetch('http://localhost/game/book.json')).ok,true);
const base='https://it041-konsey.lunarisbahal.workers.dev';
for(const path of ['/subject?lang=en','/graduates'])assert.equal((await win.fetch(base+path)).ok,true);
for(const path of ['/subjectsay','/graduatesay'])assert.equal((await win.fetch(base+path,{method:'POST'})).ok,true);
for(const path of ['/dm','/subjectbook','/graduates','/story'])await assert.rejects(win.fetch(base+path,{method:'POST'}));
assert.equal(win.FlyOnline.pending,0);
await assert.rejects(win.fetch(base+'/graduatesay',{method:'POST',signal:AbortSignal.abort()}));
// A slow or failed resident must release its busy lock and never allow duplicate sends.
let finish;const slow={fetch:()=>new Promise(resolve=>{finish=resolve;})};
vm.runInNewContext(code,{window:slow,navigator:{},document:{baseURI:'http://localhost/game/'},URL,Map,Proxy,Object,Promise,Error,AbortSignal,Response});
const waiting=slow.fetch(base+'/graduatesay',{method:'POST'});
assert.equal(slow.FlyOnline.pending,1);
await assert.rejects(slow.fetch(base+'/graduatesay',{method:'POST'}));
finish(new Response('{"reply":"Actual server reply"}'));await waiting;
assert.equal(slow.FlyOnline.pending,0);
const failed=slow.fetch(base+'/subjectsay',{method:'POST'});
finish(new Response('{}',{status:503}));await assert.rejects(failed,/503/);
assert.equal(slow.FlyOnline.pending,0);assert(slow.FlyOnline.error.includes('503'));
const empty=slow.fetch(base+'/subjectsay',{method:'POST'});
finish(new Response('{"reply":""}'));await assert.rejects(empty,/boş/);
assert.equal(slow.FlyOnline.pending,0);
console.log('PASS: 68-channel observation, press/release, stop cleanup, modal/text guards, isolated saves and network controls.');

// Mirror chat must halt instead of consuming endless ineffective actions.
window.Game.running=true;delete elements.cipherModal;let closeClicks=0;
elements.mirrorModal={getClientRects:()=>[1],innerText:'Speak / Step back',querySelector:()=>({click(){closeClicks++;delete elements.mirrorModal;}})};
assert.equal(g.observe().needsText,true);assert.equal(g.observe().mirror,true);assert(g.observe().text.includes('Speak'));
const beforeMirror=events.length;assert.equal(g.act(4),false);assert.equal(events.length,beforeMirror);
assert(g.closeMirror());assert.equal(closeClicks,1);assert.equal(g.observe().mirror,false);assert.equal(g.closeMirror(),false);
console.log('PASS: mirror text guard stops ghost actions; explicit close uses the real UI button.');
