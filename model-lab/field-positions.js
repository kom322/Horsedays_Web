(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.HorseDaysFieldPositions=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const colors=['#faf9ee','#24272b','#db3638','#3379d1','#f1d343','#36a05a','#e99032','#e792b2'];
function layout(rows,width,height,projection={}){
 if(!rows.length)return [];
 const radius=width<400?11.5:13,left=27+radius,right=width-radius-17,top=radius+6,bottom=height-radius-6;
 // Use the same longitudinal and lateral coordinates as the rendered horses.
 const distance=r=>Number.isFinite(r.ran)?r.ran:r.actualRan,leader=Math.max(...rows.map(distance)),last=Math.min(...rows.map(distance)),span=projection.span||Math.max(35,leader-last)*1.06;
 const half=Math.max(4,...rows.map(r=>r.trackHalfWidth||12));
 return rows.map(r=>({...r,x:right-(leader-distance(r))*(right-left)/span,y:bottom-(Math.max(-half,Math.min(half,r.lane))+half)*(bottom-top)/(2*half),radius}));
}
class Display{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.last=-1;this.span=null;}
 draw(rows,frames,focus,cue,time){const canvas=this.canvas,w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio||1,2),ctx=this.ctx;if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}
 ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
 ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillStyle='#9dab99';ctx.fillText('外',4,16);ctx.fillText('内',4,h-8);
 const values=rows.map(r=>Number.isFinite(r.ran)?r.ran:r.actualRan),desired=Math.max(35,Math.max(...values)-Math.min(...values))*1.06,reset=this.last<0||time<this.last||time-this.last>1,dt=reset?0:Math.min(.15,Math.max(0,time-this.last));
 this.span=reset||this.span===null?desired:this.span+(desired-this.span)*(1-Math.exp(-dt*2));this.last=time;
 const points=layout(rows,w,h,{span:this.span}).sort((a,b)=>(a.number===cue?2:a.number===focus?1:0)-(b.number===cue?2:b.number===focus?1:0));for(const p of points){const x=p.x,y=p.y;const frame=frames[p.number-1]||1,r=p.radius;
 ctx.fillStyle=colors[frame-1];ctx.beginPath();ctx.moveTo(x+r-1,y-4);ctx.lineTo(x+r+5,y);ctx.lineTo(x+r-1,y+4);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=p.number===cue?2.5:p.number===focus?2.5:1.2;ctx.strokeStyle=p.number===cue?'#ffe38a':p.number===focus?'#8fe7ff':'#e5e7d3';ctx.stroke();
 if(p.number===cue||p.number===focus){ctx.beginPath();ctx.arc(x,y,r+3,0,Math.PI*2);ctx.lineWidth=1;ctx.strokeStyle=p.number===cue?'#ffe38a99':'#8fe7ff99';ctx.stroke();}
 ctx.font='800 '+Math.max(8,Math.min(14,r*1.2))+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=[1,5,7,8].includes(frame)?'#172019':'#fff';ctx.fillText(String(p.number),x,y+.5);}
 }
}
return {layout,Display,colors};
});
