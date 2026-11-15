(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.HorseDaysElevation=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// The current course mesh has no elevation; do not show a fabricated hill profile.
const currentCourse={distance:2000,points:[[0,0],[2000,0]]};
function heightAt(profile,distance){const p=profile.points,d=Math.max(0,Math.min(profile.distance,distance));for(let i=1;i<p.length;i++)if(d<=p[i][0]){const a=p[i-1],b=p[i],u=(d-a[0])/(b[0]-a[0]||1);return a[1]+(b[1]-a[1])*u;}return p[p.length-1][1];}
function state(profile,distance){const d=Math.max(0,Math.min(profile.distance,distance)),ys=profile.points.map(p=>p[1]),gradient=(heightAt(profile,Math.min(profile.distance,d+8))-heightAt(profile,Math.max(0,d-8)))/(Math.min(profile.distance,d+8)-Math.max(0,d-8)||1);return {distance:d,progress:d/profile.distance,height:heightAt(profile,d),range:Math.max(...ys)-Math.min(...ys),slope:gradient>.002?'上り':gradient<-.002?'下り':'平坦'};}
class Display{
 constructor(root,profile=currentCourse){this.root=root;this.profile=profile;this.canvas=root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.caption=root.querySelector('.elevation-caption');}
 draw(runner,focused){const s=state(this.profile,runner.ran),caption='高低差 '+s.range.toFixed(1)+'m　'+s.slope;this.caption.textContent=caption;this.root.setAttribute('aria-label',caption+'・'+(focused?runner.number+'番':'先頭')+'の現在位置');const c=this.canvas,w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d);}const ctx=this.ctx;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);const min=Math.min(...this.profile.points.map(p=>p[1])),span=Math.max(1,s.range),xy=(dist,y)=>[6+(w-12)*dist/this.profile.distance,h-7-(y-min)/span*(h-14)];
 ctx.beginPath();this.profile.points.forEach((p,i)=>{const q=xy(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.strokeStyle='#b5e6a4';ctx.lineWidth=1.8;ctx.lineJoin='round';ctx.stroke();
 const [x,y]=xy(s.distance,s.height);ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#ffe36e';ctx.shadowColor='#ffe36e';ctx.shadowBlur=4;ctx.fill();ctx.shadowBlur=0;
 }
}
return {currentCourse,heightAt,state,Display};
});
