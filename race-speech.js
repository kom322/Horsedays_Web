(function(root,factory){
 'use strict';
 const RaceSpeech=factory();
 if(typeof module==='object'&&module.exports){module.exports=RaceSpeech;return;}
 const voice=root.HorseDaysRaceSpeech=new RaceSpeech(root);
 root.addEventListener('pointerdown',event=>{if(!event.target.closest?.('#voice-toggle'))voice.unlock();},{capture:true});
 root.addEventListener('keydown',event=>{if(!event.target.closest?.('#voice-toggle'))voice.unlock();},{capture:true});
 root.document.addEventListener('visibilitychange',()=>{voice.hidden=root.document.hidden;if(voice.hidden)voice.stop();});
 root.addEventListener('pagehide',()=>voice.stop());
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 return class RaceSpeech{
  constructor(env){
   this.env=env;
   this.synth=env.speechSynthesis;
   this.supported=!!(this.synth&&env.SpeechSynthesisUtterance);
   this.active=false;
   this.paused=false;
   this.muted=false;
   this.hidden=false;
   this.enabled=true;
   this.needsGesture=false;
   this.primed=false;
   this.latest=null;
   this.pending=null;
   this.current=null;
   this.currentNumber=0;
   this.timer=null;
   try{this.enabled=env.localStorage.getItem('horse-days-commentary-voice')!=='off';}catch(_){}
  }
  clearCurrent(){
   if(this.timer!==null)this.env.clearTimeout(this.timer);
   this.timer=null;
   this.current=null;
   this.currentNumber=0;
  }
  stop(){
   const wasSpeaking=!!this.current;
   this.clearCurrent();
   this.pending=null;
   if(wasSpeaking)this.synth.cancel();
  }
  setContext(active,paused,muted){
   const wasActive=this.active,wasBlocked=this.paused||this.muted;
   this.active=!!active;
   this.paused=!!paused;
   this.muted=!!muted;
   if(!wasBlocked&&(this.paused||this.muted))this.stop();
   if(wasActive&&!this.active)this.finish();
   this.drain();
  }
  finish(){
   this.active=false;
   this.pending=null;
   this.latest=null;
  }
  unlock(){
   if(!this.supported||!this.enabled||this.current)return;
   if(this.needsGesture){
    this.needsGesture=false;
    if(this.latest)this.pending=this.latest;
   }
   this.drain();
  }
  activate(){
   if(!this.supported)return;
   if(this.enabled&&this.primed&&!this.needsGesture){this.setEnabled(false);return;}
   if(this.current&&!this.primed)this.stop();
   this.setEnabled(true);
   this.primed=true;
   this.unlock();
  }
  setEnabled(enabled){
   this.enabled=enabled;
   try{this.env.localStorage.setItem('horse-days-commentary-voice',enabled?'on':'off');}catch(_){}
   if(!enabled){this.stop();return;}
   if(this.latest&&!this.current)this.pending=this.latest;
  }
  say(text,key,number=0){
   if(typeof text!=='string'||!text.trim())return;
   if(this.latest?.key===key&&this.latest.text===text)return;
   this.latest={text,key,number,attempt:0};
   this.pending=this.latest;
   this.drain();
  }
  drain(){
   if(!this.pending||this.current||!this.supported||!this.enabled||!this.active||
      this.paused||this.muted||this.hidden||this.needsGesture)return;
   const cue=this.pending;
   this.pending=null;
   const utterance=new this.env.SpeechSynthesisUtterance(cue.text);
   utterance.lang='ja-JP';
   utterance.rate=1.22;
   const voices=this.synth.getVoices?this.synth.getVoices():[];
   const japanese=Array.from(voices).filter(voice=>/^ja(?:-|$)/i.test(voice.lang));
   const preferred=cue.attempt===0?(japanese.find(voice=>voice.localService)||japanese[0]):null;
   if(preferred)utterance.voice=preferred;
   this.current=utterance;
   this.currentNumber=cue.number;
   const next=()=>this.env.setTimeout(()=>this.drain(),0);
   utterance.onstart=()=>{
    if(this.current!==utterance)return;
    this.primed=true;
    this.needsGesture=false;
    this.env.clearTimeout(this.timer);
    // Recover when the speech engine never sends an end event.
    this.timer=this.env.setTimeout(()=>{
     if(this.current!==utterance)return;
     this.clearCurrent();
     this.synth.cancel();
     next();
    },Math.max(15000,cue.text.length*275));
   };
   utterance.onend=()=>{
    if(this.current!==utterance)return;
    this.clearCurrent();
    next();
   };
   const retry=(requiresTap=false,cancel=false)=>{
    this.clearCurrent();
    if(cancel)this.synth.cancel();
    if(!this.active)return;
    if(requiresTap){
     if(!this.pending)this.pending=cue;
     this.needsGesture=true;
    }else{
     if(!this.pending&&cue.attempt<1)this.pending={...cue,attempt:cue.attempt+1};
     next();
    }
   };
   utterance.onerror=event=>{
    if(this.current!==utterance)return;
    retry(event.error==='not-allowed');
   };
   this.timer=this.env.setTimeout(()=>{
    if(this.current===utterance)retry(false,true);
   },5000);
   try{this.synth.speak(utterance);}catch(error){retry(error?.name==='NotAllowedError');}
  }
  label(){
   if(!this.supported)return '実況音声：非対応';
   if(!this.enabled)return '実況音声：オフ';
   return this.needsGesture||!this.primed?'実況音声を再生':'実況音声：オン';
  }
 };
});
