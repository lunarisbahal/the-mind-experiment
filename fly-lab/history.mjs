export class ActionHistory {
 constructor(limit=200){this.limit=limit;this.entries=[];this.next=1;}
 add(data){const row={...data,id:this.next++,time:new Date().toLocaleTimeString('tr'),grade:null};this.entries.push(row);if(this.entries.length>this.limit)this.entries.shift();return row;}
 recent(){return this.entries.slice(-10).reverse();}
 grade(id,value){const row=this.entries.find(r=>r.id===id);if(!row||row.grade!==null||![1,-1].includes(value))throw Error('Eylem değerlendirilemiyor');row.grade=value;return row;}
}
export function renderHistory(root,rows,onGrade){
 root.replaceChildren();
 for(const row of rows){const el=document.createElement('li');el.dataset.actionId=row.id;
  const label=document.createElement('div');label.textContent=`#${row.id} · ${row.time} · ${row.label} · ${row.source}`;el.append(label);
  const detail=document.createElement('small');detail.textContent=row.detail||'';el.append(detail);
  for(const [value,name] of [[1,'İyi'],[-1,'Kötü']]){const b=document.createElement('button');b.textContent=row.grade===value?name+' ✓':name;b.disabled=row.grade!==null;b.setAttribute('aria-label',`Eylem ${row.id}: ${name}`);b.onclick=()=>onGrade(row.id,value);el.append(b);}
  root.append(el);
 }
}
