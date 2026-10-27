/* Market & rates on search.html.
   Desktop (>=821px): a slim in-flow strip under the toolbar (one row of city cards + a rate card). It pushes the
   map/list down by ~200px instead of covering them; the map stays visible and interactive. Clicking a city card
   filters the map (same as the city chips / city dropdown).
   Phone (<=820px): a full-screen sheet with a "Back to map" bar on top; the Map/List pill and AI chip are hidden
   while it is open, so nothing sits behind or on top of it.
   Data: Zillow Research ZHVI/ZORI (assets/js/market-data.js; ZORI used for rent trend % only), 3-bed rents from
   assets/js/rent3.js and Freddie Mac PMMS 30-yr via FRED (rates-history.js, rates-latest.js). Published figures
   only, except the clearly labelled payment example (standard amortization math). */
(()=>{'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const R3=window.BSP_RENT3||{rents:{}},r3=c=>R3.rents[c],M=window.BSP_MARKET,H=window.BSP_RATE_HISTORY,R=window.BSP_RATES,btn=$('.mk-btn'),box=$('#mk');
  if(!btn||!box||!M)return;
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const money=v=>'$'+Math.round(v).toLocaleString('en-US');
  const kfmt=v=>v>=1e6?'$'+(v/1e6).toFixed(2)+'M':'$'+Math.round(v/1e3)+'K';
  const ym=s=>{const [y,m]=s.split('-');return MON[+m-1]+' '+y};
  const dl=(v,suf)=>v==null?'':'<span class="d '+(v>=0?'up':'down')+'">'+(v>=0?'▲ ':'▼ ')+Math.abs(v).toFixed(1)+'%'+(suf||'')+'</span>';
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  function spark(vals,color,h){const w=200,p=3,lo=Math.min(...vals),hi=Math.max(...vals),X=i=>p+i/(vals.length-1)*(w-2*p),Y=v=>p+(hi-v)/((hi-lo)||1)*(h-2*p);
    const d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
    return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+d+'L'+X(vals.length-1)+' '+h+'L'+X(0)+' '+h+'Z" fill="'+color+'" opacity=".14"/><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="'+X(vals.length-1)+'" cy="'+Y(vals[vals.length-1])+'" r="3" fill="'+color+'"/></svg>'}
  const p30=R&&R.series&&R.series.MORTGAGE30US;
  let city='';
  function rateCard(){
    const pts=(H&&H.MORTGAGE30US||[]).slice(-52);if(!pts.length||!p30)return '';
    const lo=Math.min(...pts.map(p=>p[1])),hi=Math.max(...pts.map(p=>p[1])),ch=p30.prev!=null?p30.value-p30.prev:null;
    const d=city&&M.cities[city];let pay='';
    if(d){const val=d.zhvi.value,L=val*.8,r=p30.value/100/12,P=L*r/(1-Math.pow(1+r,-360));pay='<div class="mk-pay" title="Example: typical '+city+' value with 20% down, principal and interest only (before tax, insurance, HOA)">'+kfmt(val)+' home, 20% down ≈ <b>'+money(P)+'/mo</b> P&amp;I · <a href="buy.html">Run numbers</a></div>'}
    return '<div class="mk-rate"><div class="k">30-yr fixed · 12 mo</div><div class="mk-l"><span class="v">'+p30.value.toFixed(2)+'%</span>'+(ch!=null?'<span class="d '+(ch<=0?'up':'down')+'">'+(ch>0?'▲ ':'▼ ')+Math.abs(ch).toFixed(2)+' wk</span>':'')+'</div>'+
      spark(pts.map(p=>p[1]),'#d9b970',34)+(pay||'<div class="mk-s">12-mo range '+lo.toFixed(2)+'–'+hi.toFixed(2)+'% · week of '+p30.date+'</div>')+
      '<div class="mk-s"><a href="'+p30.url+'" target="_blank" rel="noopener">Freddie Mac PMMS</a> · <a href="rates.html">All rates →</a></div></div>'}
  function cityCard(c,d){const z=d.zhvi,h3=r3(c),on=c===city;
    return '<button type="button" class="mk-c'+(on?' on':'')+'" data-mkcity="'+c+'" aria-pressed="'+on+'" title="Show '+c+' on the map">'+
      '<span class="n">'+c+'</span><span class="mk-l"><span class="v">'+kfmt(z.value)+'</span>'+dl(z.yoy,' 1-yr')+'</span>'+
      (z.spark&&z.spark.length>2?spark(z.spark,'#2ee6c9',26):'')+
      '<span class="r"><b>'+(h3?money(h3)+'/mo':'—')+'</b> 3-bed rent</span>'+(d.zori?'<span class="r">Rent trend '+dl(d.zori.yoy,' 1-yr')+'</span>':'')+'</button>'}
  function render(){
    const first=M.cities[Object.keys(M.cities)[0]].zhvi.month;
    const all='<button type="button" class="mk-c mk-all'+(city?'':' on')+'" data-mkcity="" aria-pressed="'+!city+'"><span class="n">All areas</span><span class="r">Show every city on the map</span></button>';
    box.innerHTML='<div class="mk-top"><button type="button" class="mk-x" aria-label="Close market and rates"><span aria-hidden="true">←</span> Back to map</button><b class="mk-t">Market &amp; rates</b><button type="button" class="mk-xd" aria-label="Close market and rates">×</button></div>'+
      '<div class="mk-strip">'+rateCard()+'<div class="mk-cities" role="group" aria-label="Pick a city to filter the map">'+all+Object.entries(M.cities).map(([c,d])=>cityCard(c,d)).join('')+'</div></div>'+
      '<div class="mk-src">Home values: <a href="'+M.url+'" target="_blank" rel="noopener">Zillow Research</a> ZHVI, '+ym(first)+' (5-yr line). 3-bed rent: <a href="'+R3.url+'" target="_blank" rel="noopener">Zillow Rentals</a>, '+R3.asof+'. Rent trend: ZORI all-rentals index, % only. <a href="communities.html#market">City details →</a></div>';
    const on=box.querySelector('.mk-c.on');if(on&&!mobile()){const w=box.querySelector('.mk-cities');w&&(w.scrollLeft=Math.max(0,on.offsetLeft-w.offsetLeft-120))}}
  function pick(c){const chip=$('.citybar .chip[data-city="'+c+'"]');
    if(chip)chip.click();else{const s=$('#f-city');if(s){s.value=c;s.dispatchEvent(new Event('change'))}}
    city=c;render();
    if(mobile()){setOpen(false);const m=$('.sp-main'),vt=$('.view-toggle');if(m&&vt&&!m.classList.contains('show-map'))vt.click()}}
  let lastFocus=null;
  function setOpen(o,focus){box.hidden=!o;btn.setAttribute('aria-expanded',o);document.body.classList.toggle('mk-open',o);
    if(o){render();if(mobile()){lastFocus=document.activeElement;const x=box.querySelector('.mk-x');x&&x.focus({preventScroll:true});box.scrollTop=0}}
    else if(focus)btn.focus();
    setTimeout(()=>window.dispatchEvent(new Event('resize')),60);setTimeout(()=>window.dispatchEvent(new Event('resize')),260)}
  btn.addEventListener('click',()=>setOpen(box.hidden));
  box.addEventListener('click',e=>{if(e.target.closest('.mk-x,.mk-xd'))return setOpen(false,true);const c=e.target.closest('[data-mkcity]');if(c)pick(c.dataset.mkcity)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden)setOpen(false,true)});
  $$('.citybar .chip[data-city]').forEach(c=>c.addEventListener('click',()=>{city=c.dataset.city;if(!box.hidden)render()}));
  const sel=$('#f-city');sel&&sel.addEventListener('change',()=>{if(city!==sel.value){city=sel.value;if(!box.hidden)render()}});
  const q=new URLSearchParams(location.search);city=q.get('city')||'';
  setOpen(q.get('panel')==='market');
})();
