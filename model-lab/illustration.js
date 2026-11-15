'use strict';
(()=>{
const $=id=>document.getElementById(id),canvas=$('view'),ctx=canvas.getContext('2d',{alpha:false});
if(!ctx){$('error').hidden=false;$('error').textContent='このブラウザでは表示できません。';return;}
const cache=new Map(),INK='#352923',TAU=Math.PI*2;
let race=false,running=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,raceTime=0,last=0,ended=false,voice=false,spoken=-1,coat=0,face=1,zoom=1,pan=[0,0];
const coats=[
 {name:'CHESTNUT / 栗毛',body:'#b87442',light:'#d99556',dark:'#8a4c31',muzzle:'#d39b6c',hair:'#573a29',iris:'#603e24'},
 {name:'BAY / 鹿毛',body:'#815137',light:'#a16a44',dark:'#5d392c',muzzle:'#b28a69',hair:'#2e2e2c',iris:'#543d2c'},
 {name:'GREY / 芦毛',body:'#e1e2dc',light:'#faf7ec',dark:'#b0b5b3',muzzle:'#c7b8af',hair:'#808b8c',iris:'#484c4e'},
 {name:'BLACK / 青毛',body:'#4b555c',light:'#69757a',dark:'#343c44',muzzle:'#8d9290',hair:'#2b3339',iris:'#4c5360'}
];
function P(d){if(!cache.has(d))cache.set(d,new Path2D(d));return cache.get(d);}
function path(d,fill,stroke=INK,width=3){const p=P(d);if(fill){ctx.fillStyle=fill;ctx.fill(p);}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(p);}}
function ellipse(x,y,rx,ry,fill,stroke=null,width=2){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}}
function line(points,color,width){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
function limb(l,c,far){
 const pts=[l.hip,l.knee,l.ankle],fill=far?c.dark:c.body;
 line(pts,INK,far?13:15);line(pts,fill,far?8:10);
 ellipse(...l.knee,far?4:5,far?4:5,fill);
 const a=l.ankle,f=l.foot,white=!far;
 if(white)line([[a[0],a[1]-4],[f[0],f[1]-2]],'#f7edda',8);
 ctx.save();ctx.translate(f[0],f[1]-3);ctx.rotate(running&&(!race||!ended)?Math.max(-.35,Math.min(.35,(a[0]-l.knee[0])*.012)):0);
 path('M-7 -6 Q-9 -2 -9 2 Q-3 6 8 3 L9 -3 Q6 -8 -1 -8 Z',far?'#38332f':'#4a4239',INK,2.4);
 path('M-6 0 Q0 3 7 1',null,'#827262',1.2);ctx.restore();
}
const silhouette='M-65 -43 C-83 -47 -91 -64 -85 -81 C-83 -98 -68 -105 -49 -103 C-27 -100 -12 -101 7 -96 C24 -94 33 -91 37 -100 C41 -111 43 -121 50 -127 L54 -142 Q55 -151 61 -145 L69 -130 Q78 -132 84 -129 L90 -144 Q95 -152 98 -144 L96 -126 C102 -122 104 -116 105 -112 L123 -101 C137 -100 144 -89 134 -80 C125 -72 111 -76 101 -81 L84 -89 C79 -73 74 -62 62 -54 C55 -39 44 -35 27 -39 C7 -36 -13 -41 -31 -42 C-43 -35 -56 -36 -65 -43 Z';
function horse(at,active){
 const c=coats[coat],pose=HorseIllustrationRig.sample(at,active);
 ctx.save();ctx.translate(0,pose.bob);
 // Tail and far legs sit behind the uninterrupted body silhouette.
 ctx.save();ctx.translate(-80,-80);ctx.rotate(pose.tail);
 path('M7 -8 C-8 -13 -22 -9 -30 -17 Q-31 -6 -22 1 L-30 0 Q-22 15 -6 15 Q-11 18 -9 22 C2 20 13 11 14 1 Z',c.hair,INK,3);
 path('M-22 -4 Q-9 2 4 -1',null,'#ffffff25',2);ctx.restore();
 limb(pose.legs[3],c,true);limb(pose.legs[1],c,true);
 ctx.save();ctx.translate(70,-105);ctx.rotate(pose.head);ctx.translate(-70,105);
 const bodyGradient=ctx.createLinearGradient(0,-140,0,-30);bodyGradient.addColorStop(0,c.light);bodyGradient.addColorStop(.55,c.body);bodyGradient.addColorStop(1,c.body);
 path(silhouette,bodyGradient);
 ctx.save();ctx.clip(P(silhouette));
 path('M-94 -58 C-59 -50 -31 -45 11 -52 C39 -52 62 -71 79 -94 L98 -82 Q84 -35 39 -28 L-74 -24 Z',c.dark,null);
 path('M-69 -92 C-51 -100 -36 -93 -24 -94 C-7 -95 6 -91 12 -89',null,c.light,5);
 path('M52 -136 L65 -122 L59 -116 L55 -129 Z','#c68e7b',null);
 path('M91 -138 L93 -125 L88 -121 Z','#c68e7b',null);
 ctx.restore();
 // Forelock and mane: an original drawn contour rather than a faceted mesh.
 path('M42 -105 L32 -99 L33 -109 L27 -107 L36 -118 L33 -121 L42 -125 L40 -130 L49 -133 L53 -126 L47 -115 Z',c.hair,INK,2.5);
 path('M53 -126 C49 -133 60 -140 72 -136 C82 -135 88 -128 85 -121 Q79 -116 74 -121 Q72 -115 64 -119 L61 -124 Q57 -120 53 -126 Z',c.hair,INK,2.6);
 path('M58 -131 Q68 -135 78 -128',null,'#ffffff20',2);
 // Broad muzzle, cheek, white blaze, expressive eye and a simple bridle.
 path('M106 -100 C117 -107 133 -102 137 -93 C144 -82 126 -75 113 -80 L100 -88 Z',c.muzzle,INK,2.3);
 ellipse(129,-91,3.6,2.9,'#553c32');
 path('M118 -81 Q125 -78 131 -82',null,'#684a38',1.6);
 path('M79 -126 Q87 -126 88 -119 L87 -107 Q84 -103 81 -108 L80 -118 Z','#f9edce',null);
 const blink=(at%5.4)>5.22;
 if(blink)path('M90 -112 Q99 -106 104 -112',null,INK,2.5);
 else {ellipse(96,-112,7.4,8.7,'#fffaf0',INK,1.9);ellipse(97.6,-111.5,4.8,6.3,c.iris);ellipse(98.1,-111.4,3.0,4.7,'#20272a');ellipse(99,-114.1,1.7,2.2,'#ffffff');ellipse(95.8,-109.3,.8,1.0,'#fff8e9');}
 path('M89 -126 Q99 -132 105 -123',null,INK,2.2);
 path('M101 -124 L111 -99 Q111 -93 107 -88',null,'#43382e',3.3);
 path('M107 -96 Q121 -101 134 -94',null,'#48392e',3.1);
 ellipse(108,-95,3.2,3.2,'#e7c887',INK,1.3);
 ctx.restore();
 // Saddle cloth and tack follow the body; the number stays readable when flipped.
 path('M-45 -100 Q-17 -106 8 -98 L12 -65 Q-9 -56 -39 -65 Z','#f8e9c8',INK,2.5);
 path('M-40 -96 Q-19 -101 4 -95 L7 -68 Q-10 -61 -36 -68 Z','#368170',INK,2.0);
 path('M-44 -102 Q-18 -113 8 -104 L9 -99 Q-13 -95 -43 -98 Z','#514334',INK,2);
 ctx.save();ctx.translate(-1,-73);ctx.scale(face,1);ctx.fillStyle='#fff4d7';ctx.font='bold 22px Georgia,serif';ctx.textAlign='center';ctx.fillText('7',0,0);ctx.restore();
 limb(pose.legs[2],c,false);limb(pose.legs[0],c,false);
 // Compact jockey, bent knees and arms, with a distinct green-and-cream uniform.
 ctx.save();ctx.translate(0,pose.rider);
 path('M-27 -111 Q-43 -105 -35 -90 L-21 -78 L-14 -87 L-25 -100 L-7 -109 Z','#f9f3df',INK,3);
 path('M-23 -87 Q-23 -79 -31 -70 L-19 -66 L-10 -78 L-12 -88 Z','#45443c',INK,2.6);
 path('M-18 -138 C-29 -133 -32 -121 -24 -113 Q-13 -104 2 -112 L21 -123 L13 -140 Z','#368170',INK,3);
 path('M-18 -133 L-4 -127 L7 -136 L13 -131 L-3 -119 L-23 -129 Z','#f2d59c',null);
 path('M11 -133 Q23 -135 30 -125 L40 -115 L34 -109 Q18 -115 12 -123 Z','#438f7d',INK,2.5);
 ellipse(39,-111,4.5,4.1,'#e5b590',INK,1.8);
 path('M5 -146 Q6 -158 18 -156 Q30 -153 29 -143 L34 -138 L29 -135 Q27 -126 18 -130 L10 -136 Z','#e6b793',INK,2.2);
 path('M5 -147 L29 -144 L30 -139 L7 -142 Z','#46595c',INK,1.5);
 path('M10 -145 L17 -144',null,'#d6f3ee',1.4);
 path('M-2 -147 C-4 -169 16 -174 29 -162 Q36 -154 32 -146 L39 -143 Q35 -138 27 -140 L7 -143 Z','#368170',INK,3);
 path('M8 -168 Q18 -170 22 -146 L15 -145 Q15 -159 8 -168 Z','#f3dbab',null);
 path('M-4 -148 Q16 -151 33 -145',null,'#25594d',2.1);
 ctx.restore();
 path('M40 -112 C60 -103 84 -106 107 -95 M39 -108 Q68 -94 106 -93',null,'#4a3829',1.6);
 ctx.restore();
}
function background(w,h,at){
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#d8edf0');sky.addColorStop(.56,'#edf4e1');sky.addColorStop(.57,'#b7d39b');sky.addColorStop(1,'#cddd9f');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 const horizon=h*.48;
 ctx.fillStyle='#fff9e9';ctx.globalAlpha=.75;ellipse(w*.16,h*.18,34,8,'#fffaf0');ellipse(w*.72,h*.23,45,7,'#fffaf0');ctx.globalAlpha=1;
 ctx.fillStyle='#9bbd90';ctx.beginPath();ctx.moveTo(0,horizon);for(let x=0;x<=w+50;x+=50)ctx.quadraticCurveTo(x+25,horizon-12,x+50,horizon);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
 const drift=race?(at*105)%110:0;
 for(let i=-1;i<w/110+2;i++){const x=i*110-drift;ctx.fillStyle='#b3ab88';ctx.fillRect(x,horizon-8,3,42);ellipse(x+3,horizon-16,18,20,'#83a77b');ellipse(x-8,horizon-14,15,15,'#91b384');ellipse(x+13,horizon-12,13,16,'#739a70');}
 ctx.fillStyle='#d1dca2';ctx.fillRect(0,horizon+24,w,h*.12);
 const railY=horizon+26;
 line([[0,railY],[w,railY]],'#8a9e80',4);line([[0,railY-2],[w,railY-2]],'#fffbec',3);
 const posts=race?(at*145)%85:0;
 for(let x=-85;x<w+85;x+=85){ctx.fillStyle='#fff9e9';ctx.fillRect(x-posts,railY-4,4,33);}
 line([[0,railY+16],[w,railY+16]],'#eef0cf',2);
 ctx.fillStyle='#aaca88';ctx.beginPath();ctx.moveTo(0,h*.74);ctx.quadraticCurveTo(w*.6,h*.64,w,h*.70);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
 if(race){const grass=(at*230)%170;for(let x=-170;x<w+170;x+=170){line([[x-grass,h*.90],[x+22-grass,h*.90]],'#93b87b',2);line([[x+55-grass,h*.82],[x+65-grass,h*.82]],'#a4c083',2);}}
}
function draw(at){
 const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
 if(w<1||h<1)return;if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';background(w,h,at);
 const base=Math.min(w/(race?420:440),h/(race?250:255))*zoom,ox=w*.46+pan[0],oy=h*.84+pan[1],active=race?!ended:running;
 ctx.save();ctx.translate(ox,oy);ctx.scale(base,base);
 const pose=HorseIllustrationRig.sample(at,active);
 ctx.globalAlpha=.14;ellipse(1,3,83-(active?-pose.bob:0),8,INK);ctx.globalAlpha=1;
 ctx.scale(face,1);horse(at,active);ctx.restore();
}
const lines=[[0,'ゲートが開きました。青空カップ、スタートです！','序盤 · リズムよく'],[6,'サニーステップ、軽快な脚取りで進みます。','序盤 · 折り合い'],[14,'残り800メートル。まだまだ余力があります。','中盤 · 力をためる'],[23,'さあ直線！ サニーステップ、ここから加速します！','直線 · スパート'],[31,'残り200メートル！ 力いっぱい、ゴールへ！','終盤 · 最後のひと伸び'],[36,'サニーステップ、今ゴール！ 最後まで走り切りました。','ゴール · おつかれさま']];
function speak(text){if(!voice||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=1.08;const v=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(v)u.voice=v;speechSynthesis.speak(u);}
function comment(){let i=0;for(let j=0;j<lines.length;j++)if(raceTime>=lines[j][0])i=j;if(i!==spoken){spoken=i;$('commentary').textContent=lines[i][1];$('phase').textContent=lines[i][2];speak(lines[i][1]);}$('distance').textContent=ended?'ゴール！':'残り '+Math.max(0,Math.round((1200-raceTime/36*1200)/10)*10)+'m';}
function reset(){zoom=1;pan=[0,0];}
function motion(){$('motion').textContent=running?'Ⅱ 走るのを止める':'▶ 走る姿を見る';$('motion').setAttribute('aria-pressed',running);}
function mode(on){race=on;document.body.classList.toggle('race',on);for(const id of ['racePanel','raceHeading','distance'])$(id).hidden=!on;$('modelPanel').hidden=on;for(const [id,active] of [['raceMode',on],['modelMode',!on]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',active);}reset();if(on){raceTime=0;spoken=-1;ended=false;comment();}else if('speechSynthesis'in window)speechSynthesis.cancel();$('gesture').textContent=on?'イラスト調の馬で試走':'横ドラッグ · 2本指で拡大';}
$('modelMode').onclick=()=>mode(false);$('raceMode').onclick=()=>{location.href='race.html';};$('motion').onclick=()=>{running=!running;motion();};$('resetView').onclick=reset;$('zoomIn').onclick=()=>zoom=Math.min(1.6,zoom+.15);$('zoomOut').onclick=()=>zoom=Math.max(.65,zoom-.15);
document.querySelectorAll('[data-coat]').forEach(b=>b.onclick=()=>{coat=+b.dataset.coat;$('stageLabel').textContent=coats[coat].name;document.querySelectorAll('[data-coat]').forEach(v=>{const active=v===b;v.classList.toggle('selected',active);v.setAttribute('aria-pressed',active);});});
$('direction').onclick=()=>{face*=-1;$('direction').textContent=face===1?'向き：右向き →':'向き：左向き ←';};
$('replay').onclick=()=>{raceTime=0;spoken=-1;ended=false;comment();};
$('voice').onclick=()=>{if(!('speechSynthesis'in window)){$('voice').textContent='音声は非対応';$('voice').disabled=true;return;}voice=!voice;$('voice').textContent='音声 '+(voice?'ON':'OFF');$('voice').setAttribute('aria-pressed',voice);if(voice)speak($('commentary').textContent);else speechSynthesis.cancel();};
const pointers=new Map();let pinch=0;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);pinch=0;});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){pan[0]=Math.max(-canvas.clientWidth*.25,Math.min(canvas.clientWidth*.25,pan[0]+e.clientX-old[0]));}else{const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinch&&d>1)zoom=Math.max(.65,Math.min(1.6,zoom*d/pinch));pinch=d;}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0;});
canvas.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoom=Math.max(.65,Math.min(1.6,zoom-e.deltaY*.001));},{passive:false});
document.addEventListener('visibilitychange',()=>{last=0;pointers.clear();if(document.hidden&&'speechSynthesis'in window)speechSynthesis.cancel();});
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(race){raceTime=Math.min(36,raceTime+dt);ended=raceTime>=36;comment();}if((race&&!ended)||(!race&&running))time+=dt;draw(time);}
$('metrics').textContent='輪郭と塗りを直接描く、横向きのイラスト調アニメーションです。4本の脚は接地と蹴り出しを別々に計算しています。スマホ実機での速度は未計測です。';
motion();requestAnimationFrame(frame);
})();
