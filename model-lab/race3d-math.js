(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.HorseDaysSolid=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const PI=Math.PI,TAU=2*PI,R=350,S=900,L=2*S+TAU*R,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t,mod=(x,n)=>(x%n+n)%n;
let courseClockwise=true;
function setClockwise(value){courseClockwise=!!value;}
function course(s,offset=0){s=mod(s,L);let x,z,dx,dz;if(s<S){x=-S/2+s;z=-R;dx=1;dz=0;}else if(s<S+PI*R){const a=-PI/2+(s-S)/R;x=S/2+R*Math.cos(a);z=R*Math.sin(a);dx=-Math.sin(a);dz=Math.cos(a);}else if(s<2*S+PI*R){x=S/2-(s-S-PI*R);z=R;dx=-1;dz=0;}else{const a=PI/2+(s-2*S-PI*R)/R;x=-S/2+R*Math.cos(a);z=R*Math.sin(a);dx=-Math.sin(a);dz=Math.cos(a);}const direction=courseClockwise?-1:1;return {x:(x+dz*offset)*direction,z:-(z-dx*offset),dx:dx*direction,dz:-dz};}
const names=['ホシノダッシュ','ムーンホープ','ナツノウィング','リバースター','レッドリーフ','シロガネロード','アオゾラブリーズ','ハルノホープ','サニーステップ','ムーンウィング','ツバサノロード','グリーンブリーズ','グリーンロード','シロガネベル','ミナミノロード','カゼノウィング','ユメノステージ'];
const frames=[1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,8],silks=['#f4f1df','#303437','#da4843','#477ed4','#e4b234','#38a35e','#e58535','#dc81ac'];
function race(time){const t=Math.max(0,time-1),finish=[121.9,118.0,121.0,123.0,122.2,123.6,120.8,124.3,121.4,122.6,118.6,124,122.4,117.7,121.7,119.4,119.8];const rows=names.map((name,i)=>{const done=t>=finish[i];const delay=(i===8||i===2)?.03:(.30+(i%6)*.16),effective=Math.max(0,t-delay*(1-smooth((t-85)/30)));let ran=2000*effective/finish[i];const settling=(1-Math.exp(-t/6)),early=(i===8||i===2?12:0)*settling*(1-smooth((t-92)/24));ran+=early;const lane0=(i-8)*1.45,laneTarget=clamp(-8+(i%5)*2.0+(i>7?1.4:0),-11,11);const lane=mix(lane0,laneTarget,smooth(t/6))+Math.sin(t*.19+i)*.25*settling;const p=course(S/2+ran/2000*L,lane);return {...p,number:i+1,name,ran,progress:Math.min(1,ran/2000),finished:done,finish:finish[i],lane,appearance:(i*7+2)%4,silk:silks[frames[i]-1]};});rows.sort((a,b)=>a.finished&&b.finished?a.finish-b.finish:b.ran-a.ran);rows.forEach((r,i)=>r.rank=i+1);return rows;}
const shots={wide:{ahead:0,inside:25,height:8,look:1.0,label:'馬群全体'},front:{ahead:16,inside:7,height:3.6,look:1.0,label:'低い斜め前'},high:{ahead:16,inside:3,height:6.8,look:0.7,label:'前方上空'},rear:{ahead:-28,inside:5,height:11,look:.7,label:'後方上空'},side:{ahead:0,inside:12,height:2.5,look:1.0,label:'横から追走'},gate:{ahead:14,inside:20,height:5,look:1,label:'発走'},goal:{ahead:0,inside:16,height:4.2,look:1,label:'ゴール'}};
const keys=[[0,'gate'],[1.8,'front'],[15.5,'front'],[18,'high'],[26.8,'high'],[29.5,'side'],[37.5,'side'],[40,'rear'],[44.8,'rear'],[47.5,'side'],[57,'side'],[60,'front'],[77,'front'],[80,'high'],[88.8,'high'],[90.8,'front'],[93,'side'],[117.7,'side'],[118.5,'goal'],[120.5,'goal'],[122,'side'],[130,'side']];
function camera(time,rows,mode='auto',focus=0){let a,b,u=0;if(mode!=='auto'){a=b=shots[mode]||shots.side;}else{let k=0;while(k<keys.length-2&&time>keys[k+1][0])k++;a=shots[keys[k][1]];b=shots[keys[k+1][1]];u=smooth((time-keys[k][0])/(keys[k+1][0]-keys[k][0]));}const shot={};for(const n of ['ahead','inside','height','look'])shot[n]=mix(a[n],b[n],u);shot.label=u>.5?b.label:a.label;
const average=n=>{const a=rows.slice(0,n);return {x:a.reduce((v,r)=>v+r.x,0)/a.length,z:a.reduce((v,r)=>v+r.z,0)/a.length,ran:a.reduce((v,r)=>v+r.ran,0)/a.length};};
let center=average(6),front=average(3),back=average(14),gate=average(17),fw=smooth((shot.ahead-2)/12),bw=smooth((-shot.ahead-4)/16),gw=mode==='auto'?1-smooth((time-.8)/1.3):0;
for(const n of ['x','z','ran'])center[n]=mix(mix(mix(center[n],front[n],fw),back[n],bw),gate[n],gw);
if(focus){const r=rows.find(r=>r.number===focus)||rows[0];center={x:r.x,z:r.z,ran:r.ran};}
const p=course(S/2+center.ran/2000*L),edge=course(S/2+center.ran/2000*L,1),inside=[edge.x-p.x,0,edge.z-p.z],forward=[p.dx,0,p.dz];p.x=center.x;p.z=center.z;
let target=[p.x,shot.look,p.z],eye=[p.x+forward[0]*shot.ahead+inside[0]*shot.inside,shot.height,p.z+forward[2]*shot.ahead+inside[2]*shot.inside];
if(mode==='auto'&&time>=117.7&&time<=122){const f=course(S/2),u=time<118.5?smooth((time-117.7)/.8):time>120.5?1-smooth((time-120.5)/1.5):1;target=target.map((v,i)=>mix(v,[f.x,1,f.z][i],u));eye=eye.map((v,i)=>mix(v,[f.x,4.2,f.z+16][i],u));}
return {eye,target,label:shot.label};}
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function mul(a,b){const r=new Array(16).fill(0);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
function look(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(aspect,fov=.94){const f=1/Math.tan(fov/2),n=.18,far=3000;return [f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0];}
function project(vp,p,w,h){const q=[0,0,0,0];for(let row=0;row<4;row++)q[row]=vp[row]*p[0]+vp[4+row]*p[1]+vp[8+row]*p[2]+vp[12+row];return {x:(q[0]/q[3]+1)*w/2,y:(1-q[1]/q[3])*h/2,depth:q[3],visible:q[3]>0&&Math.abs(q[0]/q[3])<1.2&&Math.abs(q[1]/q[3])<1.2};}
// Fit complete horse bounds instead of cropping the leader or the rear of the pack.
function fitCamera(view,rows,aspect){const target=view.target,offset=sub(view.eye,target),direction=norm(offset),right=norm(cross([0,1,0],direction)),up=cross(direction,right),tanY=Math.tan(.94/2),tanX=tanY*aspect;let distance=Math.hypot(...offset);
 for(const r of rows)for(const x of [-.6,.6])for(const y of [0,2.75])for(const z of [-1.65,1.65]){const p=sub([r.x+x,y,r.z+z],target),depth=dot(p,direction);distance=Math.max(distance,depth+Math.abs(dot(p,right))/(tanX*.84),depth+Math.abs(dot(p,up))/(tanY*.80),depth+1);}
 return {...view,eye:target.map((v,i)=>v+direction[i]*distance),target:target.slice()};}
function cameraSubjects(view,rows,focus){return focus?[rows.find(r=>r.number===focus)||rows[0]]:view.label.includes('横から追走')?rows.slice(0,8):rows;}
function frameCamera(time,rows,mode,focus,aspect){const view=camera(time,rows,mode,focus),pack=cameraSubjects(view,rows,focus);
 // A side shot follows the whole field, including the leader, instead of the middle six.
 if(!focus){const center=[(Math.min(...pack.map(r=>r.x))+Math.max(...pack.map(r=>r.x)))/2,1.25,(Math.min(...pack.map(r=>r.z))+Math.max(...pack.map(r=>r.z)))/2];const delta=center.map((v,i)=>v-view.target[i]);view.eye=view.eye.map((v,i)=>v+delta[i]);view.target=center;}
 if(!focus&&view.label==='横から追走')view.label='先頭集団・横から追走';return fitCamera(view,pack,aspect);}
function commentary(time,rows,previous,cycle=0){const lead=rows[0],tag=r=>r.number+'番 '+r.name;
 if(time<1)return {number:0,text:'ゲートにそろいました。まもなく発走です。'};
 if(lead.finished)return {number:lead.number,text:tag(lead)+'、先頭でゴール！ '+tag(rows[1])+'もゴールへ向かいます。'};
 if(time<4)return {number:lead.number,text:'ゲートが開きました！ '+tag(lead)+'が好スタート。17頭のレースが始まりました。'};
 const changes=previous?rows.map(r=>({r,gain:(previous.find(p=>p.number===r.number)?.rank||r.rank)-r.rank})).filter(v=>v.gain>0&&v.r.rank>1).sort((a,b)=>b.gain-a.gain):[];
 if(changes.length&&cycle%2===0){const r=changes[0].r;return {number:r.number,text:tag(r)+'が順位を上げて'+r.rank+'番手！ '+(r.lane>0?'外から':'馬群の中から')+'前をうかがいます。'};}
 const kind=cycle%4;
 if(kind===0)return {number:lead.number,text:tag(lead)+'が先頭。'+tag(rows[1])+'が'+Math.max(.1,(lead.ran-rows[1].ran)/2.4).toFixed(1)+'馬身ほどで追いかけます。'};
 if(kind===1){const r=rows[Math.min(4,rows.length-1)];return {number:r.number,text:'中団の前は'+tag(r)+'、現在'+r.rank+'番手。前の'+rows[r.rank-2].name+'との差を詰めたいところ。'};}
 if(kind===2){const r=rows[Math.min(10,rows.length-1)];return {number:r.number,text:'後方からは'+tag(r)+'。残り'+Math.max(0,Math.round(2000-r.ran))+'m、ここからの仕掛けに注目です。'};}
 const r=rows[1+cycle%Math.min(5,rows.length-1)];return {number:r.number,text:tag(r)+'は'+r.rank+'番手。'+(time>85?'最後の直線へ、前を追う脚は残っているか。':'折り合いをつけて、前の馬群を追走しています。')};
}
return {setClockwise,course,race,camera,fitCamera,frameCamera,cameraSubjects,commentary,shots,keys,L,S,R,names,frames,silks,I,mul,look,perspective,project,sub,cross,norm,dot,clamp,smooth,mix};});

