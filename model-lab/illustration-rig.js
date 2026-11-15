(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HorseIllustrationRig=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function leg(hip,target,upper,lower,bend){
 const dx=target[0]-hip[0],dy=target[1]-hip[1],d=clamp(Math.hypot(dx,dy),.001,upper+lower-.001),base=Math.atan2(dy,dx);
 const a=Math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1));
 return {hip:hip.slice(),knee:[hip[0]+Math.cos(base+bend*a)*upper,hip[1]+Math.sin(base+bend*a)*upper],ankle:target.slice()};
}
function sample(time,running=true){
 const cycle=((time*2.25)%1+1)%1,bob=running?-2-2*Math.sin(TAU*cycle-.6):0;
 const phases=[0,.12,.51,.63],out=[];
 for(let i=0;i<4;i++){
  const front=i<2,hip=[front?43:-64,running?(front?-51:-53):(front?-58:-60)],u=(cycle+phases[i])%1,planted=running?u<.30:true;
  let x=front?(i===0?3:-13):(i===2?-6:10),y=0;
  if(running){if(planted)x=22-44*(u/.30);else{const q=(u-.30)/.70,e=q*q*(3-2*q);x=-22+44*e;y=-26*Math.sin(Math.PI*q);}}
  const foot=[hip[0]+x,y-bob],ankle=[foot[0],foot[1]-5];
  const v=leg(hip,ankle,front?30:32,26,front?-1:1);out.push({...v,foot,planted,front,phase:u});
 }
 return {bob,legs:out,head:running?Math.sin(TAU*cycle+.5)*.018:Math.sin(time*1.4)*.009,tail:running?Math.sin(TAU*cycle+.7)*.10:Math.sin(time*1.8)*.04,rider:running?Math.sin(TAU*cycle)*1.2:0};
}
return {sample,leg};
});
