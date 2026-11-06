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
