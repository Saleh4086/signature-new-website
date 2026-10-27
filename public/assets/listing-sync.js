/* Listing Manager → website sync (Blackstone Signature Properties & Investments).
   Saves listings to the website server (PUT /api/listings, admin login required) so every visitor sees them.
   The whole list is saved each time (the server's storage can be up to a minute behind, so the editor keeps
   the authoritative copy). A backup copy stays in this browser (localStorage 'blackstone_custom_listings_v1'),
   and the first time this page opens it moves any listings saved only in this browser up to the website. */
(function(){
  var KEY='blackstone_custom_listings_v1', MIG='blackstone_listings_migrated_v1', VER='blackstone_listings_updated_v1', API='/api/listings';
  var form=document.getElementById('listingForm'), box=document.getElementById('managerListings');
  if(!form||!box)return;
  var server=null, updated=null, busy=false;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function label(s){return {'for-sale':'For Sale','pending':'Pending','sold':'Sold','rental':'For Rent'}[s]||s}
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
  function local(){try{var d=JSON.parse(ls(KEY)||'[]');return Array.isArray(d)?d.filter(function(x){return x&&typeof x==='object'&&String(x.address||'').trim()}):[]}catch(e){return []}}
  function newId(){return String(Date.now())+String(Math.floor(Math.random()*1000)).padStart(3,'0')}
  var note=document.createElement('p');note.className='notice';note.setAttribute('role','status');note.style.marginBottom='12px';
  box.parentNode.insertBefore(note,box);
  function say(t,bad){note.innerHTML=t;note.style.borderColor=bad?'#c0392b':''}
  function req(method,body){
    return fetch(API,{method:method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined})
      .then(function(r){return r.json().catch(function(){return {}}).then(function(d){if(!r.ok){var e=new Error(d.error||('Server error '+r.status));e.status=r.status;e.data=d;throw e}return d})});
  }
  function render(){
    var list=server||local();
    box.innerHTML=list.length?list.map(function(x){return '<div class="manager-item"><strong>'+esc(label(x.status))+' · '+esc(x.address)+'</strong><span>'+esc(x.price)+' '+esc(x.meta)+'</span><br><button type="button" data-del="'+esc(x.id)+'">Remove</button></div>'}).join(''):'<p>No custom properties added yet.</p>';
    box.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){remove(b.getAttribute('data-del'))}});
  }
  try{window.renderManager=render}catch(e){}
  function apply(d){server=d.listings||[];updated=d.updated||null;ls(KEY,JSON.stringify(server));if(updated)ls(VER,updated);render()}
  function save(list,okMsg){
    if(busy)return Promise.reject(new Error('Please wait for the last save to finish'));busy=true;
    return req('PUT',{listings:list,base:updated}).then(function(d){apply(d);say(okMsg)})
      .catch(function(e){if(e.status===409&&e.data&&e.data.listings){apply(e.data);say('<strong>Not saved:</strong> '+esc(e.message),true);return}throw e})
      .then(function(){busy=false},function(e){busy=false;throw e});
  }
  function fail(e){say('<strong>Not saved to the website:</strong> '+esc(e.message||'connection problem')+'. Please try again.',true)}
  function remove(id){
    if(!server){ls(KEY,JSON.stringify(local().filter(function(x){return String(x.id)!==String(id)})));render();return}
    if(!confirm('Remove this property from the website?'))return;
    save(server.filter(function(x){return String(x.id)!==String(id)}),'<strong>Removed.</strong> The website updates for visitors within about two minutes.').catch(fail);
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();e.stopImmediatePropagation();
    var g=function(id){var el=document.getElementById(id);return el?el.value:''};
    var item={id:newId(),status:g('lmStatus'),address:g('lmAddress'),price:g('lmPrice'),meta:g('lmMeta'),photo:g('lmPhoto'),url:g('lmUrl')};
    var btn=form.querySelector('[type=submit]');if(btn)btn.disabled=true;
    var go=server?save([item].concat(server),'<strong>Saved to the website.</strong> Visitors see it on Search Homes and the home page within about two minutes.').then(function(){form.reset()}):Promise.reject(new Error('website not connected'));
    go.catch(function(err){
        if(err.status===400){fail(err);return}
        var a=local();a.unshift(item);ls(KEY,JSON.stringify(a));ls(MIG,null);
        form.reset();render();say('<strong>Saved in this browser only</strong> ('+esc(err.message||'server not reachable')+'). It will be sent to the website automatically the next time this page opens.',true);
      }).then(function(){if(btn)btn.disabled=false});
  },true);
  var clear=document.getElementById('clearListings');
  if(clear)clear.onclick=function(){
    if(!server){if(confirm('Clear all custom property cards from this browser?')){ls(KEY,'[]');render()}return}
    if(!confirm('Remove ALL custom properties from the website?'))return;
    save([],'<strong>All custom properties removed from the website.</strong>').catch(fail);
  };
  say('Loading website listings…');
  req('GET').then(function(d){
    var mine=local(), lastSaved=ls(VER);
    // The server copy can be up to a minute old right after a save; this browser's newer copy wins then.
    if(lastSaved&&(!d.updated||lastSaved>d.updated))d={listings:mine,updated:lastSaved};
    var migrated=ls(MIG)==='1';
    server=d.listings||[];updated=d.updated||null;render();
    var have={};server.forEach(function(x){have[String(x.id)]=1;have['a:'+String(x.address||'').trim().toLowerCase()]=1});
    var extra=migrated?[]:mine.filter(function(x){return !have[String(x.id)]&&!have['a:'+String(x.address||'').trim().toLowerCase()]});
    if(!extra.length){ls(MIG,'1');ls(KEY,JSON.stringify(server));say('<strong>Connected.</strong> Listings you add or remove here save to the website for every visitor (updates show within about two minutes). A backup copy stays in this browser.');return}
    extra=extra.map(function(x){var y={};for(var k in x)y[k]=x[k];if(!/^[0-9A-Za-z_-]{1,40}$/.test(String(y.id||'')))y.id=newId();return y});
    return save(extra.concat(server),'<strong>Moved '+extra.length+' listing'+(extra.length===1?'':'s')+' from this browser to the website.</strong> Listings now save to the website for every visitor.').then(function(){ls(MIG,'1')});
  }).catch(function(e){server=null;render();say('<strong>Website listings could not be loaded or saved</strong> ('+esc(e.message)+'). Showing the copy saved in this browser; nothing was lost.',true)});
})();
