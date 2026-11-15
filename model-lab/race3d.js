'use strict';
(async()=>{
const LIVE=window.HorseDaysLiveRace;
const D=HorseDaysSolid,M=HorseDaysSolidModel,$=id=>document.getElementById(id),canvas=$('race3d'),stage=$('race-stage');
const TRACK_SCALE=.5;const sceneProject=(vp,p,w,h)=>D.project(vp,[p[0]*TRACK_SCALE,p[1],p[2]*TRACK_SCALE],w,h);
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'high-performance'});if(!gl){$('error').hidden=false;$('error').textContent='立体表示を開けませんでした。SafariやChromeで開き直してください。';return;}
const vs=`attribute vec3 aP,aN,aC;
attribute float aB,aM;
attribute vec2 aUV;
uniform mat4 uVP,uRoot;
uniform float uT,uHorse,uRun,uDash,uShadow,uGaitStyle,uGaitDetail;
uniform mediump float uOutline;
varying vec3 vC;
varying float vM,vFog,vLight;
varying vec2 vUV;
varying vec3 vLocal,vWorld,vNormal;
const float TAU=6.28318530718;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
float easing(float x){x=clamp(x,0.,1.);return x*x*(3.-2.*x);}
// Two-link sagittal joint: maintains a coherent elbow/knee trajectory as the hoof swings.
vec2 jointIK(vec2 h,vec2 f,float front){
 vec2 d=f-h;
 float distance=clamp(length(d),.16,1.145);
 vec2 axis=d/max(length(d),.001);
 float upper=.59,lower=.57;
 float along=(upper*upper-lower*lower+distance*distance)/(2.*distance);
 float lateral=sqrt(max(.0001,upper*upper-along*along));
 vec2 perp=vec2(-axis.y,axis.x);
 return h+axis*along+perp*lateral*(front>.5?1.:-1.);
}
vec3 bendLimb(vec3 p,float front,float side,float leg,float phase,float bodyRise){
 // Right / left lead alternates the limb order; gallop has four separate contacts and a suspension interval.
 float rightLead=step(0.,uGaitStyle);
 float contact=front>.5?(side>.5?mix(.36,.53,rightLead):mix(.53,.36,rightLead))
                           :(side>.5?mix(.15,.0,rightLead):mix(.0,.15,rightLead));
 float cycle=fract(phase/TAU-contact+1.);
 float stance=.285;
 float stride=.18+.055*uDash;
 float footZ,footY;
 if(cycle<stance){
   float s=cycle/stance;
   footZ=mix(stride,-stride,easing(s));
   footY=.068-bodyRise;
 }else{
   float s=(cycle-stance)/(1.-stance);
   footZ=mix(-stride,stride,easing(s));
   float swingArc=sin(3.14159265*s);
   footY=.068+.27*swingArc*swingArc-bodyRise;
 }
 float x=mix(-.177,.177,side);
 float shoulderY=front>.5?1.14:1.17;
 float rootZ=front>.5?.32:-1.045;
 float neutralZ=front>.5?.34:-1.095;
 vec2 hip=vec2(shoulderY,rootZ);
 vec2 foot=vec2(footY,neutralZ+footZ);
 vec2 knee=jointIK(hip,foot,front),baseKnee=jointIK(hip,vec2(.068,neutralZ),front);
 // Knee/mid-limb and hoof are influenced separately; hip vertices remain fixed to the torso.
 float kneeWeight=easing((p.y-.12)/.48)*(1.-easing((p.y-.65)/.50));
 float hoofWeight=1.-easing((p.y-.14)/.55);
 vec3 transformed=p;
 transformed.yz+=kneeWeight*(knee-baseKnee)+hoofWeight*(foot-vec2(.068,neutralZ));
 // Soft forearm/upper-thigh flex: keeps joints from looking like rubber tubes.
 transformed.x+=(side>.5?1.:-1.)*.007*kneeWeight*sin(phase+.8*front);
 return mix(p,transformed,leg);
}
void main(){
 vec3 p=aP,n=aN;
 float phase=uT*14.8;
 if(uHorse>.5&&uRun>.5){
  float cycle=fract(phase/TAU);
  // Suspension occurs after the leading forelimb leaves the ground.
  float flight=easing((cycle-.80)/.095)*(1.-easing((cycle-.955)/.045));
  float rise=.018+.042*flight+.010*sin(phase*2.+.2);
  if(aM>6.5&&aM<7.5){
    float tail=clamp(aC.b,0.,1.);
    float leg=clamp(aC.r*(1.-tail),0.,1.);
    float front=step(-.16,aP.z),side=aC.g;
    if(leg>.008){
      if(uGaitDetail>.5){p=bendLimb(p,front,side,leg,phase,rise);}
      else{
        // Far horses: two cheap oscillations, avoiding the IK sqrt cost at long distance.
        float off=front>.5?(side>.5?2.9:2.2):(side>.5?.7:0.);
        float f=sin(phase+off),foot=1.-easing((aP.y-.16)/.62);
        p.z+=.19*leg*foot*f;
        p.y+=.12*leg*foot*max(0.,cos(phase+off));
      }
    }
    if(tail>.004){
      // Tail is weighted from its own imported mesh; no lower-leg vertices participate.
      float tip=clamp((1.46-aP.y)/1.17,0.,1.);
      vec3 dock=vec3(0.,1.49,-1.28);
      float yaw=.065*sin(phase*.22+uGaitStyle)+.095*tip*sin(phase*.42-1.7*tip+uGaitStyle);
      float pitch=.045*sin(phase*.24+.7)+.055*tip*sin(phase*.38-tip);
      vec3 waved=dock+ry(rx(p-dock,pitch),yaw);
      p=mix(p,waved,tail);
      n=normalize(mix(n,ry(rx(n,pitch),yaw),tail));
    }
    float neck=clamp(aB,0.,1.);
    if(neck>.005){
      // Forequarter reaches forward in flight, then nods as the leading foreleg bears weight.
      vec3 chest=vec3(0.,1.39,.43);
      float nod=.030*sin(phase+.8)+.018*sin(phase*2.+1.4);
      float poll=easing((aP.z-.75)/.58)*easing((aP.y-1.64)/.28);
      vec3 moved=chest+rx(p-chest,nod);
      moved.z+=.015*poll*sin(phase+.24);
      moved.y+=.010*poll*sin(phase*.8+1.05);
      p=mix(p,moved,neck);
      n=normalize(mix(n,rx(n,nod),neck));
    }
    float thigh=easing((aP.y-1.12)/.25)*(1.-easing((aP.y-1.62)/.22));
    float rear=(1.-easing((aP.z+.62)/.34)),shoulder=easing((aP.z+.19)/.50)*(1.-easing((aP.z-.78)/.25));
    p.x+=sign(aP.x)*thigh*(.0055*rear*sin(phase+1.4)+.0045*shoulder*sin(phase-.35));
  }else if(aB>.5&&aB<8.5){
    // Rider follows the horse's suspension without amplifying rein or arm motion.
    float i=floor((aB-1.)/2.),off=i<.5?0.:i<1.5?.9:i<2.5?2.85:3.65;
    vec3 hip=vec3(mod(i,2.)<.5?-.245:.245,.92,i<1.5?.43:-.64);
    float a=(.29+uDash*.10)*sin(phase+off);
    if(mod(aB,2.)<.5){float b=-.09-.40*max(0.,sin(phase+off+.85));vec3 knee=hip+vec3(0.,-.43,0.);p=knee+rx(p-knee,b);n=rx(n,b);}
    p=hip+rx(p-hip,a);n=rx(n,a);
  }else if(aB>8.5&&aB<9.5){vec3 h=vec3(0.,1.88,.78);p=h+rx(p-h,.035*sin(phase+.7));n=rx(n,.035*sin(phase+.7));}
  else if(aB>9.5&&aB<10.5){vec3 h=vec3(0.,1.36,-.84);p=h+ry(p-h,.045*sin(phase*.30));n=ry(n,.045*sin(phase*.30));}
  else if(aB>10.5){vec3 h=vec3(0.,1.57,-.03);p=h+rx(p-h,.024*sin(phase));n=rx(n,.024*sin(phase));}
  // Back flexion and torso suspension remain subtle so it does not leap every stride.
  float pitch=.013*sin(phase+.48)+.005*sin(phase*2.-.3);
  p=rx(p-vec3(0.,1.2,0.),pitch)+vec3(0.,1.2,0.);
  p.y+=rise;
 }
 if(uHorse>.5)p+=n*uOutline*.032;
 vec4 world=uRoot*vec4(p,1.);
 if(uShadow>.5&&uShadow<1.5){world.xz+=world.y*vec2(.47,-.41);world.y=.034;}
 // Preserve the previous 1/2 course-size and 1/2 horse-translation settings.
 if(uHorse>-.5&&uHorse<.5)world.xz*=.5;
 else if(uHorse>.5)world.xz-=.5*vec2(uRoot[3].x,uRoot[3].z);
 vWorld=world.xyz;
 vec4 clip=uVP*world;gl_Position=clip;
 vec3 normal=normalize(mat3(uRoot)*n);
 float l=max(0.,dot(normal,normalize(vec3(-.4,.85,.35))));
 vNormal=normal;
 vLight=uHorse>.5?(.51+.49*l):(.72+.28*l);
 vFog=clamp((clip.w-900.)/1800.,0.,.75);
 vC=aC;
 vM=(uHorse<.5&&uHorse>-.5&&aM<.5&&aN.y>.95&&aP.y<.1)?-1.:aM;
 vUV=aUV;vLocal=aP;
}`;
const fs=`precision highp float;uniform vec3 uEye;uniform vec3 uCoat,uMuzzle,uHair,uSilk,uAccent;uniform sampler2D uDigits,uHorseTex,uJockeyTex;uniform float uNumber,uAlpha,uFace,uPattern,uHorse,uShadow;uniform mediump float uOutline;varying vec3 vC;varying float vM,vFog,vLight;varying vec2 vUV;varying vec3 vLocal,vWorld,vNormal;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}
vec3 cuteHorseEyes(vec3 p,vec3 c){vec2 q=vec2((p.z-.98)/.075,(p.y-1.96)/.052);float side=smoothstep(.055,.095,abs(p.x));float rim=(1.-smoothstep(.82,1.12,dot(q,q)))*side;c=mix(c,vec3(.065,.038,.025),rim);float eye=(1.-smoothstep(.60,.83,dot(q,q)))*side;c=mix(c,vec3(.025,.018,.012),eye);vec2 iris=vec2((p.z-.995)/.032,(p.y-1.955)/.034);c=mix(c,vec3(.18,.085,.032),(1.-smoothstep(.65,1.,dot(iris,iris)))*eye*.72);vec2 shine=vec2((p.z-1.006)/.014,(p.y-1.981)/.014);c=mix(c,vec3(1,.98,.91),(1.-smoothstep(.5,1.,dot(shine,shine)))*eye);return c;}
void main(){if(uShadow>.5){gl_FragColor=vec4(.08,.12,.055,.31);return;}if(uHorse<-.5){vec3 d=normalize(vLocal);float up=max(0.,d.y);vec3 sky=mix(vec3(.77,.84,.87),vec3(.18,.43,.72),pow(up,.45));vec2 p=d.xz/max(.12,d.y+.2)*2.4;float cloud=noise(p)*.60+noise(p*2.1)*.28+noise(p*4.4)*.12;float alpha=smoothstep(.52,.72,cloud)*smoothstep(-.03,.13,d.y);gl_FragColor=vec4(mix(sky,mix(vec3(.72,.76,.79),vec3(.98,.97,.92),cloud),alpha*.86),1.);return;}if(uOutline>.5){if(vM>5.5)discard;gl_FragColor=vec4(.12,.10,.08,1.);return;}vec3 c=vC;if(vM>.5&&vM<1.5)c=uCoat;else if(vM<2.5&&vM>1.5)c=uMuzzle;else if(vM<3.5&&vM>2.5)c=uHair;else if(vM<4.5&&vM>3.5)c=uSilk;else if(vM<5.5&&vM>4.5)c=uAccent;else if(vM>6.5&&vM<7.5){vec3 original=texture2D(uHorseTex,vUV).rgb;float coatMask=smoothstep(.15,.37,original.r)*smoothstep(.045,.14,original.g)*(1.-smoothstep(.75,.90,original.r));float naturalValue=clamp(dot(original,vec3(.3,.59,.11))/.36,.38,1.48);c=mix(original,uCoat*naturalValue,coatMask*.32);}else if(vM>7.5){c=texture2D(uJockeyTex,vUV).rgb;float red=step(c.g*3.2,c.r)*step(c.b*2.4,c.r)*step(.06,c.r);float yellow=step(c.b*4.,c.g)*step(c.g*.8,c.r)*step(.14,c.g);float shade=clamp(max(c.r,c.g)*1.35,.28,1.1);float stripe=uPattern<1.5?step(.5,fract(vLocal.y*12.)):uPattern<2.5?step(.5,fract(vLocal.x*12.)):uPattern<3.5?step(.5,fract((vLocal.x+vLocal.y)*8.)):abs(step(.5,fract(vLocal.x*12.))-step(.5,fract(vLocal.y*12.)));vec3 silk=mix(uSilk,uAccent,stripe*step(.5,uPattern));c=mix(c,mix(silk,uAccent,vC.r)*shade,red*vC.g);c=mix(c,uAccent*shade,yellow*vC.g);}else if(vM>5.5){vec4 ink=texture2D(uDigits,vec2((uNumber+vUV.x)*.0546875,vUV.y));if(ink.a<.3)discard;c=ink.rgb;}if(vM<-.5){vec2 p=vWorld.xz;float broad=noise(p*.36),grain=h2(floor(p*26.));float detail=clamp(1.-length(vWorld-uEye)/135.,0.,1.);float mowing=.5+.5*sin(p.x*.34+p.y*.01);c*=.93+(broad-.5)*.115+(mowing-.5)*.065+(grain-.5)*.15*detail;}
c*=vLight;if(uHorse>.5&&vM>6.5&&vM<7.5){vec3 n=normalize(vNormal),v=normalize(uEye-vWorld),halfway=normalize(v+normalize(vec3(-.4,.85,.35)));float sheen=pow(max(0.,dot(n,halfway)),43.);float rim=pow(1.-max(0.,dot(n,v)),3.);c+=vec3(.075,.065,.054)*sheen+vec3(.025,.026,.023)*rim;}c=mix(c,vec3(.72,.81,.84),vFog);gl_FragColor=vec4(c,uAlpha);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const U={};for(const n of ['Eye','Shadow','VP','Root','T','Run','Dash','GaitStyle','GaitDetail','Horse','Outline','Coat','Muzzle','Hair','Silk','Accent','Number','Face','Pattern','Alpha','Digits','HorseTex','JockeyTex'])U[n]=gl.getUniformLocation(program,'u'+n);
const A=[];let offset=0;for(const [name,size] of [['aP',3],['aN',3],['aC',3],['aB',1],['aM',1],['aUV',2]]){A.push({loc:gl.getAttribLocation(program,name),size,offset:offset*4});offset+=size;}
function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return {b,count:data.length/13};}
function bind(obj){gl.bindBuffer(gl.ARRAY_BUFFER,obj.b);for(const a of A){gl.enableVertexAttribArray(a.loc);gl.vertexAttribPointer(a.loc,a.size,gl.FLOAT,false,52,a.offset);}}
function object(out,mesh,p,s,color,r=[0,0,0]){M.emit(mesh,M.matrix(p,r,s),M.tint(color),out);}
function quad(out,points,color){if(D.cross(D.sub(points[1],points[0]),D.sub(points[2],points[0]))[1]<0)points=[points[0],points[3],points[2],points[1]];M.emit([points[0],points[1],points[2],points[0],points[2],points[3]],D.I(),M.tint(color),out);}
// Build the scenery only after the live race has supplied its actual direction.
if(LIVE)await LIVE.ready;
const dirtRace=!!LIVE&&HorseDaysLiveData.isDirt(LIVE.feed.current);
const world=[],signs=[],nearRail=[],stands=[],trackEdge=28,innerEdge=-56,innerRail=-36,railPosts=512;
object(world,M.cube,[0,-.06,0],[3600,.03,3600],'#577b39');
function band(a,b,c1,c2,steps=512){for(let i=0;i<steps;i++){const t=i*D.L/steps,u=(i+1)*D.L/steps,p=D.course(t,a),q=D.course(u,a),r=D.course(u,b),s=D.course(t,b);quad(world,[[p.x,.015,p.z],[q.x,.015,q.z],[r.x,.015,r.z],[s.x,.015,s.z]],i%12<6?c1:c2);}}
if(dirtRace){
 band(-trackEdge,trackEdge,'#af9774','#baa17e');
 band(-trackEdge,-trackEdge+2,'#c0aa89','#bba484');
 band(trackEdge-2,trackEdge,'#c7b18f','#c0a987');
}else{
 for(let j=0;j<8;j++){
  const lane=-trackEdge+j*(2*trackEdge/8),next=-trackEdge+(j+1)*(2*trackEdge/8);
  band(lane,next,j%2?'#507534':'#557d38',j%2?'#557a36':'#5d8441');
 }
 band(innerEdge,innerRail,'#b4a17a','#bfa984');
 band(-trackEdge,-trackEdge+1,'#628b48','#6d9250');
 band(trackEdge-1,trackEdge,'#6e9451','#628947');
}
function bar(p,q,y,color,width=.055,out=world){
 const dx=q.x-p.x,dz=q.z-p.z,length=Math.hypot(dx,dz)||1,sideX=-dz/length,sideZ=dx/length;
 const points=[],radius=width*1.25,sides=6;
 for(let k=0;k<=sides;k++){const a=k*Math.PI*2/sides,ox=sideX*radius*Math.cos(a),oz=sideZ*radius*Math.cos(a),oy=radius*Math.sin(a);
  points.push([[p.x+ox,y+oy,p.z+oz],[q.x+ox,y+oy,q.z+oz]]);
 }
 const triangles=[];
 for(let k=0;k<sides;k++){const [a,b]=points[k],[c,d]=points[k+1];triangles.push(a,b,d,a,d,c);}
 M.emit(triangles,D.I(),M.tint(color),out);
}
const railLanes=dirtRace?[-trackEdge,trackEdge]:[innerEdge,innerRail,-trackEdge,trackEdge];
for(const lane of railLanes)for(let i=0;i<railPosts;i++){const p=D.course(i*D.L/railPosts,lane),q=D.course((i+1)*D.L/railPosts,lane);const out=lane===trackEdge?nearRail:world;bar(p,q,1.05,'#fff9df',.055,out);bar(p,q,.58,'#f5f1dc',.038,out);object(out,M.cube,[p.x,.53,p.z],[.055,.55,.055],'#fff9df');}
// Fixed buildings, trees and distance posts occupy the same three-dimensional space.
for(const side of [-1]){const z=D.R-65;object(stands,M.cube,[0,8,z],[155,8,8],'#d1d6ca');for(let j=0;j<7;j++)object(stands,M.cube,[0,1.6+j*1.6,z-side*(15-j*.8)],[155,.45,3],'#e7ddbf');object(stands,M.cube,[0,17,z],[162,.7,22],'#344b55');for(let j=0;j<7;j++)object(stands,M.cube,[0,2+j*1.6,z-side*(18-j*.8)],[155,.24,.12],'#596f77');const data=[];object(data,M.cube,[180,10,z-side*6],[22,10,1.2],'#152b2e');object(data,M.cube,[180,.1,z-side*6],[.8,8,.8],'#58645b');signs.push({data,bounds:{min:[158,0,z-side*6-1.2],max:[202,20,z-side*6+1.2]}});}
// Stadium detailing: dark glazing, stepped seating, column supports and roof fascia.
{
 const z=D.R-65;
 for(let x=-142;x<=142;x+=11){
  object(stands,M.cube,[x,7.8,z+7.7],[.24,5.6,.25],'#879397');
  for(let h=5.6;h<=13.4;h+=2.3)object(stands,M.cube,[x+4.3,h,z+7.8],[4.2,.075,.11],'#647b82');
 }
 for(let x=-149;x<=149;x+=2.7){
  const row=Math.floor((x+149)/2.7);
  object(stands,M.cube,[x,2.9,z+18],[1.1,.34,.24],row%5===0?'#697984':'#49606b');
  object(stands,M.cube,[x,4.6,z+17.3],[1.1,.34,.24],row%6===0?'#6d7b80':'#506570');
 }
 object(stands,M.cube,[0,17.35,z+2],[162,.31,15],'#374c4f');
 object(stands,M.cube,[0,17.4,z+10],[163,.12,.34],'#ebf1e9');
 for(let x=-148;x<=148;x+=18)object(stands,M.cube,[x,8.5,z+5.5],[.46,8.1,.48],'#d6dbd6');
}
for(let i=0;i<150;i++){const p=D.course(i*D.L/150,80+(i%4)*8),height=3+(i%5)*.4;object(world,M.cube,[p.x,height/2,p.z],[.24,height/2,.24],'#9c8657');object(world,M.small,[p.x,height+1.4,p.z],[1.8,2.5,1.7],i%3?'#4e9d43':'#3a8743');if(i%4===0)object(world,M.small,[p.x+1,height+1,p.z+1],[1.6,2,1.6],'#5caa4b');}
const marks=[];for(let rem=200;rem<2000;rem+=200){const p=D.course(D.S/2+(2000-rem)/2000*D.L,trackEdge+3);const data=[];object(data,M.cube,[p.x,2,p.z],[.1,2,.1],'#e6d071');object(data,M.cube,[p.x,4,p.z],[1.4,.6,.12],'#b5a551');const sign={data,bounds:{min:[p.x-1.4,0,p.z-.12],max:[p.x+1.4,5.5,p.z+.12]}};signs.push(sign);marks.push({...p,rem,sign});}
const f=D.course(D.S/2);quad(world,[[f.x-.24,.03,f.z+trackEdge],[f.x+.24,.03,f.z+trackEdge],[f.x+.24,.03,f.z-trackEdge],[f.x-.24,.03,f.z-trackEdge]],'#fffdef');
// The finish marker sits on the far rail for the low, fixed finish camera.
for(const side of [-1,1])object(world,M.cube,[f.x+side*1.1,4.2,f.z-trackEdge-3],[.18,4.2,.16],'#edf0dc');
object(world,M.cube,[f.x,8.2,f.z-trackEdge-3],[1.3,.22,.18],'#2d5449');object(world,M.small,[f.x,9.3,f.z-trackEdge-3],[1.5,1.4,.14],'#244b42');object(world,M.small,[f.x,9.3,f.z-trackEdge-2.82],[.8,.7,.08],'#d9e0c8');

async function mesh(name){const response=await fetch((name.startsWith('horse')?'new-horse/'+name+'-fixed.bin?v=gait4':'classic/'+name+'.bin?v=gait4'));if(!response.ok)throw Error('model '+name);return new Float32Array(await response.arrayBuffer());}
async function imageTexture(name,unit,uniform){const img=new Image();img.src=name==='horse'?'new-horse/horse.jpg?v=gait4':'classic/'+name+'.png?v=gait4';await img.decode();const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);gl.uniform1i(U[uniform],unit);}
const [horseMesh,jockeyMesh,horseLow,jockeyLow]=await Promise.all([mesh('horse'),mesh('jockey'),mesh('horse-low'),mesh('jockey-low')]);
await imageTexture('horse',1,'HorseTex');await imageTexture('jockey',2,'JockeyTex');gl.activeTexture(gl.TEXTURE0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
// The bundled replacement meshes already contain tack and the saddlecloth.
const fitted=window.HorseDaysBundledFallbackModels?new Float32Array(0):M.equipment,complete=new Float32Array(horseMesh.length+jockeyMesh.length+fitted.length);complete.set(horseMesh);complete.set(jockeyMesh,horseMesh.length);complete.set(fitted,horseMesh.length+jockeyMesh.length);
const distant=new Float32Array(horseLow.length+jockeyLow.length+fitted.length);distant.set(horseLow);distant.set(jockeyLow,horseLow.length);distant.set(fitted,horseLow.length+jockeyLow.length);
const skyData=[];M.emit(M.round,M.matrix([0,0,0],[0,0,0],[900,900,900]),[1,1,1],skyData,0,9);const skyBuffer=buffer(new Float32Array(skyData));
const standBuffer=buffer(new Float32Array(stands));
const nearRailBuffer=buffer(new Float32Array(nearRail));
const worldBuffer=buffer(new Float32Array(world)),horseBuffer=buffer(complete),distantBuffer=buffer(distant);
for(const sign of signs)sign.buffer=buffer(new Float32Array(sign.data));
const gateFrame=[],gateClosed=[];
for(let i=0;i<17;i++){const p=D.course(D.S/2,(i-8)*1.45),gateDirection=p.dx;
 for(const dz of [-.71,.71]){object(gateFrame,M.cube,[p.x-1.6*gateDirection,1.15,p.z+dz],[.07,1.15,.06],'#65716b');object(gateFrame,M.cube,[p.x+.9*gateDirection,1.15,p.z+dz],[.07,1.15,.06],'#65716b');object(gateFrame,M.cube,[p.x-.35*gateDirection,2.3,p.z+dz],[1.4,.08,.08],'#2a6e51');}
 object(gateFrame,M.cube,[p.x-.35*gateDirection,2.45,p.z],[1.5,.11,.72],'#366b49');
 for(let j=0;j<5;j++)object(gateClosed,M.cube,[p.x+1.35*gateDirection,.85,p.z-.56+j*.28],[.035,.85,.035],'#818b80');
}
const gateBuffer=buffer(new Float32Array(gateFrame)),closedBuffer=buffer(new Float32Array(gateClosed));

const shadow=[];for(let i=0;i<20;i++){const a=i*2*Math.PI/20,b=(i+1)*2*Math.PI/20;M.emit([[0,0,0],[Math.cos(a),0,Math.sin(a)],[Math.cos(b),0,Math.sin(b)]],D.I(),[.12,.30,.10],shadow);}
const shadowBuffer=buffer(new Float32Array(shadow));
const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=128;const ac=atlas.getContext('2d');ac.font='bold 88px Arial';ac.textAlign='center';ac.lineWidth=7;for(let i=1;i<=18;i++){ac.strokeStyle='#171a16';ac.fillStyle='#fff6cf';ac.strokeText(String(i),(i-.5)*112,95,106);ac.fillText(String(i),(i-.5)*112,95,106);}
const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);gl.uniform1i(U.Digits,0);
const dissolve=HorseDaysDissolve(gl);
function facePattern(seed){let v=(Math.imul(seed,747796405)+2891336453+277803737)>>>0;v=Math.imul((v>>>((v>>>28)+4))^v,277803737)>>>0;v=((v>>>22)^v)>>>0;return Math.min(5,Math.floor((v&65535)/65535*6));}
const coats=[['#825032','#b08760','#30251e'],['#32251f','#615040','#15151a'],['#ad6135','#c68a5b','#503427'],['#74452d','#a37555','#252b2a'],['#deded7','#bcb7ac','#7a817c'],['#766142','#a18565','#292a25'],['#93412c','#a37555','#252b2a'],['#292a2c','#62615d','#18191a']];
let cameraEye=null,cameraTarget=null,lastFrameTime=-1,lastHud=-100;const director=new HorseDaysBroadcast.Director(),announcer=new HorseDaysRaceCommentary.Commentator(Math.floor(Date.now()/1000));
const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
const talking=document.createElement('span');talking.id='commentary-horse';talking.className='commentary-horse';talking.hidden=true;stage.append(talking);$('horse-label').hidden=true;
const cueLine=document.createElement('span');cueLine.id='commentary-line';stage.append(cueLine);
const gallopMotion=new HorseDaysGallop.Motion();
const speech=window.HorseDaysRaceSpeech,voiceButton=$("voice-toggle");
voiceButton.onclick=()=>{speech.activate();setText(voiceButton,speech.label());};
speech.setContext(true,false,false);
let elapsed=0,paused=false,rate=1,last=0,mode='auto',focus=0,oldLeader=0,lastCue=-10,cueNumber=0,finished=false,previousCueRows=null,cueCycle=0;
let finishSent=false;
const buttons=$('camera-buttons');for(const [id,label] of [['auto','中継カメラ'],['front','斜め前'],['high','前方上空'],['rear','後方上空'],['side','横'],['wide','全体']]){const b=document.createElement('button');b.textContent=label;b.dataset.mode=id;b.onclick=()=>{mode=id;for(const c of buttons.children)c.setAttribute('aria-pressed',c===b);};b.setAttribute('aria-pressed',id===mode);buttons.append(b);}
$('pause').onclick=()=>{if(LIVE){LIVE.command(1);return;}paused=!paused;$('pause').textContent=paused?'再生':'一時停止';};$('speed').onclick=()=>{if(LIVE){LIVE.command(2);return;}rate=rate===1?2:1;$('speed').textContent='速度 ×'+rate;};$('again').onclick=()=>{elapsed=0;paused=false;announcer.reset();lastCue=-10;oldLeader=0;finished=false;previousCueRows=null;cueCycle=0;$('pause').textContent='一時停止';};$('seek').oninput=()=>{elapsed=+$('seek').value;paused=true;announcer.reset();lastCue=-10;oldLeader=0;previousCueRows=null;cueCycle=Math.floor(elapsed/6);$('pause').textContent='再生';};
$('follow').onclick=()=>{focus=focus?0:(LIVE?(LIVE.feed.current?.runners[0]?.number||1):14);$('follow').textContent=focus?'馬群に戻る':'注目馬を追う';};
const runnerButtons=[];for(let i=0;i<(LIVE?0:17);i++){const b=document.createElement('button');b.textContent=(i+1)+' '+D.names[i];b.onclick=()=>{focus=i+1;$('follow').textContent='馬群に戻る';};$('field').append(b);runnerButtons.push(b);}
const coursePosition=new HorseDaysCoursePosition.Display(stage);
const elevation=new HorseDaysElevation.Display($('elevation-profile'));
const fieldPositions=new HorseDaysFieldPositions.Display($('map')),lc=$('course-labels').getContext('2d');
function uniformColor(name,c){gl.uniform3fv(U[name],M.tint(c));}
function draw(now){requestAnimationFrame(draw);if(finishSent||document.hidden||gl.isContextLost()){last=0;return;}const dt=last?Math.min(.06,(now-last)/1000):0;last=now;if(LIVE){const s=LIVE.feed.current;if(!s)return;elapsed=LIVE.feed.time(performance.now());paused=s.paused;rate=s.rate;setText($('pause'),paused?'再生':'一時停止');setText($('speed'),'速度 ×'+rate);}else if(!paused)elapsed=Math.min(130,elapsed+dt*rate);
speech.setContext(true,paused,!!(LIVE&&parent.HorseDaysRaceMuted));
setText(voiceButton,speech.label());
const rows=D.race(elapsed);if(!rows.length)return;const gaits=gallopMotion.update(rows,elapsed);
if(LIVE&&runnerButtons.length!==rows.length){$('field').replaceChildren();runnerButtons.length=0;for(let i=0;i<rows.length;i++){const b=document.createElement('button');const number=i+1;b.onclick=()=>{focus=number;};$('field').append(b);runnerButtons.push(b);}}
// Follow the visible leader from the final turn to the line.
const crowd=LIVE&&parent.HorseDaysRaceCrowd;if(crowd){const {corner}=LIVE.feed.current,start=D.clamp(corner,0,.999),p=(rows[0].progress-start)/(1-start);crowd.setPresentation(p>=0&&!rows[0].finished,Math.max(0,Math.min(1,p)));}
const lead=rows[0],rect=canvas.getBoundingClientRect(),view=director.view(elapsed,rows,mode,focus,rect.width/rect.height,LIVE?LIVE.feed.current.goalCountdown??null:null,cueNumber),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
// Hold the shot through approach/pass; scan the field without cutting on each spoken name.
const dissolveCut=view.cut&&lastFrameTime>=0&&elapsed-lastFrameTime>=0&&elapsed-lastFrameTime<.5;
cameraEye=[view.eye[0]*TRACK_SCALE,view.eye[1]*.88,view.eye[2]*TRACK_SCALE];cameraTarget=[view.target[0]*TRACK_SCALE,view.target[1],view.target[2]*TRACK_SCALE];lastFrameTime=elapsed;
const vp=D.mul(D.perspective(w/h,view.fov),D.look(cameraEye,cameraTarget));gl.viewport(0,0,w,h);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(U.VP,false,new Float32Array(vp));gl.uniform1f(U.Alpha,1);gl.uniform1f(U.Outline,0);gl.uniform3fv(U.Eye,cameraEye);gl.uniform1f(U.Shadow,0);gl.uniform1f(U.Horse,-1);gl.depthMask(false);gl.disable(gl.DEPTH_TEST);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix(cameraEye)));bind(skyBuffer);gl.drawArrays(gl.TRIANGLES,0,skyBuffer.count);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.uniform1f(U.Horse,0);gl.uniformMatrix4fv(U.Root,false,new Float32Array(D.I()));bind(worldBuffer);gl.drawArrays(gl.TRIANGLES,0,worldBuffer.count);
{bind(standBuffer);gl.drawArrays(gl.TRIANGLES,0,standBuffer.count);bind(nearRailBuffer);gl.drawArrays(gl.TRIANGLES,0,nearRailBuffer.count);}
// Keep the broadcast path intact; only omit a sign when it masks a visible runner.
const visibleHorses=rows.filter(r=>sceneProject(vp,[r.x,1.4,r.z],rect.width,rect.height).visible);
for(const sign of signs){sign.hidden=HorseDaysSignVisibility.hidden(view.eye,visibleHorses,sign.bounds);if(!sign.hidden){bind(sign.buffer);gl.drawArrays(gl.TRIANGLES,0,sign.buffer.count);}}
if(elapsed<5){bind(gateBuffer);gl.drawArrays(gl.TRIANGLES,0,gateBuffer.count);if(elapsed<1){bind(closedBuffer);gl.drawArrays(gl.TRIANGLES,0,closedBuffer.count);}}
bind(shadowBuffer);gl.uniform1f(U.Shadow,2);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);gl.depthMask(false);gl.uniform1f(U.Alpha,.23);for(const r of rows){gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,.04,r.z],[0,Math.atan2(r.dx,r.dz),0],[.52,1,1.35])));gl.drawArrays(gl.TRIANGLES,0,shadowBuffer.count);}gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform1f(U.Alpha,1);gl.uniform1f(U.Shadow,0);
bind(distantBuffer);gl.uniform1f(U.GaitDetail,0);gl.uniform1f(U.Run,elapsed>=1?1:0);gl.uniform1f(U.Horse,1);gl.uniform1f(U.Shadow,1);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);for(const r of rows){if(Math.abs(sceneProject(vp,[r.x,2.6,r.z],rect.width,rect.height).y-sceneProject(vp,[r.x,0,r.z],rect.width,rect.height).y)<45)continue;if(!sceneProject(vp,[r.x,1.2,r.z],rect.width,rect.height).visible)continue;gl.uniform1f(U.Dash,gaits.get(r.number).dash);gl.uniform1f(U.GaitStyle,Math.sin(r.number*2.33)*.45);gl.uniform1f(U.T,elapsed<1?0:gaits.get(r.number).phase/14.8*.5);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,0,r.z],[0,Math.atan2(r.dx,r.dz),0],[1,1,1])));gl.drawArrays(gl.TRIANGLES,0,distantBuffer.count);}gl.disable(gl.BLEND);gl.uniform1f(U.Shadow,0);
bind(horseBuffer);gl.uniform1f(U.Run,elapsed>=1?1:0);gl.uniform1f(U.Horse,1);
const horseSizes=rows.map(r=>{
 const top=sceneProject(vp,[r.x,2.6,r.z],rect.width,rect.height);
 const bottom=sceneProject(vp,[r.x,0,r.z],rect.width,rect.height);
 return {number:r.number,px:Math.abs(top.y-bottom.y),visible:top.depth>0&&bottom.depth>0};
});
const maxDetailed=rect.width<700?5:8;
const detailedHorses=new Set(horseSizes.filter(r=>r.visible&&r.px>32).sort((a,b)=>b.px-a.px).slice(0,maxDetailed).map(r=>r.number));
for(const r of rows){const screen=sceneProject(vp,[r.x,1.2,r.z],rect.width,rect.height);if(!screen.visible)continue;const top=sceneProject(vp,[r.x,2.6,r.z],rect.width,rect.height),bottom=sceneProject(vp,[r.x,0,r.z],rect.width,rect.height),meshForHorse=detailedHorses.has(r.number)?horseBuffer:distantBuffer;bind(meshForHorse);gl.uniform1f(U.GaitDetail,detailedHorses.has(r.number)?1:0);const c=coats[r.appearance];uniformColor('Coat',r.coatHex||c[0]);uniformColor('Muzzle',c[1]);uniformColor('Hair',c[2]);uniformColor('Silk',r.silk);uniformColor('Accent',r.silkAccent||(r.number%2?'#ffe3a1':'#fff4de'));gl.uniform1f(U.Pattern,r.silkPattern||0);gl.uniform1f(U.Dash,gaits.get(r.number).dash);gl.uniform1f(U.GaitStyle,Math.sin(r.number*2.33)*.45);gl.uniform1f(U.Face,facePattern(r.appearanceSeed??r.number));gl.uniform1f(U.Number,r.number-1);gl.uniform1f(U.T,elapsed<1?0:gaits.get(r.number).phase/14.8*.5);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,0,r.z],[0,Math.atan2(r.dx,r.dz),0],[1,1,1])));
gl.disable(gl.CULL_FACE);gl.uniform1f(U.Outline,0);gl.drawArrays(gl.TRIANGLES,0,meshForHorse.count);}
gl.disable(gl.CULL_FACE);
dissolve.draw(now,w,h,dissolveCut);
const overlay=$('course-labels');if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}lc.setTransform(dpr,0,0,dpr,0,0);lc.clearRect(0,0,rect.width,rect.height);for(const mark of marks){if(mark.sign.hidden)continue;const q=sceneProject(vp,[mark.x,4.8,mark.z],rect.width,rect.height);if(!q.visible||q.depth>150)continue;lc.font='bold '+D.clamp(300/q.depth,8,16)+'px system-ui';lc.textAlign='center';lc.strokeStyle='#70602a';lc.lineWidth=2;lc.fillStyle='#ffe16d';lc.strokeText(String(mark.rem),q.x,q.y);lc.fillText(String(mark.rem),q.x,q.y);}
fieldPositions.draw(rows,D.frames,focus,cueNumber,elapsed);
if(now-lastHud>=100){lastHud=now;
$('time').textContent='時計 '+Math.floor(Math.max(0,elapsed-(LIVE?0:1))/60)+':'+(Math.max(0,elapsed-(LIVE?0:1))%60).toFixed(1).padStart(4,'0');$('remaining').textContent=lead.finished?(rows.every(r=>r.finished)?'全馬ゴール':rows.filter(r=>r.finished).length+'/'+rows.length+'頭ゴール'):'残り '+Math.max(0,Math.round(LIVE?LIVE.feed.current.distance-lead.actualRan:2000-lead.ran))+'m';$('progress').style.width=Math.min(100,lead.progress*100)+'%';$('shot').textContent=view.label;$('seek').value=elapsed;if(LIVE){const s=LIVE.feed.sample(performance.now());if(Array.isArray(s.elevation)&&s.elevation.length>1){elevation.profile={distance:s.distance,points:s.elevation.map(p=>[p.distance,p.height])};const r=rows.find(r=>r.number===focus)||lead;elevation.draw({...r,ran:r.actualRan},!!focus);}coursePosition.draw(s,focus);}else {elevation.draw(rows.find(r=>r.number===focus)||lead,!!focus);coursePosition.drawDemo(rows,D,focus);}
}
announcer.bodyLength=LIVE?(LIVE.feed.current.bodyLength||2.8/.15):2.4;announcer.distance=LIVE?LIVE.feed.current.distance:2000;announcer.straightStart=LIVE?LIVE.feed.current.straight*announcer.distance:1600;announcer.cornerStart=LIVE?LIVE.feed.current.corner*announcer.distance:1300;announcer.slope=HorseDaysElevation.state(elevation.profile,LIVE?lead.actualRan:lead.ran).slope;let cue=announcer.update(elapsed,LIVE?rows.map(r=>({...r,ran:r.actualRan})):rows);if(view.introNumber&&cue.type==='field'){const introduced=rows.find(r=>r.number===view.introNumber);if(introduced)cue=announcer.introduce(introduced,rows);}if(cue.key!==lastCue){speech.say(cue.text,cue.key,cue.number);lastCue=cue.key;}
const spoken=speech.enabled&&speech.current;cueNumber=spoken?(speech.currentNumber||cue.number):cue.number;setText($('commentary'),spoken?speech.current.text:cue.text);
// The callout always follows the horse named by commentary, independently of camera selection.
const named=rows.find(r=>r.number===cueNumber);talking.hidden=!named;cueLine.hidden=true;
if(named){const q=sceneProject(vp,[named.x,2.85,named.z],rect.width,rect.height),visible=q.depth>0&&q.x>=12&&q.x<=rect.width-12&&q.y>=32&&q.y<rect.height-12;
 talking.hidden=!visible;
 if(visible){
 const bw=Math.min(180,rect.width-20),x=D.clamp(q.x-bw/2,8,rect.width-bw-8),y=D.clamp(q.y-32,30,rect.height-42);
 setText(talking,named.number+' '+named.name+' · '+named.rank+'番手');
 talking.style.width=bw+'px';talking.style.transform='translate3d('+x+'px,'+y+'px,0)';const foot=sceneProject(vp,[named.x,1.3,named.z],rect.width,rect.height),dx=foot.x-(x+bw/2),dy=foot.y-(y+26);cueLine.hidden=false;cueLine.style.width=Math.hypot(dx,dy)+'px';cueLine.style.transform='translate3d('+(x+bw/2)+'px,'+(y+26)+'px,0) rotate('+Math.atan2(dy,dx)+'rad)';}
}
if(now-lastHud<dt*1000+1)for(const r of rows){const b=runnerButtons[r.number-1];setText(b,r.rank+'位  '+r.number+' '+r.name);const pressed=String(focus===r.number);if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed);}
if(LIVE?.feed.current.endsBroadcast&&rows.every(r=>r.finished||r.fallen)){
 finishSent=true;
 speech.finish();
 requestAnimationFrame(()=>LIVE.command(4));
}

}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(LIVE)LIVE.command(3);$('error').hidden=false;$('error').textContent='立体表示が停止しました。再読み込みしてください。';});document.addEventListener('visibilitychange',()=>last=0);
if(LIVE)parent.postMessage({type:'horse-days-render-ready'},location.origin);
requestAnimationFrame(draw);
})().catch(e=>{document.getElementById('error').hidden=false;document.getElementById('error').textContent='表示を開けませんでした。再読み込みしてください。';if(window.HorseDaysLiveRace)parent.postMessage({type:'horse-days-race-fallback'},location.origin);console.error(e);});



