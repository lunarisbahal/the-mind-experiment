// Schematic positions only. Colors and traces use measured model output samples.
export function createMonitor(brainCanvas,flyCanvas,traceCanvas){
 let yaw=.3,pitch=.12,drag=null,activity=[],action=5,running=false,lastTime=0;
 const traces=[],points=Array.from({length:128},(_,i)=>{const side=i<64?-1:1,k=i%64,z=1-2*(k+.5)/64,a=k*2.399963;return [side*.6+Math.sqrt(1-z*z)*Math.cos(a)*.58,z*.83,Math.sqrt(1-z*z)*Math.sin(a)*.6];});
 function project([x,y,z],w,h){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw),c=y*Math.cos(pitch)-b*Math.sin(pitch),d=y*Math.sin(pitch)+b*Math.cos(pitch),s=Math.min(w,h)*.34/(1+d*.18);return [w/2+a*s,h/2+c*s,s,d];}
 brainCanvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];brainCanvas.setPointerCapture(e.pointerId);};
 brainCanvas.onpointermove=e=>{if(drag){yaw+=(e.clientX-drag[0])*.012;pitch=Math.max(-1,Math.min(1,pitch+(e.clientY-drag[1])*.012));drag=[e.clientX,e.clientY];}};
 brainCanvas.onpointerup=brainCanvas.onpointercancel=()=>drag=null;
 function clear(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);return ctx;}
 function brain(){const c=brainCanvas,ctx=clear(c);ctx.strokeStyle='#294657';
  for(const side of [-1,1])for(const latitude of [-.6,0,.6]){ctx.beginPath();for(let k=0;k<=64;k++){const a=k/64*Math.PI*2,q=project([side*.6+Math.cos(a)*.58*Math.sqrt(1-latitude*latitude),latitude*.83,Math.sin(a)*.6*Math.sqrt(1-latitude*latitude)],c.width,c.height);k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);}ctx.stroke();}
  points.slice(0,activity.length).map((p,i)=>({q:project(p,c.width,c.height),v:activity[i]})).sort((a,b)=>b.q[3]-a.q[3]).forEach(({q,v})=>{ctx.beginPath();ctx.fillStyle=v<0?`rgba(182,142,255,${.3+Math.min(1,Math.abs(v))*.7})`:`rgba(104,244,195,${.3+Math.min(1,Math.abs(v))*.7})`;ctx.arc(q[0],q[1],2+Math.min(1,Math.abs(v))*5,0,Math.PI*2);ctx.fill();});
 }
 function fly(t){const c=flyCanvas,ctx=clear(c),cx=c.width/2,cy=c.height/2;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(action===1?-.15:action===3?.15:0);
  function oval(x,y,rx,ry,color,rot=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#466168';ctx.stroke();}
  const motion=running?Math.sin(t*.035)*12:0;
  ctx.strokeStyle='#92aaa3';ctx.lineWidth=3;
  for(const side of [-1,1])for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(side*12,(i-1)*17);ctx.lineTo(side*(45+Math.sin(t*.008+i)* (running?5:0)),(i-1)*32);ctx.lineTo(side*65,(i-1)*45+motion*(i%2?1:-1));ctx.stroke();}
  oval(0,30,20,39,'#746954');oval(0,-3,24,29,'#ac9b73');
  oval(-33,12,16,51,'rgba(182,216,218,.28)',-.5-motion*.01);oval(33,12,16,51,'rgba(182,216,218,.28)',.5+motion*.01);
  oval(0,-39,23,20,'#ae9a6d');oval(-17,-43,11,15,'#c65448');oval(17,-43,11,15,'#c65448');
  const amp=activity.length?activity.reduce((s,v)=>s+Math.abs(v),0)/activity.length:0;
  oval(0,-37,7+amp*8,5+amp*5,'#8ce4c3');ctx.restore();
 }
 function trace(){const c=traceCanvas,ctx=clear(c);ctx.lineWidth=1;const colors=['#8ce4c3','#bb9cec','#f4c878','#77b9ee'];
  for(let j=0;j<4;j++){ctx.strokeStyle=colors[j];ctx.beginPath();traces.forEach((row,i)=>{const x=i*c.width/119,y=(j+.5)*c.height/4-(row[j]||0)*c.height/9;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
 }
 function tick(t){if(!document.hidden&&t-lastTime>40){lastTime=t;brain();fly(t);}requestAnimationFrame(tick);}requestAnimationFrame(tick);
 return {setRunning(value){running=value;},update(values,a){activity=values.slice(0,128);action=a;traces.push([0,Math.floor(activity.length/3),Math.floor(activity.length*2/3),activity.length-1].map(i=>activity[i]||0));if(traces.length>120)traces.shift();brainCanvas.dataset.samples=String(activity.length);traceCanvas.dataset.updates=String(Number(traceCanvas.dataset.updates||0)+1);trace();},reset(){activity=[];traces.length=0;running=false;delete brainCanvas.dataset.samples;traceCanvas.dataset.updates='0';trace();}};
}
