'use strict';
window.HorseDaysInkPainter=function(ctx){
const cache=new Map(),INK='#352923',TAU=Math.PI*2;
let race=false,running=true,ended=false,coat=0,face=1,number=7,silk='#368170',accent='#f2d59c';
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
 path('M-40 -96 Q-19 -101 4 -95 L7 -68 Q-10 -61 -36 -68 Z',silk,INK,2.0);
 path('M-44 -102 Q-18 -113 8 -104 L9 -99 Q-13 -95 -43 -98 Z','#514334',INK,2);
 ctx.save();ctx.translate(-1,-73);ctx.scale(face,1);ctx.fillStyle='#fff4d7';ctx.font=number>9?'bold 18px Georgia,serif':'bold 22px Georgia,serif';ctx.textAlign='center';ctx.fillText(String(number),0,0);ctx.restore();
 limb(pose.legs[2],c,false);limb(pose.legs[0],c,false);
 // Compact jockey, bent knees and arms, with a distinct green-and-cream uniform.
 ctx.save();ctx.translate(0,pose.rider);
 path('M-27 -111 Q-43 -105 -35 -90 L-21 -78 L-14 -87 L-25 -100 L-7 -109 Z','#f9f3df',INK,3);
 path('M-23 -87 Q-23 -79 -31 -70 L-19 -66 L-10 -78 L-12 -88 Z','#45443c',INK,2.6);
 path('M-18 -138 C-29 -133 -32 -121 -24 -113 Q-13 -104 2 -112 L21 -123 L13 -140 Z',silk,INK,3);
 path('M-18 -133 L-4 -127 L7 -136 L13 -131 L-3 -119 L-23 -129 Z',accent,null);
 path('M11 -133 Q23 -135 30 -125 L40 -115 L34 -109 Q18 -115 12 -123 Z',silk,INK,2.5);
 ellipse(39,-111,4.5,4.1,'#e5b590',INK,1.8);
 path('M5 -146 Q6 -158 18 -156 Q30 -153 29 -143 L34 -138 L29 -135 Q27 -126 18 -130 L10 -136 Z','#e6b793',INK,2.2);
 path('M5 -147 L29 -144 L30 -139 L7 -142 Z','#46595c',INK,1.5);
 path('M10 -145 L17 -144',null,'#d6f3ee',1.4);
 path('M-2 -147 C-4 -169 16 -174 29 -162 Q36 -154 32 -146 L39 -143 Q35 -138 27 -140 L7 -143 Z',silk,INK,3);
 path('M8 -168 Q18 -170 22 -146 L15 -145 Q15 -159 8 -168 Z',accent,null);
 path('M-4 -148 Q16 -151 33 -145',null,'#25594d',2.1);
 ctx.restore();
 path('M40 -112 C60 -103 84 -106 107 -95 M39 -108 Q68 -94 106 -93',null,'#4a3829',1.6);
 ctx.restore();
}


