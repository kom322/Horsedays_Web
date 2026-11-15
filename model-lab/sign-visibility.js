(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.HorseDaysSignVisibility=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
// Segment / expanded box: retain a margin for the complete horse and rider, not just its centre.
function blocks(eye,horse,bounds){const target=[horse.x,1.4,horse.z],padding=[1.9,1.7,1.9];let enter=0,leave=1;for(let i=0;i<3;i++){const delta=target[i]-eye[i],low=bounds.min[i]-padding[i],high=bounds.max[i]+padding[i];if(Math.abs(delta)<1e-8){if(eye[i]<low||eye[i]>high)return false;continue;}let a=(low-eye[i])/delta,b=(high-eye[i])/delta;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);leave=Math.min(leave,b);if(enter>leave)return false;}return leave>0&&enter<.995;}
function hidden(eye,visibleHorses,bounds){return visibleHorses.some(horse=>blocks(eye,horse,bounds));}
return {blocks,hidden};
});
