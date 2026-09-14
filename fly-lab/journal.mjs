// Public summaries and submitted text, never hidden reasoning or invented replies.
export class DialogueJournal {
 constructor(storage){this.storage=storage;this.rows=[];try{const rows=JSON.parse(storage.getItem('flywire-dialogue-journal'));if(Array.isArray(rows))this.rows=rows.slice(-40);}catch{}}
 add(data){const row={time:new Date().toLocaleTimeString('tr'),...data};this.rows.push(row);this.rows=this.rows.slice(-40);try{this.storage.setItem('flywire-dialogue-journal',JSON.stringify(this.rows));}catch{}return row;}
}
export function renderJournal(root,rows){
 root.replaceChildren();
 for(const row of [...rows].reverse()){
  const entry=document.createElement('details');entry.open=rows.indexOf(row)>=rows.length-3;
  const title=document.createElement('summary');title.textContent=row.time+' · '+row.title;entry.append(title);
  for(const [key,label] of [['read','Okuduğu metin'],['understanding','Dil modelinin kısa yorumu'],['sent','Oyuna yazdığı cevap'],['reply','Karakterden gelen cevap'],['note','Seçtiği eylem'],['error','Bağlantı hatası']]){
   if(!row[key])continue;const heading=document.createElement('strong');heading.textContent=label;
   const p=document.createElement('p');p.textContent=row[key];entry.append(heading,p);
  }
  root.append(entry);
 }
}
