'use strict';
(async()=>{
const LIVE=window.HorseDaysLiveRace;
const D=HorseDaysSolid,M=HorseDaysSolidModel,$=id=>document.getElementById(id),canvas=$('race3d'),stage=$('race-stage');
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'high-performance'});if(!gl){$('error').hidden=false;$('error').textContent='立体表示を開けませんでした。SafariやChromeで開き直してください。';return;}
const vs=`attribute vec3 aP,aN,aC;attribute float aB,aM;attribute vec2 aUV;uniform mat4 uVP,uRoot;uniform float uT,uHorse,uRun,uDash,uShadow;uniform mediump float uOutline;varying vec3 vC;varying float vM,vFog,vLight;varying vec2 vUV;varying vec3 vLocal,vWorld,vNormal;vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);}void main(){vec3 p=aP,n=aN;float phase=uT*14.8;if(uHorse>.5&&uRun>.5){if(aM>6.5&&aM<7.5){float side=step(0.,p.x),front=step(.10,p.z);side=aC.y;vec3 hip=vec3(mix(mix(-.12,.15,side),mix(-.08,.18,side),front),1.08,mix(mix(-1.08,-.94,side),mix(.32,.24,side),front));float ph=phase+mix(mix(3.2,3.8,side),mix(0.,.6,side),front);vec3 q=p;float knee=1.-smoothstep(.48,.70,p.y);vec3 joint=hip+vec3(0.,-.53,0.);float fold=-(.52+.26*uDash)*max(0.,sin(ph+.75));q=joint+rx(q-joint,fold*knee);q=hip+rx(q-hip,(.67+.22*uDash)*sin(ph));p=mix(p,q,aC.x);n=rx(n,aC.x*(.67+.22*uDash)*sin(ph));float tail=aC.z*1.;p.z-=aC.z*.16;p.y+=aC.z*.04;float flow=uT*4.4;float sway=(.16+.07*uDash)*sin(flow)+.025*sin(flow*1.8);p.x+=tail*sway;p.z-=tail*(.09+.06*uDash)*(1.+.2*sin(flow*.8+.7));p.y+=tail*(.06+.04*uDash+.025*sin(flow*1.3));float head=smoothstep(1.65,1.95,aP.y)*smoothstep(.28,.65,aP.z);p.y+=head*.025*sin(phase+.4);}else if(aB>.5&&aB<8.5){float i=floor((aB-1.)/2.);float off=i<.5?0.:i<1.5?.6:i<2.5?3.2:3.8;vec3 hip=vec3(mod(i,2.)<.5?-.245:.245,.92,i<1.5?.43:-.64);float a=(.65+uDash*.30)*sin(phase+off);if(mod(aB,2.)<.5){float b=-.12-(.95+uDash*.35)*max(0.,sin(phase+off+.85));vec3 knee=hip+vec3(0.,-.43,0.);p=knee+rx(p-knee,b);n=rx(n,b);}p=hip+rx(p-hip,a);n=rx(n,a);}else if(aB>8.5&&aB<9.5){vec3 h=vec3(0.,1.88,.78);p=h+rx(p-h,.03*sin(phase+.5));n=rx(n,.03*sin(phase+.5));}else if(aB>9.5&&aB<10.5){vec3 h=vec3(0.,1.36,-.84);float a=.1*sin(uT*5.);p=h+rz(p-h,a);n=rz(n,a);}else if(aB>10.5){vec3 h=vec3(0.,1.57,-.03);p=h+rx(p-h,.05*sin(phase));n=rx(n,.05*sin(phase));}p=rx(p-vec3(0.,1.2,0.),uDash*.025*sin(phase))+vec3(0.,1.2,0.);p.y+=(.025+uDash*.035)*cos(phase);}if(uHorse>.5)p+=n*uOutline*.032;vec4 world=uRoot*vec4(p,1.);if(uShadow>.5&&uShadow<1.5){world.xz+=world.y*vec2(.47,-.41);world.y=.034;}vWorld=world.xyz;vec4 clip=uVP*world;gl_Position=clip;vec3 normal=normalize(mat3(uRoot)*n);float l=max(0.,dot(normal,normalize(vec3(-.4,.85,.35))));vNormal=normal;vLight=uHorse>.5?(.48+.52*l):(.72+.28*l);vFog=clamp((clip.w-900.)/1800.,0.,.75);vC=aC;vM=(uHorse<.5&&uHorse>-.5&&aM<.5&&aN.y>.95&&aP.y<.1)?-1.:aM;vUV=aUV;vLocal=aP;}`;
const fs=`precision highp float;uniform vec3 uEye;uniform vec3 uCoat,uMuzzle,uHair,uSilk,uAccent;uniform sampler2D uDigits,uHorseTex,uJockeyTex;uniform float uNumber,uAlpha,uFace,uPattern,uHorse,uShadow;uniform mediump float uOutline;varying vec3 vC;varying float vM,vFog,vLight;varying vec2 vUV;varying vec3 vLocal,vWorld,vNormal;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}
vec3 cuteHorseEyes(vec3 p,vec3 c){vec2 q=vec2((p.z-.98)/.075,(p.y-1.96)/.052);float side=smoothstep(.055,.095,abs(p.x));float rim=(1.-smoothstep(.82,1.12,dot(q,q)))*side;c=mix(c,vec3(.065,.038,.025),rim);float eye=(1.-smoothstep(.60,.83,dot(q,q)))*side;c=mix(c,vec3(.025,.018,.012),eye);vec2 iris=vec2((p.z-.995)/.032,(p.y-1.955)/.034);c=mix(c,vec3(.18,.085,.032),(1.-smoothstep(.65,1.,dot(iris,iris)))*eye*.72);vec2 shine=vec2((p.z-1.006)/.014,(p.y-1.981)/.014);c=mix(c,vec3(1,.98,.91),(1.-smoothstep(.5,1.,dot(shine,shine)))*eye);return c;}
void main(){if(uShadow>.5){gl_FragColor=vec4(.08,.12,.055,.31);return;}if(uHorse<-.5){vec3 d=normalize(vLocal);float up=max(0.,d.y);vec3 sky=mix(vec3(.77,.84,.87),vec3(.18,.43,.72),pow(up,.45));vec2 p=d.xz/max(.12,d.y+.2)*2.4;float cloud=noise(p)*.60+noise(p*2.1)*.28+noise(p*4.4)*.12;float alpha=smoothstep(.52,.72,cloud)*smoothstep(-.03,.13,d.y);gl_FragColor=vec4(mix(sky,mix(vec3(.72,.76,.79),vec3(.98,.97,.92),cloud),alpha*.86),1.);return;}if(uOutline>.5){if(vM>5.5)discard;gl_FragColor=vec4(.12,.10,.08,1.);return;}vec3 c=vC;if(vM>.5&&vM<1.5)c=uCoat;else if(vM<2.5&&vM>1.5)c=uMuzzle;else if(vM<3.5&&vM>2.5)c=uHair;else if(vM<4.5&&vM>3.5)c=uSilk;else if(vM<5.5&&vM>4.5)c=uAccent;else if(vM>6.5&&vM<7.5){c=texture2D(uHorseTex,vUV).rgb;float brown=(1.-smoothstep(.36,.65,min(c.r,min(c.g,c.b))))*(1.-clamp(vC.b,0.,1.));float shade=clamp(dot(c,vec3(.3,.59,.11))/.12,.32,1.5);c=mix(c,uCoat*shade,brown*.94);float oldWhite=step(.55,min(c.r,min(c.g,c.b)))*step(.78,vLocal.z)*step(1.3,vLocal.y);c=mix(c,uCoat*shade,oldWhite);float width=uFace<.5?.055:uFace<1.5?0.:uFace<2.5?.026:uFace<3.5?.06:uFace<4.5?.10:.05;float center=uFace>4.5?.035*sin(vLocal.y*7.):0.;float patch=step(abs(vLocal.x-center),width)*step(.88,vLocal.z)*step(1.35,vLocal.y);if(uFace>2.5&&uFace<3.5)patch*=step(abs(vLocal.y-1.72),.065);c=mix(c,vec3(.94,.93,.88),patch);c=cuteHorseEyes(vLocal,c);}else if(vM>7.5){c=texture2D(uJockeyTex,vUV).rgb;float red=step(c.g*3.2,c.r)*step(c.b*2.4,c.r)*step(.06,c.r);float yellow=step(c.b*4.,c.g)*step(c.g*.8,c.r)*step(.14,c.g);float shade=clamp(max(c.r,c.g)*1.35,.28,1.1);float stripe=uPattern<1.5?step(.5,fract(vLocal.y*12.)):uPattern<2.5?step(.5,fract(vLocal.x*12.)):uPattern<3.5?step(.5,fract((vLocal.x+vLocal.y)*8.)):abs(step(.5,fract(vLocal.x*12.))-step(.5,fract(vLocal.y*12.)));vec3 silk=mix(uSilk,uAccent,stripe*step(.5,uPattern));c=mix(c,mix(silk,uAccent,vC.r)*shade,red*vC.g);c=mix(c,uAccent*shade,yellow*vC.g);}else if(vM>5.5){vec4 ink=texture2D(uDigits,vec2((uNumber+vUV.x)*.0546875,vUV.y));if(ink.a<.3)discard;c=ink.rgb;}if(vM<-.5){vec2 p=vWorld.xz;float broad=noise(p*1.8),grain=h2(floor(p*45.));float detail=clamp(1.-length(vWorld-uEye)/90.,0.,1.);c*=.90+(broad-.5)*.17+(grain-.5)*.24*detail;}
c*=vLight;if(uHorse>.5&&vM>6.5&&vM<7.5){vec3 n=normalize(vNormal),v=normalize(uEye-vWorld),halfway=normalize(v+normalize(vec3(-.4,.85,.35)));float sheen=pow(max(0.,dot(n,halfway)),28.);c+=vec3(.12,.11,.09)*sheen;}c=mix(c,vec3(.72,.81,.84),vFog);gl_FragColor=vec4(c,uAlpha);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const U={};for(const n of ['Eye','Shadow','VP','Root','T','Run','Dash','Horse','Outline','Coat','Muzzle','Hair','Silk','Accent','Number','Face','Pattern','Alpha','Digits','HorseTex','JockeyTex'])U[n]=gl.getUniformLocation(program,'u'+n);
const A=[];let offset=0;for(const [name,size] of [['aP',3],['aN',3],['aC',3],['aB',1],['aM',1],['aUV',2]]){A.push({loc:gl.getAttribLocation(program,name),size,offset:offset*4});offset+=size;}
function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return {b,count:data.length/13};}
function bind(obj){gl.bindBuffer(gl.ARRAY_BUFFER,obj.b);for(const a of A){gl.enableVertexAttribArray(a.loc);gl.vertexAttribPointer(a.loc,a.size,gl.FLOAT,false,52,a.offset);}}
function object(out,mesh,p,s,color,r=[0,0,0]){M.emit(mesh,M.matrix(p,r,s),M.tint(color),out);}
function quad(out,points,color){if(D.cross(D.sub(points[1],points[0]),D.sub(points[2],points[0]))[1]<0)points=[points[0],points[3],points[2],points[1]];M.emit([points[0],points[1],points[2],points[0],points[2],points[3]],D.I(),M.tint(color),out);}
// Build the scenery only after the live race has supplied its actual direction.
if(LIVE)await LIVE.ready;
const dirtRace=!!LIVE&&HorseDaysLiveData.isDirt(LIVE.feed.current);
// HORSEDAYS_REAL_COURSE_V7: the horse mesh is ~2.91 units from nose to tail.
// Actual Tokyo data: turf A 2083.1 m/lap, 525.9 m straight, 31-41 m wide;
// dirt: 1899 m/lap, 501.6 m straight, 25 m wide (JRA official figures).
// All other venues retain a clearly approximate, generic stadium geometry.
const HD_VISUAL_SCALE=typeof TRACK_SCALE==='number'?TRACK_SCALE:1;
const hdVenue=String(LIVE?.feed.current?.venue||'東京');
const hdTokyo=hdVenue.includes('東京')||/Tokyo/i.test(hdVenue);
const hdWidth=hdTokyo?(dirtRace?25:34):(dirtRace?25:30);
const hdDimensions=hdTokyo?(dirtRace?{lapMeters:1899,straightMeters:501.6}:{lapMeters:2083.1,straightMeters:525.9}):{lapMeters:2000,straightMeters:480};
D.setCourseDimensions({...hdDimensions,widthMeters:hdWidth,scale:HD_VISUAL_SCALE});

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

async function mesh(name){const response=await fetch((name.startsWith('horse')?'new-horse/'+name+'-fixed.bin?v=v18-restore':'classic/'+name+'.bin?v=v18-restore'));if(!response.ok)throw Error('model '+name);return new Float32Array(await response.arrayBuffer());}
async function imageTexture(name,unit,uniform){const img=new Image();img.src=name==='horse'?'new-horse/horse.jpg?v=v18-restore':'classic/'+name+'.png?v=v18-restore';await img.decode();const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);gl.uniform1i(U[uniform],unit);}
const [horseMesh,jockeyMesh,horseLow,jockeyLow]=await Promise.all([mesh('horse'),mesh('jockey'),mesh('horse-low'),mesh('jockey-low')]);
await imageTexture('horse',1,'HorseTex');await imageTexture('jockey',2,'JockeyTex');gl.activeTexture(gl.TEXTURE0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
const fitted=M.equipment,complete=new Float32Array(horseMesh.length+jockeyMesh.length+fitted.length);complete.set(horseMesh);complete.set(jockeyMesh,horseMesh.length);complete.set(fitted,horseMesh.length+jockeyMesh.length);
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
if(now-hdLastTop3>350){
 const top=rows.slice(0,3);const leader=top[0];
 const names=top.map((r,i)=>{
  const gap=i===0?'先頭':('+'+Math.max(0,(leader.actualRan??leader.ran)-(r.actualRan??r.ran)).toFixed(1)+'m');
  return (i+1)+'位 '+r.number+'番 '+r.name+' '+gap;
 });
 hdTop3.textContent=(hdTokyo?'東京モデル ':'参考コース ')+(dirtRace?'ダート':'芝')+'／幅'+hdWidth+'m　'+names.join('  ｜  ');
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
bind(distantBuffer);gl.uniform1f(U.Run,elapsed>=1?1:0);gl.uniform1f(U.Horse,1);gl.uniform1f(U.Shadow,1);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);for(const r of rows){if(Math.abs(D.project(vp,[r.x,2.6,r.z],rect.width,rect.height).y-D.project(vp,[r.x,0,r.z],rect.width,rect.height).y)<45)continue;if(!D.project(vp,[r.x,1.2,r.z],rect.width,rect.height).visible)continue;gl.uniform1f(U.Dash,gaits.get(r.number).dash);gl.uniform1f(U.T,elapsed<1?0:gaits.get(r.number).phase/14.8);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,0,r.z],[0,Math.atan2(r.dx,r.dz),0],[1,1,1])));gl.drawArrays(gl.TRIANGLES,0,distantBuffer.count);}gl.disable(gl.BLEND);gl.uniform1f(U.Shadow,0);
bind(horseBuffer);gl.uniform1f(U.Run,elapsed>=1?1:0);gl.uniform1f(U.Horse,1);for(const r of rows){const screen=D.project(vp,[r.x,1.2,r.z],rect.width,rect.height);if(!screen.visible)continue;const top=D.project(vp,[r.x,2.6,r.z],rect.width,rect.height),bottom=D.project(vp,[r.x,0,r.z],rect.width,rect.height),meshForHorse=Math.abs(top.y-bottom.y)>85?horseBuffer:distantBuffer;bind(meshForHorse);const c=coats[r.appearance];uniformColor('Coat',r.coatHex||c[0]);uniformColor('Muzzle',c[1]);uniformColor('Hair',c[2]);uniformColor('Silk',r.silk);uniformColor('Accent',r.silkAccent||(r.number%2?'#ffe3a1':'#fff4de'));gl.uniform1f(U.Pattern,r.silkPattern||0);gl.uniform1f(U.Dash,gaits.get(r.number).dash);gl.uniform1f(U.Face,facePattern(r.appearanceSeed??r.number));gl.uniform1f(U.Number,r.number-1);gl.uniform1f(U.T,elapsed<1?0:gaits.get(r.number).phase/14.8);gl.uniformMatrix4fv(U.Root,false,new Float32Array(M.matrix([r.x,0,r.z],[0,Math.atan2(r.dx,r.dz),0],[1,1,1])));
gl.disable(gl.CULL_FACE);gl.uniform1f(U.Outline,0);gl.drawArrays(gl.TRIANGLES,0,meshForHorse.count);}
gl.disable(gl.CULL_FACE);
dissolve.draw(now,w,h,dissolveCut);
const overlay=$('course-labels');if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}lc.setTransform(dpr,0,0,dpr,0,0);lc.clearRect(0,0,rect.width,rect.height);for(const mark of marks){if(mark.sign.hidden)continue;const q=D.project(vp,[mark.x,4.8,mark.z],rect.width,rect.height);if(!q.visible||q.depth>150)continue;lc.font='bold '+D.clamp(300/q.depth,8,16)+'px system-ui';lc.textAlign='center';lc.strokeStyle='#70602a';lc.lineWidth=2;lc.fillStyle='#ffe16d';lc.strokeText(String(mark.rem),q.x,q.y);lc.fillText(String(mark.rem),q.x,q.y);}
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



