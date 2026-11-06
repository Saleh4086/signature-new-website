/* Confine provider navigation to its frame; the main website stays on its own domain. */
(()=>{'use strict';
 const origin='https://blackstonesignatureproperty.idxbroker.com';
 const frame=document.getElementById('mls-frame'),status=document.getElementById('mls-status');
 let ready=false,pending=null;
 function setView(view){
   if(!['map','list'].includes(view))return;
   pending=view;
   if(ready&&frame.contentWindow)frame.contentWindow.postMessage({type:'bsp-idx-view',view},origin);
   else status.textContent='Search is loading. View selection will apply when ready.';
 }
 document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
 window.addEventListener('message',event=>{
   if(event.origin!==origin||event.source!==frame.contentWindow||!event.data||event.data.type!=='bsp-idx-ready')return;
   ready=true;status.textContent='MLS search provided by IDX Broker';
   const footer=document.querySelector('.bsp-idx-footer--compact');if(footer)footer.hidden=false;
   document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===event.data.view)));
   if(pending){const view=pending;pending=null;if(view!==event.data.view)setView(view);}
 });
 frame.addEventListener('load',()=>{ready=false;frame.contentWindow.postMessage({type:'bsp-idx-handshake'},origin);});
})();
