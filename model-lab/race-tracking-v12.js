/* HORSEDAYS_TRACKING_V12: light, real-rank tracking for 2-18 horses on smartphone. */
(function(){
  'use strict';
  if(!new URLSearchParams(location.search).has('live'))return;
  const app=window.HorseDaysLiveRace,solid=window.HorseDaysSolid;
  if(!app?.feed||!solid||!document.querySelector('.field-position'))return;
  const css=document.createElement('style');css.textContent=`
  #hd-v12-tracker{margin:8px 0 12px;border-radius:12px;border:1px solid #355644;background:#11251d;color:#f6f2e9;padding:10px 12px;font:600 13px/1.45 system-ui,-apple-system,'Noto Sans JP',sans-serif}
  #hd-v12-tracker .hd-head{display:flex;justify-content:space-between;align-items:center;margin:0 0 7px}
  #hd-v12-tracker .hd-caption{color:#acc7b6;font-size:11px;font-weight:500}
  #hd-v12-tracker .hd-slot{display:grid;grid-template-columns:36px minmax(0,1fr) 66px;gap:6px;align-items:center;padding:6px 0;border-top:1px solid #30483c}
  #hd-v12-tracker .hd-slot.owned{color:#ffe35e}
  #hd-v12-tracker .hd-num{font-weight:800;font-size:14px;white-space:nowrap}
  #hd-v12-tracker .hd-data{min-width:0}
  #hd-v12-tracker .hd-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}
  #hd-v12-tracker .hd-track{height:4px;overflow:hidden;border-radius:6px;background:#354e40;margin:4px 0 0}
  #hd-v12-tracker .hd-fill{height:100%;background:#a0d0b1;width:0%}
  #hd-v12-tracker .owned .hd-fill{background:#ffe35e}
  #hd-v12-tracker .hd-gap{text-align:right;font-size:11px;font-variant-numeric:tabular-nums}
  #hd-v12-tracker .hd-delta{font-weight:700;margin-left:4px}
  `;document.head.appendChild(css);
  const panel=document.createElement('section');panel.id='hd-v12-tracker';panel.setAttribute('aria-label','レースの位置取りと自分の馬の順位');
  const heading=document.createElement('div');heading.className='hd-head';
  const title=document.createElement('strong');title.textContent='現在の位置取り';
  const desc=document.createElement('span');desc.className='hd-caption';desc.textContent='先頭との差・順位変化';
  heading.append(title,desc);panel.append(heading);
  const slots=[];
  for(let i=0;i<4;i++){
    const row=document.createElement('div');row.className='hd-slot';
    const num=document.createElement('span');num.className='hd-num';
    const data=document.createElement('div');data.className='hd-data';
    const name=document.createElement('div');name.className='hd-name';
    const track=document.createElement('div');track.className='hd-track';
    const fill=document.createElement('div');fill.className='hd-fill';track.append(fill);data.append(name,track);
    const gap=document.createElement('div');gap.className='hd-gap';
    row.append(num,data,gap);panel.append(row);slots.push({row,num,name,fill,gap});
  }
  document.querySelector('.field-position').insertAdjacentElement('afterend',panel);
  let lastRace='',prevRanks=new Map(),lastRan=0;
  function draw(){
    const s=app.feed.current;
    if(!s||!Array.isArray(s.runners)||!s.runners.length)return;
    const rows=app.feed.rows(performance.now(),solid);
    if(!rows.length)return;
    const key=s.name+'|'+s.venue+'|'+s.distance+'|'+s.runners.map(r=>r.number).join(',');
    if(key!==lastRace || s.time<lastRan-.2){prevRanks=new Map();lastRace=key;}
    lastRan=s.time;
    const ordered=rows.slice().sort((a,b)=>a.rank-b.rank);
    const leader=ordered[0],owned=s.runners.find(r=>r.index===0);
    const ownerRow=owned?ordered.find(r=>r.number===owned.number):null;
    const visible=ordered.slice(0,3);
    if(ownerRow&&!visible.some(r=>r.number===ownerRow.number))visible.push(ownerRow);
    for(let i=0;i<slots.length;i++){
      const cell=slots[i],runner=visible[i];
      cell.row.hidden=!runner;
      if(!runner)continue;
      const mine=!!owned&&runner.number===owned.number;
      cell.row.classList.toggle('owned',mine);
      cell.num.textContent=runner.rank+'位';
      const old=prevRanks.get(runner.number),delta=old===undefined?'':old>runner.rank?' ↑'+(old-runner.rank):old<runner.rank?' ↓'+(runner.rank-old):'';
      cell.name.textContent=(mine?'★ ':'')+runner.number+'番 '+runner.name+delta;
      const ran=Number(runner.actualRan??runner.ran),lead=Number(leader.actualRan??leader.ran);
      cell.gap.textContent=runner.fallen?'落馬':runner.rank===1?'先頭':('+'+Math.max(0,lead-ran).toFixed(1)+'m');
      cell.fill.style.width=(Math.max(0,Math.min(1,runner.progress))*100).toFixed(1)+'%';
    }
    for(const r of rows)prevRanks.set(r.number,r.rank);
    const oldTop=document.getElementById('horse-days-top-three');
    if(oldTop){oldTop.hidden=true;oldTop.style.display="none";} // v7's old top-3 strip duplicates this tracker.
  }
  draw();const timer=setInterval(()=>{if(document.hidden)return;draw();},450);
  addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();
