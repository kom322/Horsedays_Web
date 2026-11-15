/* HorseDays v6: event-driven crescendo. Preserves the original commentary engine. */
(function(g){
 'use strict';
 if(!g.HorseDaysRaceCommentary?.Commentator)return;
 const C=g.HorseDaysRaceCommentary.Commentator;
 const original=C.prototype.update;
 const originalReset=C.prototype.reset;
 C.prototype.reset=function(){originalReset.call(this);this.v6Marks=new Set();this.v6Leader=0;this.v6DuelAt=-99;};
 C.prototype.update=function(time,rows){
  const cue=original.call(this,time,rows);
  if(!Array.isArray(rows)||rows.length===0)return cue;
  const leader=rows[0],remaining=Math.max(0,(this.distance||2000)-leader.ran);
  const finished=rows.some(r=>r.finished);
  let next=cue;
  // Override routine chatter at the most important race moments; no long lines in the straight.
  if(!finished&&time>1){
   const name=r=>r.number+'番 '+r.name;
   for(const dist of [200,100,50]){
    if(remaining<=dist&&!this.v6Marks.has(dist)){
     this.v6Marks.add(dist);
     const opponent=rows[1];
     const close=opponent&&((leader.ran-opponent.ran)/(this.bodyLength||2.4))<2;
     const txt=dist===200?'残り200メートル！ '+name(leader)+'が先頭！ '+(close?'後続も迫る！':'押し切るか！'):
      dist===100?'残り100メートル！ '+name(leader)+'！ '+(close?'並びかける！':'リードを保つ！'):
      'ゴール目前！ '+name(leader)+'！ あとわずか！';
     next=this.say(time,leader,txt,'v6-'+dist,dist===200?1.9:1.5);
     break;
    }
   }
   if(next===cue&&remaining<280&&remaining>55&&time-this.v6DuelAt>2.8){
    const opponent=rows[1];const gap=opponent?(leader.ran-opponent.ran)/(this.bodyLength||2.4):Infinity;
    if(gap<1.3){this.v6DuelAt=time;next=this.say(time,leader,gap<.35?name(leader)+'！ '+name(opponent)+'！ 並んだ！':name(leader)+'に'+name(opponent)+'が迫る！','v6-close',1.7);}
   }
  }
  g.HorseDaysRaceCueMeta={type:next?.type||'field',remaining};
  return next;
 };
})(window);
