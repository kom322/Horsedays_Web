/* HorseDays commentary v6: priority speech, configurable readings and crescendo.
   Uses browser-installed Japanese voices; no voice cloning or external TTS. */
(function(root,factory){
 'use strict';
 const Voice=factory();
 if(typeof module==='object'&&module.exports){module.exports=Voice;return;}
 const voice=root.HorseDaysRaceSpeech=new Voice(root);
 root.addEventListener('pointerdown',e=>{if(!e.target.closest?.('#voice-toggle'))voice.unlock();},{capture:true});
 root.addEventListener('keydown',e=>{if(!e.target.closest?.('#voice-toggle'))voice.unlock();},{capture:true});
 root.document.addEventListener('visibilitychange',()=>{voice.hidden=root.document.hidden;if(voice.hidden)voice.stop();});
 root.addEventListener('pagehide',()=>voice.stop());
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const clamp=(a,lo,hi)=>Math.min(hi,Math.max(lo,a));
 const urgent=new Set(['finish','all-finished','lead-change','duel','closing','v6-200','v6-100','v6-50','v6-close','v6-lead']);
 const normalized=t=>String(t||'').replace(/\s+/g,' ').trim();
 const defaultReadings={
   '向正面':'むこうじょうめん','直線':'ちょくせん','最終コーナー':'さいしゅうコーナー',
   '馬身':'ばしん','逃げ切り':'にげきり','差し切り':'さしきり','追い込み':'おいこみ',
   '上り坂':'のぼりざか','下り坂':'くだりざか','先行争い':'せんこうあらそい',
   '芝馬場':'しばばば','稍重':'ややおも','重馬場':'おもばば','不良馬場':'ふりょうばば'
 };
 return class RaceSpeech{
  constructor(env){
   this.env=env;this.synth=env.speechSynthesis;
   this.supported=!!(this.synth&&env.SpeechSynthesisUtterance);
   this.active=false;this.paused=false;this.muted=false;this.hidden=false;this.enabled=true;
   this.needsGesture=false;this.primed=false;this.latest=null;this.pending=null;this.current=null;
   this.currentNumber=0;this.currentDisplayText='';this.timer=null;this.sequence=0;
   this.lastPriority=0;this.voiceName='';
   try{this.enabled=env.localStorage.getItem('horse-days-commentary-voice')!=='off';}catch(_){}
  }
  getReadingMap(){
   const custom=this.env.HorseDaysNameReadings||{};
   return {...defaultReadings,...custom};
  }
  phonetic(text){
   let output=normalized(text);
   const map=this.getReadingMap();
   // Longer exact phrases first. User-supplied horse names take precedence on matches.
   Object.keys(map).sort((a,b)=>b.length-a.length).forEach(name=>{
    const reading=map[name];
    if(!name||typeof reading!=='string'||!reading.trim())return;
    output=output.split(name).join(reading.trim());
   });
   return output.replace(/([0-9]+)m\b/g,'$1メートル');
  }
  clearCurrent(){if(this.timer!==null)this.env.clearTimeout(this.timer);this.timer=null;this.current=null;this.currentNumber=0;this.currentDisplayText='';}
  stop(){const speaking=!!this.current;this.clearCurrent();this.pending=null;this.sequence++;if(speaking&&this.supported)this.synth.cancel();}
  setContext(active,paused,muted){
   const oldActive=this.active,oldBlocked=this.paused||this.muted;
   this.active=!!active;this.paused=!!paused;this.muted=!!muted;
   if(!oldBlocked&&(this.paused||this.muted))this.stop();
   if(oldActive&&!this.active)this.finish();
   this.drain();
  }
  finish(){this.active=false;this.pending=null;this.latest=null;}
  unlock(){if(!this.supported||!this.enabled)return;if(this.needsGesture){this.needsGesture=false;if(this.latest)this.pending=this.latest;}this.drain();}
  activate(){
   if(!this.supported)return;
   if(this.enabled&&this.primed&&!this.needsGesture){this.setEnabled(false);return;}
   this.setEnabled(true);this.primed=true;this.unlock();
  }
  setEnabled(v){
   this.enabled=!!v;
   try{this.env.localStorage.setItem('horse-days-commentary-voice',this.enabled?'on':'off');}catch(_){}
   if(!v){this.stop();return;}
   if(this.latest&&!this.current)this.pending=this.latest;
   this.drain();
  }
  cuePriority(type,remaining){
   if(type==='finish')return 100;
   if(type==='all-finished')return 95;
   if(type==='lead-change'||type==='v6-lead')return remaining<300?92:75;
   if(type==='v6-100'||type==='v6-50')return 90;
   if(type==='v6-200'||type==='duel'||type==='v6-close')return 85;
   if(type==='closing')return remaining<350?78:50;
   if(type==='straight'||type==='corner'||type==='distance')return 62;
   if(type==='field'||type==='gate'||type==='hill')return 12;
   return remaining<300?65:25;
  }
  say(text,key,number=0){
   if(typeof text!=='string'||!text.trim())return;
   if(this.latest?.key===key&&this.latest.text===text)return;
   const meta=this.env.HorseDaysRaceCueMeta||{};
   const rem=Number.isFinite(meta.remaining)?meta.remaining:1000;
   const type=meta.type||'field';
   const priority=this.cuePriority(type,rem);
   const cue={text,key,number,type,remaining:rem,priority,attempt:0};this.latest=cue;
   if(this.current){
    // Last-moment developments should never wait behind an outdated mid-race description.
    if(priority>=78&&(priority>=this.lastPriority+12||priority>=90)){
     this.clearCurrent();this.sequence++;
     try{this.synth.cancel();}catch(_){}
    }else if(priority<this.lastPriority&&priority<60){return;}
   }
   this.pending=cue;this.drain();
  }
  rateAndPitch(cue){
   const r=cue.remaining;
   let heat=r<=100?1:r<=200?.85:r<=400?.66:r<=600?.4:r<=1000?.22:.1;
   if(cue.type==='duel'||cue.type==='v6-close')heat=clamp(heat+.16,0,1);
   if(cue.type==='lead-change'||cue.type==='v6-lead')heat=clamp(heat+.12,0,1);
   if(cue.type==='finish')heat=1;
   if(cue.type==='all-finished')heat=.28;
   if(cue.type==='gate'||cue.type==='field'||cue.type==='hill')heat=Math.min(heat,.38);
   return {rate:clamp(1.06+heat*.36,1.02,1.48),pitch:clamp(.98+heat*.17,.9,1.2),volume:clamp(.88+heat*.12,.8,1)};
  }
  drain(){
   if(!this.pending||this.current||!this.supported||!this.enabled||!this.active||this.paused||this.muted||this.hidden||this.needsGesture)return;
   const cue=this.pending;this.pending=null;
   const utterance=new this.env.SpeechSynthesisUtterance(this.phonetic(cue.text));
   utterance.lang='ja-JP';const config=this.rateAndPitch(cue);
   utterance.rate=config.rate;utterance.pitch=config.pitch;utterance.volume=config.volume;
   const voices=this.synth.getVoices?this.synth.getVoices():[];
   const japanese=Array.from(voices).filter(v=>/^ja(?:-|$)/i.test(v.lang));
   const selected=japanese.find(v=>v.name===this.voiceName)||japanese.find(v=>v.localService)||japanese[0];
   if(selected)utterance.voice=selected;
   this.current=utterance;this.currentNumber=cue.number;this.currentDisplayText=cue.text;
   this.lastPriority=cue.priority;
   const seq=++this.sequence;const next=()=>this.env.setTimeout(()=>this.drain(),0);
   const clear=()=>{if(this.sequence!==seq||this.current!==utterance)return false;this.clearCurrent();this.lastPriority=0;return true;};
   utterance.onstart=()=>{
    if(this.current!==utterance)return;
    this.primed=true;this.needsGesture=false;
    if(this.timer!==null)this.env.clearTimeout(this.timer);
    this.timer=this.env.setTimeout(()=>{if(clear()){this.synth.cancel();next();}},Math.max(10000,cue.text.length*280));
   };
   utterance.onend=()=>{if(clear())next();};
   utterance.onerror=e=>{
    if(!clear())return;
    if(e.error==='not-allowed'){this.needsGesture=true;if(!this.pending)this.pending=cue;return;}
    if(!this.pending&&cue.attempt<1)this.pending={...cue,attempt:cue.attempt+1};
    next();
   };
   this.timer=this.env.setTimeout(()=>{
    if(clear()){this.synth.cancel();if(!this.pending&&cue.attempt<1)this.pending={...cue,attempt:cue.attempt+1};next();}
   },5000);
   try{this.synth.speak(utterance);}catch(e){utterance.onerror?.({error:e?.name==='NotAllowedError'?'not-allowed':'synthesis-failed'});}
  }
  label(){if(!this.supported)return '実況音声：非対応';if(!this.enabled)return '実況音声：オフ';return this.needsGesture||!this.primed?'実況音声を再生':'実況音声：オン';}
 };
});
