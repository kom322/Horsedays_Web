/* HORSEDAYS_JOCKEY_VISUAL_V17: independent knee/forearm joints and visor-compatible rider parts. */
/* HorseDays v5: frame-colored saddlecloth/horse number and complete rider limbs.
 * Generated geometry uses the exact 13-float vertex layout of race3d.js.
 * Exported as a plain function for static/Node regression testing.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.HorseDaysRaceAccessories=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 function build(M){
  const out=[];
  const color=M.tint;
  function limb(a,b,radius,hex,material,bone){
   const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),mid=a.map((v,i)=>(v+b[i])*.5);
   const tilt=[Math.atan2(d[2],d[1]),0,-Math.atan2(d[0],Math.hypot(d[1],d[2]))];
   M.emit(M.small,M.matrix(mid,tilt,[radius,length*.5+radius*.25,radius]),color(hex),out,bone,material);
  }
  function cuff(p,radius,hex,material,bone){M.emit(M.small,M.matrix(p,[0,0,0],[radius,radius,radius]),color(hex),out,bone,material);}
  // Construct anatomically separate upper/lower arms and thighs, calves, gloves, boots.
  // A subtle vertex animation (aB=12 for arms, 13 for legs) follows the rider's balance.
  for(const side of [-1,1]){
   const shoulder=[side*.14,2.19,.04],elbow=[side*.23,2.04,.26],hand=[side*.18,1.92,.51];
   limb(shoulder,elbow,.065,'#f5ebdb',4,12);
   limb(elbow,hand,.052,'#f5ebdb',4,14);
   cuff(hand,.047,'#d3a280',0,14);
   const hip=[side*.13,1.95,-.17],knee=[side*.31,1.69,.02],heel=[side*.34,1.44,-.09];
   limb(hip,knee,.092,'#efefe5',0,13);
   limb(knee,heel,.067,'#302d2b',0,17);
   cuff([side*.34,1.43,-.05],.08,'#242321',0,17);
  }
  // The cloth is always double-sided: the outside of either flank carries the same horse number.
  // The cloth hue follows its frame (waku) and the numeral follows its actual runner number (umaban).
  function panel(side,x0,y0,y1,z0,z1,material){
   const points=[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]];
   const uvs=[[0,1],[0,0],[1,0],[1,1]];
   for(const i of [0,1,2,0,2,3]){
    const p=points[i],uv=uvs[i],uvx=side>0?uv[0]:1-uv[0];
    out.push(p[0],p[1],p[2],side,0,0,1,1,1,0,material,uvx,uv[1]);
   }
  }
  for(const side of [-1,1]){
   // Dark piping, colored body, thin trim, central numeral; all independent of horse texture.
   panel(side,side*.411,1.16,1.55,-.55,-.01,0);
   panel(side,side*.414,1.185,1.525,-.525,-.035,10);
   panel(side,side*.417,1.22,1.50,-.43,-.16,6);
  }
  if(out.length%13)throw Error('Accessory vertex layout invalid');
  return new Float32Array(out);
 }
 return {build};
});
