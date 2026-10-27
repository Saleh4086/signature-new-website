/* Map search (Leaflet + CARTO tiles). Uses Sal's own listings (/api/listings) or SAMPLE data until an MLS/IDX feed is connected. */
(window.BSP_READY||Promise.resolve()).then(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const L=window.L, OWN=!!window.BSP_OWN, DATA=window.BSP_SAMPLES||[], CITIES=window.BSP_CITIES||{};
  const PINNED=DATA.filter(l=>l.lat!=null&&l.lng!=null);
  const pr=l=>l.priceText||money(l.price), badge=l=>l.own?'<span class="badge own st-'+l.status+'">'+l.badge+'</span>':'<span class="badge sample">Sample listing</span>';
  const facts=l=>l.own?(l.meta||'Contact Sal for details'):'<b>'+l.beds+'</b> bd · <b>'+l.baths+'</b> ba · <b>'+l.sqft.toLocaleString()+'</b> sq ft';
  const short=p=>p>=1e6?'$'+(p/1e6).toFixed(p>=1e7?0:2).replace(/\.?0+$/,'')+'M':'$'+Math.round(p/1e3)+'K';
  const money=p=>'$'+p.toLocaleString('en-US');
  const img=k=>'assets/img/'+k+'.jpg', pic=l=>l.own?(l.photo||'assets/img/s1.jpg'):img(l.img);
  // Basemap. OpenStreetMap tiles, restyled dark in CSS (.leaflet-tile-pane filter) to match the theme.
  // For production traffic, swap in a keyed provider (CARTO dark_all, Stadia, MapTiler); see README.
  const TILE_URL=window.BSP_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tiles=()=>L.tileLayer(TILE_URL,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
  const pinIcon=(l,hot)=>L.divIcon({className:'pin-wrap',html:'<span class="pin'+(hot?' hot':'')+(l.own?' own':'')+'" data-id="'+l.id+'">'+(l.own?(l.status==='sold'?'Sold':l.status==='pending'?'Pending':l.price?short(l.price):l.badge):short(l.price))+'</span>',iconSize:[0,0]});

  // Mini map on the home page
  const mini=$('#minimap');
  if(mini&&L){const m=L.map(mini,{scrollWheelZoom:false,zoomControl:false,attributionControl:true,dragging:!L.Browser.mobile}).setView([37.94,-121.86],10);tiles().addTo(m);
    PINNED.forEach(l=>L.marker([l.lat,l.lng],{icon:pinIcon(l),keyboard:false}).addTo(m).on('click',()=>location.href='search.html'+(l.own?'':'?city='+encodeURIComponent(l.city))));
    if(OWN){const d=mini.parentElement.querySelector('.disclaimer');if(d)d.innerHTML='Pins show <b>Sal’s own listings</b> (For Sale, Pending, Sold and For Rent) placed at their community, not the exact address. Open the map search for details.';mini.setAttribute('aria-label','Map of the East Bay with Sal’s listings')}}

  const mapEl=$('#map'); if(!mapEl||!L)return;
  const map=L.map(mapEl,{zoomControl:true,preferCanvas:false}).setView([37.94,-121.88],10); const street=tiles().addTo(map);
  // Map / Satellite / Hybrid toggle. Aerial imagery: Esri World Imagery (free tier, attribution required).
  const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/';
  const esriAttr='Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community';
  const aerial=L.tileLayer(ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,maxNativeZoom:18,attribution:esriAttr});
  const labels=L.tileLayer(ESRI+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,maxNativeZoom:18,pane:'overlayPane',attribution:'Labels &copy; Esri'});
  const BASES={map:[street],satellite:[aerial],hybrid:[aerial,labels]};
  let base='map';
  function setBase(k){if(!BASES[k])k='map';[street,aerial,labels].forEach(l=>{if(map.hasLayer(l))map.removeLayer(l)});BASES[k].forEach(l=>l.addTo(map));base=k;
    mapEl.classList.toggle('is-aerial',k!=='map');
    mapEl.querySelectorAll('.basemap button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.base===k));
    try{sessionStorage.setItem('bsp-basemap',k)}catch(e){}}
  const BaseCtl=L.Control.extend({options:{position:'topright'},onAdd(){const d=L.DomUtil.create('div','basemap leaflet-bar');d.setAttribute('role','group');d.setAttribute('aria-label','Map style');
    d.innerHTML='<button type="button" data-base="map" aria-pressed="true">Map</button><button type="button" data-base="satellite" aria-pressed="false">Satellite</button><button type="button" data-base="hybrid" aria-pressed="false">Hybrid</button>';
    L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);
    d.addEventListener('click',e=>{const b=e.target.closest('button[data-base]');if(b)setBase(b.dataset.base)});return d}});
  new BaseCtl().addTo(map);
  {let k=new URLSearchParams(location.search).get('basemap');if(!k){try{k=sessionStorage.getItem('bsp-basemap')}catch(e){}}if(k&&k!=='map')setBase(k)}
  const markers={}; let hotId=null;
  const F={q:$('#f-q'),city:$('#f-city'),min:$('#f-min'),max:$('#f-max'),beds:$('#f-beds'),baths:$('#f-baths'),type:$('#f-type'),sort:$('#f-sort'),area:$('#f-area')};
  const params=new URLSearchParams(location.search);
  if(params.get('q'))F.q.value=params.get('q');
  if(params.get('city')&&CITIES[params.get('city')])F.city.value=params.get('city');
  [['min','min'],['max','max'],['beds','beds']].forEach(([k,f])=>{const v=params.get(k);if(v&&[...F[f].options].some(o=>o.value===v))F[f].value=v});

  function matches(l){const q=F.q.value.trim().toLowerCase();
    if(q&&!(l.city.toLowerCase().includes(q)||l.title.toLowerCase().includes(q)||l.type.toLowerCase().includes(q)))return false;
    if(F.city.value&&l.city!==F.city.value)return false;
    if(F.min.value&&l.price<+F.min.value)return false; if(F.max.value&&l.price>+F.max.value)return false;
    if(F.beds.value&&l.beds<+F.beds.value)return false; if(F.baths.value&&l.baths<+F.baths.value)return false;
    if(F.type.value&&l.type!==F.type.value)return false;
    if(F.area.checked&&(l.lat==null||!map.getBounds().contains([l.lat,l.lng])))return false;
    return true}
  function sorted(a){const s=F.sort.value; return a.sort((x,y)=>s==='low'?x.price-y.price:s==='high'?y.price-x.price:s==='size'?y.sqft-x.sqft:x.id-y.id)}
  function setHot(id,on){const c=$('.lcard[data-id="'+id+'"]'); c&&c.classList.toggle('hot',on); const m=markers[id]; if(m){m.setIcon(pinIcon(m.l,on)); m.setZIndexOffset(on?1000:0)}}
  function render(){const list=sorted(DATA.filter(matches)); const box=$('#cards');
    $('#count').textContent=list.length+(OWN?' of Sal’s listing':' sample home')+(list.length===1?'':'s');
    box.innerHTML=list.length?list.map(l=>'<button type="button" class="lcard'+(l.own?' own':'')+'" data-id="'+l.id+'" aria-label="'+pr(l)+', '+(l.own?l.badge+', '+l.title:l.beds+' bed '+l.baths+' bath '+l.type+' in '+l.city+' (sample listing)')+'"><div class="ph"><img loading="lazy" src="'+pic(l)+'" alt="">'+badge(l)+'<span class="type">'+l.type+'</span></div><div class="b"><div class="price">'+pr(l)+'</div><div class="meta">'+facts(l)+'</div><div class="loc">'+l.title+(l.own?'':' · '+l.city+', CA')+'</div>'+(l.own&&l.link?'<span class="own-link">'+(l.lat==null?'Open property page →':'Tap for details →')+'</span>':'')+'</div></button>').join(''):'<div class="empty">No sample homes match these filters. <br>Tell Sal what you\'re looking for and he\'ll run a live MLS search for you.</div>';
    Object.values(markers).forEach(m=>{const show=list.some(l=>l.id===m.l.id); if(show&&!map.hasLayer(m))m.addTo(map); if(!show&&map.hasLayer(m))map.removeLayer(m)});
    $$('.lcard',box).forEach(c=>{const id=+c.dataset.id; c.addEventListener('mouseenter',()=>setHot(id,true)); c.addEventListener('mouseleave',()=>setHot(id,false)); c.addEventListener('focus',()=>setHot(id,true)); c.addEventListener('blur',()=>setHot(id,false));
      c.addEventListener('click',e=>{const m=markers[id]; if(!m){const L2=DATA.find(x=>x.id===id);if(L2&&L2.link)window.open(L2.link,'_blank','noopener');return} if(innerWidth<=820)toggleView(true); map.flyTo(m.getLatLng(),Math.max(map.getZoom(),14),{duration:.8}); setTimeout(()=>m.openPopup(),850)})});
  }
  PINNED.forEach(l=>{const m=L.marker([l.lat,l.lng],{icon:pinIcon(l),title:l.own?l.badge+' '+l.priceText:money(l.price)+' sample listing'}); m.l=l;
    m.bindPopup(l.own?'<div class="pop"><img src="'+pic(l)+'" alt=""><div><span class="badge own st-'+l.status+'" style="position:static;display:inline-block;margin-bottom:6px">'+l.badge+'</span><br><b>'+l.priceText+'</b><br>'+(l.meta||'')+'<br><small style="color:#a9b2cc">'+l.title+' · pin shows the community, not the exact address</small><br>'+(l.link?'<a href="'+l.link+'" target="_blank" rel="noopener">View property →</a>':'<a href="contact.html?topic=Buying&home='+encodeURIComponent(l.title.replace(/&[a-z#0-9]+;/g,''))+'">Ask Sal about this home →</a>')+'</div></div>':'<div class="pop"><img src="'+img(l.img)+'" alt=""><div><span class="badge sample" style="position:static;display:inline-block;margin-bottom:6px">Sample listing</span><br><b>'+money(l.price)+'</b><br>'+l.beds+' bd · '+l.baths+' ba · '+l.sqft.toLocaleString()+' sq ft<br><small style="color:#a9b2cc">'+l.title+' · '+l.city+'</small><br><a href="contact.html?topic=Buying&home='+encodeURIComponent(l.city+' '+l.type)+'">Ask Sal about homes like this →</a></div></div>',{maxWidth:260,minWidth:260});
    m.on('mouseover',()=>{setHot(l.id,true);const c=$('.lcard[data-id="'+l.id+'"]');c&&c.scrollIntoView({block:'nearest',behavior:'smooth'})}); m.on('mouseout',()=>setHot(l.id,false));
    markers[l.id]=m; m.addTo(map)});
  Object.values(F).forEach(el=>el&&el.addEventListener(el.type==='text'||el.type==='search'?'input':'change',render));
  map.on('moveend',()=>{if(F.area.checked)render()});
  // city chips + select → fly to city
  function fly(city){ $$('.citybar .chip').forEach(c=>c.classList.toggle('on',c.dataset.city===city)); if(city&&CITIES[city])map.flyTo(CITIES[city].c,CITIES[city].z,{duration:1}); else map.flyTo([37.94,-121.88],10,{duration:1}); }
  $$('.citybar .chip').forEach(c=>c.addEventListener('click',()=>{F.city.value=c.dataset.city;fly(c.dataset.city);render()}));
  F.city.addEventListener('change',()=>fly(F.city.value));
  $('#f-reset').addEventListener('click',()=>{['q','min','max','beds','baths','type','city'].forEach(k=>F[k].value='');F.area.checked=false;F.sort.value='new';fly('');render()});
  const mf=$('.more-f'); mf&&mf.addEventListener('click',()=>{const o=$('.filters').classList.toggle('open');mf.setAttribute('aria-expanded',o);mf.textContent=o?'Hide filters':'Filters'});
  // mobile map/list toggle
  const vt=$('.view-toggle'), main=$('.sp-main');
  function toggleView(toMap){const s=toMap===undefined?!main.classList.contains('show-map'):toMap; main.classList.toggle('show-map',s); vt.innerHTML=s?'☰&nbsp; List view':'◎&nbsp; Map view'; setTimeout(()=>map.invalidateSize(),60)}
  vt&&vt.addEventListener('click',()=>toggleView());
  if(OWN){const d=$('.sp-main .disclaimer')||$('#cards')&&$('#cards').previousElementSibling;if(d&&d.classList.contains('disclaimer'))d.innerHTML='<b>Sal’s own listings.</b> For Sale, Pending, Sold and For Rent homes from Blackstone Signature Properties &amp; Investments. Map pins mark the community, not the exact address.';$$('.idx-live p').forEach(p=>{p.textContent=p.textContent.replace('the map shows sample homes so you can try the experience','the map shows Sal’s own listings')})}
  render(); if(F.city.value)fly(F.city.value);
});
