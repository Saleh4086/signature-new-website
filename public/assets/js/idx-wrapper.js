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

/* Slim Blackstone mark + clickable phone beside the listing photo (detail and photo gallery). */
(()=>{'use strict';
 const HOME='https://blackstonesignatureproperty.com/';
 const LOGO='https://blackstonesignatureproperty.com/assets/logo-mark.png';
 const TEL='tel:+19257225144';
 const PHONE='(925) 722-5144';
 let scheduled=false;

 function brandBar(){
  const el=document.createElement('div');
  el.className='bsp-photo-brand';
  el.setAttribute('role','group');
  el.setAttribute('aria-label','Blackstone Signature Properties');
  el.innerHTML=
   '<a class="bsp-photo-brand__home" href="'+HOME+'">'+
    '<img src="'+LOGO+'" alt="" width="32" height="36">'+
    '<span><b>BLACKSTONE</b><small>Signature Properties</small></span>'+
   '</a>'+
   '<a class="bsp-photo-brand__phone" href="'+TEL+'">'+
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 3.8c.4-.4 1-.5 1.5-.3l2.2.9c.5.2.9.7.9 1.3l-.2 2.4c0 .5-.3 1-.8 1.2l-1.3.6a12.6 12.6 0 0 0 5.8 5.8l.6-1.3c.2-.5.7-.8 1.2-.8l2.4-.2c.6 0 1.1.4 1.3.9l.9 2.2c.2.5.1 1.1-.3 1.5l-1.5 1.5c-.4.4-1 .6-1.6.5C10.4 19.2 4.8 13.6 4.1 6.9c-.1-.6.1-1.2.5-1.6l2-1.5z"/></svg>'+
    '<span>'+PHONE+'</span>'+
   '</a>';
  return el;
 }

 function slot(){
  if(/\/idx\/details\//.test(location.pathname)){
   const photo=document.getElementById('IDX-primaryPhoto');
   if(photo) return {node:photo, position:'afterend'};
  }
  if(/\/idx\/photogallery\//.test(location.pathname)){
   const header=document.getElementById('IDX-photoGalleryHeader');
   if(header) return {node:header, position:'afterend'};
   const gallery=document.getElementById('IDX-photoGallery');
   if(gallery) return {node:gallery, position:'afterbegin'};
  }
  return null;
 }

 function place(){
  const target=slot();
  const current=document.querySelector('#blackstone-idx-content .bsp-photo-brand, .bsp-photo-brand');
  if(!target){
   if(current && current.parentElement) current.remove();
   return;
  }
  const placed=target.position==='afterend'
   ? target.node.nextElementSibling===current
   : target.node.firstElementChild===current;
  if(current && placed) return;
  const el=current||brandBar();
  target.node.insertAdjacentElement(target.position, el);
 }

 function schedule(){
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false; try{place();}catch(e){}});
 }
 schedule();
 document.addEventListener('DOMContentLoaded', schedule);
 window.addEventListener('load', schedule);
 const root=document.getElementById('blackstone-idx-content')||document.body;
 if(root && typeof MutationObserver==='function'){
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 }
})();

/* Map search: photo card on a single pin, phone map fitted under our header.
   Clusters stay on IDX (zoom, and spiderfy at max zoom). If listing data or Leaflet
   is missing, the original pin click is left alone. */
