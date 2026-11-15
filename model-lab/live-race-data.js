// HORSEDAYS_COURSES_V8: lanes use physical horse spacing rather than Unity visual lane width.
// HORSEDAYS_REAL_COURSE_V7: the live horse lanes use the same physical metres as the rails.
(function(g,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else g.HorseDaysLiveData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function valid(s){return !!(s&&Number.isFinite(s.distance)&&s.distance>0&&Number.isFinite(s.time)&&Array.isArray(s.runners)&&s.runners.length>=2&&s.runners.length<=18&&s.runners.every(r=>Number.isInteger(r.number)&&r.number>=1&&r.number<=18&&Number.isFinite(r.ran)&&Number.isFinite(r.lane)&&Number.isFinite(r.progress)));}
function frameColor(number,count){return Math.min(8,count<=8?number:count<=16?Math.ceil(number/2):number<=2*(8-(count-16))?Math.ceil(number/2):(8-(count-16))+Math.ceil((number-2*(8-(count-16)))/3));}
function isDirt(frame){return typeof frame?.dirt==='boolean'?frame.dirt:/・ダート/.test(frame?.courseName||'');}
class Feed{
 constructor(){this.current=null;this.previous=null;this.history=[];this.received=0;this.interval=80;this.clock=null;this.clockAt=0;}
 alpha(now){return this.current&&this.previous?Math.max(0,Math.min(1,(this.time(now)-this.previous.time)/Math.max(.001,this.current.time-this.previous.time))):1;}
 time(now){const s=this.current;if(!s)return 0;if(s.paused||s.countdown>0){this.clock=s.time;this.clockAt=now;return s.time;}const rate=Math.max(.1,s.rate||1),target=s.time+Math.min(.10,Math.max(0,(now-this.received)/1000))*rate-.14*rate;
  if(this.clock===null)this.clock=s.time;const dt=Math.max(0,Math.min(.25,(now-this.clockAt)/1000)),pred=this.clock+dt*rate,error=target-pred;this.clockAt=now;
  if(s.endsBroadcast){this.clock=Math.min(s.time,pred);return this.clock;}
  this.clock=Math.max(this.clock,Math.min(s.time+.10*rate,pred+Math.max(-dt*rate*.45,Math.min(dt*rate*.45,error*dt*2))));return this.clock;
 }
 sample(now){const s=this.current;if(!s)return null;if(s.paused||s.countdown>0)return s;const time=this.time(now),h=this.history;if(s.endsBroadcast&&time>=s.time)return s;let a=h[0],b=h[h.length-1];for(let i=1;i<h.length;i++)if(h[i].time>=time){a=h[i-1];b=h[i];break;}
  if(time>b.time&&h.length>1){a=h[h.length-2];b=h[h.length-1];}if(!a||!b)return s;
  const span=b.time-a.time,u=span>.00001?Math.max(0,Math.min(1.5,(time-a.time)/span)):1;
  const runners=b.runners.map(r=>{const q=a.runners.find(q=>q.number===r.number);if(!q)return r;return {...r,x:Number.isFinite(q.x)&&Number.isFinite(r.x)?q.x+(r.x-q.x)*u:r.x,z:Number.isFinite(q.z)&&Number.isFinite(r.z)?q.z+(r.z-q.z)*u:r.z,ran:q.ran+(r.ran-q.ran)*u,lane:q.lane+(r.lane-q.lane)*Math.min(1,u),progress:Math.max(0,Math.min(1,q.progress+(r.progress-q.progress)*u)),finished:u>=1?r.finished:q.finished};});
  const order=runners.slice().sort((x,y)=>x.finished&&y.finished?x.rank-y.rank:y.ran-x.ran);order.forEach((r,i)=>r.rank=i+1);return {...s,time,runners};
 }
 accept(s,now){if(!valid(s))return false;const old=this.current,reset=!old||s.distance!==old.distance||s.clockwise!==old.clockwise||s.runners.length!==old.runners.length||s.time<old.time-.01;
  this.previous=reset?null:old;this.interval=old?Math.max(50,Math.min(240,now-this.received)):80;this.current=s;this.received=now;
  if(reset){this.history=[s];this.clock=s.time;this.clockAt=now;}else if(this.history[this.history.length-1]?.time===s.time)this.history[this.history.length-1]=s;else{this.history.push(s);if(this.history.length>12)this.history.shift();}return true;
 }

 rows(now,D){const s=this.sample(now);if(!s)return [];const count=s.runners.length,leaderRan=Math.max(...s.runners.filter(r=>!r.fallen).map(r=>r.ran)),bodyLength=s.bodyLength||2.8/.15,spacing=2.8/bodyLength*2000/D.L,scale=2000/s.distance;
 // Ease out of the compressed midrace formation before the leader reaches the line.
 // After that point, a horse still racing has its own position and speed.
 const straightStart=Math.min(.95,s.straight??.8)*s.distance;
 const closing=Math.max(0,Math.min(1,(leaderRan-straightStart)/Math.max(1,s.distance-straightStart)));
 const blend=closing*closing*(3-2*closing);
 const gapScale=spacing+(scale-spacing)*blend;
 const anchor=leaderRan*scale;
 return s.runners.map(r=>{const ran=r.ran,lane=r.lane,visualRan=anchor-(leaderRan-ran)*gapScale,offset=Math.max(-((D.trackWidthMeters/2-.8)/D.visualScale),Math.min((D.trackWidthMeters/2-.8)/D.visualScale,(lane-(s.laneCenter??(count-1)/2))*(s.visualLaneSpacingMeters||1.15)/D.visualScale)),point=D.course(D.S/2+visualRan/2000*D.L,offset),frame=frameColor(r.number,count);
 return {...point,number:r.number,name:r.name,ran:visualRan,actualRan:ran,progress:r.progress,rank:r.rank,finished:r.finished,fallen:r.fallen,dashing:!!r.dashing,finish:Number.POSITIVE_INFINITY,lane:offset,trackHalfWidth:(D.trackWidthMeters/2)/D.visualScale,appearance:Math.abs(r.appearance||0)%8,appearanceSeed:Math.abs(r.appearance||0),coatHex:r.coatHex,silkAccent:r.silkAccent,silkPattern:r.silkPattern,silk:r.silkHex|| (r.silk>0&&r.silk<=8?['#ffb81a','#ff0000','#00ffff','#00ff00','#ff00ff','#ffffff','#ff801a','#6666ff'][r.silk-1]:D.silks[frame-1])};}).sort((a,b)=>a.rank-b.rank);
 }
}
return {Feed,valid,frameColor,isDirt};
});
