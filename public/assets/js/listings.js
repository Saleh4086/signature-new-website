/* SAMPLE DATA ONLY — these are placeholder homes to demonstrate the search experience.
   They are NOT real listings. Replace this file with a live MLS/IDX feed (e.g. BridgeMLS IDX / RESO Web API)
   once IDX approval is in place. Photos are stock images. */
window.BSP_CITIES={
  "Discovery Bay":{c:[37.9085,-121.6002],z:13},
  "Brentwood":{c:[37.9319,-121.6958],z:13},
  "Oakley":{c:[37.9974,-121.7125],z:13},
  "Antioch":{c:[37.9900,-121.8058],z:12},
  "Concord":{c:[37.9780,-122.0311],z:12},
  "Walnut Creek":{c:[37.9050,-122.0552],z:13},
  "Danville":{c:[37.8216,-121.9999],z:13}
};
window.BSP_SAMPLES=[
 {id:1,title:"Waterfront residence with private dock",city:"Discovery Bay",lat:37.9142,lng:-121.5935,price:1495000,beds:4,baths:3.5,sqft:3180,type:"House",img:"s5"},
 {id:2,title:"Lagoon-view single story",city:"Discovery Bay",lat:37.9031,lng:-121.6081,price:925000,beds:3,baths:2,sqft:2050,type:"House",img:"s1"},
 {id:3,title:"Modern farmhouse near downtown",city:"Brentwood",lat:37.9361,lng:-121.7012,price:1089000,beds:5,baths:3,sqft:3240,type:"House",img:"s3"},
 {id:4,title:"Move-in-ready family home",city:"Brentwood",lat:37.9205,lng:-121.7189,price:799000,beds:4,baths:2.5,sqft:2410,type:"House",img:"s1"},
 {id:5,title:"Townhome with community pool",city:"Brentwood",lat:37.9458,lng:-121.6858,price:569000,beds:3,baths:2.5,sqft:1560,type:"Townhome",img:"s4"},
 {id:6,title:"Delta-access cul-de-sac home",city:"Oakley",lat:38.0021,lng:-121.7231,price:735000,beds:4,baths:3,sqft:2280,type:"House",img:"s3"},
 {id:7,title:"New-construction style two story",city:"Oakley",lat:37.9890,lng:-121.6990,price:819000,beds:5,baths:3,sqft:2960,type:"House",img:"s1"},
 {id:8,title:"Hillside home near regional park",city:"Antioch",lat:37.9805,lng:-121.8165,price:689000,beds:4,baths:3,sqft:2150,type:"House",img:"s5"},
 {id:9,title:"Duplex — owner-occupy or invest",city:"Antioch",lat:38.0080,lng:-121.7930,price:749000,beds:6,baths:4,sqft:2600,type:"Multi-family",img:"s3"},
 {id:10,title:"Starter condo close to BART",city:"Antioch",lat:37.9960,lng:-121.7820,price:389000,beds:2,baths:2,sqft:980,type:"Condo",img:"s4"},
 {id:11,title:"Updated ranch with Diablo views",city:"Concord",lat:37.9632,lng:-122.0110,price:875000,beds:3,baths:2,sqft:1620,type:"House",img:"s1"},
 {id:12,title:"Light-filled condo near downtown",city:"Concord",lat:37.9771,lng:-122.0343,price:529000,beds:2,baths:2,sqft:1110,type:"Condo",img:"s2"},
 {id:13,title:"Fourplex investment opportunity",city:"Concord",lat:37.9705,lng:-122.0490,price:1350000,beds:8,baths:4,sqft:3600,type:"Multi-family",img:"s3"},
 {id:14,title:"Walkable townhome off Main St",city:"Walnut Creek",lat:37.9025,lng:-122.0620,price:995000,beds:3,baths:2.5,sqft:1720,type:"Townhome",img:"s4"},
 {id:15,title:"Contemporary estate with pool",city:"Walnut Creek",lat:37.8890,lng:-122.0390,price:2295000,beds:5,baths:4.5,sqft:4100,type:"House",img:"s2"},
 {id:16,title:"Classic home on a quiet court",city:"Danville",lat:37.8250,lng:-121.9890,price:1785000,beds:4,baths:3,sqft:2900,type:"House",img:"s5"}
];

