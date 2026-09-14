import assert from 'node:assert/strict';
import {Relay,parseDecision} from './dialogue.mjs';
import {ActionHistory} from './history.mjs';
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
let calls=0;const relay=new Relay({storage,fetcher:async()=>{calls++;return {ok:true,json:async()=>({choices:[{message:{content:'LINE_OK'}}]})};}});
assert.equal(await relay.generate([{role:'user',content:'test'}]),'LINE_OK');assert.equal(calls,1);
assert.equal(JSON.parse(map.get('it041_relay_q')).n,1);
map.set('it041_relay_q',JSON.stringify({d:new Date().toDateString(),n:80}));await assert.rejects(relay.generate([]),/80/);assert.equal(calls,1);
const fail=new Relay({storage:{getItem:()=>null,setItem(){}},fetcher:async()=>({ok:false,status:403})});await assert.rejects(fail.generate([]),/403/);
const view={panel:'riteModal',field:{maxLength:20},buttons:[{id:0,label:'Submit'}]};
assert.equal(parseDecision('{"kind":"write","button":0,"text":"I am a simulated agent."}',view).text.length,20);
assert.throws(()=>parseDecision('{"kind":"click","button":9}',view));assert.throws(()=>parseDecision('{"kind":"move","direction":0}',view));assert.throws(()=>parseDecision('{"kind":"write","button":0,"text":""}',view));
const history=new ActionHistory();for(let i=0;i<30;i++)history.add({label:'step '+i});const id=history.recent()[5].id;history.add({label:'newer'});history.grade(id,1);assert.equal(history.entries.find(x=>x.id===id).grade,1);assert.equal(history.recent()[0].grade,null);assert.throws(()=>history.grade(id,-1));
console.log('PASS: actual relay payload parsing, persistent shared quota, explicit errors, valid text/button actions, stable feedback IDs.');
let ownRequest;const own=new Relay({storage,credentials:()=> 'gsk_test_fixture',fetcher:async(url,options)=>{ownRequest={url,options};return {ok:true,json:async()=>({choices:[{message:{content:'OWN_OK'}}]})};}});
assert.equal(await own.generate([]),'OWN_OK');assert.equal(ownRequest.url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(ownRequest.options.headers.Authorization,'Bearer gsk_test_fixture');assert.equal(JSON.parse(ownRequest.options.body).model,'openai/gpt-oss-120b');assert.equal(JSON.parse(map.get('it041_relay_q')).n,80);
console.log('PASS: explicitly selected own-account transport keeps shared quota intact.');

const cut=new Relay({storage:{getItem:()=>null,setItem(){}},fetcher:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'partial'}}]})})});await assert.rejects(cut.generate([]),/token sınırında/);
let urls=[];const fallback=new Relay({storage:{getItem:()=>null,setItem(){}},fetcher:async(url,options)=>{urls.push(url);assert.equal(JSON.parse(options.body).max_tokens,2048);return url.includes('konsey')?{ok:false,status:503}:{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'READY'}}]})};}});await fallback.generate([]);await fallback.generate([]);assert.equal(urls.length,3);assert(urls[2].includes('it041-mirror'));
console.log('PASS: reasoning budget, truncated response rejection, and remembered working fallback.');

// 429 respects Retry-After, does not hop endpoints, and survives reopening.
let limitedCalls=0;const limits=new Map(),limitStorage={getItem:k=>limits.get(k),setItem:(k,v)=>limits.set(k,v)};
const limited=new Relay({storage:limitStorage,fetcher:async()=>{limitedCalls++;return {ok:false,status:429,headers:new Headers({'retry-after':'120'})};}});
await assert.rejects(limited.generate([]),e=>e.retryAt>Date.now()+115000);
await assert.rejects(limited.generate([]),/429/);assert.equal(limitedCalls,1);
const reopened=new Relay({storage:limitStorage,fetcher:async()=>{throw Error('must not call');}});await assert.rejects(reopened.generate([]),/429/);
import {DialogueJournal} from './journal.mjs';
const journal=new DialogueJournal(storage);journal.add({title:'Read and write',read:'Visible clue',understanding:'A brief summary',sent:'A real submitted answer'});
assert.equal(new DialogueJournal(storage).rows.at(-1).sent,'A real submitted answer');
for(let i=0;i<50;i++)journal.add({title:String(i)});assert.equal(new DialogueJournal(storage).rows.length,40);
console.log('PASS: 429 cooldown persists without extra requests; visible dialogue journal persists and stays bounded.');

let selectedKey=null;const switcher=new Relay({storage:limitStorage,credentials:()=>selectedKey,fetcher:async()=>({ok:true,json:async()=>({choices:[{message:{content:'OWN_READY'}}]})})});await assert.rejects(switcher.generate([]),/429/);selectedKey='gsk_fixture';assert.equal(await switcher.generate([]),'OWN_READY');
console.log('PASS: selecting an explicitly configured own account does not inherit the shared-account cooldown.');

import {AbilityLedger} from './abilities.mjs';
const abilities=new AbilityLedger(storage,'test-abilities');abilities.action({action:1,source:'Öğretmen'});abilities.grade({action:1,source:'FlyWire'},1);abilities.dialogue({read:'clue',sent:'reply'});const restoredAbilities=new AbilityLedger(storage,'test-abilities');assert.equal(restoredAbilities.rows()[1].count,1);assert.equal(restoredAbilities.rows()[3].count,1);assert.equal(restoredAbilities.data.taught[1],1);assert.equal(restoredAbilities.data.good[1],1);assert.equal(new AbilityLedger(storage,'other-model').rows()[1].count,0);
console.log('PASS: skill evidence persists per model, with language activity separate from motor teaching.');
