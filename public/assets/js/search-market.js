/* Collapsible city market panel on search.html.
   Data: Zillow Research ZHVI/ZORI (assets/js/market-data.js) and Freddie Mac PMMS 30-yr via FRED
   (assets/js/rates-history.js, rates-latest.js). All values are published figures; nothing is estimated
   except the clearly labelled payment example (standard amortization math). */
(()=>{'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const M=window.BSP_MARKET,H=window.BSP_RATE_HISTORY,R=window.BSP_RATES,btn=$('.mk-btn'),box=$('#mk');
  if(!btn||!box||!M)return;
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const money=v=>'$'+Math.round(v).toLocaleString('en-US');
  const ym=s=>{const [y,m]=s.split('-');return MON[+m-1]+' '+y};
  const back=(s,n)=>{let [y,m]=s.split('-').map(Number);m-=n;while(m<=0){m+=12;y--}return y+'-'+String(m).padStart(2,'0')};
  const pct=v=>v==null?'':'<span class="d '+(v>=0?'up':'down')+'">'+(v>=0?'▲ ':'▼ ')+Math.abs(v).toFixed(1)+'% 1-yr</span>';
  function chart(vals,color,fmt){const w=320,h=92,p=4,lo=Math.min(...vals),hi=Math.max(...vals),X=i=>p+i/(vals.length-1)*(w-2*p),Y=v=>p+(hi-v)/((hi-lo)||1)*(h-2*p);
    const d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
    return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Trend from '+fmt(vals[0])+' to '+fmt(vals[vals.length-1])+'"><path d="'+d+'L'+X(vals.length-1)+' '+h+'L'+X(0)+' '+h+'Z" fill="'+color+'" opacity=".14"/><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="'+X(vals.length-1)+'" cy="'+Y(vals[vals.length-1])+'" r="3.5" fill="'+color+'"/></svg>'}
  let city='',kind='zhvi';
  const p30=R&&R.series&&R.series.MORTGAGE30US;
  function rateCard(val){
    const pts=(H&&H.MORTGAGE30US||[]).slice(-52);if(!pts.length||!p30)return '';
    const lo=Math.min(...pts.map(p=>p[1])),hi=Math.max(...pts.map(p=>p[1]));
    let pay='';if(val){const L=val*.8,r=p30.value/100/12,n=360,P=L*r/(1-Math.pow(1+r,-n));pay='<div class="src" style="color:#d5dbec">Example: '+money(val)+' with 20% down at '+p30.value.toFixed(2)+'% ≈ <b style="color:var(--gold-2)">'+money(P)+'/mo</b> principal &amp; interest (before tax, insurance, HOA). <a href="buy.html">Run your numbers →</a></div>'}
    const ch=p30.prev!=null?p30.value-p30.prev:null;
    return '<div class="mk-card"><div class="k">30-yr fixed mortgage rate · last 12 months</div><div class="mk-row"><span class="v">'+p30.value.toFixed(2)+'%</span>'+(ch!=null?'<span class="d '+(ch<=0?'up':'down')+'">'+(ch>0?'▲ ':'▼ ')+Math.abs(ch).toFixed(2)+' vs prior week</span>':'')+'<span class="d" style="color:var(--muted)">12-mo range '+lo.toFixed(2)+'–'+hi.toFixed(2)+'%</span></div>'+chart(pts.map(p=>p[1]),'#d9b970',v=>v.toFixed(2)+'%')+
      '<div class="axis"><span>'+pts[0][0]+'</span><span>Week of '+p30.date+'</span></div>'+pay+'<div class="src">National weekly average. Source: <a href="'+p30.url+'" target="_blank" rel="noopener">Freddie Mac PMMS via FRED</a> · <a href="rates.html">All rate charts →</a></div></div>'}
  function render(){
    _render();if(!box.hidden&&!box.querySelector('.mk-x'))box.insertAdjacentHTML('afterbegin',closeBtn())}
  function _render(){
    if(!city||!M.cities[city]){
      const rows=Object.entries(M.cities).map(([c,d])=>'<tr><th scope="row"><button type="button" class="chip" data-mkcity="'+c+'" style="margin:0;padding:4px 10px;font-size:.76rem">'+c+'</button></th><td>'+money(d.zhvi.value)+'</td><td>'+pct(d.zhvi.yoy)+'</td><td>'+(d.zori?money(d.zori.value)+'/mo':'—')+'</td></tr>').join('');
      box.innerHTML='<div class="mk-card"><div class="k">Typical home value &amp; rent by city · '+ym(M.cities[Object.keys(M.cities)[0]].zhvi.month)+'</div><div style="overflow-x:auto"><table class="mtable" style="font-size:.82rem;margin-top:6px"><thead><tr><th>City</th><th>Value</th><th>1-yr</th><th>Rent</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="src">Pick a city for its 5-year trend. Source: <a href="'+M.url+'" target="_blank" rel="noopener">Zillow Research</a> (ZHVI, ZORI).</div></div>'+rateCard(null);
      $$('[data-mkcity]',box).forEach(b=>b.addEventListener('click',()=>{const c=$('.citybar .chip[data-city="'+b.dataset.mkcity+'"]');c?c.click():(city=b.dataset.mkcity,render())}));return}
    const d=M.cities[city],s=d[kind]||d.zhvi,k=d[kind]?kind:'zhvi',vals=s.spark,start=back(s.month,vals.length-1);
    const lbl=k==='zhvi'?'Typical home value (ZHVI)':'Typical rent (ZORI)';
    box.innerHTML='<div class="mk-card"><div style="display:flex;align-items:center;gap:8px"><div class="k">'+city+' · '+lbl+'</div><div class="mk-tabs" role="group" aria-label="Series"><button type="button" data-k="zhvi" aria-pressed="'+(k==='zhvi')+'">Values</button>'+(d.zori?'<button type="button" data-k="zori" aria-pressed="'+(k==='zori')+'">Rents</button>':'')+'</div></div>'+
      '<div class="mk-row"><span class="v">'+money(s.value)+(k==='zori'?'<small style="font-size:.9rem">/mo</small>':'')+'</span>'+pct(s.yoy)+(s.fiveYr!=null?'<span class="d '+(s.fiveYr>=0?'up':'down')+'">'+(s.fiveYr>=0?'▲ ':'▼ ')+Math.abs(s.fiveYr).toFixed(1)+'% 5-yr</span>':'')+'</div>'+
      chart(vals,k==='zhvi'?'#2ee6c9':'#7f8bff',money)+'<div class="axis"><span>'+ym(start)+'</span><span>'+ym(s.month)+'</span></div>'+
      '<div class="src">Monthly, smoothed &amp; seasonally adjusted. Source: <a href="'+M.url+'" target="_blank" rel="noopener">Zillow Research</a> · <a href="communities.html#market">All cities →</a></div></div>'+rateCard(d.zhvi.value);
    $$('.mk-tabs button',box).forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.k;render()}))}
  // Desktop: the panel floats over the top of the map/list as a drawer (CSS), so opening it never shrinks the map.
  // Collapsed by default everywhere; ?panel=market opens it. A close button and Esc dismiss it.
  const closeBtn=()=>'<button type="button" class="mk-x" aria-label="Close market &amp; rates">×</button>';
  function setOpen(o,focus){box.hidden=!o;btn.setAttribute('aria-expanded',o);document.body.classList.toggle('mk-open',o);if(o)render();else if(focus)btn.focus();setTimeout(()=>window.dispatchEvent(new Event('resize')),60)}
  btn.addEventListener('click',()=>setOpen(box.hidden));
  box.addEventListener('click',e=>{if(e.target.closest('.mk-x'))setOpen(false,true)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden)setOpen(false,true)});
  document.addEventListener('pointerdown',e=>{if(!box.hidden&&matchMedia('(min-width:821px)').matches&&!box.contains(e.target)&&!btn.contains(e.target)&&e.target.closest('#map'))setOpen(false)});
  $$('.citybar .chip[data-city]').forEach(c=>c.addEventListener('click',()=>{city=c.dataset.city;if(!box.hidden)render()}));
  const sel=$('#f-city');sel&&sel.addEventListener('change',()=>{city=sel.value;if(!box.hidden)render()});
  const q=new URLSearchParams(location.search);city=q.get('city')||'';
  setOpen(q.get('panel')==='market');
})();
