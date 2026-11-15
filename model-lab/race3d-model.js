'use strict';
(()=>{
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
const round=sphere(10,6),small=sphere(8,5),cube=box(),nodes=[],legs=[],coatNodes=[],hairNodes=[],whiteNodes=[];
function node(name,parent,p=[0,0,0],s=[1,1,1],color='#ffffff',mesh=null,r=[0,0,0]){const n={name,parent,p:p.slice(),r:r.slice(),s,color:tint(color),mesh,world:I()};nodes.push(n);return n;}
function part(name,parent,p,s,color,mesh=round,r){return node(name,parent,p,s,color,mesh,r);}
function coat(...args){const n=part(...args);coatNodes.push(n);return n;}
function hair(...args){const n=part(...args);hairNodes.push(n);return n;}
const root=node('Horse',null),body=node('Suspension',root);
coat('Barrel',body,[0,1.12,-.12],[.43,.43,.78],'#a95b32');
coat('Shoulder',body,[0,1.18,.40],[.34,.42,.35],'#a95b32');
const neck=node('Neck',body,[0,0,0]);
coat('Neck silhouette',neck,[0,0,0],[1,1,1],'#a95b32',loft([[1.08,.3,.22,.28],[1.4,.48,.22,.25],[1.7,.62,.16,.19],[1.91,.75,.13,.13]]));
const head=node('Head',neck,[0,1.88,.78],[1.45,1.10,1.15]);
coat('Face',head,[0,-.04,.1],[.23,.28,.34],'#a95b32',round,[-.35,0,0]);
coat('Muzzle',head,[0,-.21,.38],[.235,.17,.20],'#b66c43',small);
for(const x of [-1,1]){
 part('Nostril',head,[x*.145,-.20,.536],[.036,.029,.012],'#3c2925',small);
 part('Eye white',head,[x*.213,.015,.18],[.026,.068,.061],'#fffbeb',small);
 part('Eye',head,[x*.239,.007,.195],[.019,.046,.041],'#232b2b',small);
 part('Eye glint',head,[x*.255,.03,.213],[.007,.014,.012],'#ffffff',small);
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

function ancestor(n,re){for(let p=n;p;p=p.parent){const m=p.name.match(re);if(m)return m;}return null;}
function bone(n){let m=ancestor(n,/^Knee (\d)$/);if(m)return +m[1]*2+2;m=ancestor(n,/^Leg (\d)$/);if(m)return +m[1]*2+1;if(ancestor(n,/^Head$/))return 9;if(ancestor(n,/^Tail$/))return 10;if(ancestor(n,/^Jockey$/))return 11;return 0;}
function material(n){if(coatNodes.includes(n))return n.name==='Muzzle'?2:1;if(hairNodes.includes(n))return 3;if(['Cloth','Silks','Sleeve','Helmet','Helmet brim'].includes(n.name))return 4;if(n.name==='Stripe')return 5;return 0;}
function emit(mesh,m,color,out,b=0,mat=0){for(let i=0;i<mesh.length;i+=3){const a=point(m,mesh[i]),v=point(m,mesh[i+1]),c=point(m,mesh[i+2]),normal=norm(cross(sub(v,a),sub(c,a)));for(const p of [a,v,c])out.push(...p,...normal,...color,b,mat,0,0);}}
const vertices=[];
for(const n of horseNodes){n.world=mul(n.parent?n.parent.world:I(),matrix(n.p,n.r,n.s));if(n.mesh&&!n.name.startsWith('Number 7'))emit(n.mesh,n.world,n.color,vertices,bone(n),material(n));}
for(const side of [-1,1]){
 const x=side*.407,p=[[x,1.03,-.39],[x,1.03,.02],[x,1.32,.02],[x,1.32,-.39]],uv=[[0,1],[1,1],[1,0],[0,0]];
 for(const i of (side===1?[0,2,1,0,3,2]:[0,1,2,0,2,3]))vertices.push(...p[i],side,0,0,1,1,1,0,6,...(side===1?[1-uv[i][0],uv[i][1]]:uv[i]));
}
const equipment=[];
for(const n of horseNodes){if(!n.mesh||!['Saddle pad','Saddle','Cloth'].includes(n.name))continue;const m=n.world.slice();m[13]+=.26;emit(n.mesh,m,n.color,equipment,0,material(n));}
// Complete the cropped imported torso with connected riding limbs.
function fittedPart(mesh,p,size,color,mat=0,rotation=[0,0,0]){emit(mesh,matrix(p,rotation,size),tint(color),equipment,0,mat);}
function limb(a,b,radius,color,mat=0){const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d),mid=a.map((v,i)=>(v+b[i])/2);fittedPart(round,mid,[radius,len/2+radius*.35,radius],color,mat,[Math.atan2(d[2],d[1]),0,-Math.atan2(d[0],Math.hypot(d[1],d[2]))]);}
fittedPart(round,[0,1.95,-.10],[.19,.16,.24],'#fff',4);
for(const side of [-1,1]){
 const hip=[side*.13,1.98,-.22],knee=[side*.35,1.66,.13],ankle=[side*.34,1.40,-.12];
 limb(hip,knee,.085,'#eee8da');limb(knee,ankle,.068,'#2a2625');fittedPart(round,[side*.34,1.39,-.06],[.075,.06,.14],'#2a2625');
 const shoulder=[side*.14,2.16,.07],elbow=[side*.23,1.97,.34],hand=[side*.16,1.92,.61];
 limb(shoulder,elbow,.068,'#fff',4);limb(elbow,hand,.054,'#fff',4);fittedPart(small,hand,[.052,.05,.065],'#d8a67e');
 limb(hand,[side*.12,1.94,1.03],.008,'#3b2b23');
}
for(let i=0;i<vertices.length;i+=13){if(vertices[i+10]===6){for(let j=0;j<13;j++)equipment.push(vertices[i+j]+(j===1?.26:0));}}
window.HorseDaysSolidModel={equipment:new Float32Array(equipment),horse:new Float32Array(vertices),cube,round,small,matrix,point,tint,emit,loft};

})();
