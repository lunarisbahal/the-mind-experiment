// Evidence of behavior and teaching, not anatomical claims or mastery scores.
export class AbilityLedger {
 constructor(storage,key){this.storage=storage;this.key=key;this.data={actions:[0,0,0,0,0,0],taught:[0,0,0,0,0,0],good:[0,0,0,0,0,0],bad:[0,0,0,0,0,0],read:0,write:0,replies:0};try{const d=JSON.parse(storage.getItem(key));if(d&&['actions','taught','good','bad'].every(k=>Array.isArray(d[k])&&d[k].length===6&&d[k].every(Number.isSafeInteger))&&['read','write','replies'].every(k=>Number.isSafeInteger(d[k])))this.data=d;}catch{}}
 save(){try{this.storage.setItem(this.key,JSON.stringify(this.data));}catch{}}
 action(row){if(Number.isInteger(row.action)&&row.action>=0&&row.action<6){this.data.actions[row.action]++;if(row.source==='Öğretmen')this.data.taught[row.action]++;}this.save();}
 grade(row,value){if(row.source==='FlyWire'&&Number.isInteger(row.action))this.data[value===1?'good':'bad'][row.action]++;this.save();}
 dialogue(row){if(row.read)this.data.read++;if(row.sent)this.data.write++;if(row.reply)this.data.replies++;this.save();}
 rows(){const d=this.data,group=(ids,key)=>ids.reduce((sum,i)=>sum+d[key][i],0);return [
  ...[['Keşif',[0]],['Yön',[1,2,3]],['Etkileşim',[4]]].map(([name,ids])=>({name,count:group(ids,'actions'),detail:group(ids,'actions')+' eylem · '+group(ids,'taught')+' gösterim · '+group(ids,'good')+' iyi / '+group(ids,'bad')+' kötü geri bildirim',source:'Hareket karar katmanı'})),
  {name:'Okuma',count:d.read,detail:d.read+' metin kararı ve kısa yorum',source:'Dil modeli desteği'},
  {name:'Yazma',count:d.write,detail:d.write+' cevap oyun arayüzüne yazıldı',source:'Dil modeli desteği'},
  {name:'AI yanıtı',count:d.replies,detail:d.replies+' gerçek servis yanıtı alındı',source:'Çevrimiçi sohbet'}
 ];}
}
