/* Blackstone AI Concierge for the new site.
   Uses the SAME request format as Sal's existing widget (/assets/blackstone-ai-widget.js):
   POST {message, history:[{role:'user'|'assistant', text}]}  ->  {reply} | {error}
   The request goes to /api/chat on this site; the preview Worker forwards it server-side
   to https://blackstonesignatureproperty.com/api/chat unchanged. */
(()=>{'use strict';
  if(document.getElementById('bsai2'))return;
  const API='/api/chat', TEL='+19257225144', PHONE='(925) 722-5144';
  const HOSTS=new Set(['blackstonesignatureproperty.com','www.blackstonesignatureproperty.com','zillow.com','www.zillow.com','realtor.com','www.realtor.com','redfin.com','www.redfin.com','maps.google.com','www.google.com',location.hostname]);
  /* Common questions: instant, pre-written answers (no AI call). Facts come only from Sal's Worker
     (canned answers + verified business info) and this site's pages. Unknowns go to Sal directly. */
  const CALL='<a href="tel:+19257225144">call</a> or <a href="sms:+19257225144">text</a> Sal at (925) 722-5144';
  const FAQ=[
    ['rates','What are today’s mortgage rates?','<span class="ai-rates">Loading the latest daily rates…</span>'],
    ['pmfees','What are your property management fees?','Blackstone’s published pricing:<ul><li><b>Monthly management:</b> 6% of monthly rent collected</li><li><b>Tenant placement / leasing:</b> one-half of one month’s rent</li><li><b>Lease renewal:</b> $300</li></ul>Repair/vendor costs and third-party legal, court, screening or other outside charges are separate. Final terms are confirmed in the signed management agreement. <a href="property-management.html">Property management details</a>'],
    ['areas','What areas do you serve?','Core service areas include Discovery Bay, Brentwood, Oakley, Antioch, Pittsburg, Concord, Bay Point, Byron, Walnut Creek and nearby East Bay communities. <a href="communities.html">Explore the communities</a>'],
    ['value','How do I find out what my home is worth?','Request a free home valuation. Sal prepares a personal pricing review based on recent comparable sales and current competition. It’s prepared by a broker, with no obligation, in English or Farsi. <a href="sell.html#value">Request my free valuation</a>'],
    ['buy','How does buying work? I’m a first-time buyer.','Five steps, one point of contact:<ol><li><b>Strategy call:</b> location, budget, lifestyle, timeline and financing</li><li><b>Pre-approval:</b> get financing lined up so your offer is credible and fast. Sal can recommend lenders.</li><li><b>Search &amp; tour:</b> personalized MLS search plus local neighborhood knowledge</li><li><b>Offer &amp; negotiation</b></li><li><b>Inspections to keys:</b> inspections, disclosures, contingencies and closing</li></ol><a href="guide-first-time-home-buyer-guide-california.html">First-time buyer guide</a> · <a href="buy.html#calc">Payment calculator</a>'],
    ['sell','How does selling work?','The process, from valuation to closing:<ol><li><b>Valuation &amp; strategy:</b> pricing from recent comparable sales and current competition</li><li><b>Preparation plan:</b> what to fix, what to skip, and contractor coordination when helpful</li><li><b>Marketing &amp; exposure:</b> professional presentation and MLS exposure</li><li><b>Offers &amp; negotiation:</b> price, terms and certainty</li><li><b>Escrow to close:</b> disclosures, inspections, deadlines and closing</li></ol><a href="sell.html">Selling with Blackstone</a>'],
    ['commission','What is your commission to sell my home?','Sal discusses commission and listing terms directly with each seller, based on your home and goals. Please '+CALL+', or <a href="contact.html">send a message</a>.'],
    ['rent','How do I rent a home or apply?','Applications are handled securely through RentSpree. See <a href="property-management.html#rentals">current rentals</a> for available homes, rent and each home’s Apply Now link or '+CALL+'.'],
    ['repair','I’m a tenant. How do I request a repair?','Use the <a href="property-management.html#repair">repair request form</a>. It goes directly to Blackstone. <b>Emergency?</b> For fire, gas, flooding, electrical danger or any immediate life-safety emergency, call 911 or the utility first, then notify us.'],
    ['showing','How do I schedule a showing?','<a href="tel:+19257225144">Call</a> or <a href="sms:+19257225144">text</a> Sal at (925) 722-5144 with the home you’d like to see, or <a href="contact.html">send a message</a>. You can browse homes on the <a href="search.html">map search</a>.'],
    ['farsi','Do you speak Farsi?','Yes. Sal works with clients in English and Farsi (به فارسی با ما صحبت کنید), so every detail of your purchase, sale, lease or investment is clear in the language you’re most comfortable with.'],
    ['contact','How do I contact Sal?','Sal Gharibyar, Broker/Owner (DRE #01418692): <a href="tel:+19257225144">call</a> or <a href="sms:+19257225144">text</a> (925) 722-5144, email <a href="mailto:gharibyar61@gmail.com">gharibyar61@gmail.com</a>, or use the <a href="contact.html">contact form</a>.']
  ];
  const FAQ_HTML='<div class="ai-faq" id="bsai2-faq"><p class="ai-faq-h">Common questions · instant answers</p>'+FAQ.map(f=>'<details data-k="'+f[0]+'"><summary>'+f[1]+'</summary><div class="ai-faq-a">'+f[2]+'</div></details>').join('')+'<p class="ai-faq-f">Something else? Type your question below.</p></div>';
  const root=document.createElement('div');root.id='bsai2';
  root.innerHTML='<button class="ai-fab" type="button" aria-expanded="false" aria-controls="bsai2-p" aria-label="Ask Sal\'s AI assistant"><b aria-hidden="true">✦</b><span class="t">Ask Sal’s AI</span></button>'+
  '<section class="ai-panel" id="bsai2-p" role="dialog" aria-label="Blackstone Signature Properties &amp; Investments AI Concierge" hidden>'+
  '<div class="ai-h"><img src="assets/logo-mark.png" alt=""><div><b>Blackstone AI Concierge</b><small>● Online 24/7 · Sal\'s own assistant</small></div><button class="ai-x" type="button" aria-label="Close">✕</button></div>'+
  '<div class="ai-log" aria-live="polite"><div class="ai-m bot">Hi! I’m the Blackstone Signature Properties &amp; Investments AI Concierge. Ask about buying, selling, mortgage payments, investing, rentals, or property management.</div>'+FAQ_HTML+'</div>'+
  '<div class="ai-q"><button type="button" class="ai-faq-go">☰ Common questions</button>'+
  '<a href="search.html">⌕ Search homes</a><a href="sell.html#value">$ Home worth?</a><a href="contact.html?topic=Showing">▣ Schedule a showing</a></div>'+
  '<form class="ai-f"><input type="text" autocomplete="off" placeholder="Type a message…" aria-label="Message" maxlength="1500"><button type="submit">Send</button></form>'+
  '<p class="ai-d">General information only. Contact Sal for advice specific to your situation.</p></section>';
  document.body.appendChild(root);
  const fab=root.querySelector('.ai-fab'),panel=root.querySelector('.ai-panel'),log=root.querySelector('.ai-log'),form=root.querySelector('form'),input=form.querySelector('input'),send=form.querySelector('button');
  const history=[];
  const fabT=fab.querySelector('.t'),fabB=fab.querySelector('b');
  const open=o=>{panel.hidden=!o;root.classList.toggle('open',o);fab.setAttribute('aria-expanded',o);fabT.textContent=o?'Close chat':'Ask Sal’s AI';fabB.textContent=o?'✕':'✦';fab.setAttribute('aria-label',o?'Close Sal\'s AI assistant':'Ask Sal\'s AI assistant');if(o&&matchMedia('(min-width:821px)').matches)setTimeout(()=>input.focus(),40)};
  const vv=window.visualViewport;if(vv){const kb=()=>panel.style.setProperty('--kb',Math.max(0,Math.round(innerHeight-vv.height-vv.offsetTop))+'px');vv.addEventListener('resize',kb);vv.addEventListener('scroll',kb)}
  fab.addEventListener('click',()=>open(panel.hidden));
  root.querySelector('.ai-x').addEventListener('click',()=>{open(false);fab.focus()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)open(false)});
  function linkify(el,text){const re=/(https:\/\/[^\s<>"']+)/gi;let last=0,m;
    while((m=re.exec(text))){el.appendChild(document.createTextNode(text.slice(last,m.index)));let u=m[1];const tr=(u.match(/[),.!?;:]+$/)||[''])[0];if(tr)u=u.slice(0,-tr.length);
      try{const url=new URL(u);if(HOSTS.has(url.hostname.toLowerCase())){const a=document.createElement('a');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=url.hostname.replace(/^www\./,'')+(url.pathname.length>1?url.pathname:'');el.appendChild(a)}else el.appendChild(document.createTextNode(u))}catch(_){el.appendChild(document.createTextNode(u))}
      if(tr)el.appendChild(document.createTextNode(tr));last=m.index+m[1].length}
    el.appendChild(document.createTextNode(text.slice(last)))}
  function add(text,cls){const d=document.createElement('div');d.className='ai-m '+cls;if(cls.startsWith('bot'))linkify(d,text);else d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
  function offline(d,status,detail){d.className='ai-m bot note';d.textContent='';
    const msg=status===403?'The AI assistant isn’t switched on for this web address yet.':
      status===429?(detail||'The AI assistant has reached its free usage limit for the moment. Please try again in about a minute.'):
      status==='timeout'?'The AI is taking too long to answer right now. Please try again in a moment.':
      status===0?'Your connection to the AI assistant dropped. Please check your signal and try again.':
      'The AI assistant had a problem answering that question. Please try again in a moment.';
    d.append(msg+' Or get an answer from Sal right away: ');
    const a=document.createElement('a');a.href='tel:'+TEL;a.textContent='call '+PHONE;d.append(a,' or ');
    const b=document.createElement('a');b.href='sms:'+TEL;b.textContent='text him';d.append(b,'.')}
  async function ask(message){
    root.classList.add('asked');add(message,'me');input.value='';input.disabled=send.disabled=true;
    const ld=add('','bot');ld.innerHTML='<span class="ai-dots" aria-label="Thinking"><span></span><span></span><span></span></span>';
    const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),35000);
    try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history}),signal:ac.signal});
      let data={};try{data=await r.json()}catch(_){}
      if(!r.ok){offline(ld,r.status===504?'timeout':r.status,typeof data.error==='string'?data.error.slice(0,300):'');return}
      const reply=data.reply||'I’m sorry, I could not create a response.';ld.textContent='';linkify(ld,reply);
      history.push({role:'user',text:message});history.push({role:'assistant',text:reply});if(history.length>12)history.splice(0,history.length-12);
    }catch(e){offline(ld,e&&e.name==='AbortError'?'timeout':0)}
    finally{clearTimeout(tm);input.disabled=send.disabled=false;if(matchMedia('(min-width:821px)').matches)input.focus();log.scrollTop=log.scrollHeight}}
  /* FAQ accordion: one open at a time; the rates answer reads /api/rates when opened */
  const faqBox=root.querySelector('.ai-faq');
  let ratesLoaded=false;
  const mdy=v=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(String(v||'').trim());if(!m)return null;const y=m[3].length===2?2000+(+m[3]):+m[3];return new Date(Date.UTC(y,+m[1]-1,+m[2]))};
  const ok=v=>typeof v==='number'&&isFinite(v)&&v>=1&&v<=20;
  const fd=d=>d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  const fresh=d=>d&&(Date.now()-d.getTime())/864e5<=6&&d.getTime()-Date.now()<2*864e5;
  function loadRates(){if(ratesLoaded)return;ratesLoaded=true;const el=root.querySelector('.ai-rates');if(!el)return;
    const fail=()=>{el.innerHTML='The live rate feed isn’t available right now. See the latest published averages with their dates and sources on the <a href="rates.html">Rates page</a>.'};
    const ac=window.AbortController?new AbortController():null,t=setTimeout(()=>{ac&&ac.abort()},5000);
    fetch('/api/rates',{headers:{Accept:'application/json'},signal:ac?ac.signal:undefined}).then(r=>r.ok?r.json():null).then(j=>{clearTimeout(t);
      const d=j&&mdy(j.updated);if(!j||j.fallback===true||!ok(j.rate30)||!fresh(d))return fail();
      const df=mdy(j.fhaUpdated||j.updated),fha=ok(j.fha30)&&fresh(df);
      el.innerHTML='Mortgage News Daily’s national daily index:<ul><li><b>30-yr fixed:</b> '+j.rate30.toFixed(2)+'% (as of '+fd(d)+')</li>'+(fha?'<li><b>30-yr FHA:</b> '+j.fha30.toFixed(2)+'% (as of '+fd(df)+')</li>':'')+'</ul>These are national benchmarks, not a quote. Your rate depends on credit, down payment, loan type and points. <a href="rates.html">All rates &amp; sources</a> · <a href="buy.html?rate='+j.rate30.toFixed(2)+'#calc">Payment at '+j.rate30.toFixed(2)+'%</a> · Ask Sal for a lender referral: (925) 722-5144.';
    }).catch(()=>{clearTimeout(t);fail()})}
  faqBox.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open)return;faqBox.querySelectorAll('details[open]').forEach(o=>{if(o!==d)o.open=false});if(d.dataset.k==='rates')loadRates();
    setTimeout(()=>{const top=d.offsetTop-log.offsetTop-8;if(top<log.scrollTop||d.offsetTop+d.offsetHeight-log.offsetTop>log.scrollTop+log.clientHeight)log.scrollTop=top},30)}));
  root.querySelector('.ai-faq-go').addEventListener('click',()=>{log.scrollTop=faqBox.offsetTop-log.offsetTop-8;const f=faqBox.querySelector('summary');f&&f.focus()});
  /* Mobile: keep the AI button off content. Fade while scrolling; dock into the quick-contact bar once it shows;
     on the map search page it becomes a compact chip in the bottom row and hides while the map is open. */
  const mq=matchMedia('(max-width:820px)');let scT;
  const busy=()=>{if(!mq.matches||root.classList.contains('open'))return;root.classList.add('scrolling');clearTimeout(scT);scT=setTimeout(()=>root.classList.remove('scrolling'),650)};
  addEventListener('scroll',busy,{passive:true});
  const spList=document.querySelector('body.search-page .list');spList&&spList.addEventListener('scroll',busy,{passive:true});
  const spMain=document.querySelector('body.search-page .sp-main');
  if(spMain){const u=()=>root.classList.toggle('mapopen',spMain.classList.contains('show-map'));new MutationObserver(u).observe(spMain,{attributes:true,attributeFilter:['class']});u()}
  const mbar=document.querySelector('.mbar');
  if(mbar&&!spMain){const ab=document.createElement('button');ab.type='button';ab.className='mbar-ai';ab.setAttribute('aria-label','Ask Sal\'s AI assistant');ab.setAttribute('aria-controls','bsai2-p');
    ab.innerHTML='<b aria-hidden="true">✦</b>Ask AI';ab.addEventListener('click',()=>open(true));mbar.appendChild(ab);mbar.classList.add('has-ai');
    const u=()=>root.classList.toggle('docked',mbar.classList.contains('show'));new MutationObserver(u).observe(mbar,{attributes:true,attributeFilter:['class']});u()}
  form.addEventListener('submit',e=>{e.preventDefault();const m=input.value.trim();if(m)ask(m)});
  root.querySelectorAll('.ai-q button[data-q]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.q)));
  document.querySelectorAll('[data-open-ai]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();open(true)}));
})();
