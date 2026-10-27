/* Blackstone AI Concierge for the new site.
   Uses the SAME request format as Sal's existing widget (/assets/blackstone-ai-widget.js):
   POST {message, history:[{role:'user'|'assistant', text}]}  ->  {reply} | {error}
   The request goes to /api/chat on this site; the preview Worker forwards it server-side
   to https://blackstonesignatureproperty.com/api/chat unchanged. */
(()=>{'use strict';
  if(document.getElementById('bsai2'))return;
  const API='/api/chat', TEL='+19257225144', PHONE='(925) 722-5144';
  const HOSTS=new Set(['blackstonesignatureproperty.com','www.blackstonesignatureproperty.com','zillow.com','www.zillow.com','realtor.com','www.realtor.com','redfin.com','www.redfin.com','maps.google.com','www.google.com',location.hostname]);
  const root=document.createElement('div');root.id='bsai2';
  root.innerHTML='<button class="ai-fab" type="button" aria-expanded="false" aria-controls="bsai2-p" aria-label="Ask Sal\'s AI assistant"><b aria-hidden="true">✦</b><span class="t">Ask Sal’s AI</span></button>'+
  '<section class="ai-panel" id="bsai2-p" role="dialog" aria-label="Blackstone Signature Properties &amp; Investments AI Concierge" hidden>'+
  '<div class="ai-h"><img src="assets/logo-mark.png" alt=""><div><b>Blackstone AI Concierge</b><small>● Online 24/7 · Sal\'s own assistant</small></div><button class="ai-x" type="button" aria-label="Close">✕</button></div>'+
  '<div class="ai-log" aria-live="polite"><div class="ai-m bot">Hi! I’m the Blackstone Signature Properties &amp; Investments AI Concierge. Ask about buying, selling, mortgage payments, investing, rentals, or property management.</div></div>'+
  '<div class="ai-q"><button type="button" data-q="What would the monthly payment be on a $750,000 home with 20% down at today’s rate?">Payment on $750K?</button><button type="button" data-q="What should I know before buying in Discovery Bay?">Buying in Discovery Bay</button><button type="button" data-q="How does your property management work?">Property management</button>'+
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
  form.addEventListener('submit',e=>{e.preventDefault();const m=input.value.trim();if(m)ask(m)});
  root.querySelectorAll('.ai-q button').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.q)));
  document.querySelectorAll('[data-open-ai]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();open(true)}));
})();
