/* Header interactions only; leave IDX search and forms under IDX control. */
(()=>{'use strict';
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
