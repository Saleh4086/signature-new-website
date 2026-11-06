/* Header interactions only; leave IDX search and forms under IDX control. */
(()=>{'use strict';
 document.body.classList.toggle('bsp-native-map',location.pathname.includes('/idx/map/'));
 const menu=document.querySelector('.bsp-chrome .menu-btn');
 if(menu)menu.addEventListener('click',()=>{const on=document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',String(on));});
 document.querySelectorAll('.bsp-chrome .nav a').forEach(link=>link.addEventListener('click',()=>{document.body.classList.remove('nav-open');if(menu)menu.setAttribute('aria-expanded','false');}));
 const fa=document.querySelector('.bsp-chrome .fa-btn');
 if(fa)fa.addEventListener('click',()=>{window.location.href='https://blackstonesignatureproperty.com/?lang=fa';});
})();

/* Embedded mode is activated only inside a frame on the main website. */
(()=>{'use strict';
 const parentOrigin='https://blackstonesignatureproperty.com';
 if(window.parent===window)return;
 let host;
 try{host=new URL(document.referrer).origin;}catch{return;}
 if(host!==parentOrigin)return;
 document.body.classList.add('bsp-idx-embedded');
 const notify=()=>window.parent.postMessage({type:'bsp-idx-ready',view:location.pathname.includes('/map/')?'map':'list'},parentOrigin);
 document.addEventListener('click',event=>{
   const link=event.target.closest&&event.target.closest('a[href]');if(!link)return;
   let url;try{url=new URL(link.href,location.href);}catch{return;}
   if(url.origin===location.origin)link.target='_self';
 },true);
 document.addEventListener('submit',event=>{if(event.target.tagName==='FORM')event.target.target='_self';},true);
 window.addEventListener('message',event=>{
   if(event.origin!==parentOrigin||event.source!==window.parent||!event.data)return;
   if(event.data.type==='bsp-idx-handshake'){notify();return;}
   if(event.data.type==='bsp-idx-view'&&['map','list'].includes(event.data.view)){
     const route=event.data.view==='map'?'/idx/map/mapsearch':'/idx/results/listings';
     location.assign(route+location.search);
   }
 });
 notify();
})();

/* Add presentation classes to native search actions; preserve provider links and events. */
(()=>{'use strict';
 const root=document.getElementById('blackstone-idx-content');if(!root)return;
 function styleActions(){
  root.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span').forEach(element=>{
   if(element.children.length===0&&/^similar listings$/i.test(element.textContent.trim()))element.classList.add('bsp-similar-listings-heading');
  });
  root.querySelectorAll('a,button').forEach(element=>{
   const label=element.textContent.replace(/\s+/g,' ').trim().toLowerCase();
   const cleanLabel=label.replace(/[♥♡❤💙\uFE0F]/gu,'').trim();
   const wording={'add to favorites':'Save property','remove from favorites':'Remove from saved','print flyer':'Print brochure','send message':'Send inquiry','my account':'My account'};
   if(wording[cleanLabel]){
    const next=wording[cleanLabel];
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    let text;while((text=walker.nextNode())){if(text.nodeValue.replace(/[♥♡❤💙\uFE0F]/gu,'').trim()){text.nodeValue=next+' ';break;}}
    element.setAttribute('aria-label',next);
    element.classList.add(cleanLabel==='send message'?'bsp-detail-submit':'bsp-detail-action');
   }

   if(/^(advanced search|listing id|address|map search)$/.test(label)){
    element.classList.add('bsp-search-tab');
    let active=false;
    try{active=new URL(element.href,location.href).pathname.replace(/\/$/,'').toLowerCase()===location.pathname.replace(/\/$/,'').toLowerCase();}catch{}
    element.classList.toggle('bsp-search-tab--active',active);
    if(active)element.setAttribute('aria-current','page');
   }
   if(/^(modify search|new search)$/.test(label))element.classList.add('bsp-primary-search-action');
   else if(/^(previous listing|next listing)$/.test(label))element.classList.add('bsp-secondary-search-action');
  });


  // Identify the native tab row by its four known actions, not provider class names.
  const tabs=Array.from(root.querySelectorAll('.bsp-search-tab'));
  if(tabs.length===4){
   let row=tabs[0].parentElement;
   while(row&&row!==root&&!tabs.every(tab=>row.contains(tab)))row=row.parentElement;
   if(row&&row!==root){
    row.classList.add('bsp-search-tabs');
    tabs.forEach(tab=>{let item=tab.parentElement;while(item&&item!==row){item.classList.add('bsp-search-tab-shell');['background','background-image','border','box-shadow'].forEach(property=>item.style.setProperty(property,property==='background'?'transparent':'none','important'));item=item.parentElement;}});
   }
  }

  root.querySelectorAll('label').forEach(label=>{
   let group=label.parentElement;
   if(group&&group!==root&&group.querySelectorAll('label').length===1&&group.querySelector('input,select,textarea'))group.classList.add('bsp-search-field-group');
  });
  root.querySelectorAll('input[type="submit"]').forEach(input=>{
   if(input.value&&input.value.trim().toLowerCase()==='send message'){input.value='Send inquiry';input.classList.add('bsp-detail-submit');}
  });
  root.querySelectorAll('form[id*="contact" i],form[id*="moreinfo" i]').forEach(form=>form.classList.add('bsp-details-inquiry'));
  root.querySelectorAll('a[href^="mailto:"]').forEach(link=>{
   if(!/gharibyar61@gmail\.com/i.test(link.getAttribute('href')||''))return;
   let block=link.parentElement;
   while(block&&block!==root){
    if(/917[- .]?5595|722[- .]?5144/.test(block.textContent)){block.classList.add('bsp-agent-contact');break;}
    block=block.parentElement;
   }
  });
 }
 styleActions();
 if(typeof MutationObserver==='function')new MutationObserver(styleActions).observe(root,{childList:true,subtree:true});
})();

