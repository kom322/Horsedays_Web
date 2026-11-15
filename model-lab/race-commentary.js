(function(g,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else g.HorseDaysRaceCommentary=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const tag=r=>r.number+'番 '+r.name;
class Commentator{
 constructor(seed=0){this.seed=seed;this.reset();}
 reset(){this.last=-1;this.until=-1;this.cue={number:0,text:'各馬、ゲートに収まります。',key:0};this.serial=0;this.samples=[];this.called=new Set();this.marks=new Set();this.lastLeader=0;this.leadCall=-20;this.winner=0;this.allDone=false;this.scan=0;this.lastType='';this.variants={};this.introCue=null;this.lastHill=-30;}
 say(time,r,text,type,duration=3.6){this.cue={number:r?r.number:0,text,key:++this.serial,type};this.until=time+duration;this.lastType=type;return this.cue;}
 pick(kind,choices){const n=this.variants[kind]||0;this.variants[kind]=n+1;return choices[(n+Math.abs(this.seed)%choices.length)%choices.length];}
 lane(r,rows){const mean=rows.reduce((v,x)=>v+x.lane,0)/rows.length;return r.lane>mean+1?'外め':r.lane<mean-1?'内め':'馬群の中';}
 introduce(r,rows){const key='introduction-'+r.number+'-'+r.rank;if(this.introCue?.key===key)return this.introCue;const side=this.lane(r,rows),position=r.rank<=3?'先団':r.rank>rows.length*.65?'後方':'中団';return this.introCue={number:r.number,key,text:this.pick('intro-'+position,[tag(r)+'、現在'+r.rank+'番手。'+side+'を追走しています。',position+'からは'+tag(r)+'。'+r.rank+'番手でレースを進めます。',tag(r)+'は'+r.rank+'番手、'+side+'から前を追っています。'])};}
 update(time,rows){if(time<this.last-.05||this.last<0||time-this.last>1.5){this.reset();this.last=time;this.until=-1;if(time>4){this.marks.add('start');for(const mark of [1000,600,400])if((this.distance||2000)-rows[0].ran<mark)this.marks.add(mark);}}
 this.last=time;const lead=rows[0],old=this.samples.find(s=>time-s.time>=2.5&&time-s.time<4.5);if(!this.samples.length||time-this.samples[this.samples.length-1].time>=.45)this.samples.push({time,rows:rows.map(r=>({...r}))});this.samples=this.samples.filter(s=>time-s.time<4.5);
 const remain=Math.max(0,(this.distance||2000)-lead.ran),all=rows.every(r=>r.finished),winner=rows.filter(r=>r.finished).sort((a,b)=>a.finish-b.finish)[0];
 if(winner&&!this.winner){this.winner=winner.number;return this.say(time,winner,this.pick('finish',[tag(winner)+'、先頭でゴールイン！',tag(winner)+'が勝ちました！ ゴールを駆け抜けます！','最後に先着したのは'+tag(winner)+'！ ゴールイン！']),'finish',4.5);}
 if(all&&!this.allDone){this.allDone=true;return this.say(time,winner,this.pick('all-finished',['全馬がゴール。勝ったのは'+tag(winner)+'！','これで全馬が入線しました。優勝は'+tag(winner)+'です！']),'all-finished',6);}
 if(time<this.until)return this.cue;
 if(time<1)return this.say(time,null,'各馬、ゲートに収まりました。まもなく発走です。','gate',1-time);
 if(!this.marks.has('start')){this.marks.add('start');return this.say(time,null,this.pick('start',['スタートしました！ まずは先行争い。','各馬、一斉に飛び出しました！ 先行争いに注目です。','ゲートが開きました！ 先手を取るのはどの馬でしょうか。']),'start',2.8);}
 if(winner){const next=rows.find(r=>!r.finished);return next?this.say(time,next,this.pick('runout',[tag(next)+'もゴールへ。後続も続々と入線してきます。',tag(next)+'がゴールを目指します。最後まで走り抜きます。','続いては'+tag(next)+'。後続の馬もゴールへ向かいます。']),'run-out',4):this.cue;}
 const candidates=old?rows.filter(r=>r.rank>1).map(r=>{const prev=old.rows.find(p=>p.number===r.number);return {r,gain:prev?prev.rank-r.rank:0,closing:prev?(old.rows[0].ran-prev.ran)-(lead.ran-r.ran):0};}).filter(x=>x.gain>0||x.closing>.5).sort((a,b)=>(b.gain*2+b.closing)-(a.gain*2+a.closing)):[];
 const former=this.lastLeader;this.lastLeader=lead.number;
 if(former&&former!==lead.number&&time-this.leadCall>4&&time>7){this.leadCall=time;return this.say(time,lead,this.pick('change',[tag(lead)+'、前をかわして先頭に変わりました！','今、先頭が替わった！ '+tag(lead)+'が前に出ます！',tag(lead)+'が抜け出しました！ 後続は追いつけるか！']),'lead-change',remain<350?2.3:3.6);}
 if(Number.isFinite(this.straightStart)&&lead.ran>=this.straightStart&&!this.marks.has('straight')){this.marks.add('straight');return this.say(time,lead,this.pick('straight',['最終コーナーを曲がって直線へ！ '+tag(lead)+'が先頭で向きました。','さあ、最後の直線に入りました！ '+tag(lead)+'、後続を振り切れるか！','直線コースの攻防です！ 先頭は'+tag(lead)+'、後ろからも追ってきます。']),'straight',3);}
 if(Number.isFinite(this.cornerStart)&&lead.ran>=this.cornerStart&&lead.ran<this.straightStart&&!this.marks.has('corner')){this.marks.add('corner');return this.say(time,lead,this.pick('corner',['勝負どころ、最終コーナーです。先頭は'+tag(lead)+'。','各馬、最後のコーナーへ。'+tag(lead)+'を先頭に直線を目指します。']),'corner',3.2);}
 if(remain>350&&time-this.lastHill>18&&this.slope&&this.slope!=='平坦'){this.lastHill=time;return this.say(time,lead,this.slope==='上り'?this.pick('uphill',['ここから上り坂です。先頭の'+tag(lead)+'、坂を駆け上がっていきます。',tag(lead)+'を先頭に上りへ。各馬、ここを越えて前へ進みます。']):this.pick('downhill',['下り坂に入りました。'+tag(lead)+'を先頭に各馬が駆け下ります。','ここは下り。先頭の'+tag(lead)+'、後続も続いています。']),'hill',3.6);}
 if(remain<350){
  const chaser=candidates.find(x=>lead.ran-x.r.ran<45&&this.cue.number!==x.r.number);
  if(chaser){const r=chaser.r;return this.say(time,r,this.pick('closing',[tag(r)+'、'+this.lane(r,rows)+'から差を詰めてきた！ '+r.rank+'番手、前に迫ります！',tag(r)+'が伸びてきます！ '+r.rank+'番手から先頭を追いかける！','追ってきたのは'+tag(r)+'！ 前との差を縮めています！']),'closing',2.4);}
  const near=rows[1],gap=(lead.ran-near.ran)/(this.bodyLength||2.4);
  if(gap<4&&this.cue.number!==near.number)return this.say(time,near,(gap<.25?this.pick('photo',[tag(lead)+'と'+tag(near)+'！ ほとんど差がありません！','先頭争いは接戦！ '+tag(near)+'が肉薄しています！']):gap<1?this.pick('close',[tag(near)+'も迫る！ 先頭との差は一馬身もありません！','一馬身以内で追ってくる'+tag(near)+'！ 最後まで分かりません！']):this.pick('chase',[tag(near)+'も追ってきます！ 先頭を捉えられるか！','二番手の'+tag(near)+'、前を追いかけています！'])),'duel',2.2);
  return this.say(time,lead,this.pick('leader',['残り'+Math.max(10,Math.round(remain/10)*10)+'m！ '+tag(lead)+'、先頭を守れるか！',tag(lead)+'が先頭！ ゴールは目前、後続を振り切れるか！','前で粘る'+tag(lead)+'！ 後ろからの追い上げをしのげるか！']),'home-leader',2.5);
 }
 for(const mark of [1000,600,400])if(remain<=mark&&!this.marks.has(mark)){this.marks.add(mark);return this.say(time,lead,'残り'+mark+'m。'+tag(lead)+'が先頭、'+(mark===1000?'後半の攻防に入ります。':'後続も前を追います。'),'distance',3.3);}
 if(remain<750&&candidates.length&&this.lastType!=='closing'){const r=candidates[0].r;return this.say(time,r,this.pick('move',[tag(r)+'が前との差を詰めて、現在'+r.rank+'番手。勝負所で動いてきました。',tag(r)+'が順位を上げてきました。'+r.rank+'番手から前をうかがいます。',this.lane(r,rows)+'から'+tag(r)+'が接近。先頭との差を縮めています。']),'closing',3.6);}
 // Introduce every runner in stable front-to-rear order, rather than cycling ranks 1/5/11.
 let r=rows.find(r=>!this.called.has(r.number));if(!r){this.called.clear();r=rows[Math.min(this.scan++%rows.length,rows.length-1)];}this.called.add(r.number);
 const gap=r.rank===1?(lead.ran-rows[1].ran)/(this.bodyLength||2.4):(rows[r.rank-2].ran-r.ran)/(this.bodyLength||2.4);
 const text=r.rank===1?this.pick('field-lead',[tag(r)+'が先頭。2番手に'+Math.max(.1,gap).toFixed(1)+'馬身ほどのリード。','レースを引っ張るのは'+tag(r)+'。二番手との差はおよそ'+Math.max(.1,gap).toFixed(1)+'馬身。',tag(r)+'を先頭に進みます。後続は'+Math.max(.1,gap).toFixed(1)+'馬身ほど後ろです。']):this.pick('field-pack',[tag(r)+'は'+r.rank+'番手。'+this.lane(r,rows)+'を追走、前との差は'+Math.max(.1,gap).toFixed(1)+'馬身ほどです。',r.rank+'番手には'+tag(r)+'。'+this.lane(r,rows)+'でレースを進めています。',tag(r)+'、前の馬を追って'+r.rank+'番手。間隔はおよそ'+Math.max(.1,gap).toFixed(1)+'馬身です。']);
 return this.say(time,r,text,'field',3.5);
 }
}
return {Commentator};
});
