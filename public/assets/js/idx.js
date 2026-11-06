/* IDX owns rendering. Never hide its widget based on a timer or DOM guesses. */
(()=>{'use strict';
  const box=document.getElementById('idx-widget'),status=document.getElementById('idx-status');
  if(!box||!status)return;
  box.hidden=false;
  status.textContent='MLS search provided by IDX Broker';
  const expand=document.getElementById('idx-expand'),panel=document.getElementById('idx');
  if(expand&&panel){
    const setExpanded=on=>{
      document.body.classList.toggle('idx-expanded',on);
      expand.setAttribute('aria-expanded',String(on));
      expand.textContent=on?'Close enlarged search':'Enlarge MLS search';
      requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
    };
    expand.addEventListener('click',()=>setExpanded(expand.getAttribute('aria-expanded')!=='true'));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expand.getAttribute('aria-expanded')==='true'){setExpanded(false);expand.focus();}});
    document.addEventListener('focusin',event=>{if(expand.getAttribute('aria-expanded')==='true'&&!panel.contains(event.target))expand.focus();});
  }
  const script=document.getElementById('idxwidgetsrc-180514');
  if(script)script.addEventListener('error',()=>{
    status.textContent='IDX script could not load. Refresh to try again.';
  });
})();
