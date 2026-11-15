'use strict';
(()=> {
const $=id=>document.getElementById(id),canvas=$('view'),stage=$('stage');
const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
if(!gl){$('error').hidden=false;$('error').textContent='この端末では3D表示を開けません。Safariなどのブラウザでお試しください。';return;}
const VS='attribute vec3 aP,aN,aC; uniform mat4 uVP; varying vec3 vC; void main(){float l=.58+.42*max(0.,dot(normalize(aN),normalize(vec3(-.5,1.,.7))));vC=aC*l;gl_Position=uVP*vec4(aP,1.);}';
const FS='precision mediump float; varying vec3 vC; void main(){gl_FragColor=vec4(vC,1.);}';
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
for(const [i,name] of ['aP','aN','aC'].entries()){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,i*12);}
const uVP=gl.getUniformLocation(program,'uVP');gl.enable(gl.DEPTH_TEST);
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){const r=new Array(16).fill(0);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
function matrix(p,r=[0,0,0],s=[1,1,1]){let m=I();m[12]=p[0];m[13]=p[1];m[14]=p[2];const [x,y,z]=r,cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
m=mul(m,[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);m=mul(m,[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]);m=mul(m,[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1]);return mul(m,[s[0],0,0,0,0,s[1],0,0,0,0,s[2],0,0,0,0,1]);}
function point(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function look(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(aspect){const f=1/Math.tan(.64/2),n=.1,far=90;return [f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0];}
const tint=(s)=>{if(Array.isArray(s))return s;if(s.length===4)s='#'+[...s.slice(1)].map(c=>c+c).join('');return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);};
function triangle(out,a,b,c,outward){if(outward&&dot(cross(sub(b,a),sub(c,a)),outward)<0)[b,c]=[c,b];out.push(a,b,c);}
function sphere(sides=12,bands=8){const a=[],v=(y,x)=>[Math.sin(y*Math.PI/bands)*Math.cos(x*2*Math.PI/sides),Math.cos(y*Math.PI/bands),Math.sin(y*Math.PI/bands)*Math.sin(x*2*Math.PI/sides)];for(let y=0;y<bands;y++)for(let x=0;x<sides;x++){const p=v(y,x),q=v(y+1,x),r=v(y+1,x+1),s=v(y,x+1);if(y>0)triangle(a,p,q,s,p);if(y<bands-1)triangle(a,s,q,r,r);}return a;}
function box(){const a=[],v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){triangle(a,v[f[0]],v[f[1]],v[f[2]],v[f[0]]);triangle(a,v[f[0]],v[f[2]],v[f[3]],v[f[0]]);}return a;}
function loft(rings,sides=10){const a=[],v=(i,j)=>{const [y,z,w,d]=rings[i],ang=j*2*Math.PI/sides;return [Math.cos(ang)*w,y,z+Math.sin(ang)*d];};for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){const p=v(i,j),q=v(i+1,j),r=v(i+1,j+1),s=v(i,j+1),out=[Math.cos((j+.5)*2*Math.PI/sides),0,Math.sin((j+.5)*2*Math.PI/sides)];triangle(a,p,q,s,out);triangle(a,s,q,r,out);}for(const i of [0,rings.length-1])for(let j=0;j<sides;j++)triangle(a,[0,rings[i][0],rings[i][1]],v(i,j),v(i,j+1),[0,i===0?-1:1,0]);return a;}
const round=sphere(),small=sphere(10,6),cube=box(),nodes=[],legs=[],coatNodes=[],hairNodes=[],whiteNodes=[];
function node(name,parent,p=[0,0,0],s=[1,1,1],color='#ffffff',mesh=null,r=[0,0,0]){const n={name,parent,p:p.slice(),r:r.slice(),s,color:tint(color),mesh,world:I()};nodes.push(n);return n;}
function part(name,parent,p,s,color,mesh=round,r){return node(name,parent,p,s,color,mesh,r);}
function coat(...args){const n=part(...args);coatNodes.push(n);return n;}
function hair(...args){const n=part(...args);hairNodes.push(n);return n;}
const root=node('Horse',null),body=node('Suspension',root);
coat('Barrel',body,[0,1.12,-.12],[.38,.43,.78],'#a95b32');
coat('Shoulder',body,[0,1.18,.40],[.34,.42,.35],'#a95b32');
const neck=node('Neck',body,[0,0,0]);
coat('Neck silhouette',neck,[0,0,0],[1,1,1],'#a95b32',loft([[1.08,.3,.22,.28],[1.4,.48,.22,.25],[1.7,.62,.16,.19],[1.91,.75,.13,.13]]));
const head=node('Head',neck,[0,1.88,.78]);
coat('Face',head,[0,-.04,.1],[.23,.28,.34],'#a95b32',round,[-.35,0,0]);
coat('Muzzle',head,[0,-.21,.38],[.235,.17,.20],'#b66c43',small);
for(const x of [-1,1]){
 part('Nostril',head,[x*.145,-.20,.536],[.036,.029,.012],'#3c2925',small);
 part('Eye white',head,[x*.213,.015,.18],[.035,.091,.080],'#fffbeb',small);
 part('Eye',head,[x*.239,.007,.195],[.022,.060,.052],'#232b2b',small);
 part('Eye glint',head,[x*.255,.03,.213],[.008,.019,.016],'#ffffff',small);
 coat('Ear',head,[x*.14,.26,-.01],[.074,.16,.075],'#a95b32',small,[.05,0,x*-.17]);
 part('Ear inner',head,[x*.14,.28,.047],[.034,.10,.015],'#cc9576',small);
 part('Cheek bridle',head,[x*.238,-.065,.16],[.012,.15,.017],'#44352f',cube,[-.5,0,0]);
}
whiteNodes.push(part('Forehead blaze',head,[0,.015,.415],[.065,.16,.018],'#fff3d8',small,[-.35,0,0]));
part('Noseband',head,[0,-.155,.50],[.24,.024,.014],'#44352f',cube);
part('Mouth',head,[0,-.29,.53],[.095,.008,.009],'#4d3029',cube);
for(let i=0;i<7;i++)hair('Mane',neck,[0,1.4+i*.075,.26+i*.071],[.12,.13,.10],'#4a2c24',small,[-.4,0,0]);
hair('Forelock',head,[0,.20,.22],[.18,.13,.15],'#4a2c24',small,[-.3,0,.2]);
const tail=node('Tail',body,[0,1.36,-.84],[1,1,1],'#fff',null,[.3,0,0]);
hair('Tail root',tail,[0,-.21,-.07],[.11,.34,.12],'#4a2c24',small,[-.25,0,0]);
hair('Tail fall',tail,[0,-.52,-.10],[.15,.24,.14],'#4a2c24',small,[.2,0,0]);
for(let i=0;i<4;i++){
 const x=i%2===0?-.245:.245,z=i<2?.43:-.64;
 const hip=node('Leg '+i,body,[x,.92,z]),shin=node('Knee '+i,hip,[0,-.43,0]);
 coat('Upper leg',hip,[0,-.21,0],[.11,.27,.12],'#a95b32',small);
 coat('Cannon',shin,[0,-.19,0],[.065,.235,.075],'#a95b32',small);
 const sock=part('Sock',shin,[0,-.32,0],[.068,.12,.077],i===0||i===3?'#fff3df':'#583d31',small);
 part('Hoof',shin,[0,-.41,.035],[.095,.075,.13],'#3b3430',small);
 legs.push({hip,shin,sock});
}
part('Saddle pad',body,[0,1.45,-.12],[.41,.10,.39],'#efd5a5',small);
part('Saddle',body,[0,1.53,-.12],[.28,.07,.30],'#3f3830',small);
for(const x of [-1,1]){part('Cloth',body,[x*.385,1.17,-.17],[.014,.19,.28],'#327865',cube);part('Number 7 top',body,[x*.404,1.28,-.20],[.009,.018,.12],'#fff6df',cube);part('Number 7 stem',body,[x*.405,1.18,-.25],[.009,.10,.016],'#fff6df',cube,[-.5,0,0]);}
const rider=node('Jockey',body,[0,1.57,-.03]);
part('Silks',rider,[0,.19,.07],[.16,.23,.20],'#327865',small,[.7,0,0]);
part('Stripe',rider,[0,.28,.17],[.17,.037,.12],'#f5cf8e',small,[.7,0,0]);
part('Face',rider,[0,.39,.25],[.115,.13,.11],'#d8a67e',small);
part('Helmet',rider,[0,.49,.24],[.15,.13,.15],'#327865',small);
part('Helmet brim',rider,[0,.45,.35],[.15,.018,.12],'#255645',small);
for(const x of [-1,1]){part('Breeches',rider,[x*.19,-.02,0],[.075,.16,.10],'#fbf4df',small,[.6,0,x*.3]);part('Boot',rider,[x*.25,-.22,-.02],[.063,.15,.065],'#343531',small);part('Sleeve',rider,[x*.17,.16,.23],[.06,.16,.06],'#327865',small,[-.9,0,0]);part('Hand',rider,[x*.16,.08,.35],[.045,.045,.045],'#d8a67e',small);part('Rein',body,[x*.14,1.64,.58],[.008,.012,.25],'#483a30',cube,[.20,0,0]);}
const horseNodes=nodes.slice(),horseTriangles=horseNodes.reduce((n,p)=>n+(p.mesh?.length||0)/3,0);
const sets=[{name:'CHESTNUT / 栗毛',coat:'#a95b32',muzzle:'#b56c48',hair:'#4a2c24'},{name:'BAY / 鹿毛',coat:'#664231',muzzle:'#845e49',hair:'#25282a'},{name:'GREY / 芦毛',coat:'#c3c7be',muzzle:'#a2a99f',hair:'#626b68'},{name:'BLACK / 青毛',coat:'#343e40',muzzle:'#525d5c',hair:'#222a2c'}];
function setCoat(i){const c=sets[i];for(const n of coatNodes)n.color=tint(n.name==='Muzzle'?c.muzzle:c.coat);for(const n of hairNodes)n.color=tint(c.hair);$('stageLabel').textContent=c.name;document.querySelectorAll('[data-coat]').forEach(b=>{const selected=+b.dataset.coat===i;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});for(const [j,l] of legs.entries())l.sock.color=tint(j===0||j===3?'#fff3df':c.hair);}
let race=false,animate=!matchMedia('(prefers-reduced-motion: reduce)').matches,clock=0,raceTime=0,last=0,yaw=1.0,elev=.22,zoom=5.5,voice=false,spoken=-1,ended=false;
const lines=[
[0,'ゲートが開きました。青空カップ、スタートです！','序盤 · リズムよく'],
[6,'サニーステップ、まずは自分のリズムで運びます。','序盤 · 折り合い'],
[14,'残り800メートル。軽快な脚取りを見せています。','中盤 · 力をためる'],
[23,'さあ、直線へ！ サニーステップ、ここから加速します！','直線 · スパート'],
[31,'残り200メートル！ 力いっぱい、ゴールへ向かいます！','終盤 · 最後のひと伸び'],
[36,'サニーステップ、今ゴール！ 最後まで走り切りました。','ゴール · おつかれさま']
];
function speak(text){if(!voice||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=1.08;const japanese=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(japanese)u.voice=japanese;speechSynthesis.speak(u);}
function commentary(){let i=0;for(let j=0;j<lines.length;j++)if(raceTime>=lines[j][0])i=j;if(i!==spoken){spoken=i;$('commentary').textContent=lines[i][1];$('phase').textContent=lines[i][2];speak(lines[i][1]);}$('distance').textContent=ended?'ゴール！':'残り '+Math.max(0,Math.round((1200-raceTime/36*1200)/10)*10)+'m';}
function motionUI(){$('motion').textContent=animate?'Ⅱ 走るのを止める':'▶ 走る姿を見る';$('motion').setAttribute('aria-pressed',animate);}
function setMode(on){race=on;document.body.classList.toggle('race',on);for(const id of ['racePanel','raceHeading','distance'])$(id).hidden=!on;$('modelPanel').hidden=on;for(const [id,active] of [['raceMode',on],['modelMode',!on]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',active);}reset();if(on){raceTime=0;spoken=-1;ended=false;commentary();}$('gesture').textContent=on?'スワイプで視点変更':'指で回す · ピンチで拡大';if(!on&&'speechSynthesis'in window)speechSynthesis.cancel();}
function reset(){yaw=race?1.30:1.0;elev=race?.25:.22;zoom=race?6.2:5.5;}
$('modelMode').onclick=()=>setMode(false);$('raceMode').onclick=()=>setMode(true);$('motion').onclick=()=>{animate=!animate;motionUI();};$('resetView').onclick=reset;
document.querySelectorAll('[data-coat]').forEach(b=>b.onclick=()=>setCoat(+b.dataset.coat));
$('replay').onclick=()=>{raceTime=0;spoken=-1;ended=false;commentary();};
$('voice').onclick=()=>{if(!('speechSynthesis'in window)){ $('voice').textContent='音声は非対応';$('voice').disabled=true;return;}voice=!voice;$('voice').textContent='音声 '+(voice?'ON':'OFF');$('voice').setAttribute('aria-pressed',voice);if(voice)speak($('commentary').textContent);else speechSynthesis.cancel();};
const pointers=new Map();let pinch=0;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);pinch=0;});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){yaw-=(e.clientX-old[0])*.012;elev=Math.max(.03,Math.min(.7,elev+(e.clientY-old[1])*.006));}else {const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinch)zoom=Math.max(3.8,Math.min(8.5,zoom*pinch/d));pinch=d;}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(3.8,Math.min(8.5,zoom+e.deltaY*.003));},{passive:false});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('error').textContent='3D表示が一時停止しました。ページを読み直してください。';});
document.addEventListener('visibilitychange',()=>{last=0;pointers.clear();if(document.hidden&&'speechSynthesis'in window)speechSynthesis.cancel();});
let data=new Float32Array(400000),count=0;
function emit(mesh,m,color){for(let i=0;i<mesh.length;i+=3){const a=point(m,mesh[i]),b=point(m,mesh[i+1]),c=point(m,mesh[i+2]),normal=norm(cross(sub(b,a),sub(c,a)));for(const v of [a,b,c]){if(count+9>data.length)throw Error('Preview geometry capacity exceeded');for(const val of [...v,...normal,...color])data[count++]=val;}}}
function object(mesh,p,s,color,r=[0,0,0]){emit(mesh,matrix(p,r,s),tint(color));}
function world(){object(cube,[0,-.11,0],[30,.05,30],race?'#93b975':'#dce8d3');
if(!race){object(round,[0,-.035,0],[2.1,.04,2.1],'#b7cb9e');object(round,[.08,.012,-.03],[.65,.008,1.20],'#8ba87b');return;}
object(cube,[0,-.045,0],[2.5,.015,30],'#afc98a');object(round,[.05,.004,0],[.62,.008,1.15],'#789b65');
const travel=(raceTime*2)%4;
for(const x of [-2.65,2.65]){object(cube,[x,.48,0],[.035,.035,28],'#f8f2df');object(cube,[x,.25,0],[.03,.022,28],'#e8e8ce');for(let i=-5;i<6;i++)object(cube,[x,.23,i*4-travel],[.045,.29,.045],'#f8f2df');}
for(let i=0;i<9;i++){const z=i*5-20-(raceTime*.8)%5,x=(i%2?-1:1)*(5+i%3);object(cube,[x,.6,z],[.10,.6,.10],'#a78d65');object(small,[x,1.4,z],[.75,1.0,.65],i%2?'#6e9668':'#83a36d');}
object(cube,[7,1.5,-12],[2,1.5,4],'#d4dacb');object(cube,[7,3.1,-12],[2.2,.10,4.2],'#69816c');}
function pose(){const running=race?!ended:animate,t=clock*2*Math.PI*2.35;body.p[1]=running?.035*Math.cos(t*2):0;body.r[0]=running?.015*Math.sin(t):0;head.r[0]=running?.035*Math.sin(t+.5):.015*Math.sin(clock);tail.r[2]=.12*Math.sin(clock*5);rider.r[0]=running?.05*Math.sin(t):0;
for(let i=0;i<4;i++){const q=t+[0,.6,3.2,3.8][i];legs[i].hip.r[0]=running?.65*Math.sin(q):0;legs[i].shin.r[0]=running?-.12-.95*Math.max(0,Math.sin(q+.85)):0;}}
function draw(now){requestAnimationFrame(draw);if(document.hidden||gl.isContextLost())return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(race){raceTime=Math.min(36,raceTime+dt);ended=raceTime>=36;commentary();}if((race&&!ended)||(!race&&animate))clock+=dt;pose();
const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(w<1||h<1)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
gl.viewport(0,0,w,h);gl.clearColor(race?.77:.86,race?.87:.91,race?.73:.82,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
const target=[0,1.12,.06],dist=zoom*Math.max(1,.92/(w/h)),eye=[Math.sin(yaw)*Math.cos(elev)*dist,1.12+Math.sin(elev)*dist,Math.cos(yaw)*Math.cos(elev)*dist];
gl.uniformMatrix4fv(uVP,false,new Float32Array(mul(perspective(w/h),look(eye,target))));
count=0;world();for(const n of horseNodes){n.world=mul(n.parent?n.parent.world:I(),matrix(n.p,n.r,n.s));if(n.mesh)emit(n.mesh,n.world,n.color);}
gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,count),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,count/9);
}
$('metrics').textContent='馬と騎手：約 '+horseTriangles.toLocaleString()+' 三角形。外部の3Dライブラリ・画像のダウンロードなし。実機での速さは未計測です。';
window.HorseDaysToyModel={exportAsset:()=>({format:1,triangleCount:horseTriangles,nodes:horseNodes.map(n=>({name:n.name,parent:n.parent?horseNodes.indexOf(n.parent):-1,p:n.p.slice(),r:n.r.slice(),s:n.s.slice(),color:n.color.slice(),vertices:n.mesh?n.mesh.flat():[]}))})};
motionUI();setCoat(0);requestAnimationFrame(draw);
})();
