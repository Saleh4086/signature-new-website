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

  /* ---------- rent vs buy (balanced: equity, appreciation, tax savings, selling costs, refinance vs. rent growth and invested savings) ---------- */
  const rb=$('#rentbuy');
  if(rb){
    const g=id=>num($('#'+id)), on=id=>{const e=$('#'+id);return !!(e&&e.checked)}, val=id=>{const e=$('#'+id);return e?e.value:''};
    // California 2025 tax schedules (FTB), indexed below at 3%/yr; [upper bound, rate]
    const CA_Y=[[22158,.01],[52528,.02],[82904,.04],[115084,.06],[145448,.08],[742958,.093],[891542,.103],[1485906,.113],[Infinity,.123]];
    const CA_X=[[11079,.01],[26264,.02],[41452,.04],[57542,.06],[72724,.08],[371479,.093],[445771,.103],[742953,.113],[Infinity,.123]];
    const caTax=(ti,sch,k)=>{let t=0,lo=0;for(const [hi,r] of sch){const h=hi*k;if(ti>lo)t+=(Math.min(ti,h)-lo)*r;lo=h;if(ti<=h)break}return Math.max(0,t)};
    function sim(o){
      const {price,dp,r0,rent0,ap,rg,ret,tax,mt,ins0,hoa0,sell,close,taxOn,mfj,inc0,fedR,caR,refi,refiR,refiY,refiC}=o;
      const mr=ret/12, D=price*dp, C=price*close, L=price-D;
      let rate=r0/12, nLeft=360, pi=rate?L*rate/(1-Math.pow(1+rate,-360)):L/360;
      let bal=L, val=price, tb=price, rent=rent0, ins=ins0, hoa=hoa0, inc=inc0;
      let ownInv=0, rentInv=D+C, cO=0, cR=D+C, sOwn=0, sRent=0, sTax=0, sPrin=0, sInt=0, refiCost=0, pi0=pi, pi1=pi, own1=0, tax1=0;
      let yInt=0, yPT=0, yBal0=bal;
      const W=[];
      for(let m=1;m<=360;m++){
        const y=Math.ceil(m/12);
        let extra=0;
        if(refi&&m===refiY*12+1&&bal>0){ // refinance the remaining balance over the remaining term
          extra=bal*refiC; refiCost+=extra; rate=refiR/12; nLeft=361-m; pi=rate?bal*rate/(1-Math.pow(1+rate,-nLeft)):bal/nLeft; pi1=pi;
        }
        const int=bal*rate, prin=Math.min(bal,pi-int), pay=bal>0?int+prin:0; bal-=prin;
        const pmi=(dp<.2&&bal>.78*price)?L*.005/12:0;
        const pt=tb*tax/12;
        const own=pay+pt+val*mt/12+ins/12+hoa+pmi+extra;
        if(m===1)own1=own;
        yInt+=int; yPT+=pt; sInt+=int; sPrin+=prin;
        ownInv*=1+mr; rentInv*=1+mr;
        if(own>rent){rentInv+=own-rent;cR+=own-rent}else{ownInv+=rent-own;cO+=rent-own}
        sOwn+=own; sRent+=rent;
        val*=Math.pow(1+ap,1/12);
        if(m%12===0){
          // estimated income-tax savings for this year, credited to the owner (and invested) at year end
          let save=0;
          if(taxOn){
            const cy=2025+y, k=Math.pow(1.025,y-1);
            const stdF=(mfj?32200:16100)*k, stdC=(mfj?11412:5706)*Math.pow(1.03,y);
            let cap=cy<=2029?40400*Math.pow(1.01,cy-2026):10000;
            const thr=505000*Math.pow(1.01,Math.min(cy,2029)-2026); if(inc>thr)cap=Math.max(10000,cap-.3*(inc-thr));
            const avg=Math.max(1,(yBal0+bal)/2), intF=yInt*Math.min(1,750000/avg), intC=yInt*Math.min(1,1e6/avg);
            const ct=caTax(Math.max(0,inc-stdC),mfj?CA_Y:CA_X,Math.pow(1.03,y));
            const itemOwn=intF+Math.min(cap,ct+yPT), base=Math.max(stdF,Math.min(cap,ct));
            save=Math.max(0,itemOwn-base)*fedR+Math.max(0,intC+yPT-stdC)*caR;
          }
          if(y===1)tax1=save;
          ownInv+=save; cO+=save; sTax+=save;
          yInt=0; yPT=0; yBal0=bal;
          rent*=1+rg; tb*=1.02; ins*=1.03; hoa*=1.03; inc*=1.03;
          const saleNet=val*(1-sell)-Math.max(bal,0);
          const gain=val*(1-sell)-price-C, cg=Math.max(0,gain-(mfj?500000:250000))*(.15+caR+(inc>400000?.05:0));
          W.push({y,b:saleNet-cg+ownInv,r:rentInv,val,bal:Math.max(bal,0),saleNet,cg,sOwn,sRent,sTax,sPrin,sInt,ownInv,rentInv,cO,cR,refiCost,rentNow:rent/(1+rg)});
        }
      }
      return {W,own1,tax1,pi0,pi1,D,C};
    }
    const read=()=>({price:g('rb1'),dp:Math.min(1,g('rb2')/100),r0:g('rb3')/100,rent0:g('rb4'),ap:g('rb6')/100,rg:g('rb7')/100,ret:g('rb8')/100,
      tax:g('rb9')/100,mt:g('rb10')/100,ins0:g('rb11'),hoa0:g('rb12'),sell:g('rb13')/100,close:g('rb14')/100,taxOn:on('rb19'),mfj:val('rb15')!=='single',
      inc0:g('rb16'),fedR:(parseFloat(val('rb17'))||0)/100,caR:(parseFloat(val('rb18'))||0)/100,refi:on('rb20'),refiR:g('rb21')/100,
      refiY:Math.max(1,Math.min(29,Math.round(g('rb22'))||1)),refiC:g('rb23')/100});
    // keep the suggested refi rate 1 point under today's rate until the visitor edits it
    const rr=$('#rb21'), r3=$('#rb3'); if(rr){rr.dataset.auto='1';rr.addEventListener('input',e=>{if(e.isTrusted)rr.dataset.auto='0'})}
    const syncRefi=()=>{if(rr&&rr.dataset.auto==='1'&&r3){const v=Math.max(3,num(r3)-1);rr.value=v.toFixed(2)}};
    const calc=()=>{
      syncRefi();
      const o=read(), yrs=Math.max(1,Math.min(30,Math.round(g('rb5'))||1));
      $$('.rb-set:nth-of-type(1) .field',rb).forEach(f=>f.classList.toggle('off',!o.taxOn));
      const R=sim(o), w=R.W[yrs-1], b=w.b, r=w.r, d=b-r;
      const buyNet=R.D+R.C+w.sOwn-w.sTax-(w.saleNet-w.cg)-(w.ownInv-w.cO), rentNet=w.sRent-(w.rentInv-w.cR);
      let be=null;for(const x of R.W){if(x.b>x.r){be=x.y;break}}
      $('#rb-head').textContent='After '+yrs+' year'+(yrs>1?'s':'');
      $('#rb-big').textContent=(Math.abs(d)<1000?'About even':short(Math.abs(d)));
      $('#rb-sub').innerHTML=(Math.abs(d)<1000?'Buying and renting come out about the same':d>=0?'<b>Buying</b> comes out ahead by '+money(d):'<b>Renting</b> comes out ahead by '+money(-d))+' under these assumptions. Net worth if you buy: <b>'+money(b)+'</b>; if you rent and invest the difference: <b>'+money(r)+'</b>.';
      const mx=Math.max(buyNet,rentNet,1);
      const bar=(cls,l,v)=>'<div class="rb-bar '+cls+'"><span>'+l+'</span><div><i style="width:'+Math.max(2,Math.max(0,v)/mx*100).toFixed(1)+'%"></i></div><b>'+money(v)+'</b></div>';
      $('#rb-cmp').innerHTML='<div class="rb-cmp-h">Net cost of housing over '+yrs+' year'+(yrs>1?'s':'')+'</div>'+bar('own','Own',buyNet)+bar('rent','Rent',rentNet)+
        '<small>What you paid, minus what you get back: cash from selling and tax savings for owners, investment growth for renters.</small>';
      $('#rb-own').textContent=money(R.own1)+'/mo';
      $('#rb-own-net').textContent=o.taxOn?money(R.own1-R.tax1/12)+'/mo':'Off';
      $('#rb-rent').textContent=money(o.rent0)+' → '+money(w.rentNow)+'/mo';
      $('#rb-be').textContent=be?('Year '+be):'Not within 30 years';
      // refinance what-if (always shown)
      const oR=Object.assign({},o,{refi:true}), oN=Object.assign({},o,{refi:false});
      const A=sim(oR), N=sim(oN), dRefi=(A.W[yrs-1].b-A.W[yrs-1].r)-(N.W[yrs-1].b-N.W[yrs-1].r), drop=N.pi0-A.pi1;
      const rbox=$('#rb-refi');
      if(o.refiR>=o.r0) rbox.innerHTML='<b>Refinance:</b> set a new rate below today\'s '+(o.r0*100).toFixed(2)+'% to see the savings.';
      else if(o.refiY>=yrs) rbox.innerHTML='<b>Refinance:</b> year '+o.refiY+' is past your '+yrs+'-year stay. Set an earlier year to see the savings.';
      else rbox.innerHTML='<b>If rates drop to '+(o.refiR*100).toFixed(2)+'% and you refinance in year '+o.refiY+':</b> principal &amp; interest falls about <b>'+money(drop)+'/mo</b>, and buying gains about <b>'+money(Math.abs(dRefi))+'</b>'+(dRefi<0?' less':'')+' versus renting by year '+yrs+', after '+money(A.W[yrs-1].refiCost)+' in refi costs.'+(o.refi?' <span class="rb-tag">included above</span>':' <span class="rb-tag off">not included above</span>');
      // breakdown table
      const row=(l,v,c)=>'<tr'+(c?' class="'+c+'"':'')+'><td>'+l+'</td><td>'+v+'</td></tr>';
      $('#rb-tbl').innerHTML='<tr class="h"><td colspan="2">Buying, year '+yrs+'</td></tr>'+
        row('Down payment + closing costs',money(R.D+R.C))+row('Mortgage, property tax, insurance, upkeep, HOA',money(w.sOwn))+
        row('&nbsp;&nbsp;of which interest',money(w.sInt))+row('Estimated tax savings',o.taxOn?'−'+money(w.sTax):'Off')+
        row('Principal paid down (equity you built)',money(w.sPrin))+row('Home value: '+money(o.price)+' → '+money(w.val),'+'+money(w.val-o.price))+
        row('Selling costs',money(w.val*o.sell))+(w.cg>0?row('Est. tax on gain above the exclusion',money(w.cg)):'')+
        row('Cash back when you sell, after paying off the loan','−'+money(w.saleNet-w.cg))+(w.ownInv-w.cO>1?row('Growth on invested savings','−'+money(w.ownInv-w.cO)):'')+
        row('Net cost of owning',money(buyNet),'t')+
        '<tr class="h"><td colspan="2">Renting, year '+yrs+'</td></tr>'+row('Rent paid',money(w.sRent))+
        row('Growth on the invested down payment and savings (opportunity cost)','−'+money(w.rentInv-w.cR))+row('Net cost of renting',money(rentNet),'t');
      // chart
      const B=R.W.map(x=>x.b), Rn=R.W.map(x=>x.r);
      const W=520,H=220,pl=46,pr=10,pt=10,pb=24,mxv=Math.max(...B,...Rn)*1.05,mn=Math.min(0,...B,...Rn);
      const X=i=>pl+(i)*(W-pl-pr)/29,Y=v=>pt+(mxv-v)/(mxv-mn||1)*(H-pt-pb);
      const path=a=>a.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
      let grid='';for(let k=0;k<=4;k++){const v=mn+(mxv-mn)*k/4;grid+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(pl-6)+'" y="'+(Y(v)+3)+'" text-anchor="end">'+short(v)+'</text>'}
      let xl='';[1,5,10,15,20,25,30].forEach(y=>{xl+='<text x="'+X(y-1)+'" y="'+(H-6)+'" text-anchor="middle">'+y+'y</text>'});
      $('#rb-chart').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><g class="grid">'+grid+'</g>'+xl+
        '<line x1="'+X(yrs-1)+'" x2="'+X(yrs-1)+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="rgba(255,255,255,.3)" stroke-dasharray="3 3"/>'+
        '<path d="'+path(Rn)+'" fill="none" stroke="var(--aqua)" stroke-width="2.2" vector-effect="non-scaling-stroke"/><path d="'+path(B)+'" fill="none" stroke="var(--gold)" stroke-width="2.2" vector-effect="non-scaling-stroke"/>'+
        '<circle cx="'+X(yrs-1)+'" cy="'+Y(b)+'" r="4" fill="var(--gold)"/><circle cx="'+X(yrs-1)+'" cy="'+Y(r)+'" r="4" fill="var(--aqua)"/></svg>';
      window.BSP_RB_LAST={yrs,b,r,d,buyNet,rentNet,own1:R.own1,tax1:R.tax1,be,refi:{drop,dRefi},w};
    };
    rb.addEventListener('input',calc);rb.addEventListener('change',calc);calc();
  }

  /* ---------- investment hold-period analysis (rent growth, appreciation, paydown, depreciation, passive-loss rules, after-tax sale, IRR, refi) ---------- */
  const ivf=$('#roi');
  if(ivf&&$('#iv-big')){
    const q=n=>$('[name='+n+']',ivf), gv=n=>num(q(n)), sv=n=>{const e=q(n);return e?e.value:''}, ck=n=>{const e=q(n);return !!(e&&e.checked)};
    const pct=v=>(isFinite(v)?(v*100).toFixed(1)+'%':'—');
    const irr=cf=>{const npv=r=>cf.reduce((s,c,t)=>s+c/Math.pow(1+r,t),0);let lo=-.99,hi=1.5;if(npv(lo)*npv(hi)>0)return NaN;for(let i=0;i<200;i++){const m=(lo+hi)/2;(npv(lo)*npv(m)<=0)?hi=m:lo=m}return (lo+hi)/2};
    function ivsim(o){
      const {price,dp,r0,rent0,vac,mg,mt,tax,ins0,hoa0,close,rehab,N,ap,rg,sellc,land,fedR,caR,mfj,magi0,pal,refi,refiR,refiY,refiC}=o;
      const L=price*(1-dp), cash0=price*dp+price*close+rehab, basis=price+price*close+rehab, depY=basis*(1-land)/27.5;
      let rate=r0/12, pi=dp>=1?0:(rate?L*rate/(1-Math.pow(1+rate,-360)):L/360), bal=L, nLeft=360, pi0=pi, pi1=pi;
      let rent=rent0, ins=ins0, hoa=hoa0, magi=magi0, susp=0, accDep=0, refiCost=0; const Y=[], ord=fedR+caR;
      for(let y=1;y<=N;y++){
        let yInt=0,yPrin=0,yDS=0,extra=0;
        for(let m=1;m<=12;m++){const mm=(y-1)*12+m;
          if(refi&&mm===refiY*12+1&&bal>0){extra=bal*refiC;refiCost+=extra;rate=refiR/12;nLeft=361-mm;pi=rate?bal*rate/(1-Math.pow(1+rate,-nLeft)):bal/nLeft;pi1=pi}
          if(bal>0){const int=bal*rate,prin=Math.min(bal,pi-int);bal-=prin;yInt+=int;yPrin+=prin;yDS+=int+prin}}
        const gross=rent*12, egi=gross*(1-vac), opex=egi*mg+gross*mt+price*tax*Math.pow(1.02,y-1)+ins+hoa*12, noi=egi-opex, cf=noi-yDS-extra;
        const dep=Math.min(depY,basis*(1-land)-accDep); accDep+=dep;
        let ti=noi-yInt-dep, taxEff=0;
        if(ti<0){const loss=-ti;let allow=pal==='rep'?Infinity:pal==='susp'?0:Math.max(0,25000-.5*Math.max(0,magi-100000));const use=Math.min(loss,allow);taxEff=use*ord;susp+=loss-use}
        else{const off=Math.min(ti,susp);susp-=off;taxEff=-(ti-off)*ord}
        const at=cf+taxEff;
        Y.push({y,rentMo:rent,noi,ds:yDS+extra,int:yInt,prin:yPrin,cf,dep,ti,taxEff,at,bal,val:price*Math.pow(1+ap,y)});
        rent*=1+rg; ins*=1+Math.max(.03,rg); hoa*=1.03; magi*=1.03;
      }
      const last=Y[N-1], sale=last.val, sc=sale*sellc, adj=basis-accDep, gain=sale-sc-adj, recap=Math.max(0,Math.min(gain,accDep)), rest=Math.max(0,gain-recap);
      const inc=magi/Math.pow(1.03,1);
      const ltcg=(inc+gain>(mfj?600000:500000))?.20:.15, niitThr=mfj?250000:200000, niit=Math.max(0,Math.min(gain,inc+gain-niitThr))*.038;
      const fedT=recap*Math.min(.25,fedR)+rest*ltcg+niit, caT=Math.max(0,gain)*caR, suspBen=susp*ord, saleTax=Math.max(0,fedT+caT)-suspBen;
      const netSale=sale-sc-last.bal, atSale=netSale-saleTax;
      const cfAT=[-cash0,...Y.map(x=>x.at)]; cfAT[N]+=atSale;
      const cfPre=[-cash0,...Y.map(x=>x.cf)]; cfPre[N]+=netSale;
      const sumAT=Y.reduce((s,x)=>s+x.at,0), sumCF=Y.reduce((s,x)=>s+x.cf,0), sumTax=Y.reduce((s,x)=>s+x.taxEff,0), sumPrin=Y.reduce((s,x)=>s+x.prin,0);
      return {Y,cash0,depY,accDep,sale,sc,adj,gain,recap,rest,fedT,caT,suspBen,susp,saleTax,netSale,atSale,profit:sumAT+atSale-cash0,irrAT:irr(cfAT),irrPre:irr(cfPre),
        sumAT,sumCF,sumTax,sumPrin,appr:sale-price,eq:sale-last.bal,mult:(sumAT+atSale)/cash0,pi0,pi1,refiCost,ltcg,niit};
    }
    const read=()=>({price:gv('price'),dp:Math.min(1,gv('down')/100),r0:gv('rate')/100,rent0:gv('rent'),vac:gv('vacancy')/100,mg:gv('mgmt')/100,mt:gv('maint')/100,tax:gv('tax')/100,
      ins0:gv('ins'),hoa0:gv('hoa'),close:gv('closing')/100,rehab:gv('rehab'),N:Math.max(1,Math.min(30,Math.round(gv('hold'))||1)),ap:gv('apprec')/100,rg:gv('rentg')/100,
      sellc:gv('sellc')/100,land:Math.min(.9,gv('land')/100),fedR:(parseFloat(sv('fed'))||0)/100,caR:(parseFloat(sv('ca'))||0)/100,mfj:sv('filing')!=='single',magi0:gv('magi'),pal:sv('pal'),
      refi:ck('refion'),refiR:gv('refirate')/100,refiY:Math.max(1,Math.min(29,Math.round(gv('refiyear'))||1)),refiC:gv('reficost')/100});
    const rr=q('refirate'), r3=q('rate'); if(rr){rr.dataset.auto='1';rr.addEventListener('input',e=>{if(e.isTrusted)rr.dataset.auto='0'})}
    const syncRefi=()=>{if(rr&&rr.dataset.auto==='1'&&r3)rr.value=Math.max(3,num(r3)-1).toFixed(2)};
    const setK=(id,v,c)=>{const el=$(id);el.querySelector('b').textContent=v;if(c!==undefined){el.classList.toggle('pos',c>0);el.classList.toggle('neg',c<0)}};
    const sg=v=>(v<0?'−':'+')+money(Math.abs(v));
    const calc=()=>{
      syncRefi();
      const o=read(), R=ivsim(o), N=o.N, y1=R.Y[0];
      $('#iv-head').textContent='If you hold '+N+' year'+(N>1?'s':'')+' and sell: annual return after tax (IRR)';
      $('#iv-big').textContent=isFinite(R.irrAT)?pct(R.irrAT):'—'; $('#iv-big').style.color=R.irrAT>=0?'var(--aqua-2)':'#ff9c86';
      $('#iv-sub').innerHTML='You put in <b>'+money(R.cash0)+'</b>. After '+N+' year'+(N>1?'s':'')+' of cash flow, taxes and an after-tax sale you get back about <b>'+money(R.sumAT+R.atSale)+'</b>: a profit of <b>'+money(R.profit)+'</b> under these assumptions.';
      setK('#iv-profit',money(R.profit),R.profit); setK('#iv-eq',money(R.eq)); setK('#iv-mult',isFinite(R.mult)?R.mult.toFixed(2)+'×':'—',R.mult-1); setK('#iv-pre',pct(R.irrPre),R.irrPre);
      // where the return comes from
      const parts=[['Appreciation',R.appr],['Loan paydown',R.sumPrin],['Tax savings from depreciation & interest',R.sumTax+R.suspBen],['Cash flow before tax',R.sumCF],['Closing costs & rehab at purchase',-(o.price*o.close+o.rehab)],['Selling costs',-R.sc],['Tax on the sale',-(R.fedT+R.caT)]];
      const mx=Math.max(...parts.map(p=>Math.abs(p[1])),1);
      $('#iv-cmp').innerHTML='<div class="rb-cmp-h">Where the '+N+'-year profit comes from</div>'+parts.map(([l,v])=>'<div class="iv-bar'+(v<0?' neg':'')+'"><span>'+l+'</span><div><i style="width:'+Math.max(1.5,Math.abs(v)/mx*100).toFixed(1)+'%"></i></div><b>'+sg(v)+'</b></div>').join('')+
        '<div class="iv-bar tot"><span>Total profit after tax</span><div></div><b>'+sg(R.profit)+'</b></div><small>Profit is what you get back beyond the '+money(R.cash0)+' you put in (down payment, closing costs and rehab). Rehab that raises the value or rent isn\'t counted unless you add it to the price or rent.</small>';
      $('#iv-cf1').textContent=money(y1.cf/12)+'/mo'; $('#iv-tx1').textContent=(y1.taxEff>=0?'saves ':'costs ')+money(Math.abs(y1.taxEff)/12)+'/mo'+(o.pal==='susp'||(y1.ti<0&&y1.taxEff===0)?' (loss carried forward)':'');
      $('#iv-at1').textContent=money(y1.at/12)+'/mo'; const pos=R.Y.find(x=>x.cf>0), posAT=R.Y.find(x=>x.at>0);
      $('#iv-pos').textContent=(pos?'Year '+pos.y+' before tax':'Not within '+N+' yrs before tax')+(posAT?' · year '+posAT.y+' after tax':'');
      // refinance what-if
      const A=ivsim(Object.assign({},o,{refi:true})), B0=ivsim(Object.assign({},o,{refi:false})), rb=$('#iv-refi');
      if(o.refiR>=o.r0) rb.innerHTML='<b>Refinance:</b> set a new rate below today\'s '+(o.r0*100).toFixed(2)+'% to see the effect.';
      else if(o.refiY>=N) rb.innerHTML='<b>Refinance:</b> year '+o.refiY+' is past your '+N+'-year hold. Set an earlier year.';
      else{const yA=A.Y[o.refiY]; rb.innerHTML='<b>If rates drop to '+(o.refiR*100).toFixed(2)+'% and you refinance in year '+o.refiY+':</b> principal &amp; interest falls about <b>'+money(B0.pi0-A.pi1)+'/mo</b>, year-'+(o.refiY+1)+' cash flow becomes <b>'+money(yA.cf/12)+'/mo</b> before tax, and the after-tax return moves from '+pct(B0.irrAT)+' to <b>'+pct(A.irrAT)+'</b> (profit '+sg(A.profit-B0.profit)+', after '+money(A.refiCost)+' in refi costs).'+(o.refi?' <span class="rb-tag">included above</span>':' <span class="rb-tag off">not included above</span>')}
      // year table + sale math
      const c=v=>'<td'+(v<0?' class="n"':'')+'>'+money(v)+'</td>';
      $('#iv-yr').innerHTML='<tr class="h"><td>Year</td><td>Rent/mo</td><td>NOI</td><td>Loan pmts</td><td>Cash flow</td><td>Tax effect</td><td>After tax</td><td>Equity</td></tr>'+R.Y.map(x=>'<tr><td>'+x.y+'</td><td>'+money(x.rentMo)+'</td>'+c(x.noi)+c(x.ds)+c(x.cf)+c(x.taxEff)+c(x.at)+'<td>'+money(x.val-x.bal)+'</td></tr>').join('');
      const row=(l,v,k)=>'<tr'+(k?' class="'+k+'"':'')+'><td>'+l+'</td><td>'+v+'</td></tr>';
      $('#iv-sale').innerHTML='<tr class="h"><td colspan="2">Sale in year '+N+'</td></tr>'+row('Sale price ('+(o.ap*100).toFixed(1)+'%/yr growth)',money(R.sale))+row('Selling costs','−'+money(R.sc))+row('Loan payoff','−'+money(R.Y[N-1].bal))+
        row('Cash from sale before tax',money(R.netSale),'t')+row('Depreciation taken ('+money(R.depY)+'/yr)',money(R.accDep))+row('Taxable gain (price − costs − adjusted basis '+money(R.adj)+')',money(R.gain))+
        row('Federal: recapture at '+Math.round(Math.min(.25,o.fedR)*100)+'%, gain at '+Math.round(R.ltcg*100)+'%'+(R.niit>0?' + 3.8% NIIT':''),'−'+money(R.fedT))+row('California at '+(o.caR*100).toFixed(1)+'%','−'+money(R.caT))+
        (R.suspBen>0?row('Carried-forward rental losses used at sale','+'+money(R.suspBen)):'')+row('Cash from sale after tax',money(R.atSale),'t');
      // chart: after-tax cash flow bars + equity line
      const W=520,H=220,pl=50,pr=10,pt=10,pb=24, E=R.Y.map(x=>x.val-x.bal), A2=R.Y.map(x=>x.at);
      const mxv=Math.max(...E,...A2,1)*1.06, mn=Math.min(0,...A2)*1.2, n=R.Y.length, bw=(W-pl-pr)/n;
      const X=i=>pl+bw*(i+.5), Yp=v=>pt+(mxv-v)/((mxv-mn)||1)*(H-pt-pb);
      let g='';for(let k=0;k<=4;k++){const v=mn+(mxv-mn)*k/4;g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Yp(v)+'" y2="'+Yp(v)+'"/><text x="'+(pl-6)+'" y="'+(Yp(v)+3)+'" text-anchor="end">'+short(v)+'</text>'}
      let bars='',xl='';R.Y.forEach((x,i)=>{const y0=Yp(0),y1=Yp(x.at);bars+='<rect x="'+(X(i)-bw*.3).toFixed(1)+'" width="'+(bw*.6).toFixed(1)+'" y="'+Math.min(y0,y1).toFixed(1)+'" height="'+Math.max(1,Math.abs(y1-y0)).toFixed(1)+'" fill="'+(x.at<0?'#ff9c86':'var(--aqua)')+'" rx="2"/>';
        if(n<=12||x.y%5===0||x.y===1)xl+='<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="middle">'+x.y+'y</text>'});
      const path=E.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Yp(v).toFixed(1)).join('');
      $('#iv-chart').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><g class="grid">'+g+'</g>'+xl+'<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Yp(0)+'" y2="'+Yp(0)+'" stroke="rgba(255,255,255,.25)"/>'+bars+
        '<path d="'+path+'" fill="none" stroke="var(--gold)" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>';
      window.BSP_IV_LAST={o,R:{irrAT:R.irrAT,irrPre:R.irrPre,profit:R.profit,eq:R.eq,mult:R.mult,cash0:R.cash0,atSale:R.atSale,netSale:R.netSale,saleTax:R.saleTax,sumAT:R.sumAT,sumCF:R.sumCF,sumTax:R.sumTax,suspBen:R.suspBen,sumPrin:R.sumPrin,appr:R.appr,sc:R.sc,fedT:R.fedT,caT:R.caT,depY:R.depY,y1:R.Y[0]},refi:{irrA:A.irrAT,irrB:B0.irrAT,drop:B0.pi0-A.pi1,dProfit:A.profit-B0.profit}};
    };
    ivf.addEventListener('input',calc);ivf.addEventListener('change',calc);calc();
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
