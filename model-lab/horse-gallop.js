(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.HorseDaysGallop=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
class Motion {
 constructor(){this.horses=new Map();this.time=null;}
 update(rows,time){const jump=this.time===null||time<this.time||time-this.time>1,delta=jump?0:Math.max(0,time-this.time);this.time=time;
 for(const r of rows){let s=this.horses.get(r.number);if(!s||jump)s={phase:time*14.8+r.number*.8,dash:r.dashing?1:0};const target=r.dashing&&!r.finished?1:0;s.dash+=(target-s.dash)*(1-Math.exp(-delta*7));s.phase+=delta*(14.8+4.5*s.dash);this.horses.set(r.number,s);}return this.horses;}
}
return {Motion};});
