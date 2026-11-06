/* Hosted MLS search remains usable independently of the optional widget.
   A widget element is not evidence of approved access or populated MLS results. */
(()=>{'use strict';
  const box=document.getElementById('idx-widget'),status=document.getElementById('idx-status');
  if(!box||!status)return;
  let timer,observer,failed=false;
  const message=text=>{status.textContent=text;};
  function stop(){clearTimeout(timer);if(observer)observer.disconnect();}
  function check(){
    if(failed)return;
    if(!box.querySelector('iframe,canvas,.leaflet-container,.mapboxgl-map,.gm-style'))return;
    clearTimeout(timer);box.hidden=false;const links=document.getElementById('idx-links');if(links)links.hidden=false;
    message('MLS map provided by IDX Broker.');
  }
  function unavailable(){
    failed=true;stop();box.hidden=true;
    message('The MLS map could not load. Please contact Sal for help with your search.');
  }
  if(typeof MutationObserver==='function'){
    observer=new MutationObserver(check);
    observer.observe(box,{childList:true,subtree:true});
  }
  const script=document.getElementById('idxwidgetsrc-180514');
  if(script)script.addEventListener('error',unavailable);
  timer=setTimeout(()=>{if(!box.querySelector('iframe,canvas,.leaflet-container,.mapboxgl-map,.gm-style'))unavailable();else{check();stop();}},12000);
  check();
})();
