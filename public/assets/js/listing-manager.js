/* Listing Manager (admin, behind the admin login). Saves Sal's listings to the website (PUT /api/listings)
   and uploads photos (POST /api/listing-photo). Photos are resized in the browser to max 1600 px before upload. */
(function(){
  const API='/api/listings', PH='/api/listing-photo', KEY='blackstone_custom_listings_v1', MAXP=12, MAXPX=1600;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LABEL={'for-sale':'For Sale','pending':'Pending','sold':'Sold','rental':'For Rent'};
  const NOT_IMG=/^https?:\/\/(?:photos\.app\.goo\.gl|goo\.gl|photos\.google\.com|drive\.google\.com\/(?:file|drive|open)|(?:www\.)?(?:zillow|redfin|realtor|trulia)\.com|(?:www\.)?dropbox\.com\/s(?:h|cl)?\/|1drv\.ms|onedrive\.live\.com|(?:www\.)?icloud\.com\/(?:photos|sharedalbum))/i;
  const isOwnPhoto=u=>/^\/api\/listing-photo\/[0-9A-Za-z_-]{8,64}$/.test(String(u||'').replace(location.origin,''));
  let list=[], updated=null, editing=null, photos=[], session=new Set(), busy=false, pin=null; // pin={lat,lng,addr,src:'auto'|'manual'}
  const form=$('#lm-form'), note=$('#lm-note'), box=$('#lm-list'), strip=$('#lm-photos'), up=$('#lm-files');
  const say=(t,bad)=>{note.innerHTML=t;note.className='lm-note'+(bad?' bad':' ok');note.hidden=!t};
  async function req(url,opt){const r=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},opt||{}));const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||('Server error '+r.status));e.status=r.status;e.data=d;throw e}return d}
  function setData(d){list=Array.isArray(d.listings)?d.listings:[];updated=d.updated||null;try{localStorage.setItem(KEY,JSON.stringify(list))}catch(_){}render()}
  async function load(){try{setData(await req(API))}catch(e){say('<b>Could not load listings:</b> '+esc(e.message),true)}}
  const pics=x=>(Array.isArray(x.photos)&&x.photos.length?x.photos:(x.photo?[x.photo]:[]));
  function render(){
    box.innerHTML=list.length?list.map((x,i)=>{const p=pics(x),cover=p.find(u=>!NOT_IMG.test(u));
      return '<div class="lm-item"><div class="lm-th">'+(cover?'<img src="'+esc(cover)+'" alt="">':'<span>No photo</span>')+'</div><div class="lm-tx"><b>'+esc(LABEL[x.status]||x.status)+' · '+esc(x.address)+'</b><small>'+esc(x.price||'')+' · '+p.length+' photo'+(p.length===1?'':'s')+(x.apply?' · apply link ✓':'')+(x.lat!=null&&x.lng!=null&&x.lat!==''?' · <em class="pinok">map pin ✓</em>':' · <em class="warn">map pin: community only, edit to place it</em>')+(p.some(u=>NOT_IMG.test(u))?' · <em class="warn">has a share link, not a photo</em>':'')+'</small></div>'+
      '<div class="lm-act"><button type="button" class="btn btn-ghost" data-edit="'+i+'">Edit</button><button type="button" class="btn btn-ghost" data-up="'+i+'"'+(i?'':' disabled')+' aria-label="Move up">↑</button><button type="button" class="btn btn-ghost danger" data-del="'+i+'">Remove</button></div></div>'}).join(''):'<p class="muted">No listings yet. Add your first one above.</p>';
  }
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.edit)return edit(+b.dataset.edit);
    if(b.dataset.up){const i=+b.dataset.up,a=list.slice();[a[i-1],a[i]]=[a[i],a[i-1]];return save(a,'<b>Order saved.</b>')}
    if(b.dataset.del){const i=+b.dataset.del,x=list[i];if(!confirm('Remove "'+x.address+'" from the website?'))return;const a=list.filter((_,j)=>j!==i);save(a,'<b>Removed.</b> It disappears from the website within about two minutes.',pics(x))}});
  function drawPhotos(){
    strip.innerHTML=photos.map((u,i)=>'<div class="lm-ph'+(NOT_IMG.test(u)?' bad':'')+'">'+(NOT_IMG.test(u)?'<span>Share link,<br>not a photo</span>':'<img src="'+esc(u)+'" alt="">')+(i===0?'<em>Cover</em>':'')+
      '<div class="lm-phb">'+(i?'<button type="button" data-l="'+i+'" aria-label="Move left">←</button><button type="button" data-c="'+i+'">Make cover</button>':'')+'<button type="button" data-x="'+i+'" aria-label="Remove photo">✕</button></div></div>').join('')||'<p class="muted">No photos yet.</p>';
    $('#lm-pcount').textContent=photos.length+' / '+MAXP;
  }
  strip.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+(b.dataset.l||b.dataset.c||b.dataset.x);
    if(b.dataset.l){[photos[i-1],photos[i]]=[photos[i],photos[i-1]]}else if(b.dataset.c){photos.unshift(photos.splice(i,1)[0])}else if(b.dataset.x){photos.splice(i,1)}drawPhotos()});
  function blob(c,type,q){return new Promise(r=>c.toBlob(r,type,q))}
  async function shrink(file){
    let src; try{src=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(_){src=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('This file could not be read as a photo (iPhone HEIC? choose “Most Compatible” or send it as JPEG).'));im.src=URL.createObjectURL(file)})}
    const w=src.width||src.naturalWidth,h=src.height||src.naturalHeight,k=Math.min(1,MAXPX/Math.max(w,h));
    const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(src,0,0,c.width,c.height);
    let b=await blob(c,'image/webp',0.8); if(!b||b.type!=='image/webp')b=await blob(c,'image/jpeg',0.82);
    if(b&&b.size>2.8e6)b=await blob(c,'image/jpeg',0.6);
    if(!b)throw new Error('Could not process this photo.');return b}
  up.addEventListener('change',async()=>{
    const files=[...up.files];up.value='';if(!files.length)return;
    const room=MAXP-photos.length;if(room<=0)return say('Up to '+MAXP+' photos per listing.',true);
    const st=$('#lm-upst');let ok=0,errs=[];
    for(const [n,f] of files.slice(0,room).entries()){
      st.textContent='Uploading photo '+(n+1)+' of '+Math.min(files.length,room)+'…';
      try{const b=await shrink(f);const d=await req(PH,{method:'POST',headers:{'Content-Type':b.type},body:b});photos.push(d.url);session.add(d.url);ok++;drawPhotos()}
      catch(e){errs.push(f.name+': '+e.message)}}
    st.textContent=ok?ok+' photo'+(ok===1?'':'s')+' uploaded. Click “Save listing” to publish.':'';
    if(errs.length)say('<b>Some photos were not uploaded.</b><br>'+errs.map(esc).join('<br>'),true);else if(files.length>room)say('Only the first '+room+' photos were added (max '+MAXP+').',true);
  });
  $('#lm-addurl').addEventListener('click',()=>{const i=$('#lm-photourl'),v=i.value.trim();if(!v)return;
    if(NOT_IMG.test(v))return say('<b>That link is a share page, not a photo file</b>, so it can’t show on the website. Download the photos to your phone or computer and use <b>Upload photos</b> instead.',true);
    try{const u=new URL(v);if(!/^https?:$/.test(u.protocol))throw 0}catch(_){return say('Enter a full photo link starting with https://',true)}
    if(photos.length>=MAXP)return say('Up to '+MAXP+' photos per listing.',true);photos.push(v);i.value='';drawPhotos();say('')});
  const F=id=>$('#'+id);
  /* ---- Map pin: geocoded from the address (server: /api/geocode), draggable, or typed coordinates ---- */
  const GEO='/api/geocode', DB=[37.9085,-121.6002], pinst=$('#lm-pinst');
  const pinSay=(t,cls)=>{pinst.innerHTML=t;pinst.className=cls||''};
  const norm=a=>String(a||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  let pmap=null, pmk=null;
  function initMap(){if(pmap||!window.L||!$('#lm-map'))return;const L=window.L;
    pmap=L.map('lm-map',{scrollWheelZoom:false}).setView(DB,11);
    const E='https://server.arcgisonline.com/ArcGIS/rest/services/';
    L.tileLayer(E+'World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18,attribution:'Imagery &copy; Esri'}).addTo(pmap);
    L.tileLayer(E+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18}).addTo(pmap);
    L.tileLayer(E+'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:18}).addTo(pmap);
    pmap.on('click',e=>setPin(e.latlng.lat,e.latlng.lng,'manual'));drawPin()}
  function drawPin(){if(!pmap)return;const L=window.L;
    if(!pin){if(pmk){pmap.removeLayer(pmk);pmk=null}return}
    if(!pmk){pmk=L.marker([pin.lat,pin.lng],{draggable:true,autoPan:true,title:'Drag to the house',icon:L.divIcon({className:'lm-pin',html:'<span></span>',iconSize:[26,26],iconAnchor:[13,26]})}).addTo(pmap);pmk.on('dragend',()=>{const p=pmk.getLatLng();setPin(p.lat,p.lng,'manual')})}
    else pmk.setLatLng([pin.lat,pin.lng]);
    pmap.setView([pin.lat,pin.lng],Math.max(pmap.getZoom(),18))}
  function setPin(lat,lng,src,matched){lat=+(+lat).toFixed(6);lng=+(+lng).toFixed(6);
    pin={lat,lng,src,addr:norm(F('lm-address').value)};F('lm-lat').value=lat;F('lm-lng').value=lng;drawPin();
    pinSay(src==='manual'?'Pin set by hand ✓ ('+lat+', '+lng+')':'Pin found ✓ '+esc(matched||'')+' <span class="muted">Drag it if it is not on the house.</span>','ok')}
  function clearPin(msg){pin=null;F('lm-lat').value='';F('lm-lng').value='';drawPin();if(pmap)pmap.setView(DB,11);pinSay(msg||'No pin yet.','')}
  async function findPin(){const a=F('lm-address').value.trim();if(a.length<5){pinSay('Type the full address first.','bad');return false}
    pinSay('Finding the address on the map…','');
    try{const d=await req(GEO+'?address='+encodeURIComponent(a));
      if(d.ok&&Number.isFinite(d.lat)&&Number.isFinite(d.lng)){setPin(d.lat,d.lng,'auto',d.matched);
        if(d.street===false)pinSay('Only the street or area was found, not the house number. <b>Drag the pin onto the house</b> before saving.','bad');return true}
      pinSay('<b>Could not find this address on the map.</b> Check the spelling (street, city, ZIP), or tap the house on the map to place the pin.','bad');return false}
    catch(e){pinSay('<b>Map lookup failed:</b> '+esc(e.message)+'. Tap the house on the map to place the pin.','bad');return false}}
  $('#lm-find').addEventListener('click',findPin);
  F('lm-address').addEventListener('change',()=>{if(pin&&pin.addr===norm(F('lm-address').value))return;if(F('lm-address').value.trim().length>=5)findPin()});
  $('#lm-setll').addEventListener('click',()=>{const a=parseFloat(F('lm-lat').value),b=parseFloat(F('lm-lng').value);
    if(!(Math.abs(a)<=90&&Math.abs(b)<=180)||!a||!b)return pinSay('Enter latitude and longitude as numbers, e.g. 37.901399 and -121.590796.','bad');setPin(a,b,'manual')});
  $('#lm-clearll').addEventListener('click',()=>clearPin('Pin cleared. The listing will show at its community until you set a pin.'));
  function edit(i){editing=i;const x=list[i];
    F('lm-status').value=x.status||'for-sale';F('lm-address').value=x.address||'';F('lm-price').value=x.price||'';F('lm-beds').value=x.beds||'';F('lm-baths').value=x.baths||'';F('lm-sqft').value=x.sqft||'';
    F('lm-meta').value=x.meta||'';F('lm-apply').value=x.apply||'';F('lm-url').value=x.url||'';photos=pics(x).slice();session=new Set();drawPhotos();
    if(x.lat!=null&&x.lng!=null&&x.lat!==''&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lng)){setPin(x.lat,x.lng,'manual');pinSay('Saved pin ✓ ('+(+x.lat)+', '+(+x.lng)+') <span class="muted">Drag it to adjust.</span>','ok')}else{clearPin('This listing has no exact pin yet (it shows at its community). Click “Find on map”.')}
    $('#lm-title').textContent='Edit: '+x.address;$('#lm-cancel').hidden=false;$('#lm-submit').textContent='Save changes';toggleApply();form.scrollIntoView({behavior:'smooth'});say('')}
  function reset(){editing=null;form.reset();photos=[];session=new Set();drawPhotos();clearPin('Type the address above, then “Find on map”.');$('#lm-title').textContent='Add a listing';$('#lm-cancel').hidden=true;$('#lm-submit').textContent='Save listing';toggleApply()}
  $('#lm-cancel').addEventListener('click',async()=>{const orphan=[...session];reset();cleanup(orphan)});
  const toggleApply=()=>{$('#lm-applyrow').classList.toggle('dim',F('lm-status').value!=='rental')};F('lm-status').addEventListener('change',toggleApply);
  async function cleanup(cands){const used=new Set(list.flatMap(pics).map(u=>String(u).replace(location.origin,'')));
    for(const u of new Set(cands)){const p=String(u).replace(location.origin,'');if(isOwnPhoto(p)&&!used.has(p)){try{await req(p,{method:'DELETE'})}catch(_){}}}}
  async function save(a,msg,removed){if(busy)return;busy=true;const before=list.flatMap(pics);
    try{setData(await req(API,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({listings:a,base:updated})}));say(msg);await cleanup((removed||[]).concat(before));return true}
    catch(e){if(e.status===409&&e.data&&e.data.listings){setData(e.data);say('<b>Not saved:</b> '+esc(e.message),true)}else say('<b>Not saved:</b> '+esc(e.message),true);return false}
    finally{busy=false}}
  form.addEventListener('submit',async e=>{e.preventDefault();
    const bad=photos.filter(u=>NOT_IMG.test(u));
    if(F('lm-address').value.trim().length<3)return say('Enter the address.',true);
    const btn0=$('#lm-submit');btn0.disabled=true;
    if(!pin||pin.addr!==norm(F('lm-address').value))await findPin();
    btn0.disabled=false;
    const nopin=!pin||pin.addr!==norm(F('lm-address').value);
    const item={id:editing!=null?list[editing].id:String(Date.now())+String(Math.floor(Math.random()*1000)).padStart(3,'0'),status:F('lm-status').value,address:F('lm-address').value.trim(),price:F('lm-price').value.trim(),
      beds:F('lm-beds').value,baths:F('lm-baths').value,sqft:F('lm-sqft').value,meta:F('lm-meta').value.trim(),photos:photos.slice(),photo:photos[0]||'',apply:F('lm-apply').value.trim(),url:F('lm-url').value.trim()};
    if(!nopin){item.lat=pin.lat;item.lng=pin.lng}
    for(const k of ['apply','url'])if(item[k]){try{const u=new URL(item[k]);if(!/^https?:$/.test(u.protocol))throw 0}catch(_){return say('The '+(k==='apply'?'apply link':'property page link')+' must start with https://',true)}}
    const a=list.slice();if(editing!=null)a[editing]=item;else a.unshift(item);
    const btn=$('#lm-submit');btn.disabled=true;
    const ok=await save(a,'<b>Saved to the website.</b> Visitors see it on the map search, home page'+(item.status==='rental'?' and Available rentals':'')+' within about two minutes.'+(nopin?' <br><b>Map pin:</b> the address was not found, so it shows at its community. Edit the listing and tap the house on the map to place the pin.':'')+(bad.length?' <br><b>Note:</b> it still has a share link instead of a photo; remove it and upload the photos.':''),[...session]);
    btn.disabled=false;if(ok)reset()});
  drawPhotos();toggleApply();initMap();load();
})();