/* Normalize ALL visible IDX phones 925-917-5595 → (925) 722-5144 (CRM number). */
(()=>{'use strict';
 const GOOD_DISPLAY='(925) 722-5144';
 const GOOD_TEL='+19257225144';
 const GOOD_DIGITS='9257225144';
 const BAD_DIGITS='9259175595';
 /* Match every common formatting of the bad number */
 const BAD_RE=/\(?\s*9\s*2\s*5\s*\)?\s*[-./\s]*\s*9\s*1\s*7\s*[-./\s]*\s*5\s*5\s*9\s*5/gi;
 const WELCOME_RE=/TEST\s*ONLY|Not you\?|Welcome,\s*.{0,100}Saved Search/i;
 let scheduled=false;

 function digits(s){return String(s||'').replace(/\D/g,'');}
 function isBadPhone(s){
  const d=digits(s);
  return d===BAD_DIGITS || d.endsWith(BAD_DIGITS) || d.includes(BAD_DIGITS);
 }
 function fixHref(el){
  const href=el.getAttribute('href')||'';
  if(!/^tel:/i.test(href)) return;
  if(isBadPhone(href)){
   el.setAttribute('href','tel:'+GOOD_TEL);
   const t=(el.textContent||'').trim();
   if(!t || isBadPhone(t) || /917/.test(t)) el.textContent=GOOD_DISPLAY;
  }
 }
 function fixTextNode(node){
  const v=node.nodeValue||'';
  if(!v || !/9\s*1\s*7|917/.test(v)) return;
  if(BAD_RE.test(v)){
   BAD_RE.lastIndex=0;
   node.nodeValue=v.replace(BAD_RE,GOOD_DISPLAY);
  }else{
   BAD_RE.lastIndex=0;
  }
 }
 function fixAttrs(el){
  for(const attr of ['title','aria-label','data-phone','data-agent-phone','value','placeholder','content']){
   if(!el.hasAttribute?.(attr)) continue;
   const v=el.getAttribute(attr);
   if(v && isBadPhone(v)){
    el.setAttribute(attr, attr.startsWith('data') || attr==='value' ? GOOD_TEL : GOOD_DISPLAY);
   }else if(v && BAD_RE.test(v)){
    BAD_RE.lastIndex=0;
    el.setAttribute(attr, v.replace(BAD_RE, GOOD_DISPLAY));
   }else{
    BAD_RE.lastIndex=0;
   }
 }
 }
 function scrubWelcome(el){
  if(el.nodeType!==1) return;
  if(el.classList?.contains('bsp-hide-lead-welcome')) return;
  const t=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(!t || t.length>200) return;
  if(WELCOME_RE.test(t) || (/Welcome,/i.test(t) && /Not you/i.test(t))){
   el.classList.add('bsp-hide-lead-welcome');
   el.setAttribute('hidden','');
   el.style.setProperty('display','none','important');
  }
 }
 function walk(node){
  if(!node) return;
  if(node.nodeType===Node.TEXT_NODE){ fixTextNode(node); return; }
  if(node.nodeType!==Node.ELEMENT_NODE) return;
  const tag=(node.tagName||'').toLowerCase();
  if(tag==='script'||tag==='style'||tag==='noscript') return;
  if(node.matches?.('a[href^="tel:"],a[href^="TEL:"]')) fixHref(node);
  fixAttrs(node);
  scrubWelcome(node);
  const kids=node.childNodes;
  for(let i=0;i<kids.length;i++) walk(kids[i]);
 }
 function run(){
  walk(document.body||document.documentElement);
  /* Also force agent phone anchors IDX uses */
  document.querySelectorAll('a.IDX-contact__agentPhone, a[href*="917"], [class*="agentPhone" i], #IDX-contactPhone2').forEach(el=>{
   if(el.matches?.('a[href^="tel:"]')) fixHref(el);
   if(isBadPhone(el.textContent||'')) el.textContent=GOOD_DISPLAY;
   walk(el);
  });
 }
 function schedule(){
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{ scheduled=false; try{run();}catch(e){} });
 }
 run();
 document.addEventListener('DOMContentLoaded', schedule);
 window.addEventListener('load', schedule);
 if(typeof MutationObserver==='function'){
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','title','aria-label','value']});
 }
 /* Late IDX ajax / map popups */
 setInterval(schedule, 1500);
})();

