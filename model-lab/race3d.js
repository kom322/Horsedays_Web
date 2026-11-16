// HORSEDAYS_FALL_AND_PACK_V13: WebGL rider fall + riderless horse (visual only).
// HORSEDAYS_MOMENTS_V11: player-tracking arrow and probability-based winner celebration.
// HORSEDAYS_RENDER_V10: horse mesh, contact/suspension gait, performance LOD and improved coat light.
// HORSEDAYS_JOCKEY_VISUAL_V17: articulated rider hands/boots, near-face geometry and helmet/goggle profiles.
// HORSEDAYS_JOCKEY_WEB_V16: fixed rider appearance, dynamic posture and named jockey captions.
'use strict';
(async()=>{
const LIVE=window.HorseDaysLiveRace;
const JOCKEY_V16=window.HorseDaysJockeyIdentityV16;
const JOCKEY_V17=window.HorseDaysJockeyVisualV17;
const D=HorseDaysSolid,M=HorseDaysSolidModel,$=id=>document.getElementById(id),canvas=$('race3d'),stage=$('race-stage');
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'high-performance'});if(!gl){$('error').hidden=false;$('error').textContent='立体表示を開けませんでした。SafariやChromeで開き直してください。';return;}
const vs=`// HORSEDAYS_RENDER_V10: material-aware gallop, four independent contacts and LOD.
attribute vec3 aP,aN,aC;
attribute float aB,aM;
attribute vec2 aUV;
uniform mat4 uVP,uRoot;
uniform float uT,uHorse,uRun,uDash,uShadow,uGaitStyle,uGaitDetail,uCelebrate,uFallMode,uFallAge,uJockeySeed,uJockeyMotion,uJockeyAttack,uJockeyLean;
uniform mediump float uOutline;
varying vec3 vC;
varying float vM,vFog,vLight;
varying vec2 vUV;
varying vec3 vLocal,vWorld,vNormal;
const float TAU=6.28318530718;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
float easing(float t){t=clamp(t,0.,1.);return t*t*(3.-2.*t);}
vec2 jointIK(vec2 hip,vec2 hoof,float isFront){
 vec2 d=hoof-hip;
 float reach=clamp(length(d),.18,1.185);
 vec2 axis=normalize(d);
 float upper=isFront>.5?.625:.66,lower=isFront>.5?.60:.59;
 float along=(upper*upper-lower*lower+reach*reach)/(2.*reach);
 float bend=sqrt(max(.00001,upper*upper-along*along));
 vec2 sideways=vec2(-axis.y,axis.x);
 return hip+axis*along+sideways*bend*(isFront>.5?1.:-1.);
}
vec3 gallopLeg(vec3 source,float front,float side,float weight,float phase,float bodyRise){
 // Transverse gallop: trailing hind -> leading hind -> trailing fore -> leading fore -> suspension.
 // Lead may reverse from horse to horse. Four footfalls, not diagonally synchronous trotting.
 float rightLead=step(0.,uGaitStyle);
 float contact=front>.5?(side>.5?mix(.51,.38,rightLead):mix(.38,.51,rightLead))
                         :(side>.5?mix(.13,.025,rightLead):mix(.025,.13,rightLead));
 float t=fract(phase/TAU-contact+1.);
 float stance=.225;
 float reach=.22+.09*uDash;
 float footZ,footY;
 if(t<stance){
  float s=easing(t/stance);
  footZ=mix(reach,-reach,s);
  footY=.062-bodyRise;
 }else{
  float s=(t-stance)/(1.-stance);
  float arc=sin(3.14159265*s);
  footZ=mix(-reach,reach,easing(s));
  footY=.062+(.26+.09*uDash)*arc*arc-bodyRise;
 }
 vec2 hip=front>.5?vec2(1.18,.34):vec2(1.19,-1.035);
 vec2 neutral=front>.5?vec2(.062,.315):vec2(.062,-1.095);
 vec2 foot=neutral+vec2(footY-.062,footZ);
 vec2 knee=jointIK(hip,foot,front);
 vec2 baseKnee=jointIK(hip,neutral,front);
 float distal=1.-easing((source.y-.17)/.38);
 float mid=easing((source.y-.24)/.25)*(1.-easing((source.y-.77)/.40));
 float proximal=easing((source.y-.76)/.24)*(1.-easing((source.y-1.12)/.17));
 vec3 moved=source;
 moved.yz+=(foot-neutral)*(distal+.13*mid);
 moved.yz+=(knee-baseKnee)*(mid+.28*proximal);
 moved.x+=(side>.5?1.:-1.)*.006*mid*sin(phase+.37*front);
 return mix(source,moved,clamp(weight,0.,1.));
}
void main(){
 vec3 p=aP,n=aN;
 if(uHorse>.5 && aB>10.5){
  // The same jockey ID always has the same compact/tall silhouette.
  float broad=fract(uJockeySeed*.073),heightMix=fract(uJockeySeed*.113);
  vec3 center=vec3(0.,1.97,-.02);
  p=center+vec3((p.x-center.x)*mix(.915,1.095,broad),
                (p.y-center.y)*mix(.950,1.065,heightMix),
                (p.z-center.z)*mix(.965,1.045,fract(uJockeySeed*.139)));
 }
 // Slightly different physical nose, cheeks and helmet dimensions per rider.
 if(uHorse>.5 && aM>10.5 && aM<11.5){
  float nose=fract(uJockeySeed*.239);
  p.z+=(nose-.5)*.064*smoothstep(.343,.388,aP.z);
  p.x*=mix(.91,1.09,fract(uJockeySeed*.071));
 }
 if(uHorse>.5 && aM>11.5 && aM<12.5){
  p.y+=(fract(uJockeySeed*.131)-.5)*.025;
  p.x*=mix(.935,1.085,fract(uJockeySeed*.151));
 }
 float phase=uT*14.8;
 if(uHorse>.5&&uRun>.001){
  float cycle=fract(phase/TAU);
  float flight=easing((cycle-.765)/.080)*(1.-easing((cycle-.955)/.045));
  float rise=.011+.046*flight+.009*sin(phase*2.+.2);
  if(aM>6.5&&aM<7.5){
   float tail=clamp(aC.b,0.,1.);
   float leg=clamp(aC.r*(1.-tail),0.,1.);
   float front=step(-.16,aP.z);
   float side=aC.g;
   if(leg>.004){
    if(uGaitDetail>.5){
     vec3 moved=gallopLeg(p,front,side,leg,phase,rise);
     // A slight normal response makes the leg's highlights move with its stance.
     float bend=.07*sin(phase+(front>.5?2.5:.1)+(side>.5?.2:0.));
     n=rx(n,bend*leg*(1.-easing((aP.y-.40)/.65)));
     p=moved;
    }else{
     // Lower-poly horses use two oscillations without inverse kinematics.
     float off=front>.5?(side>.5?3.1:2.4):(side>.5?.8:0.);
     float m=1.-easing((aP.y-.24)/.78);
     p.z+=.22*leg*m*sin(phase+off);
     p.y+=.14*leg*m*max(0.,cos(phase+off));
    }
   }
   if(tail>.004){
    // Tail-root movement is independent of the rear legs, with more motion at the tip.
    float tip=easing((1.38-aP.y)/.88);
    vec3 dock=vec3(0.,1.43,-1.26);
    float yaw=.055*sin(phase*.25+.85)+.16*tip*sin(phase*.37-1.6*tip+uGaitStyle);
    float pitch=.045*sin(phase*.25+.1)+.09*tip*sin(phase*.42-1.0*tip);
    p=mix(p,dock+ry(rx(p-dock,pitch),yaw),tail);
    n=normalize(mix(n,ry(rx(n,pitch),yaw),tail));
   }
   float neck=clamp(aB,0.,1.);
   if(neck>.004){
    vec3 chest=vec3(0.,1.38,.43);
    float nod=.038*sin(phase+.86)+.013*sin(phase*2.+.25);
    vec3 moved=chest+rx(p-chest,nod);
    float poll=easing((aP.z-.69)/.57)*easing((aP.y-1.62)/.27);
    moved.y+=.012*poll*sin(phase-.5);
    moved.z+=.023*poll*sin(phase+.12);
    p=mix(p,moved,neck);
    n=normalize(mix(n,rx(n,nod),neck));
   }
   float upper=easing((aP.y-1.03)/.20)*(1.-easing((aP.y-1.55)/.21));
   float rump=1.-easing((aP.z+.63)/.32);
   float shoulder=easing((aP.z+.19)/.42)*(1.-easing((aP.z-.68)/.25));
   p.x+=sign(aP.x)*upper*(.006*shoulder*sin(phase-.4)+.008*rump*sin(phase+1.2));
  }else if(aB>11.5&&aB<14.5){
   float side=sign(aP.x),sway=(.043+.015*uDash)*uJockeyMotion*sin(phase+.6*side);
   if(aB<12.5||aB>13.5){
    vec3 h=vec3(side*.14,2.19,.04);
    p=h+rx(p-h,sway);n=rx(n,sway);
    if(uCelebrate>.001 && (side>.5 || (fract(uJockeySeed*.127)>.66 && side<-.5))){
      float gesture=fract(uJockeySeed*.181);float a=-(gesture<.34?1.43:gesture<.68?1.04:.66)*uCelebrate+.045*sin(phase*.46)*uCelebrate;
      p=h+rx(p-h,a);n=rx(n,a);
      // Bend the forearm independently to make a recognizable clenched-fist gesture.
      if(aB>13.5){
        vec3 k=h+rx(rx(vec3(side*.23,2.04,.26)-h,sway),a);
        float flex=-.61*uCelebrate;
        p=k+rx(p-k,flex);n=rx(n,flex);
      }
    }
   }
   else{
     vec3 h=vec3(side*.14,1.95,-.16);
     p=h+rx(p-h,-.60*sway-.022*uJockeyAttack);n=rx(n,-.60*sway-.022*uJockeyAttack);
    }
  }else if(aB>16.5&&aB<17.5){
    float side=sign(aP.x);
    vec3 knee=vec3(side*.31,1.69,.02);
    float a=(.035+.055*uJockeyAttack)*sin(phase+.5*side);
    p=knee+rx(p-knee,a);n=rx(n,a);
  }else if(aB>.5&&aB<8.5){
   float i=floor((aB-1.)/2.);
   float off=i<.5?0.:i<1.5?.9:i<2.5?2.9:3.65;
   vec3 hip=vec3(mod(i,2.)<.5?-.245:.245,.92,i<1.5?.43:-.64);
   float a=(.32+uDash*.12)*sin(phase+off);
   if(mod(aB,2.)<.5){float fold=-.10-.42*max(0.,sin(phase+off+.85));vec3 knee=hip+vec3(0.,-.43,0.);p=knee+rx(p-knee,fold);n=rx(n,fold);}
   p=hip+rx(p-hip,a);n=rx(n,a);
  }else if(aB>8.5&&aB<9.5){vec3 h=vec3(0.,1.88,.78);p=h+rx(p-h,.036*sin(phase+.65));n=rx(n,.036*sin(phase+.65));}
  else if(aB>9.5&&aB<10.5){vec3 h=vec3(0.,1.36,-.84);p=h+ry(p-h,.045*sin(phase*.33));n=ry(n,.045*sin(phase*.33));}
  else if(aB>10.5){vec3 h=vec3(0.,1.57,-.03);p=h+rx(p-h,.028*sin(phase));n=rx(n,.028*sin(phase));}
  float trunkPitch=.017*sin(phase+.52)+.006*sin(phase*2.-.10);
  p=rx(p-vec3(0.,1.20,0.),trunkPitch)+vec3(0.,1.20,0.);
  p.y+=rise;
  p=mix(aP,p,clamp(uRun,0.,1.));
  n=normalize(mix(aN,n,clamp(uRun,0.,1.)));
 }
 // Rider's upper body folds forward when urging the horse, without changing race physics.
 if(uHorse>.5 && aB>10.5 && uRun>.001){
  vec3 waist=vec3(0.,1.71,-.035);
  float lean=.022*(uJockeyLean-1.)+.075*uJockeyAttack;
  p=waist+rx(p-waist,lean);n=rx(n,lean);
 }
 if(uHorse>.5)p+=n*uOutline*.032;

 // HORSEDAYS_FALL_AND_PACK_V13: rider meshes use skin channel aB 11..14.
 // The horse, saddlecloth and number share aB <= 10.5 and remain visible.
 if(uHorse>.5 && uFallMode>.5){
  bool riderPart=(aB>10.5);
  if((uFallMode<1.5 && riderPart) || (uFallMode>1.5 && !riderPart)){
    // Send hidden geometry outside the clip volume without making a new model buffer.
    p=vec3(0.,-100000.,0.);
  }else if(uFallMode>1.5 && riderPart){
    // In rider-only mode, fall away from the saddle, roll onto the turf and stop.
    // The rider's world anchor stays at the original fall site, not on the riderless horse.
    float t=easing(clamp(uFallAge/1.08,0.,1.));
    vec3 hip=vec3(0.,1.91,-.045);
    vec3 d=p-hip;
    float a=-1.47*t,ca=cos(a),sa=sin(a);
    p=hip+vec3(ca*d.x-sa*d.y,sa*d.x+ca*d.y,d.z);
    n=normalize(vec3(ca*n.x-sa*n.y,sa*n.x+ca*n.y,n.z));
    p+=vec3(.23*t+.88*t*t,-1.55*t,.14*t);
    // Low amplitude final settling; no repeated flipping.
    p.y+=.035*sin(min(1.,uFallAge/1.08)*3.14159)*(1.-t);
  }
 }
vec4 world=uRoot*vec4(p,1.);if(uShadow>.5&&uShadow<1.5){world.xz+=world.y*vec2(.47,-.41);world.y=.034;}vWorld=world.xyz;vec4 clip=uVP*world;gl_Position=clip;vec3 normal=normalize(mat3(uRoot)*n);float l=max(0.,dot(normal,normalize(vec3(-.4,.85,.35))));vNormal=normal;vLight=uHorse>.5?(.46+.44*l+.10*max(0.,dot(normal,normalize(vec3(.58,.42,-.68))))):(.70+.30*l);vFog=clamp((clip.w-900.)/1800.,0.,.75);vC=aC;vM=(uHorse<.5&&uHorse>-.5&&aM<.5&&aN.y>.95&&aP.y<.1)?-1.:aM;vUV=aUV;vLocal=aP;}`;
const fs=`precision highp float;uniform vec3 uEye;uniform vec3 uCoat,uMuzzle,uHair,uSilk,uAccent,uFrame;uniform sampler2D uDigits,uHorseTex,uJockeyTex;uniform float uNumber,uAlpha,uFace,uPattern,uHorse,uShadow,uJockeySeed;uniform mediump float uOutline;varying vec3 vC;varying float vM,vFog,vLight;varying vec2 vUV;varying vec3 vLocal,vWorld,vNormal;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}
vec3 cuteHorseEyes(vec3 p,vec3 c){vec2 q=vec2((p.z-.98)/.075,(p.y-1.96)/.052);float side=smoothstep(.055,.095,abs(p.x));float rim=(1.-smoothstep(.82,1.12,dot(q,q)))*side;c=mix(c,vec3(.065,.038,.025),rim);float eye=(1.-smoothstep(.60,.83,dot(q,q)))*side;c=mix(c,vec3(.025,.018,.012),eye);vec2 iris=vec2((p.z-.995)/.032,(p.y-1.955)/.034);c=mix(c,vec3(.18,.085,.032),(1.-smoothstep(.65,1.,dot(iris,iris)))*eye*.72);vec2 shine=vec2((p.z-1.006)/.014,(p.y-1.981)/.014);c=mix(c,vec3(1,.98,.91),(1.-smoothstep(.5,1.,dot(shine,shine)))*eye);return c;}
void main(){if(uShadow>.5){float feather=1.-smoothstep(.18,1.0,length(vLocal.xz));gl_FragColor=vec4(.065,.084,.055,clamp(uAlpha*1.35,0.,1.)*feather);return;}if(uHorse<-.5){vec3 d=normalize(vLocal);float up=max(0.,d.y);vec3 sky=mix(vec3(.77,.84,.87),vec3(.18,.43,.72),pow(up,.45));vec2 p=d.xz/max(.12,d.y+.2)*2.4;float cloud=noise(p)*.60+noise(p*2.1)*.28+noise(p*4.4)*.12;float alpha=smoothstep(.52,.72,cloud)*smoothstep(-.03,.13,d.y);gl_FragColor=vec4(mix(sky,mix(vec3(.72,.76,.79),vec3(.98,.97,.92),cloud),alpha*.86),1.);return;}if(uOutline>.5){if(vM>5.5)discard;gl_FragColor=vec4(.12,.10,.08,1.);return;}vec3 c=vC;if(vM>.5&&vM<1.5)c=uCoat;else if(vM<2.5&&vM>1.5)c=uMuzzle;else if(vM<3.5&&vM>2.5)c=uHair;else if(vM<4.5&&vM>3.5)c=uSilk;else if(vM<5.5&&vM>4.5)c=uAccent;else if(vM>6.5&&vM<7.5){
 vec3 original=texture2D(uHorseTex,vUV).rgb;
 float tone=dot(original,vec3(.2126,.7152,.0722));
 // Preserve photographic hairs, muzzle and light markings, while giving runners distinct coat colours.
 float hairMask=smoothstep(.09,.32,tone)*(1.-smoothstep(.77,.95,tone));
 vec3 texturedCoat=uCoat*clamp(tone/.30,.48,1.52);
 c=mix(original*vec3(1.10,1.075,1.05),texturedCoat,.68*hairMask);
}else if(vM>9.5&&vM<10.5){c=uFrame;}
 else if(vM>10.5&&vM<11.5){
   // Distinct face palette, without changing the player's horse's silks.
   float skin=fract(uJockeySeed*.0371);
   c=mix(vec3(.46,.27,.18),vec3(.85,.66,.49),skin);
   float shade=clamp(.76+.25*vLight,0.,1.08);
   c*=shade;
 }else if(vM>11.5&&vM<12.5){
   // One jockey keeps the same helmet style when switching horses.
   float stripe=fract(uJockeySeed*.173);
   c=mix(uSilk,uAccent,step(.60,stripe)*.62);
 }else if(vM>12.5&&vM<13.5){
   c=mix(vec3(.19,.30,.37),vec3(.38,.61,.70),fract(uJockeySeed*.137));
 }else if(vM>13.5&&vM<14.5){c=vec3(.045,.063,.070);
 }else if(vM>14.5&&vM<15.5){c=mix(uAccent,vec3(.82,.83,.80),.33);
 }else if(vM>15.5&&vM<16.5){c=mix(uAccent,uSilk,fract(uJockeySeed*.217));
 }else if(vM>7.5){c=texture2D(uJockeyTex,vUV).rgb;if(vLocal.y>2.16&&vLocal.y<2.31&&vLocal.z>.22)c*=mix(vec3(.87,.85,.83),vec3(1.07,1.045,1.025),fract(uJockeySeed*.101));float red=step(c.g*3.2,c.r)*step(c.b*2.4,c.r)*step(.06,c.r);float yellow=step(c.b*4.,c.g)*step(c.g*.8,c.r)*step(.14,c.g);float shade=clamp(max(c.r,c.g)*1.35,.28,1.1);float stripe=uPattern<1.5?step(.5,fract(vLocal.y*12.)):uPattern<2.5?step(.5,fract(vLocal.x*12.)):uPattern<3.5?step(.5,fract((vLocal.x+vLocal.y)*8.)):abs(step(.5,fract(vLocal.x*12.))-step(.5,fract(vLocal.y*12.)));vec3 silk=mix(uSilk,uAccent,stripe*step(.5,uPattern));c=mix(c,mix(silk,uAccent,vC.r)*shade,red*vC.g);c=mix(c,uAccent*shade,yellow*vC.g);}else if(vM>5.5){vec4 ink=texture2D(uDigits,vec2((uNumber+vUV.x)*.0546875,vUV.y));if(ink.a<.3)discard;c=ink.rgb;}if(vM<-.5){vec2 p=vWorld.xz;float broad=noise(p*.36),grain=h2(floor(p*26.));float detail=clamp(1.-length(vWorld-uEye)/135.,0.,1.);float mowing=.5+.5*sin(p.x*.34+p.y*.01);c*=.93+(broad-.5)*.115+(mowing-.5)*.065+(grain-.5)*.15*detail;}
c*=vLight;if(uHorse>.5&&vM>6.5&&vM<7.5){
 vec3 normal=normalize(vNormal);
 vec3 eye=normalize(uEye-vWorld);
 vec3 sun=normalize(vec3(-.42,.85,.36));
 vec3 halfDir=normalize(sun+eye);
 float gloss=pow(max(0.,dot(normal,halfDir)),32.);
 float softGloss=pow(max(0.,dot(normal,halfDir)),9.);
 float rim=pow(1.-max(0.,dot(normal,eye)),3.);
 c+=vec3(.075,.069,.061)*gloss+vec3(.027,.022,.018)*softGloss+vec3(.024,.028,.032)*rim;
}c=mix(c,vec3(.72,.81,.84),vFog);gl_FragColor=vec4(c,uAlpha);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const U={};for(const n of ['Eye','Shadow','VP','Root','T','Run','Dash','Horse','Outline','Coat','Muzzle','Hair','Silk','Accent','Number','Face','Pattern','Alpha','Digits','HorseTex','JockeyTex','Frame','GaitDetail','GaitStyle','Celebrate','FallMode','FallAge','JockeySeed','JockeyMotion','JockeyAttack','JockeyLean'])U[n]=gl.getUniformLocation(program,'u'+n);
const A=[];let offset=0;for(const [name,size] of [['aP',3],['aN',3],['aC',3],['aB',1],['aM',1],['aUV',2]]){A.push({loc:gl.getAttribLocation(program,name),size,offset:offset*4});offset+=size;}
function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return {b,count:data.length/13};}
function bind(obj){gl.bindBuffer(gl.ARRAY_BUFFER,obj.b);for(const a of A){gl.enableVertexAttribArray(a.loc);gl.vertexAttribPointer(a.loc,a.size,gl.FLOAT,false,52,a.offset);}}
function object(out,mesh,p,s,color,r=[0,0,0]){M.emit(mesh,M.matrix(p,r,s),M.tint(color),out);}
function quad(out,points,color){if(D.cross(D.sub(points[1],points[0]),D.sub(points[2],points[0]))[1]<0)points=[points[0],points[3],points[2],points[1]];M.emit([points[0],points[1],points[2],points[0],points[2],points[3]],D.I(),M.tint(color),out);}
// Build the scenery only after the live race has supplied its actual direction.
if(LIVE)await LIVE.ready;
const dirtRace=!!LIVE&&HorseDaysLiveData.isDirt(LIVE.feed.current);
// HORSEDAYS_COURSES_V8: real per-venue profile, not the old generic Tokyo fallback.
const hdFrame=LIVE?.feed.current||{venue:'東京',distance:2000,courseName:'東京・芝',dirt:false};
const hdProfile=HorseDaysCourseProfiles.resolve({...hdFrame,dirt:dirtRace});
const hdWidth=hdProfile.widthMeters;
const hdVenue=hdFrame.venue;
const hdTokyo=hdVenue==='東京';
const HD_VISUAL_SCALE=1; // A virtual metre is now one WebGL model unit, preserving horse/course proportions.
D.setCourseDimensions({...hdProfile,scale:HD_VISUAL_SCALE});
const world=[],signs=[],nearRail=[],stands=[],trackEdge=hdWidth/(2*HD_VISUAL_SCALE),innerEdge=-trackEdge-24/HD_VISUAL_SCALE,innerRail=-trackEdge-6/HD_VISUAL_SCALE,railPosts=512;
object(world,M.cube,[0,-.06,0],[3600,.03,3600],'#577b39');
function band(a,b,c1,c2,steps=512){for(let i=0;i<steps;i++){const t=i*D.L/steps,u=(i+1)*D.L/steps,p=D.course(t,a),q=D.course(u,a),r=D.course(u,b),s=D.course(t,b);quad(world,[[p.x,.015,p.z],[q.x,.015,q.z],[r.x,.015,r.z],[s.x,.015,s.z]],i%12<6?c1:c2);}}
if(dirtRace)band(-trackEdge,trackEdge,'#b7a07b','#c4ad86');
else{
 band(-trackEdge,trackEdge,'#557d31','#608738');
 band(innerEdge,innerRail,'#b7a07b','#c4ad86');
}
function bar(p,q,y,color,width=.055,out=world){const dx=q.x-p.x,dz=q.z-p.z;object(out,M.cube,[(p.x+q.x)/2,y,(p.z+q.z)/2],[width,.045,Math.hypot(dx,dz)/2],color,[0,Math.atan2(dx,dz),0]);}
const railLanes=dirtRace?[-trackEdge,trackEdge]:[innerEdge,innerRail,-trackEdge,trackEdge];
for(const lane of railLanes)for(let i=0;i<railPosts;i++){const p=D.course(i*D.L/railPosts,lane),q=D.course((i+1)*D.L/railPosts,lane);const out=lane===trackEdge?nearRail:world;bar(p,q,1.05,'#fff9df',.055,out);bar(p,q,.58,'#f5f1dc',.038,out);object(out,M.cube,[p.x,.53,p.z],[.055,.55,.055],'#fff9df');}
// Fixed buildings, trees and distance posts occupy the same three-dimensional space.
for(const side of [-1]){const z=D.R-65;object(stands,M.cube,[0,8,z],[155,8,8],'#d1d6ca');for(let j=0;j<7;j++)object(stands,M.cube,[0,1.6+j*1.6,z-side*(15-j*.8)],[155,.45,3],'#e7ddbf');object(stands,M.cube,[0,17,z],[162,.7,22],'#344b55');for(let j=0;j<7;j++)object(stands,M.cube,[0,2+j*1.6,z-side*(18-j*.8)],[155,.24,.12],'#596f77');const data=[];object(data,M.cube,[180,10,z-side*6],[22,10,1.2],'#152b2e');object(data,M.cube,[180,.1,z-side*6],[.8,8,.8],'#58645b');signs.push({data,bounds:{min:[158,0,z-side*6-1.2],max:[202,20,z-side*6+1.2]}});}
for(let i=0;i<150;i++){const p=D.course(i*D.L/150,80+(i%4)*8),height=3+(i%5)*.4;object(world,M.cube,[p.x,height/2,p.z],[.24,height/2,.24],'#9c8657');object(world,M.small,[p.x,height+1.4,p.z],[1.8,2.5,1.7],i%3?'#4e9d43':'#3a8743');if(i%4===0)object(world,M.small,[p.x+1,height+1,p.z+1],[1.6,2,1.6],'#5caa4b');}
const marks=[];for(let rem=200;rem<2000;rem+=200){const p=D.course(D.S/2+(2000-rem)/2000*D.L,trackEdge+3);const data=[];object(data,M.cube,[p.x,2,p.z],[.1,2,.1],'#e6d071');object(data,M.cube,[p.x,4,p.z],[1.4,.6,.12],'#b5a551');const sign={data,bounds:{min:[p.x-1.4,0,p.z-.12],max:[p.x+1.4,5.5,p.z+.12]}};signs.push(sign);marks.push({...p,rem,sign});}
const f=D.course(D.S/2);quad(world,[[f.x-.24,.03,f.z+trackEdge],[f.x+.24,.03,f.z+trackEdge],[f.x+.24,.03,f.z-trackEdge],[f.x-.24,.03,f.z-trackEdge]],'#fffdef');
// The finish marker sits on the far rail for the low, fixed finish camera.
for(const side of [-1,1])object(world,M.cube,[f.x+side*1.1,4.2,f.z-trackEdge-3],[.18,4.2,.16],'#edf0dc');
object(world,M.cube,[f.x,8.2,f.z-trackEdge-3],[1.3,.22,.18],'#2d5449');object(world,M.small,[f.x,9.3,f.z-trackEdge-3],[1.5,1.4,.14],'#244b42');object(world,M.small,[f.x,9.3,f.z-trackEdge-2.82],[.8,.7,.08],'#d9e0c8');

async function mesh(name){const response=await fetch((name.startsWith('horse')?'new-horse/'+name+'-fixed.bin?v=hd10':'classic/'+name+'.bin?v=hd10'));if(!response.ok)throw Error('model '+name);return new Float32Array(await response.arrayBuffer());}
async function imageTexture(name,unit,uniform){const img=new Image();img.src=name==='horse'?'new-horse/horse.jpg?v=hd10':'classic/'+name+'.png?v=hd10';await img.decode();const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);const isPOT=(n)=>(n&(n-1))===0;const mip=isPOT(img.width)&&isPOT(img.height);if(mip)gl.generateMipmap(gl.TEXTURE_2D);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);gl.uniform1i(U[uniform],unit);}
const [horseMesh,jockeyMesh,horseLow,jockeyLow]=await Promise.all([mesh('horse'),mesh('jockey'),mesh('horse-low'),mesh('jockey-low')]);
await imageTexture('horse',1,'HorseTex');await imageTexture('jockey',2,'JockeyTex');gl.activeTexture(gl.TEXTURE0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
const fitted=HorseDaysRaceAccessories.build(M),riderDetail=JOCKEY_V17.build(M);
const complete=new Float32Array(horseMesh.length+jockeyMesh.length+fitted.length+riderDetail.length);
complete.set(horseMesh);complete.set(jockeyMesh,horseMesh.length);complete.set(fitted,horseMesh.length+jockeyMesh.length);complete.set(riderDetail,horseMesh.length+jockeyMesh.length+fitted.length);
const distant=new Float32Array(horseLow.length+jockeyLow.length+fitted.length);distant.set(horseLow);distant.set(jockeyLow,horseLow.length);distant.set(fitted,horseLow.length+jockeyLow.length);
const riderOnlyParts=[];for(let i=0;i<fitted.length;i+=13)if(fitted[i+9]>10.5)for(let j=0;j<13;j++)riderOnlyParts.push(fitted[i+j]);
const fallenRiderData=new Float32Array(jockeyMesh.length+riderOnlyParts.length+riderDetail.length);
fallenRiderData.set(jockeyMesh);fallenRiderData.set(riderOnlyParts,jockeyMesh.length);fallenRiderData.set(riderDetail,jockeyMesh.length+riderOnlyParts.length);
const skyData=[];M.emit(M.round,M.matrix([0,0,0],[0,0,0],[900,900,900]),[1,1,1],skyData,0,9);const skyBuffer=buffer(new Float32Array(skyData));
const standBuffer=buffer(new Float32Array(stands));
const nearRailBuffer=buffer(new Float32Array(nearRail));
const worldBuffer=buffer(new Float32Array(world)),horseBuffer=buffer(complete),distantBuffer=buffer(distant),fallenRiderBuffer=buffer(fallenRiderData);
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
const frameColors=['#f7f4ee','#292e33','#e93c3f','#3a71d9','#f4d733','#2b9d51','#ef7b2d','#ee8fba'];
const coats=[['#825032','#b08760','#30251e'],['#32251f','#615040','#15151a'],['#ad6135','#c68a5b','#503427'],['#74452d','#a37555','#252b2a'],['#deded7','#bcb7ac','#7a817c'],['#766142','#a18565','#292a25'],['#93412c','#a37555','#252b2a'],['#292a2c','#62615d','#18191a']];
let cameraEye=null,cameraTarget=null,lastFrameTime=-1,lastHud=-100;const director=new HorseDaysBroadcast.Director(),announcer=new HorseDaysRaceCommentary.Commentator(Math.floor(Date.now()/1000));
const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
const talking=document.createElement('span');talking.id='commentary-horse';talking.className='commentary-horse';talking.hidden=true;stage.append(talking);$('horse-label').hidden=true;
const cueLine=document.createElement('span');cueLine.id='commentary-line';stage.append(cueLine);
const gallopMotion=new HorseDaysGallop.Motion();
const moments=new HorseDaysRaceMoments.Moments();
// Fall events are reconstructed from the Unity runner's fallen flag. The event is
// cached once so the rider can stay on the track even after the horse moves away.
const hdFallSites=new Map();const hdFallDuration=3.2;

const speech=window.HorseDaysRaceSpeech,voiceButton=$("voice-toggle");
const riderTagV16=document.createElement('div');riderTagV16.id='rider-tag-v16';
riderTagV16.setAttribute('aria-live','off');
riderTagV16.style.cssText='position:absolute;right:9px;bottom:11px;z-index:9;background:rgba(9,31,25,.76);border:1px solid #c8d7c660;border-radius:7px;padding:5px 9px;color:#fff8dc;font:600 11px/1.35 system-ui,sans-serif;pointer-events:none;max-width:64%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
stage.append(riderTagV16);
const hdTop3=document.createElement('div');
hdTop3.id='horse-days-top-three';hdTop3.setAttribute('aria-label','レース先頭3頭の動き');
hdTop3.style.cssText='font:600 12px/1.5 system-ui,sans-serif;color:#f4e4ac;padding:7px 11px;background:rgba(12,24,20,.88);border-radius:8px;margin:6px 0;word-break:keep-all';
(document.querySelector('.field-position')||document.querySelector('main')).prepend(hdTop3);
let hdLastTop3=-10000;

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
const rows=D.race(elapsed);if(!rows.length)return;
const shownV16=rows.find(r=>r.number===focus)||rows[0];
const riderTextV16=shownV16?.riderName||'';
riderTagV16.textContent=riderTextV16?'騎手：'+riderTextV16+'  ·  '+(JOCKEY_V17.styleLabel(shownV16.riderStyle)||'騎乗中')+'  /  '+shownV16.number+'番':'';
riderTagV16.hidden=!riderTextV16;
if(LIVE)moments.update(elapsed,rows,LIVE.feed.current);
if(LIVE){
 for(const r of rows){
  if(r.fallen && !hdFallSites.has(r.number)){
   hdFallSites.set(r.number,{number:r.number,x:r.x,z:r.z,yaw:Math.atan2(r.dx,r.dz),
     time:elapsed,silk:r.silk,accent:r.silkAccent,appearance:r.appearance,riderId:r.riderId,riderName:r.riderName,riderStyle:r.riderStyle});
  }
 }
}

if(now-hdLastTop3>350){
 const top=rows.slice(0,3);const leader=top[0];
 const names=top.map((r,i)=>{
  const gap=i===0?'先頭':('+'+Math.max(0,(leader.actualRan??leader.ran)-(r.actualRan??r.ran)).toFixed(1)+'m');
  return (i+1)+'位 '+r.number+'番 '+r.name+' '+gap;
 });
 hdTop3.textContent=hdProfile.label+'／代表幅'+hdWidth+'m　'+names.join('  ｜  ');
 hdLastTop3=now;
}
const gaits=gallopMotion.update(rows,elapsed);
if(LIVE&&runnerButtons.length!==rows.length){$('field').replaceChildren();runnerButtons.length=0;for(let i=0;i<rows.length;i++){const b=document.createElement('button');const number=i+1;b.onclick=()=>{focus=number;};$('field').append(b);runnerButtons.push(b);}}
// Follow the visible leader from the final turn to the line.
const crowd=LIVE&&parent.HorseDaysRaceCrowd;if(crowd){const {corner}=LIVE.feed.current,start=D.clamp(corner,0,.999),p=(rows[0].progress-start)/(1-start);crowd.setPresentation(p>=0&&!rows[0].finished,Math.max(0,Math.min(1,p)));}
const lead=rows[0],rect=canvas.getBoundingClientRect(),view=director.view(elapsed,rows,mode,focus,rect.width/rect.height,LIVE?LIVE.feed.current.goalCountdown??null:null,cueNumber),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
// Hold the shot through approach/pass; scan the field without cutting on each spoken name.
const dissolveCut=view.cut&&lastFrameTime>=0&&elapsed-lastFrameTime>=0&&elapsed-lastFrameTime<.5;
cameraEye=view.eye;cameraTarget=view.target;lastFrameTime=elapsed;
const vp=D.mul(D.perspective(w/h,view.fov),D.look(cameraEye,cameraTarget));gl.viewport(0,0,w,h);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(U.VP,false,new Float32Array(vp));gl.uniform1f(U.Alpha,1);gl.uniform1f(U.Outline,0);gl.uniform3fv(U.Eye,cameraEye);gl.uniform1f(U.Shadow,0);gl.uniform1f(U.Horse,-1);gl.depthMask(false);gl.disable(gl.DEPTH_TEST);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix(cameraEye)));bind(skyBuffer);gl.drawArrays(gl.TRIANGLES,0,skyBuffer.count);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.uniform1f(U.Horse,0);gl.uniformMatrix4fv(U.Root,false,new Float32Array(D.I()));bind(worldBuffer);gl.drawArrays(gl.TRIANGLES,0,worldBuffer.count);
{bind(standBuffer);gl.drawArrays(gl.TRIANGLES,0,standBuffer.count);bind(nearRailBuffer);gl.drawArrays(gl.TRIANGLES,0,nearRailBuffer.count);}
// Keep the broadcast path intact; only omit a sign when it masks a visible runner.
const visibleHorses=rows.filter(r=>D.project(vp,[r.x,1.4,r.z],rect.width,rect.height).visible);
for(const sign of signs){sign.hidden=HorseDaysSignVisibility.hidden(cameraEye,visibleHorses,sign.bounds);if(!sign.hidden){bind(sign.buffer);gl.drawArrays(gl.TRIANGLES,0,sign.buffer.count);}}
if(elapsed<5){bind(gateBuffer);gl.drawArrays(gl.TRIANGLES,0,gateBuffer.count);if(elapsed<1){bind(closedBuffer);gl.drawArrays(gl.TRIANGLES,0,closedBuffer.count);}}
bind(shadowBuffer);gl.uniform1f(U.Shadow,2);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);gl.depthMask(false);gl.uniform1f(U.Alpha,.23);for(const r of rows){gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,.04,r.z],[0,Math.atan2(r.dx,r.dz),0],[.52,1,1.35])));gl.drawArrays(gl.TRIANGLES,0,shadowBuffer.count);}gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform1f(U.Alpha,1);gl.uniform1f(U.Shadow,0);
bind(distantBuffer);gl.uniform1f(U.GaitDetail,0);gl.uniform1f(U.Run,Math.max(0,Math.min(1,(elapsed-1)*3.2)));gl.uniform1f(U.Horse,1);gl.uniform1f(U.Shadow,1);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);for(const r of rows){if(Math.abs(D.project(vp,[r.x,2.6,r.z],rect.width,rect.height).y-D.project(vp,[r.x,0,r.z],rect.width,rect.height).y)<45)continue;if(!D.project(vp,[r.x,1.2,r.z],rect.width,rect.height).visible)continue;gl.uniform1f(U.Dash,gaits.get(r.number).dash);gl.uniform1f(U.JockeySeed,JOCKEY_V16.seed(JOCKEY_V17.identity(r)));
 gl.uniform1f(U.JockeyMotion,JOCKEY_V16.motion(r.riderStyle,r.dashing));
 gl.uniform1f(U.JockeyAttack,JOCKEY_V17.attack(r.riderStyle,r.dashing,(LIVE?.feed.current?.distance||2000)*(1-r.progress)));
 gl.uniform1f(U.JockeyLean,JOCKEY_V17.lean(r));gl.uniform1f(U.GaitStyle,Math.sin(r.number*2.33));gl.uniform1f(U.Celebrate,moments.pose(r.number,elapsed)*JOCKEY_V16.victory(JOCKEY_V17.identity(r)));gl.uniform1f(U.FallMode,r.fallen?1:0);gl.uniform1f(U.T,elapsed<1?0:gaits.get(r.number).phase/14.8*1.16);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,0,r.z],[0,Math.atan2(r.dx,r.dz),0],[.88,.88,.88])));gl.drawArrays(gl.TRIANGLES,0,distantBuffer.count);}gl.disable(gl.BLEND);gl.uniform1f(U.Shadow,0);
bind(horseBuffer);gl.uniform1f(U.Run,Math.max(0,Math.min(1,(elapsed-1)*3.2)));gl.uniform1f(U.Horse,1);for(const r of rows){const screen=D.project(vp,[r.x,1.2,r.z],rect.width,rect.height);if(!screen.visible)continue;const top=D.project(vp,[r.x,2.6,r.z],rect.width,rect.height),bottom=D.project(vp,[r.x,0,r.z],rect.width,rect.height),meshForHorse=Math.abs(top.y-bottom.y)>68?horseBuffer:distantBuffer;bind(meshForHorse);gl.uniform1f(U.GaitDetail,meshForHorse===horseBuffer?1:0);const c=coats[r.appearance];uniformColor('Coat',r.coatHex||c[0]);uniformColor('Muzzle',c[1]);uniformColor('Hair',c[2]);uniformColor('Silk',r.silk);uniformColor('Accent',r.silkAccent||(r.number%2?'#ffe3a1':'#fff4de'));uniformColor('Frame',frameColors[Math.max(0,Math.min(7,(D.frames[r.number-1]||1)-1))]);gl.uniform1f(U.Pattern,r.silkPattern||0);gl.uniform1f(U.Dash,gaits.get(r.number).dash);gl.uniform1f(U.JockeySeed,JOCKEY_V16.seed(JOCKEY_V17.identity(r)));
 gl.uniform1f(U.JockeyMotion,JOCKEY_V16.motion(r.riderStyle,r.dashing));
 gl.uniform1f(U.JockeyAttack,JOCKEY_V17.attack(r.riderStyle,r.dashing,(LIVE?.feed.current?.distance||2000)*(1-r.progress)));
 gl.uniform1f(U.JockeyLean,JOCKEY_V17.lean(r));gl.uniform1f(U.GaitStyle,Math.sin(r.number*2.33));gl.uniform1f(U.Celebrate,moments.pose(r.number,elapsed)*JOCKEY_V16.victory(JOCKEY_V17.identity(r)));gl.uniform1f(U.FallMode,r.fallen?1:0);gl.uniform1f(U.Face,facePattern(r.appearanceSeed??r.number));gl.uniform1f(U.Number,r.number-1);gl.uniform1f(U.T,elapsed<1?0:gaits.get(r.number).phase/14.8*1.16);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,0,r.z],[0,Math.atan2(r.dx,r.dz),0],[.88,.88,.88])));
gl.disable(gl.CULL_FACE);gl.uniform1f(U.Outline,0);gl.drawArrays(gl.TRIANGLES,0,meshForHorse.count);}
gl.disable(gl.CULL_FACE);
// An independent rider-only mesh stays at the fall position while the horse continues.
if(LIVE && hdFallSites.size){
 gl.uniform1f(U.Celebrate,0);gl.uniform1f(U.Shadow,0);gl.uniform1f(U.Horse,1);
 gl.uniform1f(U.Run,0);gl.uniform1f(U.GaitDetail,0);gl.uniform1f(U.Outline,0);
 bind(fallenRiderBuffer);
 for(const site of hdFallSites.values()){
  const age=elapsed-site.time;
  if(age<0||age>hdFallDuration)continue;
  gl.uniform1f(U.FallMode,2);gl.uniform1f(U.FallAge,age);
  gl.uniform1f(U.JockeySeed,JOCKEY_V16.seed(JOCKEY_V17.identity(site)));
  gl.uniform1f(U.JockeyMotion,JOCKEY_V16.motion(site.riderStyle,false));
  gl.uniform1f(U.JockeyAttack,0);
  gl.uniform1f(U.JockeyLean,JOCKEY_V17.lean(site));
  uniformColor('Silk',site.silk||'#eeeeee');
  uniformColor('Accent',site.accent||'#f5e9da');
  gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix(
   [site.x,0,site.z],[0,site.yaw,0],[.88,.88,.88])));
  gl.drawArrays(gl.TRIANGLES,0,fallenRiderBuffer.count);
 }
 gl.uniform1f(U.FallMode,0);gl.uniform1f(U.FallAge,0);
}
dissolve.draw(now,w,h,dissolveCut);
const overlay=$('course-labels');if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}lc.setTransform(dpr,0,0,dpr,0,0);lc.clearRect(0,0,rect.width,rect.height);for(const mark of marks){if(mark.sign.hidden)continue;const q=D.project(vp,[mark.x,4.8,mark.z],rect.width,rect.height);if(!q.visible||q.depth>150)continue;lc.font='bold '+D.clamp(300/q.depth,8,16)+'px system-ui';lc.textAlign='center';lc.strokeStyle='#70602a';lc.lineWidth=2;lc.fillStyle='#ffe16d';lc.strokeText(String(mark.rem),q.x,q.y);lc.fillText(String(mark.rem),q.x,q.y);}
if(LIVE)moments.drawOwner(lc,rows,vp,rect,sceneProject);
fieldPositions.draw(rows,D.frames,focus,cueNumber,elapsed);
if(now-lastHud>=100){lastHud=now;
$('time').textContent='時計 '+Math.floor(Math.max(0,elapsed-(LIVE?0:1))/60)+':'+(Math.max(0,elapsed-(LIVE?0:1))%60).toFixed(1).padStart(4,'0');$('remaining').textContent=lead.finished?(rows.every(r=>r.finished)?'全馬ゴール':rows.filter(r=>r.finished).length+'/'+rows.length+'頭ゴール'):'残り '+Math.max(0,Math.round(LIVE?LIVE.feed.current.distance-lead.actualRan:2000-lead.ran))+'m';$('progress').style.width=Math.min(100,lead.progress*100)+'%';$('shot').textContent=view.label;$('seek').value=elapsed;if(LIVE){const s=LIVE.feed.sample(performance.now());if(Array.isArray(s.elevation)&&s.elevation.length>1){elevation.profile={distance:s.distance,points:s.elevation.map(p=>[p.distance,p.height])};const r=rows.find(r=>r.number===focus)||lead;elevation.draw({...r,ran:r.actualRan},!!focus);}coursePosition.draw(s,focus);}else {elevation.draw(rows.find(r=>r.number===focus)||lead,!!focus);coursePosition.drawDemo(rows,D,focus);}
}
announcer.bodyLength=LIVE?(LIVE.feed.current.bodyLength||2.8/.15):2.4;announcer.distance=LIVE?LIVE.feed.current.distance:2000;announcer.straightStart=LIVE?LIVE.feed.current.straight*announcer.distance:1600;announcer.cornerStart=LIVE?LIVE.feed.current.corner*announcer.distance:1300;announcer.slope=HorseDaysElevation.state(elevation.profile,LIVE?lead.actualRan:lead.ran).slope;let cue=announcer.update(elapsed,LIVE?rows.map(r=>({...r,ran:r.actualRan})):rows);if(view.introNumber&&cue.type==='field'){const introduced=rows.find(r=>r.number===view.introNumber);if(introduced)cue=announcer.introduce(introduced,rows);}if(cue.key!==lastCue){speech.say(cue.text,cue.key,cue.number);lastCue=cue.key;}
const spoken=speech.enabled&&speech.current;cueNumber=spoken?(speech.currentNumber||cue.number):cue.number;setText($('commentary'),spoken?(speech.currentDisplayText||cue.text):cue.text);
// The callout always follows the horse named by commentary, independently of camera selection.
const named=rows.find(r=>r.number===cueNumber);talking.hidden=!named;cueLine.hidden=true;
if(named){const q=D.project(vp,[named.x,2.85,named.z],rect.width,rect.height),visible=q.depth>0&&q.x>=12&&q.x<=rect.width-12&&q.y>=32&&q.y<rect.height-12;
 talking.hidden=!visible;
 if(visible){
 const bw=Math.min(180,rect.width-20),x=D.clamp(q.x-bw/2,8,rect.width-bw-8),y=D.clamp(q.y-32,30,rect.height-42);
 setText(talking,named.number+' '+named.name+' · '+named.rank+'番手');
 talking.style.width=bw+'px';talking.style.transform='translate3d('+x+'px,'+y+'px,0)';const foot=D.project(vp,[named.x,1.3,named.z],rect.width,rect.height),dx=foot.x-(x+bw/2),dy=foot.y-(y+26);cueLine.hidden=false;cueLine.style.width=Math.hypot(dx,dy)+'px';cueLine.style.transform='translate3d('+(x+bw/2)+'px,'+(y+26)+'px,0) rotate('+Math.atan2(dy,dx)+'rad)';}
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



