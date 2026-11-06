/* IDX owns rendering. Never hide its widget based on a timer or DOM guesses. */
(()=>{'use strict';
  const box=document.getElementById('idx-widget'),status=document.getElementById('idx-status');
  if(!box||!status)return;
  box.hidden=false;
  status.textContent='MLS search provided by IDX Broker';
  const script=document.getElementById('idxwidgetsrc-180514');
  if(script)script.addEventListener('error',()=>{
    status.textContent='IDX script could not load. Refresh to try again.';
  });
})();