/* Sal's OWN listings (For Sale / Pending / Sold / For Rent) from his existing Listing Manager
   (admin-hub → listing-manager.html, saved by /assets/site.js under localStorage key
   'blackstone_custom_listings_v1', shape {id,status,address,price,meta,photo,url}).
   Future: when a server endpoint exists, set window.BSP_LISTINGS_FEED before this file (or flip
   OWN_FEED below) and the same normalizer is used. When any own listing exists, the samples are
   NOT shown; samples are only the fallback. */
(function(){
  const KEY='blackstone_custom_listings_v1';
  const APPROX={"Pittsburg":[38.0280,-121.8847],"Bay Point":[38.0291,-121.9616],"Byron":[37.8672,-121.6380],"Clayton":[37.9410,-121.9358],
    "Pleasant Hill":[37.9480,-122.0608],"Martinez":[38.0194,-122.1341],"San Ramon":[37.7799,-121.9780],"Knightsen":[37.9688,-121.6683],"Bethel Island":[38.0149,-121.6405]};
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=v=>{if(!String(v||'').trim())return '';try{const u=new URL(String(v).trim(),location.href);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''}catch(_){return ''}};
  const LABEL={'for-sale':'For Sale','pending':'Pending','sold':'Sold','rental':'For Rent'};
  function read(){let a=[];
    if(Array.isArray(window.BSP_LISTINGS_FEED)&&window.BSP_LISTINGS_FEED.length)a=window.BSP_LISTINGS_FEED;
    else{try{const d=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(d))a=d}catch(_){}}
    return a.filter(x=>x&&typeof x==='object'&&String(x.address||'').trim())}
  function num(re,s){const m=String(s||'').match(re);return m?parseFloat(m[1].replace(/,/g,'')):0}
  function apply(){const raw=read(); if(!raw.length){window.BSP_OWN=false;return}
  const cities=Object.assign({},...Object.entries(window.BSP_CITIES||{}).map(([k,v])=>({[k]:v.c})),APPROX);
  window.BSP_OWN=true;
  window.BSP_SAMPLES=raw.slice(0,200).map((x,i)=>{
    const addr=String(x.address).slice(0,200), meta=String(x.meta||'').slice(0,300);
    const city=Object.keys(cities).find(c=>new RegExp('\\b'+c.replace(/ /g,'\\s+')+'\\b','i').test(addr))||'';
    const ll=city?cities[city]:null, j=((i*7)%11-5)*0.0016, k=((i*5)%9-4)*0.0016;
    const st=LABEL[x.status]?x.status:'for-sale';
    const t=/townho/i.test(meta)?'Townhome':/condo/i.test(meta)?'Condo':/multi|duplex|triplex|fourplex|units?\b/i.test(meta)?'Multi-family':/\bland|\blot\b|acre/i.test(meta)?'Land':'House';
    return {id:1000+i,own:true,status:st,badge:LABEL[st],title:esc(addr),city:esc(city),lat:ll?ll[0]+j:null,lng:ll?ll[1]+k:null,approx:!!ll,
      price:num(/\$?\s*([\d,]+(?:\.\d+)?)/,x.price),priceText:esc(String(x.price||'').slice(0,60)||'Contact Sal'),
      beds:num(/([\d.]+)\s*(?:bd|bds|bed|beds|br|bedroom)/i,meta),baths:num(/([\d.]+)\s*(?:ba|bath|baths|bathroom)/i,meta),sqft:num(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|sf)\b/i,meta),
      meta:esc(meta),type:t,photo:safeUrl(x.photo),link:safeUrl(x.url)}});
  }
  /* Server feed: /api/listings (saved by the Listing Manager). Waits at most 2.5 s, then falls back to samples. */
  window.BSP_READY=new Promise(done=>{
    let ok=false; const t=setTimeout(()=>{if(!ok){ok=true;apply();done()}},2500);
    fetch('/api/listings',{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{
      if(d&&Array.isArray(d.listings))window.BSP_LISTINGS_FEED=d.listings;
    }).catch(()=>{}).then(()=>{if(!ok){ok=true;clearTimeout(t);apply();done()}});
  });
})();