/* IDX signup → Brokerage OS via /api/leads (IDX vault still saves first). */
(()=>{'use strict';
 const LEAD_API='https://blackstonesignatureproperty.com/api/leads';
 const sent=new Set();
 let lastFields=null;

 function readSignupFields(form){
  if(!form) return null;
  const get=name=>{
   const el=form.querySelector('[name="'+name+'"]');
   return el ? String(el.value||'').trim() : '';
  };
  const first=get('firstName'), last=get('lastName');
  const name=[first,last].filter(Boolean).join(' ').trim();
  const email=get('email');
  const phone=get('phone');
  if(!email && !phone) return null;
  return {
   name: name || 'IDX Registrant',
   email,
   phone,
   firstName:first,
   lastName:last,
   listingID:get('listingID'),
   idxID:get('idxID'),
   leadCapturedPage:get('leadCapturedPage') || location.href
  };
 }

 function fingerprint(f){
  return [String(f.email||'').toLowerCase(), String(f.phone||'').replace(/\D/g,''), String(f.name||'').toLowerCase()].join('|');
 }

 function forwardToCrm(fields, meta){
  if(!fields) return;
  const fp=fingerprint(fields);
  if(!fp || fp==='||') return;
  try{
   const key='bsp-idx-lead:'+fp;
   if(sessionStorage.getItem(key)==='1') return;
   if(sent.has(fp)) return;
   sent.add(fp);
   sessionStorage.setItem(key,'1');
  }catch(_){ if(sent.has(fp)) return; sent.add(fp); }

  const listingBit=fields.listingID ? (' Listing '+fields.listingID) : '';
  const body={
   name: fields.name,
   email: fields.email || '',
   phone: fields.phone || '',
   lead_type: 'buyer',
   message: 'IDX Broker registration / sign-up.'+listingBit,
   page: location.pathname + location.search,
   source: 'idx-signup',
   consent_to_contact: true,
   city: '',
   property_address: '',
   motivation: meta || 'IDX sign-up popup'
  };
  // Fire-and-forget: never block or undo IDX's own usersignup.php success.
  fetch(LEAD_API,{
   method:'POST',
   mode:'cors',
   credentials:'omit',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(body)
  }).catch(()=>{});
 }

 function looksSuccessful(xhr, settings){
  const url=String((settings&&settings.url)||'');
  if(!/usersignup\.php/i.test(url)) return false;
  if(xhr && xhr.status && xhr.status>=400) return false;
  const raw=xhr && (xhr.responseText||xhr.response||'');
  if(!raw) return true; // treat 2xx empty as ok; IDX usually returns JSON
  try{
   const data=typeof raw==='string' ? JSON.parse(raw) : raw;
   if(data && typeof data==='object'){
    const st=String(data.status||data.result||data.message||'').toLowerCase();
    if(st.includes('fail')||st.includes('error')||data.success===false||data.ok===false) return false;
    if(data.status==='success'||data.success===true||data.ok===true||st.includes('success')||st.includes('thank')) return true;
    // Unknown JSON shape with 2xx — still forward (IDX already accepted the lead).
    return !data.error;
   }
  }catch(_){
   const t=String(raw).toLowerCase();
   if(/error|fail|invalid|already/.test(t) && !/success|thank|welcome/.test(t)) return false;
   if(/success|thank|welcome|registered|logged/.test(t)) return true;
  }
  return xhr && xhr.status>=200 && xhr.status<300;
 }

 function hookJquery(){
  const $=window.idx || window.jQuery || window.$;
  if(!$ || !$.fn) return false;
  $(document).on('submit','#IDX-signupForm',function(){
   lastFields=readSignupFields(this);
  });
  $(document).ajaxComplete(function(_ev, xhr, settings){
   if(!looksSuccessful(xhr, settings)) return;
   const form=document.getElementById('IDX-signupForm');
   const fields=readSignupFields(form) || lastFields;
   forwardToCrm(fields, 'idx ajaxComplete usersignup');
  });
  return true;
 }

 function hookFetch(){
  if(typeof window.fetch!=='function' || window.fetch.__bspIdxLead) return;
  const orig=window.fetch.bind(window);
  function wrapped(input, init){
   const url=typeof input==='string' ? input : (input && input.url) || '';
   const isSignup=/usersignup\.php/i.test(url);
   if(isSignup){
    const form=document.getElementById('IDX-signupForm');
    lastFields=readSignupFields(form) || lastFields;
   }
   return orig(input, init).then(res=>{
    if(isSignup && res && res.ok){
     try{
      const clone=res.clone();
      clone.text().then(text=>{
       const fake={status:res.status, responseText:text};
       if(looksSuccessful(fake,{url})) forwardToCrm(lastFields || readSignupFields(document.getElementById('IDX-signupForm')), 'idx fetch usersignup');
      }).catch(()=>{});
     }catch(_){}
    }
    return res;
   });
  }
  wrapped.__bspIdxLead=true;
  window.fetch=wrapped;
 }

 function hookXHR(){
  if(XMLHttpRequest.prototype.__bspIdxLead) return;
  const open=XMLHttpRequest.prototype.open;
  const send=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url){
   this.__bspUrl=url;
   return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send=function(body){
   if(/usersignup\.php/i.test(String(this.__bspUrl||''))){
    lastFields=readSignupFields(document.getElementById('IDX-signupForm')) || lastFields;
    this.addEventListener('load',()=>{
     if(looksSuccessful(this,{url:this.__bspUrl})) forwardToCrm(lastFields, 'idx xhr usersignup');
    });
   }
   return send.apply(this, arguments);
  };
  XMLHttpRequest.prototype.__bspIdxLead=true;
 }

 function boot(){
  hookXHR();
  hookFetch();
  if(!hookJquery()){
   let n=0;
   const t=setInterval(()=>{ if(hookJquery()||++n>40) clearInterval(t); }, 250);
  }
 }
 boot();
 document.addEventListener('DOMContentLoaded', boot);
})();