function quarterHorse(at,active,yaw){
 const c=coats[coat],pose=HorseIllustrationRig.sample(at,active),a=Math.min(1.35,Math.abs(yaw)),co=Math.cos(a),si=Math.sin(a);
 const point=(x,y,z=0)=>[x*co+z*si,y+x*si*.18+z*co*.10];
 const oval=(x,y,z,rx,ry,fill,stroke=INK)=>{const p=point(x,y,z);ellipse(p[0],p[1],rx,ry,fill,stroke,3);};
 const stroke3=(pts,color,width)=>line(pts.map(p=>point(...p)),color,width);
 ctx.save();ctx.translate(0,pose.bob);
 // Four independently projected legs keep their width as the horse turns towards us.
 const leg=(id,z,far)=>{const l=pose.legs[id],pts=[l.hip,l.knee,l.ankle,l.foot].map(p=>point(p[0],p[1],z));line(pts,INK,far?11:13);line(pts,far?c.dark:c.body,far?7:9);line(pts.slice(2),'#f1e6d0',7);ellipse(pts[3][0],pts[3][1]-2,7,4,'#3e3833',INK,2);};
 leg(3,-17,true);leg(1,-17,true);
 const tail=point(-83,-76,-3);ctx.save();ctx.translate(tail[0],tail[1]);ctx.rotate(pose.tail*.4);
 path('M4 -8 Q-20 -14 -30 -5 Q-22 0 -29 9 Q-11 14 7 3 Z',c.hair,INK,3);ctx.restore();
 const body=point(-18,-73,0),bodyWidth=68*co+27*si,grad=ctx.createLinearGradient(0,body[1]-34,0,body[1]+28);grad.addColorStop(0,c.light);grad.addColorStop(1,c.body);
 ellipse(body[0],body[1],bodyWidth,30,grad,INK,3);
 oval(31,-72,0,24*co+24*si,29,c.body);
 // A chest, neck and paired cheek volumes replace the flattened side silhouette.
 const n1=point(34,-78,0),n2=point(68,-119,0);stroke3([[34,-78,0],[51,-102,0],[68,-119,0]],INK,37);stroke3([[34,-78,0],[51,-102,0],[68,-119,0]],c.body,31);
 stroke3([[32,-89,-14],[45,-116,-14],[64,-133,-12]],c.hair,10);
 const cloth=point(-19,-88,20);ctx.save();ctx.translate(cloth[0],cloth[1]);ctx.transform(Math.max(.45,co),.10*si,0,1,0,0);path('M-25 -10 L23 -10 L25 23 Q0 33 -24 20 Z',silk,INK,2.5);ctx.fillStyle='#fff4d7';ctx.font=number>9?'bold 18px Georgia':'bold 22px Georgia';ctx.textAlign='center';ctx.scale(face,1);ctx.fillText(String(number),0,17);ctx.restore();
 leg(2,17,false);leg(0,17,false);
 // Rider seen over the withers; white breeches and coloured helmet remain distinct.
 const rider=pose.rider;stroke3([[-17,-108+rider,16],[-30,-91+rider,21],[-18,-77+rider,23]],INK,15);stroke3([[-17,-108+rider,16],[-30,-91+rider,21],[-18,-77+rider,23]],'#fff6df',10);
 stroke3([[-18,-82+rider,23],[-22,-68+rider,22]],'#41463f',10);
 oval(-6,-127+rider,0,22*co+14*si,18,silk);
 stroke3([[-14,-138+rider,3],[2,-122+rider,15],[14,-132+rider,10]],accent,7);
 stroke3([[8,-128+rider,14],[29,-113+rider,18],[38,-109+rider,18]],INK,11);stroke3([[8,-128+rider,14],[29,-113+rider,18],[38,-109+rider,18]],silk,7);
 oval(11,-148+rider,0,13,14,'#e6b793');
 oval(8,-160+rider,0,20,14,silk);stroke3([[0,-171+rider,0],[7,-157+rider,12]],accent,7);stroke3([[-8,-148+rider,15],[26,-147+rider,14]],'#344d52',5);
 // Head turns as a volume: two ears, paired eyes and a broad forward muzzle.
 oval(76,-126,-12,7,20,c.body);oval(78,-127,12,7,20,c.light);
 oval(78,-112,0,23*co+20*si,26,c.body);
 const head=point(78,-137,0);ctx.save();ctx.translate(head[0],head[1]);path('M-20 8 Q-12 -9 4 -3 L18 7 L5 14 L-3 7 L-11 15 Z',c.hair,INK,2);ctx.restore();
 oval(103,-96,0,25*co+18*si,12,c.muzzle);
 for(const z of [-15,15]){const p=point(92,-118,z);ellipse(p[0],p[1],4.5,6.5,'#fff7e8',INK,1.8);ellipse(p[0]+1,p[1]+.5,2.4,4.3,c.iris);ellipse(p[0]+1.6,p[1]-1,1.1,1.6,'#fff');}
 stroke3([[92,-130,0],[100,-110,0]],'#fff0cf',5);
 for(const z of [-12,12])oval(112,-97,z,2.4,2.0,'#594132',null);
 stroke3([[107,-108,-19],[108,-99,0],[107,-108,19]],'#4c3b2d',3);
 stroke3([[38,-109+rider,18],[72,-111,20],[107,-104,18]],'#554335',2);
 ctx.restore();
}

return {draw:function(t,active,options){options=options||{};coat=((options.appearance||0)%4+4)%4;number=options.number||1;face=options.flip||1;silk=options.silk||'#368170';accent=options.accent||'#f2d59c';running=active;ended=!active;const yaw=options.yaw||0,mix=yaw<0&&yaw>-1.65?Math.max(0,Math.min(1,(-yaw-.42)/.20)):0;ctx.save();if(mix<1){ctx.save();ctx.globalAlpha*=1-mix;ctx.scale(options.foreshorten||1,1);horse(t,active);ctx.restore();}if(mix>0){ctx.globalAlpha*=mix;quarterHorse(t,active,yaw);}ctx.restore();}};
};
