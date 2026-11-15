(function(g,f){const api=f(typeof module==='object'&&module.exports?require('./race3d-math.js'):g.HorseDaysSolid);if(typeof module==='object'&&module.exports)module.exports=api;else g.HorseDaysBroadcast=api;})(typeof globalThis!=='undefined'?globalThis:this,function(D){
'use strict';
const center=rs=>[rs.reduce((s,r)=>s+r.x,0)/rs.length,1.35,rs.reduce((s,r)=>s+r.z,0)/rs.length];
function phase(rows){const r=rows[0];if(rows.every(r=>r.finished))return 'winner';if(r.ran>=1980)return 'goal';if(r.ran>=1870)return 'duel';if(r.ran>=1760)return 'home';if(r.ran>=1330)return 'turn2';if(r.ran>=1110)return 'approach';if(r.ran>=760)return 'parade';if(r.ran>=210)return 'bend';return 'opening';}
function requiredFov(eye,target,rows,aspect){const forward=D.norm(D.sub(eye,target)),right=D.norm(D.cross([0,1,0],forward)),up=D.cross(forward,right);let tangent=.012;for(const r of rows)for(const x of [-.65,.65])for(const y of [0,2.85])for(const z of [-1.7,1.7]){const v=D.sub([r.x+x,y,r.z+z],eye),depth=-D.dot(v,forward);if(depth<=.5)return 1.6;tangent=Math.max(tangent,Math.abs(D.dot(v,right))/(depth*aspect*.84),Math.abs(D.dot(v,up))/(depth*.70));}return 2*Math.atan(tangent);}
const labels={finishLine:'ゴールライン',runin:'直線からゴールへ',introduce:'先頭から隊列紹介',opening:'発走・先行争い',bend:'コーナーから隊列紹介',parade:'向正面・各馬の位置',approach:'接近する馬群',turn2:'最後のコーナー',home:'直線・追い上げ',duel:'先着争い',goal:'ゴールへ',winner:'ゴール後',front:'前方から',high:'上空から',rear:'後方から',side:'横から',wide:'隊列全体'};
class Director{
 constructor(){this.reset();}
 reset(){this.shot=null;this.lastTime=-1;this.serial=0;this.mode='';this.focus=0;this.history=[];}
 choose(rows,kind){if(kind==='runin'){if(rows[0].finished)return rows.filter(r=>!r.fallen).sort((a,b)=>Math.abs(a.ran-2000)-Math.abs(b.ran-2000)).slice(0,5);return rows.slice(0,5).filter((r,i)=>i<2||rows[0].ran-r.ran<25);}if(kind==='winner')return rows.slice(0,2);if(kind==='wide'||kind==='opening')return rows;if(kind==='home')return rows.filter(r=>rows[0].ran-r.ran<35).slice(0,8);if(kind==='goal')return rows.filter(r=>rows[0].ran-r.ran<18).slice(0,4);if(kind==='duel'){const close=rows.filter(r=>rows[0].ran-r.ran<12);return close.length>1?close.slice(0,4):rows.slice(0,3);}return rows;}
 subjects(rows,s,time){if(s.kind==='finishLine')return rows.filter(r=>!r.finished&&r.ran>1970).concat([D.course(D.S/2)]);if(s.kind==='runin'&&!s.focus)return this.choose(rows,'runin');if(s.focus)return [rows.find(r=>r.number===s.focus)||rows[0]];const ordered=s.ids.map(n=>rows.find(r=>r.number===n)).filter(Boolean),ran=rows[0].ran;
 if(s.kind==='introduce'||s.kind==='field'){
  const age=Math.max(0,time-s.at),segment=Math.floor(age/8);
  const group=[.5,.87,.13],from=group[segment%3],to=group[(segment+1)%3];
  const cursor=s.kind==='introduce'?Math.min(ordered.length-1,age/s.introStep):
   (ordered.length-1)*D.mix(from,to,D.smooth(D.clamp((age%8-5)/3,0,1)));
  const weighted=ordered.map((r,i)=>({r,w:Math.pow(Math.max(0,1-Math.abs(i-cursor)/2.2),2)}));
  const sum=weighted.reduce((v,a)=>v+a.w,0)||1,target=[0,1.35,0];let ran=0;
  for(const a of weighted){target[0]+=a.r.x*a.w/sum;target[2]+=a.r.z*a.w/sum;ran+=a.r.ran*a.w/sum;}
  const pack=weighted.filter(a=>a.w>.10).map(a=>a.r);
  return {target,pack:pack.length?pack:[ordered[0]],ids:pack.map(r=>r.number),ran};
 }
 if(['bend','parade','turn2'].includes(s.kind)){
  let index=1;
  if(s.kind==='bend'||s.kind==='parade')index=D.mix(1,ordered.length-2,D.smooth(ran/1120));
  if(s.kind==='turn2')return rows.filter(r=>rows[0].ran-r.ran<(ran<1540?95:65));
  // The camera scans stable horse IDs; entering/leaving the window eases the target and lens.
  const weighted=ordered.map((r,i)=>({r,w:Math.max(0,1-Math.abs(i-index)/2.1)})),sum=weighted.reduce((v,a)=>v+a.w,0),target=[0,1.35,0];for(const a of weighted){target[0]+=a.r.x*a.w/sum;target[2]+=a.r.z*a.w/sum;}
  const active=weighted.filter(a=>a.w>.25).map(a=>a.r);return {target,pack:weighted.map(a=>({...a.r,x:D.mix(target[0],a.r.x,a.w),z:D.mix(target[2],a.r.z,a.w)})),ids:active.map(r=>r.number)};
 }
 return ordered.length?ordered:rows.slice(0,1);
 }
 view(time,rows,mode='auto',focus=0,aspect=1.65,goalCountdown=null,commentaryNumber=0){const remaining=goalCountdown===null?(Number.isFinite(rows[0].finish)?rows[0].finish-Math.max(0,time-1):Infinity):goalCountdown;const p=rows.every(r=>r.finished)?'winner':remaining<=1&&remaining>-60?'goal':phase(rows)==='goal'?'duel':phase(rows),seek=this.lastTime<0||time<this.lastTime-.01||time-this.lastTime>.8,changed=mode!==this.mode||focus!==this.focus,resized=this.aspect!==undefined&&Math.abs(this.aspect-aspect)>.001;let kind=mode==='auto'?(['bend','parade'].includes(p)?'introduce':p):mode;
 if(mode==='auto'&&goalCountdown!==null&&(rows[0].finished||remaining<=7))kind='runin';
 else if(mode==='auto'&&['home','duel','goal'].includes(kind))kind='runin';
 if(mode==='auto'&&!focus&&['approach','turn2'].includes(kind))kind='field';
 // If the leader is isolated, retain the wider straight shot rather than inventing a duel.
 if(kind==='duel'&&rows[0].ran-rows[1].ran>12)kind='home';
 const cut=!this.shot||seek||changed||this.shot.kind!==kind;
 if(cut){const previous=!seek&&!changed&&this.shot?{eye:this.shot.eye.slice(),target:this.shot.target.slice(),fov:this.shot.fov}:null;const pack=focus?[rows.find(r=>r.number===focus)||rows[0]]:this.choose(rows,kind),ran=rows[0].ran;let stationS,outside,height;
 if(kind==='opening'){stationS=D.S/2+370;outside=48;height=12;}
 else if(kind==='introduce'){stationS=D.S/2+ran/2000*D.L;outside=28;height=7;}
 else if(kind==='bend'){stationS=D.S+Math.PI*D.R+65;outside=48;height=14;}
 else if(kind==='parade'){stationS=D.S+Math.PI*D.R+D.S/2;outside=48;height=7;}
 else if(kind==='approach'){stationS=2*D.S+Math.PI*D.R+95;outside=24;height=7;}
 else if(kind==='turn2'){stationS=D.L+40;outside=80;height=25;}
 else if(['home','duel','goal'].includes(kind)){stationS=D.S/2+30;outside=kind==='home'?90:kind==='duel'?42:60;height=kind==='home'?21:kind==='duel'?11:16;}
 else{stationS=D.S/2+ran/2000*D.L;outside=mode==='wide'?110:mode==='high'?60:35;height=mode==='high'?45:mode==='wide'?34:6;}
 const station=D.course(stationS,outside);const ids=kind==='parade'&&this.shot?.kind==='bend'?this.shot.ids.slice():pack.map(r=>r.number);this.shot={id:++this.serial,kind,at:time,introStep:D.clamp((1110-ran)/Math.max(1,ran/Math.max(1,time-1))/Math.max(1,ids.length),.9,2.8),ids,focus,eye:[station.x,height,station.z],target:center(pack),fov:.6,entry:['field','runin'].includes(kind)?previous:null};
 }
 const s=this.shot,plan=this.subjects(rows,s,time),pack=Array.isArray(plan)?plan:plan.pack,dt=seek?0:D.clamp(time-this.lastTime,0,.15),k=1-Math.exp(-dt*(s.kind==='introduce'?8:3));
 const named=mode==='auto'&&!focus?rows.find(r=>r.number===commentaryNumber&&!pack.includes(r)):null;
 const framed=named?pack.concat(named):pack;
 const target=Array.isArray(plan)?center(framed):plan.target.slice();
 let trackingDistance=plan.ran;
 if(named&&(s.kind==='field'||s.kind==='introduce')){
  target[0]=D.mix(target[0],named.x,.6);target[2]=D.mix(target[2],named.z,.6);
  trackingDistance=D.mix(trackingDistance,named.ran,.6);
 }
 if(s.kind==='runin'){const finish=D.course(D.S/2),direction=finish.dx,limit=finish.x*direction+3;target[0]=direction*(limit-8*Math.log1p(Math.exp(D.clamp((limit-target[0]*direction)/8,-60,60))));}
 if(cut)s.target=target.slice();else s.target=s.target.map((v,i)=>D.mix(v,target[i],k));
 // A lateral tracking shot supports the long field introduction; other automatic stations stay put.
 if(s.kind==='parade'||['side','front','rear','high','wide','winner'].includes(s.kind)||focus){const mean=Number.isFinite(plan.ran)?plan.ran:pack.reduce((v,r)=>v+r.ran,0)/pack.length,advance=s.kind==='front'?65:s.kind==='rear'?-65:s.kind==='winner'?9:0,offset=s.kind==='winner'?13:focus?25:s.kind==='wide'?110:s.kind==='high'?60:26,pt=D.course(D.S/2+mean/2000*D.L+advance,offset),eye=[pt.x,s.kind==='winner'?3.6:s.kind==='wide'?34:s.kind==='high'?45:focus?5:7,pt.z];s.eye=cut?eye:s.eye.map((v,i)=>D.mix(v,eye[i],k));}
 if(!focus&&(s.kind==='introduce'||s.kind==='field')){
  const station=D.course(D.S/2+trackingDistance/2000*D.L,32);
  const eye=[station.x,10,station.z];
  s.eye=cut?eye:s.eye.map((v,i)=>D.mix(v,eye[i],k));
 }
 if(s.kind==='finishLine'){const finish=D.course(D.S/2);s.eye=[finish.x,10,finish.z+37];}
 if(s.kind==='runin'){const finish=D.course(D.S/2);s.eye=[finish.x,28,finish.z+85];
 // A high broadcast station pans across the straight, then gently settles over the line.
 }
 const framePack=s.kind==='goal'?framed.concat([{x:D.course(D.S/2).x,z:D.course(D.S/2).z}]):framed;
 let framing=1.08;
 if(s.kind==='runin'&&!focus){
  const gap=Math.abs(rows[0].ran-rows[1].ran)*D.L/2000;
  const duel=rows[0].finished?0:D.smooth(D.clamp((4.2-gap)/2.8,0,1));
  // Tighten the lens without moving the camera or cropping the framed runners.
  framing=D.mix(1.15,1.02,duel);
 }
 const needed=D.clamp(requiredFov(s.eye,s.target,framePack,aspect)*framing,.025,1.5),zoom=1-Math.exp(-dt*2.5);s.fov=s.kind==='goal'?D.clamp(2*Math.atan(Math.tan(.45/2)*1.65/aspect),.40,.95):(cut||resized?needed:D.mix(s.fov,needed,s.kind==='introduce'&&needed>s.fov?Math.max(.35,zoom):zoom));
 this.lastTime=time;this.mode=mode;this.focus=focus;this.aspect=aspect;
 const introIndex=s.kind==='introduce'?Math.floor((time-s.at)/(s.introStep||2.8)):-1,introNumber=introIndex>=0&&introIndex<s.ids.length?s.ids[introIndex]:0;
 const blend=s.entry?D.smooth((time-s.at)/1.2):1,outEye=s.entry?s.eye.map((v,i)=>D.mix(s.entry.eye[i],v,blend)):s.eye.slice(),outTarget=s.entry?s.target.map((v,i)=>D.mix(s.entry.target[i],v,blend)):s.target.slice(),outFov=s.entry?D.mix(s.entry.fov,s.fov,blend):s.fov;
 return {introNumber,eye:outEye,target:outTarget,fov:outFov,label:focus?'注目馬を追う':s.kind==='field'?'馬群を追う':labels[s.kind],shot:s.id,cut:cut&&!s.entry,subjects:framed.map(r=>r.number),phase:p};
 }
}
return {Director,phase,requiredFov};
});
