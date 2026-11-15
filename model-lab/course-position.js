(function(g,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else g.HorseDaysCoursePosition=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function projection(points,width,height){const xs=points.map(p=>p.x),zs=points.map(p=>p.z),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2,scale=Math.min((width-16)/Math.max(1,Math.max(...xs)-Math.min(...xs)),(height-14)/Math.max(1,Math.max(...zs)-Math.min(...zs)));return p=>[width/2+(p.x-cx)*scale,height/2-(p.z-cz)*scale];}
class Display{
 constructor(stage){this.root=document.createElement('aside');this.root.id='course-position';this.root.setAttribute('aria-label','コース上の現在位置');this.caption=document.createElement('span');this.canvas=document.createElement('canvas');this.root.append(this.caption,this.canvas);stage.append(this.root);this.ctx=this.canvas.getContext('2d');}
 draw(s,focus){if(!Array.isArray(s.course)||s.course.length<3)return;const c=this.canvas,w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d);}const ctx=this.ctx,xy=projection(s.course,w,h);ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);ctx.beginPath();s.course.forEach((p,i)=>{const q=xy(p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.strokeStyle=HorseDaysLiveData.isDirt(s)?'#d7ab77':'#8ac77b';ctx.lineWidth=4;ctx.stroke();
 const lead=s.runners.find(r=>r.rank===1)||s.runners[0],target=s.runners.find(r=>r.number===focus)||lead;
 for(const r of s.runners){const p=xy(r);ctx.fillStyle=r===target?'#ffe267':'#d8e7d1';ctx.beginPath();ctx.arc(...p,r===target?3.5:1.5,0,Math.PI*2);ctx.fill();}
 if(s.goal){const q=xy(s.goal);ctx.fillStyle='#fff';ctx.fillRect(q[0]-2,q[1]-4,4,8);}
 this.caption.textContent=focus?target.number+'番の現在位置':'先頭の現在位置';this.root.setAttribute('aria-label',this.caption.textContent+'・'+s.venue+'・'+(s.clockwise?'右回り':'左回り'));
 }
 drawDemo(rows,D,focus){this.draw({course:Array.from({length:97},(_,i)=>D.course(i*D.L/96)),runners:rows,goal:D.course(D.S/2),venue:'試走コース',clockwise:true},focus);}
}
return {Display,projection};
});
