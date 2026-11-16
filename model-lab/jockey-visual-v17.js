/* HorseDays v17: near-camera rider face, helmet, goggles, and stable rider posture.
 * Visual-only: derives profile from a stable jockey identifier, not the horse's number.
 * All geometry uses the existing 13-float WebGL1 vertex format. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.HorseDaysJockeyVisualV17=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function hash(value){let h=2166136261;for(const ch of String(value||'guest'))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;}
 // Prefer Unity's jockey ID; when an older build lacks it, use the jockey name.
 function identity(row){return String(row?.riderId||row?.riderName||'guest-rider');}
 function trait(id,shift){const n=hash(id);return ((n>>shift)&255)/255;}
 function profile(id){return Object.freeze({
  face:trait(id,1),height:trait(id,9),helmet:trait(id,17),goggles:trait(id,5),
  crouch:trait(id,13),temper:trait(id,21)
 });}
 function lean(row){const p=profile(identity(row));return .86+p.crouch*.32;}
 function styleLabel(style){return ({Escape:'逃げ型',BoldEscape:'積極逃げ',Press:'先行型',Closer:'差し型',DeepCloser:'追込型',Natural:'自在型'})[String(style||'')]||'';}
 function attack(style,dashing,remaining){
  const s=String(style||'');
  const natural=s==='Escape'||s==='BoldEscape'?.32:s==='Press'?.27:s==='DeepCloser'||s==='Closer'?.19:.23;
  const closing=clamp((600-Math.max(0,remaining))/520,0,1);
  return clamp(natural+(dashing?.33:0)+closing*.32,0,1);
 }
 function build(M){
  const a=[],skin='#cda27e',dark='#252b31',silk='#f7f4e9';
  function shape(center,size,color,material,rotation=[0,0,0]){
   M.emit(M.small,M.matrix(center,rotation,size),M.tint(color),a,15,material);
  }
  function strip(start,end,width,color,material){
   const d=end.map((v,i)=>v-start[i]),len=Math.hypot(...d),mid=start.map((v,i)=>(v+end[i])*.5);
   const rx=Math.atan2(d[2],d[1]),rz=-Math.atan2(d[0],Math.hypot(d[1],d[2]));
   shape(mid,[width,len*.5,width],color,material,[rx,0,rz]);
  }
  // Helmet crown, near-front brim, central ridge, and side fasteners.
  shape([0,2.153,.183],[.145,.094,.139],silk,12);
  shape([0,2.108,.306],[.152,.016,.094],dark,14);
  strip([0,2.232,.120],[0,2.225,.276],.012,silk,16);
  for(const side of [-1,1]){
   shape([side*.135,2.132,.203],[.018,.047,.082],silk,12);
   // Face and goggle details are attached to the jockey's head, not to the horse.
   shape([side*.058,2.057,.359],[.057,.028,.020],dark,14);
   shape([side*.058,2.058,.374],[.044,.019,.011],'#6e92a3',13);
   shape([side*.104,2.058,.359],[.013,.014,.018],dark,14);
   shape([side*.106,2.016,.292],[.024,.035,.027],skin,11);
   strip([side*.135,2.116,.213],[side*.071,1.981,.333],.009,dark,14);
   shape([side*.142,2.120,.213],[.017,.021,.017],silk,15);
  }
  // Nose profile, chin and cheeks are individually shaded per jockey ID in the fragment shader.
  shape([0,2.017,.362],[.031,.055,.034],skin,11,[-.13,0,0]);
  shape([0,1.967,.324],[.073,.028,.051],skin,11);
  shape([0,1.985,.373],[.042,.012,.014],skin,11);
  if(a.length%13!==0)throw Error('v17 rider geometry stride mismatch');
  return new Float32Array(a);
 }
 return {hash,identity,profile,lean,attack,styleLabel,build};
});