(()=>{'use strict';
 if(window.__bspMapPins) return;
 window.__bspMapPins=true;
 const PHONE='(max-width:820px)';
 const LISTING_KEYS=['CurrentListings','ActiveListings','FeaturedListings','SupplementalListings','SoldPendingListings','FeaturedSoldPendingListings','InitialListings'];
 let leafletMap=null;
 let probing=false;
 let queued=false;
 let opening=false;

 function isMapPage(){return /\/idx\/map\//.test(location.pathname);}
 function phone(){
  if(window.matchMedia) return window.matchMedia(PHONE).matches;
  return window.innerWidth<=820;
 }
 function point(x,y){
  const L=window.L;
  return L&&L.point?L.point(x,y):[x,y];
 }

 function listingStore(){
  try{
   const root=document.getElementById('IDX-searchPageWrapper');
   const app=root&&root.__vue_app__;
   const pinia=app&&app.config&&app.config.globalProperties&&app.config.globalProperties.$pinia;
   return pinia&&pinia._s&&pinia._s.get&&pinia._s.get('listing');
  }catch(e){return null;}
 }
 function findInStore(idxID,listingID){
  const store=listingStore();
  if(!store) return null;
  const id=String(listingID), idx=String(idxID||'');
  for(const key of LISTING_KEYS){
   const rows=store[key];
   if(!Array.isArray(rows)) continue;
   const hit=rows.find(row=>row&&String(row.listingID)===id&&(!idx||String(row.idxID)===idx));
   if(hit) return hit;
  }
  return null;
 }
 function textOf(card,sel){
  const node=card.querySelector(sel);
  return node?node.textContent.replace(/\s+/g,' ').trim():'';
 }
 function findInDom(idxID,listingID){
  const id=String(listingID), idx=String(idxID||'');
  const links=document.querySelectorAll('a[href*="/idx/details/"]');
  for(const link of links){
   const href=link.href||'';
   if(!href.includes('/'+id)) continue;
   if(idx&&!href.includes('/'+idx+'/')) continue;
   const card=link.closest('.listing-card__parent, .listing-card__wrap, article');
   if(!card) continue;
   const img=card.querySelector('img.listing-card__image');
   return {
    listingPrice:textOf(card,'.listing-card__listing-price')||textOf(card,'.listing-card__price'),
    address:textOf(card,'.listing-card__address'),
    bedrooms:textOf(card,'.listing-card__bedrooms'),
    totalBaths:textOf(card,'.listing-card__total-baths'),
    sqFt:textOf(card,'.listing-card__sqft'),
    acres:textOf(card,'.listing-card__acres'),
    primaryPhoto:img&&(img.currentSrc||img.src)||'',
    detailsURL:href,
    propStatus:textOf(card,'.listing-card__prop-status'),
    displayAddress:'y',
    listingID:id,
    idxID:idx
   };
  }
  return null;
 }
 function safeHttp(raw,idxOnly){
  try{
   const url=new URL(String(raw||''),location.href);
   if(url.protocol!=='https:'&&url.protocol!=='http:') return '';
   if(idxOnly){
    const host=url.hostname;
    if(host!==location.hostname&&host!=='idxbroker.com'&&!/\.idxbroker\.com$/i.test(host)) return '';
   }
   return url.href;
  }catch(e){return '';}
 }
 function photoFromImage(image){
  if(!image) return '';
  if(typeof image==='string') return safeHttp(image);
  if(typeof image!=='object') return '';
  const direct=safeHttp(image.url);
  if(direct) return direct;
  const first=image[1]||image['1'];
  const nested=first&&(first.url||(first.urls&&first.urls.hires&&first.urls.hires.url));
  return safeHttp(nested);
 }
 function photoOf(row){
  if(!row) return '';
  return safeHttp(row.primaryPhoto)||photoFromImage(row.photo)||photoFromImage(row.image);
 }
 function leadingNum(value){
  if(typeof value==='number') return Number.isFinite(value)?value:0;
  const match=String(value||'').replace(/,/g,'').match(/-?\d+(\.\d+)?/);
  return match?Number(match[0]):0;
 }
 function money(row){
  const labeled=row&&row.listingPrice!=null?String(row.listingPrice).trim():'';
  if(labeled&&/\$/.test(labeled)) return labeled;
  const amount=leadingNum(labeled||(row&&row.price));
  if(amount>0) return amount.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  return '';
 }
 function metaLine(row){
  const parts=[];
  const beds=leadingNum(row.bedrooms!=null?row.bedrooms:row.beds);
  const baths=leadingNum(row.totalBaths!=null?row.totalBaths:row.baths);
  if(beds>0) parts.push((Number.isInteger(beds)?String(beds):String(beds))+' bd');
  if(baths>0) parts.push((Number.isInteger(baths)?String(baths):String(Math.round(baths*10)/10))+' ba');
  const sq=leadingNum(row.sqFt!=null?row.sqFt:row.sqft);
  if(sq>0) parts.push(sq.toLocaleString('en-US')+' sqft');
  if(!parts.length&&row.acres){
   const raw=String(row.acres).trim();
   if(leadingNum(raw)>0) parts.push(/acre/i.test(raw)?raw:raw+' acres');
  }
  return parts.join(' | ');
 }
 function addressFromUrl(url){
  try{
   const slug=decodeURIComponent(new URL(url,location.href).pathname.split('/').filter(Boolean).pop()||'');
   if(!/\d{5}$/.test(slug)||slug.length<8) return [];
   let text=slug.replace(/-/g,' ');
   text=text.replace(/\b([a-z])/g,ch=>ch.toUpperCase());
   text=text.replace(/\s([A-Za-z]{2})\s(\d{5})$/,(all,st,zip)=>', '+st.toUpperCase()+' '+zip);
   return [text];
  }catch(e){return [];}
 }
 function addressLines(row){
  const hideStreet=String(row.displayAddress||'y').toLowerCase()==='n';
  const region=[row.cityName,[row.stateAbrv||row.state,row.zipcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if(hideStreet) return region?[region]:[];
  const street=String(row.address||[row.streetNumber,row.streetName].filter(Boolean).join(' ')).trim();
  if(street&&row.cityName&&street.toLowerCase().includes(String(row.cityName).toLowerCase())) return [street];
  return [street,region].filter(Boolean);
 }
 function listingFrom(props){
  const stored=findInStore(props.idxID,props.listingID)||findInDom(props.idxID,props.listingID);
  const row=stored||{
   listingPrice:props.price,
   price:props.price,
   photo:props.photo,
   bedrooms:props.beds,
   totalBaths:props.baths,
   sqFt:props.sqft,
   detailsURL:props.detailsURL,
   propStatus:props.propertyStatus,
   displayAddress:'y',
   listingID:props.listingID,
   idxID:props.idxID
  };
  const lines=addressLines(row);
  const data={
   price:money(row),
   meta:metaLine(row),
   lines,
   photo:photoOf(row),
   url:safeHttp(row.detailsURL,true),
   status:String(row.propStatus||'').replace(/\s+/g,' ').trim().slice(0,24),
   id:String(props.listingID||'')
  };
  if(!data.lines.length&&data.url) data.lines=addressFromUrl(data.url);
  if(!data.price&&!data.lines.length&&!data.photo&&!data.url) return null;
  return data;
 }

 function el(tag,className){
  const node=document.createElement(tag);
  if(className) node.className=className;
  return node;
 }
 function cardElement(data){
  const card=el('article','bsp-pin-card');
  card.dataset.listingId=data.id;
  const media=el('div','bsp-pin-card__media');
  const photo=el('a','bsp-pin-card__photo');
  if(data.url) photo.href=data.url;
  else photo.removeAttribute('href');
  if(data.photo){
   const img=document.createElement('img');
   img.alt=data.lines[0]?data.lines[0]+' photo':'Listing photo';
   img.draggable=false;
   img.src=data.photo;
   img.addEventListener('error',()=>{
    img.remove();
    photo.classList.add('is-empty');
    photo.appendChild(document.createTextNode('No photo'));
   });
   photo.appendChild(img);
  }else{
   photo.classList.add('is-empty');
   photo.appendChild(document.createTextNode('No photo'));
  }
  media.appendChild(photo);
  if(data.status){
   const status=el('span','bsp-pin-card__status');
   status.textContent=data.status;
   media.appendChild(status);
  }
  card.appendChild(media);
  const body=el('div','bsp-pin-card__body');
  if(data.price){
   const price=el('p','bsp-pin-card__price');
   price.textContent=data.price;
   body.appendChild(price);
  }
  if(data.meta){
   const meta=el('p','bsp-pin-card__meta');
   meta.textContent=data.meta;
   body.appendChild(meta);
  }
  if(data.lines.length){
   const address=el(data.url?'a':'p','bsp-pin-card__address');
   if(data.url) address.href=data.url;
   data.lines.forEach((line,index)=>{
    if(index) address.appendChild(document.createElement('br'));
    address.appendChild(document.createTextNode(line));
   });
   body.appendChild(address);
  }
  if(data.url){
   const cta=el('a','bsp-pin-card__cta');
   cta.href=data.url;
   cta.textContent='View listing';
   body.appendChild(cta);
  }
  card.appendChild(body);
  return card;
 }

 function controlPads(map){
  const mapEl=map.getContainer&&map.getContainer();
  const box=mapEl&&mapEl.getBoundingClientRect();
  let left=12, right=12;
  if(!box) return {left,right};
  mapEl.querySelectorAll('.leaflet-control').forEach(el=>{
   if(el.classList.contains('leaflet-control-attribution')) return;
   const b=el.getBoundingClientRect();
   if(b.width<8||b.height<8) return;
   if((b.left+b.right)/2<box.left+box.width/2) left=Math.max(left,Math.ceil(b.right-box.left+12));
   else right=Math.max(right,Math.ceil(box.right-b.left+12));
  });
  return {left,right};
 }
 function nudge(map,popup){
  const mapEl=map.getContainer&&map.getContainer();
  const popEl=popup.getElement&&popup.getElement();
  if(!mapEl||!popEl||!map.panBy) return;
  const mapBox=mapEl.getBoundingClientRect();
  if(popEl.getBoundingClientRect().height>mapBox.height-12) popEl.classList.add('bsp-pin-popup--compact');
  const box=popEl.getBoundingClientRect();
  const pad=8;
  let dx=0, dy=0;
  if(box.left<mapBox.left+pad) dx=box.left-(mapBox.left+pad);
  else if(box.right>mapBox.right-pad) dx=box.right-(mapBox.right-pad);
  if(box.top<mapBox.top+pad) dy=box.top-(mapBox.top+pad);
  else if(box.bottom>mapBox.bottom-pad) dy=box.bottom-(mapBox.bottom-pad);
  mapEl.querySelectorAll('.leaflet-control').forEach(el=>{
   if(el.classList.contains('leaflet-control-attribution')) return;
   const c=el.getBoundingClientRect();
   if(c.width<8||c.height<8) return;
   const hits=!(box.right<c.left||box.left>c.right||box.bottom<c.top||box.top>c.bottom);
   if(!hits) return;
   if((c.left+c.right)/2<mapBox.left+mapBox.width/2) dx=Math.min(dx, box.left-(c.right+10));
   else dx=Math.max(dx, box.right-(c.left-10));
  });
  if(dx||dy) map.panBy([dx,dy],{animate:false});
  const shown=popEl.getBoundingClientRect();
  let sy=0;
  if(shown.top<pad) sy=shown.top-pad;
  else if(shown.bottom>window.innerHeight-pad) sy=shown.bottom-(window.innerHeight-pad);
  if(Math.abs(sy)>2) window.scrollBy(0,sy);
 }
 function openCard(marker){
  if(opening) return false;
  const L=window.L;
  const props=marker.feature&&marker.feature.properties;
  if(!L||!L.popup||!props||!props.listingID) return false;
  if(typeof marker.getChildCount==='function') return false;
  if(marker._icon&&marker._icon.classList&&marker._icon.classList.contains('marker-cluster')) return false;
  const map=marker._map||leafletMap;
  if(!map||typeof marker.getLatLng!=='function') return false;
  const data=listingFrom(props);
  if(!data) return false;
  opening=true;
  const size=map.getSize?map.getSize():{x:360,y:400};
  const pads=controlPads(map);
  const maxWidth=Math.max(188,Math.min(248,size.x-pads.left-pads.right-8));
  const popup=L.popup({
   className:'bsp-pin-popup',
   autoPan:true,
   keepInView:false,
   autoPanPaddingTopLeft:point(pads.left,12),
   autoPanPaddingBottomRight:point(pads.right,12),
   maxWidth,
   minWidth:maxWidth,
   closeButton:true,
   autoClose:true,
   closeOnEscapeKey:true,
   closeOnClick:true,
   offset:point(0,-30)
  });
  const node=cardElement(data);
  node.style.width=Math.round(maxWidth)+'px';
  popup.setLatLng(marker.getLatLng()).setContent(node);
  try{
   popup.openOn(map);
  }finally{
   opening=false;
  }
  requestAnimationFrame(()=>nudge(map,popup));
  setTimeout(()=>nudge(map,popup),350);
  return true;
 }

 function hookLeaflet(){
  const L=window.L;
  if(!L||!L.Evented||!L.Map||!L.Evented.prototype||!L.Map.prototype) return false;
  if(!L.Evented.prototype.fire.__bsp){
   const origFire=L.Evented.prototype.fire;
   function fire(type){
    try{
     if(type==='click'&&this&&this.feature&&this.feature.properties&&this.feature.properties.listingID){
      if(openCard(this)) return this;
     }
    }catch(e){}
    return origFire.apply(this,arguments);
   }
   fire.__bsp=true;
   L.Evented.prototype.fire=fire;
  }
  if(!L.Map.prototype.invalidateSize.__bsp){
   const origSize=L.Map.prototype.invalidateSize;
   function invalidateSize(){
    leafletMap=this;
    return origSize.apply(this,arguments);
   }
   invalidateSize.__bsp=true;
   L.Map.prototype.invalidateSize=invalidateSize;
  }
  return true;
 }
 function invalidateMap(){
  if(leafletMap&&typeof leafletMap.invalidateSize==='function'){
   try{leafletMap.invalidateSize({animate:false,pan:false});}catch(e){}
   return;
  }
  if(probing) return;
  probing=true;
  try{window.dispatchEvent(new Event('resize'));}catch(e){}
  probing=false;
 }
 function navCovered(){
  const root=document.getElementById('blackstone-idx-content')||document;
  const labels=new Set();
  root.querySelectorAll('a,button').forEach(node=>{
   const label=(node.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
   if(/^(advanced search|listing id|address|map search)$/.test(label)) labels.add(label);
  });
  return labels.size>=4;
 }
 function hideNav(){
  const hide=isMapPage()&&phone()&&navCovered();
  document.querySelectorAll('.idx-nav-button-container-mobile').forEach(node=>{
   node.classList.toggle('bsp-hide-map-nav-select',hide);
  });
 }
 function fitMap(){
  if(!isMapPage()) return;
  const root=document.documentElement;
  const mapEl=document.getElementById('prime-map-search--map');
  const filter=document.getElementById('prime-map-search--filter-bar');
  if(!phone()||!mapEl||!filter){
   document.body.classList.remove('bsp-map-fit');
   root.style.removeProperty('--bsp-map-h');
   if(mapEl) invalidateMap();
   return;
  }
  const scrollY=window.scrollY||document.documentElement.scrollTop||0;
  const filterBottom=filter.getBoundingClientRect().bottom+scrollY;
  const mapTop=mapEl.getBoundingClientRect().top+scrollY;
  const gap=Math.max(0,Math.min(40,mapTop-filterBottom));
  const height=Math.floor(window.innerHeight-filterBottom-gap-72);
  if(height<260){
   document.body.classList.remove('bsp-map-fit');
   root.style.removeProperty('--bsp-map-h');
   return;
  }
  root.style.setProperty('--bsp-map-h',height+'px');
  document.body.classList.add('bsp-map-fit');
  invalidateMap();
 }
 function watchNode(node){
  if(!node||node.__bspWatch||typeof MutationObserver!=='function') return;
  node.__bspWatch=true;
  new MutationObserver(queue).observe(node,{childList:true,subtree:true});
 }
 function refresh(){
  if(!isMapPage()) return;
  document.body.classList.add('bsp-native-map');
  hookLeaflet();
  hideNav();
  watchNode(document.getElementById('navigation-container'));
  document.querySelectorAll('.idx-nav-button-container-mobile').forEach(node=>watchNode(node.parentElement));
  const filter=document.getElementById('prime-map-search--filter-bar');
  if(filter&&typeof ResizeObserver==='function'){
   if(!refresh.ro) refresh.ro=new ResizeObserver(queue);
   if(!filter.__bspFit){filter.__bspFit=true; refresh.ro.observe(filter);}
  }
  fitMap();
 }
 function queue(){
  if(queued) return;
  queued=true;
  requestAnimationFrame(()=>{queued=false; try{refresh();}catch(e){}});
 }

 queue();
 document.addEventListener('DOMContentLoaded',queue);
 window.addEventListener('load',queue);
 window.addEventListener('resize',()=>{if(!probing) queue();});
 window.addEventListener('orientationchange',queue);
 if(window.visualViewport) window.visualViewport.addEventListener('resize',queue);
 let tries=0;
 const boot=setInterval(()=>{
  tries+=1;
  queue();
  if(!isMapPage()||tries>24||(leafletMap&&(!phone()||document.body.classList.contains('bsp-map-fit')))) clearInterval(boot);
 },400);
})();
