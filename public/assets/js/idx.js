/* IDX Broker status detection for Sal's widget #180514 (map search).
   The official embed <script id="idxwidgetsrc-180514"> sits inside #idx-widget. If IDX Broker renders
   anything there, we mark the feed live and reveal the hosted-search links; otherwise we keep the
   sample map and say the feed is pending approval. */
(()=>{'use strict';
  const box=document.getElementById('idx-widget'),st=document.getElementById('idx-status'),links=document.getElementById('idx-links');if(!box||!st)return;
  const rendered=()=>[...box.children].some(n=>n.tagName!=='SCRIPT'&&n.tagName!=='NOSCRIPT')||!!document.querySelector('[id^="IDX-"],[class*="IDX-"]');
  let done=false;
  function check(final){if(done)return;
    if(rendered()){done=true;st.className='idx-status live';st.textContent='● Live MLS feed via IDX Broker';links&&(links.hidden=false);document.documentElement.dataset.idx='live';return}
    if(final){done=true;st.textContent='● MLS feed pending IDX Broker approval';document.documentElement.dataset.idx='pending'}}
  new MutationObserver(()=>check(false)).observe(box,{childList:true,subtree:true});
  const s=document.getElementById('idxwidgetsrc-180514');s&&s.addEventListener('error',()=>check(true));
  addEventListener('load',()=>setTimeout(()=>check(true),4000));
  check(false);
})();
