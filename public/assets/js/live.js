/* Blackstone Signature v3: live rates, staleness, chart, rent vs buy, Farsi toggle, micro-interactions.
   Data: window.BSP_RATES (rates-latest.js) and window.BSP_RATE_HISTORY (rates-history.js), both written by _src/update_rates.py */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const num=el=>parseFloat(String(el.value).replace(/[^0-9.\-]/g,''))||0;
  const money=n=>(n<0?'-':'')+'$'+Math.round(Math.abs(n)).toLocaleString('en-US');
  const short=n=>{const a=Math.abs(n),s=n<0?'-':'';return a>=1e6?s+'$'+(a/1e6).toFixed(a>=1e7?1:2)+'M':a>=1e3?s+'$'+Math.round(a/1e3)+'k':s+'$'+Math.round(a)};
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fdate=d=>{const [y,m,dd]=d.split('-');return MON[+m-1]+' '+(+dd)+', '+y};
  const parse=d=>{const [y,m,dd]=d.split('-');return Date.UTC(+y,+m-1,+dd)};
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D=window.BSP_RATES||null, S=(D&&D.series)||{};
  const fmt=(sid,v)=>v==null?'–':(sid.startsWith('OBMMI')?v.toFixed(3):v.toFixed(2));

  /* ---------- staleness: weekly data older than 10 days, daily older than 6 days ---------- */
  const today=Date.now(), DAY=864e5;
  const isStale=(s)=>!s||!s.date||((today-parse(s.date))/DAY>(s.freq==='weekly'?10:6));
  const p30=S.MORTGAGE30US;
  const allStale=!D||Object.values(S).every(isStale);
  const tick=$('.tick');
  if(tick){
    if(allStale){tick.classList.add('stale');const l=$('.tick-lbl span',tick);if(l){l.textContent='Last available rates';l.removeAttribute('data-fa')}}
    // pause control (WCAG 2.2.2)
    if(!RM){const b=document.createElement('button');b.type='button';b.className='tick-ctl';b.setAttribute('aria-label','Pause rate ticker');b.textContent='❚❚';
      b.addEventListener('click',()=>{const p=tick.classList.toggle('paused');b.textContent=p?'▶':'❚❚';b.setAttribute('aria-label',p?'Play rate ticker':'Pause rate ticker')});
      const more=$('.tick-more',tick);tick.insertBefore(b,more||null)}
  }
  $$('.rcard[data-date],.rate-pill[data-date]').forEach(c=>{if(isStale({date:c.dataset.date,freq:c.dataset.freq})){c.classList.add('stale');const a=$('.rc-asof',c);a&&a.insertAdjacentHTML('beforeend',' · <b style="color:#f0b44c">last available</b>')}});
  const sn=$('.stale-note');
  if(sn&&allStale){sn.hidden=false;sn.textContent='Heads up: the newest data we have is from '+(p30?fdate(p30.date):'an earlier date')+'. Sources publish on a schedule (Freddie Mac on Thursdays, daily indices on business days), and this page shows the last available values until the next update runs.'}

  /* ---------- calculator defaults: latest 30-yr, ?rate= override, 15-yr switch ---------- */
  const qs=new URLSearchParams(location.search);
  let qr=parseFloat(qs.get('rate'));if(!(qr>=0.5&&qr<=20))qr=null;
  const rateInputs=$$('#m3,#a4,#rb3,#r2');
  rateInputs.forEach(inp=>{
    inp.dataset.auto='1';
    if(qr!=null){inp.value=qr;const h=$('.rate-hint[data-for="'+inp.id+'"]');if(h)h.innerHTML='Using <b>'+qr.toFixed(2)+'%</b> from the rates page link. <a href="rates.html">Rates &amp; sources</a>.';}
    inp.addEventListener('input',e=>{if(e.isTrusted)inp.dataset.auto='0'});
    if(qr!=null)inp.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const term=$('#m4'), m3=$('#m3'), p15=S.MORTGAGE15US;
  let LIVE=null; // daily values from /api/rates once they load (see below)
  if(term&&m3&&p30&&p15&&qr==null){term.addEventListener('change',()=>{if(m3.dataset.auto!=='1')return;const h=$('.rate-hint[data-for="m3"]');
    if(term.value!=='15'&&LIVE){m3.value=LIVE.rate30;if(h)h.innerHTML=liveHint()}
    else{const v=term.value==='15'?p15:p30;m3.value=v.value;if(h)h.innerHTML='Prefilled with the Freddie Mac '+(term.value==='15'?'15':'30')+'-yr average, <b>'+v.value.toFixed(2)+'%</b> (week of '+fdate(v.date)+'). <a href="rates.html">Rates &amp; sources</a>.'}
    m3.dispatchEvent(new Event('input',{bubbles:true}))})}

  /* ---------- daily rates from Sal's Worker (/api/rates = Mortgage News Daily daily index) ----------
     Fetched on load. Only fields the feed really has are used (30-yr fixed + 30-yr FHA, each with its own date).
     Everything else, the chart history and any failure/fallback/stale case keep the build-time values. */
  const SRC='Mortgage News Daily', SRCURL='https://www.mortgagenewsdaily.com/mortgage-rates';
  const mdy=s=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(String(s||'').trim());if(!m)return null;const y=m[3].length===2?2000+(+m[3]):+m[3];return y+'-'+('0'+m[1]).slice(-2)+'-'+('0'+m[2]).slice(-2)};
  const okRate=v=>typeof v==='number'&&isFinite(v)&&v>=1&&v<=20;
  const okDate=d=>!!d&&!isStale({date:d,freq:'daily'})&&parse(d)-today<2*DAY;
  const sdate=d=>{const [,m,dd]=d.split('-');return MON[+m-1]+' '+(+dd)};
  const dnH=c=>{if(typeof c!=='number'||!isFinite(c))return '';if(Math.abs(c)<0.005)return '<span class="dn flat">unch</span>';const u=c>0;return '<span class="dn '+(u?'up':'down')+'"><span aria-hidden="true">'+(u?'▲':'▼')+'</span><span class="sr">'+(u?'up':'down')+'</span> '+Math.abs(c).toFixed(2)+'</span>'};
  const liveHint=()=>'Prefilled with the '+SRC+' 30-yr fixed daily index, <b>'+LIVE.rate30.toFixed(2)+'%</b> ('+fdate(LIVE.d30)+'). <a href="rates.html">Rates &amp; sources</a>.';
  function applyLive(j){
    if(!j||typeof j!=='object'||j.fallback===true||/not\s*live/i.test(String(j.updated))||!okRate(j.rate30))return;
    const d30=mdy(j.updated);if(!okDate(d30))return;
    const dF=mdy(j.fhaUpdated||j.updated),fha=okRate(j.fha30)&&okDate(dF)?j.fha30:null;
    const url=/^https:\/\/www\.mortgagenewsdaily\.com\//.test(String(j.sourceUrl||''))?j.sourceUrl:SRCURL;
    LIVE={rate30:j.rate30,ch30:j.change30,d30,fha,chF:j.changeFha30,dF};
    document.documentElement.dataset.liveRates=d30;
    // ticker: daily items first, build-time items follow with their own sources/dates
    $$('.tick-set').forEach((set,i)=>{const ti=i?' tabindex="-1"':'';
      set.insertAdjacentHTML('afterbegin','<a'+ti+' class="ti live" href="rates.html#r-MND30" data-sid="MND30" data-date="'+d30+'"><span class="tn">30-yr fixed · daily</span><b>'+LIVE.rate30.toFixed(2)+'%</b>'+dnH(LIVE.ch30)+'<span class="ts">'+SRC+' · '+sdate(d30)+'</span></a>'+
        (fha!=null?'<a'+ti+' class="ti live" href="rates.html#r-MNDFHA30" data-sid="MNDFHA30" data-date="'+dF+'"><span class="tn">30-yr FHA · daily</span><b>'+fha.toFixed(2)+'%</b>'+dnH(LIVE.chF)+'<span class="ts">'+SRC+' · '+sdate(dF)+'</span></a>':''))});
    if(tick&&tick.classList.contains('stale')){tick.classList.remove('stale');const l=$('.tick-lbl span',tick);if(l){l.textContent='Live rates';l.setAttribute('data-fa','نرخ وام')}}
    // home badge
    $$('.rate-pill[data-sid="MORTGAGE30US"]').forEach(p=>{p.classList.remove('stale');p.dataset.sid='MND30';p.dataset.date=d30;p.dataset.freq='daily';p.href='rates.html#r-MND30';
      const lab=$('span',p);if(lab)lab.textContent='30-yr fixed · daily';const b=$('b',p);if(b)b.textContent=LIVE.rate30.toFixed(2)+'%';
      const dn=$(':scope > .dn',p),nd=dnH(LIVE.ch30);if(dn){if(nd)dn.outerHTML=nd;else dn.remove()}
      const sm=$('small',p);if(sm)sm.textContent=SRC+' · '+fdate(d30)});
    // rates page: daily cards above the weekly/daily FRED cards
    const top=$('.rates-top .rgrid');
    if(top&&!$('#r-MND30')){
      const card=(id,name,v,c,d,big)=>'<article class="rcard'+(big?' big':'')+'" id="'+id+'" data-sid="'+id+'" data-date="'+d+'" data-freq="daily"><div class="rc-top"><span class="rc-name">'+name+'</span><span class="rc-freq">daily · live</span></div><div class="rc-val"><b>'+v.toFixed(2)+'<small>%</small></b>'+dnH(c)+'</div><div class="rc-asof">As of <time datetime="'+d+'">'+fdate(d)+'</time>'+(typeof c==='number'&&isFinite(c)?' · prior '+(v-c).toFixed(2)+'%':'')+'</div><ul class="rc-list"><li><span>Updates</span><b>Weekdays, about 4 PM ET</b></li></ul><a class="rc-src" href="'+url+'" rel="noopener" target="_blank">Source: '+SRC+' Rate Index ↗</a></article>';
      top.insertAdjacentHTML('beforebegin','<p class="note live-note" style="margin:0 0 14px">Daily rate index, loaded live from '+SRC+' when this page opens. The weekly Freddie Mac averages and Optimal Blue indices below are from our last data update, each with its own date.</p><div class="rgrid" id="mnd-live" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-bottom:20px">'+
        card('MND30','30-yr fixed · daily rate index',LIVE.rate30,LIVE.ch30,d30,true)+(fha!=null?card('MNDFHA30','30-yr FHA · daily rate index',fha,LIVE.chF,dF,true):'')+'</div>');
      const sn2=$('.stale-note');if(sn2)sn2.hidden=true;
      const cta=$('.phero a.btn-gold[href^="buy.html?rate="]');if(cta){cta.href='buy.html?rate='+LIVE.rate30.toFixed(2)+'#calc';const t=cta.lastChild;if(t&&t.nodeType===3)t.nodeValue=' Open the calculator at '+LIVE.rate30.toFixed(2)+'%'}
    }
    // calculator defaults (only fields the visitor hasn't edited, no ?rate= link, 30-yr term)
    if(qr==null)rateInputs.forEach(inp=>{if(inp.dataset.auto!=='1')return;if(inp.id==='m3'&&term&&term.value==='15')return;
      inp.value=LIVE.rate30.toFixed(2);const h=$('.rate-hint[data-for="'+inp.id+'"]');if(h)h.innerHTML=liveHint();inp.dispatchEvent(new Event('input',{bubbles:true}))});
  }
  if(window.fetch&&($('.tick')||rateInputs.length||$('.rate-pill'))){
    const ac=window.AbortController?new AbortController():null,to=setTimeout(()=>{ac&&ac.abort()},4000);
    fetch('/api/rates',{headers:{Accept:'application/json'},credentials:'same-origin',signal:ac?ac.signal:undefined})
      .then(r=>r.ok?r.json():null).then(j=>{clearTimeout(to);try{applyLive(j)}catch(e){}}).catch(()=>{clearTimeout(to)});
  }
  // deep-link tabs: ?tool=afford|rentbuy
  const tool=qs.get('tool');if(tool){const b=$('.seg button[data-show="'+tool+'"]');b&&b.click()}

  /* ---------- city presets (Zillow values) ---------- */
  $$('select.city-preset').forEach(sel=>{
    const apply=()=>{const o=sel.selectedOptions[0];if(!o||!o.dataset.price)return;
      [['price',sel.dataset.price],['rent',sel.dataset.rent]].forEach(([k,t])=>{const el=t&&$(t);if(el&&o.dataset[k]){el.value=o.dataset[k];el.dispatchEvent(new Event('input',{bubbles:true}))}})};
    sel.addEventListener('change',apply);
  });

  /* ---------- rent vs buy ---------- */
  const rb=$('#rentbuy');
  if(rb){
    const g=id=>num($('#'+id));
    const calc=()=>{
      const price=g('rb1'),dp=g('rb2')/100,rate=g('rb3')/100/12,rent0=g('rb4'),yrs=Math.max(1,Math.min(30,Math.round(g('rb5'))||1));
      const ap=g('rb6')/100,rg=g('rb7')/100,ret=g('rb8')/100/12,tax=g('rb9')/100,mt=g('rb10')/100,ins=g('rb11'),hoa=g('rb12'),sell=g('rb13')/100;
      const loan=price*(1-dp),n=360,pi=rate?loan*rate/(1-Math.pow(1+rate,-n)):loan/n;
      let tb=price,bal=loan,val=price,rent=rent0,ownInv=0,rentInv=price*dp,own1=0;const B=[],Rn=[];let be=null;
      for(let m=1;m<=360;m++){
        const int=bal*rate,prin=Math.min(bal,pi-int);bal-=prin;
        const own=(bal>0||prin>0?pi:0)+(tb*tax+val*mt)/12+ins/12+hoa; if(m===1)own1=own;
        ownInv*=1+ret;rentInv*=1+ret;
        if(own>rent)rentInv+=own-rent;else ownInv+=rent-own;
        val*=Math.pow(1+ap,1/12);
        if(m%12===0){rent*=1+rg;tb*=1.02;const y=m/12,bw=val*(1-sell)-Math.max(bal,0)+ownInv;B.push(bw);Rn.push(rentInv);if(be==null&&bw>rentInv)be=y}
      }
      const b=B[yrs-1],r=Rn[yrs-1],d=b-r;
      $('#rb-head').textContent='After '+yrs+' year'+(yrs>1?'s':'');
      $('#rb-big').textContent=short(Math.abs(d));
      $('#rb-sub').innerHTML=(d>=0?'<b>Buying</b> comes out ahead':'<b>Renting</b> comes out ahead')+' under these assumptions. Net worth if you buy: <b>'+money(b)+'</b>; if you rent and invest the difference: <b>'+money(r)+'</b>.';
      $('#rb-own').textContent=money(own1)+'/mo';$('#rb-rent').textContent=money(rent0)+'/mo';
      $('#rb-be').textContent=be?('Year '+be):'Not within 30 years';
      // chart
      const W=520,H=220,pl=46,pr=10,pt=10,pb=24,mx=Math.max(...B,...Rn)*1.05,mn=Math.min(0,...B,...Rn);
      const X=i=>pl+(i)*(W-pl-pr)/29,Y=v=>pt+(mx-v)/(mx-mn||1)*(H-pt-pb);
      const path=a=>a.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
      let grid='';for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4;grid+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(pl-6)+'" y="'+(Y(v)+3)+'" text-anchor="end">'+short(v)+'</text>'}
      let xl='';[1,5,10,15,20,25,30].forEach(y=>{xl+='<text x="'+X(y-1)+'" y="'+(H-6)+'" text-anchor="middle">'+y+'y</text>'});
      $('#rb-chart').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><g class="grid">'+grid+'</g>'+xl+
        '<line x1="'+X(yrs-1)+'" x2="'+X(yrs-1)+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="rgba(255,255,255,.3)" stroke-dasharray="3 3"/>'+
        '<path d="'+path(Rn)+'" fill="none" stroke="var(--aqua)" stroke-width="2.2" vector-effect="non-scaling-stroke"/><path d="'+path(B)+'" fill="none" stroke="var(--gold)" stroke-width="2.2" vector-effect="non-scaling-stroke"/>'+
        '<circle cx="'+X(yrs-1)+'" cy="'+Y(b)+'" r="4" fill="var(--gold)"/><circle cx="'+X(yrs-1)+'" cy="'+Y(r)+'" r="4" fill="var(--aqua)"/></svg>';
    };
    rb.addEventListener('input',calc);rb.addEventListener('change',calc);calc();
  }

  /* ---------- rates history chart ---------- */
  const COL={MORTGAGE30US:'var(--gold)',MORTGAGE15US:'#7f8bff',DGS10:'var(--aqua)',OBMMIC30YF:'#f08a6c'};
  const NAME={MORTGAGE30US:'30-yr fixed',MORTGAGE15US:'15-yr fixed',DGS10:'10-yr Treasury',OBMMIC30YF:'30-yr daily (OB)'};
  function initChart(){
    const box=$('#rchart'),H=window.BSP_RATE_HISTORY;if(!box||!H)return;
    let range=5;const on=new Set($$('#keys button[aria-pressed=true]').map(b=>b.dataset.s));
    const tip=document.createElement('div');tip.className='tip';tip.hidden=true;
    const draw=()=>{
      const end=parse((p30&&p30.date)||'2026-01-01'),start=range?end-range*365.25*DAY:-Infinity;
      const ser=[...on].filter(s=>H[s]).map(s=>({s,pts:H[s].filter(p=>parse(p[0])>=start).map(p=>[parse(p[0]),p[1]])})).filter(o=>o.pts.length);
      // thin very long daily series for speed
      ser.forEach(o=>{if(o.pts.length>1600){const k=Math.ceil(o.pts.length/1600);o.pts=o.pts.filter((p,i)=>i%k===0||i===o.pts.length-1)}});
      const w=box.clientWidth||800,h=box.clientHeight||400,pl=40,pr=12,pt=12,pb=26;
      if(!ser.length){box.innerHTML='<p class="note" style="padding:40px;text-align:center">Pick at least one series above.</p>';return}
      const t0=Math.min(...ser.map(o=>o.pts[0][0])),t1=Math.max(...ser.map(o=>o.pts[o.pts.length-1][0]));
      let lo=Math.min(...ser.flatMap(o=>o.pts.map(p=>p[1]))),hi=Math.max(...ser.flatMap(o=>o.pts.map(p=>p[1])));
      const pad=(hi-lo)*.08||.5;lo=Math.max(0,Math.floor((lo-pad)*2)/2);hi=Math.ceil((hi+pad)*2)/2;
      const X=t=>pl+(t-t0)/((t1-t0)||1)*(w-pl-pr),Y=v=>pt+(hi-v)/((hi-lo)||1)*(h-pt-pb);
      let g='';const step=(hi-lo)>8?2:(hi-lo)>3?1:.5;for(let v=lo;v<=hi+1e-9;v+=step)g+='<line x1="'+pl+'" x2="'+(w-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(pl-6)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v.toFixed(step<1?1:0)+'%</text>';
      const y0=new Date(t0).getUTCFullYear(),y1=new Date(t1).getUTCFullYear(),span=y1-y0,ys=span>30?10:span>12?5:span>5?2:1;let xl='';
      if(span<2){for(let t=t0;t<=t1;){const d=new Date(t);const m=d.getUTCMonth();const tt=Date.UTC(d.getUTCFullYear(),m+1,1);if(tt<=t1&&(m+1)%3===0)xl+='<text x="'+X(tt)+'" y="'+(h-6)+'" text-anchor="middle">'+MON[(m+1)%12]+' '+String(new Date(tt).getUTCFullYear()).slice(2)+'</text>';t=tt}}
      else for(let y=Math.ceil(y0/ys)*ys;y<=y1;y+=ys){const t=Date.UTC(y,0,1);if(t>=t0)xl+='<text x="'+X(t)+'" y="'+(h-6)+'" text-anchor="middle">'+y+'</text>'}
      const lines=ser.map(o=>{const d=o.pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');return(o.s==='MORTGAGE30US'?'<path class="ar" fill="'+COL[o.s]+'" d="'+d+'L'+X(o.pts[o.pts.length-1][0]).toFixed(1)+' '+(h-pb)+'L'+X(o.pts[0][0]).toFixed(1)+' '+(h-pb)+'Z"/>':'')+'<path class="ln" stroke="'+COL[o.s]+'" d="'+d+'"/>'}).join('');
      box.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Rate history, '+(range?range+' years':'all available data')+'"><g class="grid">'+g+'</g>'+xl+lines+'<line class="xh" x1="0" x2="0" y1="'+pt+'" y2="'+(h-pb)+'" visibility="hidden"/><g class="pts"></g></svg>';
      box.appendChild(tip);
      const svg=$('svg',box),xh=$('.xh',svg),pg=$('.pts',svg);
      const near=(pts,t)=>{let a=0,b=pts.length-1;while(b-a>1){const m=(a+b)>>1;pts[m][0]<t?a=m:b=m}return Math.abs(pts[a][0]-t)<Math.abs(pts[b][0]-t)?pts[a]:pts[b]};
      const move=e=>{const r=svg.getBoundingClientRect(),x=Math.max(pl,Math.min(w-pr,e.clientX-r.left)),t=t0+(x-pl)/(w-pl-pr)*(t1-t0);
        xh.setAttribute('x1',x);xh.setAttribute('x2',x);xh.setAttribute('visibility','visible');
        let html='<b>'+new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})+'</b>',dots='';
        ser.forEach(o=>{const p=near(o.pts,t);html+='<div><span><i style="background:'+COL[o.s]+'"></i>'+NAME[o.s]+'</span><b style="display:inline;margin:0;color:#fff">'+p[1].toFixed(o.s.startsWith('OBMMI')?3:2)+'%</b></div>';dots+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="4" fill="'+COL[o.s]+'" stroke="#050816" stroke-width="2"/>'});
        pg.innerHTML=dots;tip.innerHTML=html;tip.hidden=false;tip.style.left=Math.max(95,Math.min(w-95,x))+'px'};
      svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);
      svg.addEventListener('pointerleave',()=>{tip.hidden=true;xh.setAttribute('visibility','hidden');pg.innerHTML=''});
    };
    $$('#rng button').forEach(b=>b.addEventListener('click',()=>{range=+b.dataset.r;$$('#rng button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()}));
    $$('#keys button').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.s,p=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',!p);p?on.delete(s):on.add(s);draw()}));
    let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(draw,150)});draw();
  }
  // rates-history.js is a later deferred script, so wait for it
  let chartDone=false;const tryChart=()=>{if(chartDone||!window.BSP_RATE_HISTORY)return;chartDone=true;initChart()};
  if(document.readyState==='complete')tryChart();else{document.addEventListener('DOMContentLoaded',tryChart);addEventListener('load',tryChart)}

  /* ---------- Farsi toggle (key sections) ---------- */
  const faEls=$$('[data-fa]');faEls.forEach(el=>{el.dataset.en=el.innerHTML});
  const setFa=(on,announce)=>{
    document.body.classList.toggle('fa',on);
    faEls.forEach(el=>{if(!el.dataset.fa)return;el.innerHTML=on?el.dataset.fa:el.dataset.en;el.classList.toggle('fa-on',on);on?el.setAttribute('lang','fa'):el.removeAttribute('lang');on?el.setAttribute('dir','rtl'):el.removeAttribute('dir')});
    $$('.fa-btn').forEach(b=>{b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Switch to English':'نمایش به فارسی (Show key sections in Farsi)')});
    try{localStorage.setItem('bsp-lang',on?'fa':'en')}catch(e){}
    if(announce){let n=$('.fa-banner');if(!n){n=document.createElement('div');n.className='fa-banner';n.setAttribute('role','status');document.body.appendChild(n)}
      n.textContent=on?'بخش‌های اصلی به فارسی نمایش داده می‌شوند. Sal به هر دو زبان پاسخ می‌دهد.':'Showing English.';n.hidden=false;clearTimeout(n._t);n._t=setTimeout(()=>{n.hidden=true},2600)}
  };
  $$('.fa-btn').forEach(b=>b.addEventListener('click',()=>setFa(!document.body.classList.contains('fa'),true)));
  let saved=null;try{saved=localStorage.getItem('bsp-lang')}catch(e){}
  if(qs.get('lang')==='fa'||saved==='fa')setFa(true,false);else setFa(false,false);

  /* ---------- micro-interactions ---------- */
  const pr=document.createElement('div');pr.className='sprog';pr.setAttribute('aria-hidden','true');document.body.appendChild(pr);
  const onS=()=>{const m=document.documentElement.scrollHeight-innerHeight;pr.style.setProperty('--p',m>0?Math.min(1,scrollY/m):0)};
  addEventListener('scroll',onS,{passive:true});onS();
  if(!RM&&matchMedia('(hover:hover)').matches){
    document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.card,.mcard,.rcard');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true});
  }
  // count-up for big rate values when they enter view
  if(!RM&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;io.unobserve(en.target);const el=en.target,txt=el.firstChild&&el.firstChild.nodeValue;const v=parseFloat(txt);if(!(v>0))return;const dec=(txt.split('.')[1]||'').length,t0=performance.now();
      const st=t=>{const k=Math.min(1,(t-t0)/900),e=1-Math.pow(1-k,3);el.firstChild.nodeValue=(v*e).toFixed(dec);if(k<1)requestAnimationFrame(st);else el.firstChild.nodeValue=txt};requestAnimationFrame(st)}),{threshold:.6});
    $$('.rcard.big .rc-val b').forEach(b=>io.observe(b));
  }
})();
