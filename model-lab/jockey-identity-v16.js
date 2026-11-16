/* HORSEDAYS_JOCKEY_IDENTITY_V16: deterministic appearance and action from an actual rider ID.
   No additional fetch, no persistent state, no influence on race results. */
(function(root,factory){const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;else root.HorseDaysJockeyIdentityV16=x;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function hash(id){let h=2166136261;for(const c of String(id||'default'))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
function seed(id){return (hash(id)%9973)+1;}
function motion(style,dashing){const s=String(style||'');const base=s==='DeepCloser'||s==='Closer'?0.78:s==='Escape'||s==='BoldEscape'?1.17:s==='Press'?1.08:0.93;return Math.min(1.55,base*(dashing?1.18:1));}
function victory(id){return .90+(hash(id)%4)*.09;}
return {hash,seed,motion,victory};
});
