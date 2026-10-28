/* Sal's own listings as cards (home page "Featured listings", Property management "Available rentals").
   Data comes from listings.js (window.BSP_READY / BSP_SAMPLES, fed by /api/listings).
   <div data-own-listings="all|rental" data-empty="hide|rentals"></div> */
(function(){
  const NOPHOTO='assets/img/no-photo.svg';
  const unesc=t=>String(t||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clip=(t,n)=>{const x=unesc(t);return x.length>n?x.slice(0,n).replace(/\s+\S*$/,'')+'…':x};
  const spec=l=>[l.beds?l.beds+' bd':'',l.baths?l.baths+' ba':'',l.sqft?l.sqft.toLocaleString()+' sq ft':''].filter(Boolean).join(' · ');
  const ORDER={'rental':0,'for-sale':1,'pending':2,'sold':3};
  function card(l){
    const home=encodeURIComponent(unesc(l.title)), rent=l.status==='rental', ph=(l.photos&&l.photos.length?l.photos:[NOPHOTO]);
    const full=unesc(l.meta), short=clip(l.meta,170);
    let c='';
    if(rent){c+=(l.apply?'<a class="btn btn-gold" href="'+esc(l.apply)+'" target="_blank" rel="noopener">Apply Now</a>':'')+'<a class="btn '+(l.apply?'btn-ghost':'btn-gold')+'" href="contact.html?topic=Renting&amp;home='+home+'">Ask about this rental</a>'}
    else c+='<a class="btn btn-gold" href="contact.html?topic=Buying&amp;home='+home+'">Ask Sal about this home</a>';
    if(l.link)c+='<a class="btn btn-ghost" href="'+esc(l.link)+'" target="_blank" rel="noopener">View property</a>';
    return '<article class="olcard" id="listing-'+l.id+'"><div class="ph"><img loading="lazy" src="'+esc(ph[0])+'" alt="'+esc(unesc(l.title))+'" data-fb>'+
      '<span class="badge own st-'+l.status+'">'+l.badge+'</span>'+
      (ph.length>1?'<button type="button" class="olnav prev" aria-label="Previous photo">‹</button><button type="button" class="olnav next" aria-label="Next photo">›</button><span class="olcount">1 / '+ph.length+'</span>':'')+
      '</div><div class="body"><div class="olprice">'+l.priceText+'</div>'+(spec(l)?'<div class="olspec">'+spec(l)+'</div>':'')+
      '<div class="oladdr">'+l.title+'</div>'+
      (full?(full.length>170?'<details class="oldesc"><summary><span class="s">'+esc(short)+'</span> <span class="more">Read more</span></summary><p>'+esc(full)+'</p></details>':'<p class="oldesc">'+esc(full)+'</p>'):'')+
      '<div class="btn-row">'+c+'</div></div></article>';
  }
  document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.hasAttribute('data-fb')&&!/no-photo\.svg$/.test(t.src))t.src=NOPHOTO},true);
  function run(){
    document.querySelectorAll('[data-own-listings]').forEach(box=>{
      const want=box.getAttribute('data-own-listings'), sec=box.closest('[data-own-section]')||box;
      const all=window.BSP_OWN?(window.BSP_SAMPLES||[]).filter(l=>l.own):[];
      const list=all.filter(l=>want==='rental'?l.status==='rental':true).sort((a,b)=>ORDER[a.status]-ORDER[b.status]).slice(0,want==='rental'?24:6);
      if(!list.length){
        if(box.getAttribute('data-empty')==='hide'){sec.hidden=true;return}
        box.innerHTML='<div class="olempty"><b>No rentals available right now.</b><p>New homes for rent are posted here first. Tell Sal what you are looking for and he will let you know when something opens up.</p><div class="btn-row"><a class="btn btn-gold" href="contact.html?topic=Renting">Ask about upcoming rentals</a></div></div>';return}
      sec.hidden=false; box.innerHTML=list.map(card).join('');
      const map=Object.fromEntries(list.map(l=>[String(l.id),l.photos||[]]));
      box.querySelectorAll('.olcard').forEach(el=>{const ps=map[el.id.replace('listing-','')];if(!ps||ps.length<2)return;let i=0;const im=el.querySelector('img'),ct=el.querySelector('.olcount');
        const go=d=>{i=(i+d+ps.length)%ps.length;im.src=ps[i];ct.textContent=(i+1)+' / '+ps.length};
        el.querySelector('.prev').addEventListener('click',()=>go(-1));el.querySelector('.next').addEventListener('click',()=>go(1))});
      if(location.hash&&location.hash.indexOf('#listing-')===0){const t=document.querySelector(location.hash);t&&t.scrollIntoView()}
    });
  }
  (window.BSP_READY||Promise.resolve()).then(run);
})();
