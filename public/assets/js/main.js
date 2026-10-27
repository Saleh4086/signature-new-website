/* Blackstone Signature v2 — site interactions (no dependencies) */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const money=(n,d=0)=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
  const num=el=>parseFloat(String(el.value).replace(/[^0-9.\-]/g,''))||0;

  // header + menu
  const hdr=$('.hdr'), mbar=$('.mbar');
  const onScroll=()=>{const y=scrollY; hdr&&hdr.classList.toggle('solid',y>30); mbar&&mbar.classList.toggle('show',y>380)};
  addEventListener('scroll',onScroll,{passive:true}); onScroll();
  const mb=$('.menu-btn'); mb&&mb.addEventListener('click',()=>{const o=document.body.classList.toggle('nav-open');mb.setAttribute('aria-expanded',o)});
  $$('.nav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('nav-open')));

  // reveal on scroll
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    $$('.rv').forEach(el=>io.observe(el));
  } else $$('.rv').forEach(el=>el.classList.add('in'));

  // count-up numbers
  $$('[data-count]').forEach(el=>{const end=+el.dataset.count, suf=el.dataset.suffix||''; let t0;
    const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return; io.disconnect();
      const step=ts=>{t0=t0||ts; const p=Math.min(1,(ts-t0)/1400); el.textContent=Math.round(end*(1-Math.pow(1-p,3)))+suf; if(p<1)requestAnimationFrame(step)}; requestAnimationFrame(step)});
    io.observe(el)});

  // journey tabs (Buy → Invest → Improve → Manage → Sell)
  const jt=$$('.j-tab');
  if(jt.length){const panels=$$('.j-panel'), bar=$('.j-progress i');
    const show=i=>{jt.forEach((t,k)=>{t.setAttribute('aria-selected',k===i);t.tabIndex=k===i?0:-1});panels.forEach((p,k)=>p.hidden=k!==i);bar&&(bar.style.width=((i+1)/jt.length*100)+'%')};
    jt.forEach((t,i)=>{t.addEventListener('click',()=>show(i));t.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();jt[(i+1)%jt.length].focus();show((i+1)%jt.length)}if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();const k=(i-1+jt.length)%jt.length;jt[k].focus();show(k)}})});
    show(0)}

  // segmented controls
  $$('.seg').forEach(seg=>{const bs=$$('button',seg);bs.forEach(b=>b.addEventListener('click',()=>{bs.forEach(x=>x.setAttribute('aria-selected',x===b));$$(b.dataset.group).forEach(p=>p.hidden=p.id!==b.dataset.show)}))});

  // range <-> number mirrors
  $$('[data-mirror]').forEach(r=>{const t=$(r.dataset.mirror);r.addEventListener('input',()=>{t.value=r.value;t.dispatchEvent(new Event('input',{bubbles:true}))});t.addEventListener('input',()=>{r.value=num(t)})});

  // mortgage calculator
  const mc=$('#mortgage');
  if(mc){const f=n=>$('[name='+n+']',mc);
    const calc=()=>{const price=num(f('price')),dp=num(f('down'))/100,rate=num(f('rate'))/100/12,n=num(f('term'))*12;
      const loan=price*(1-dp); const pi=rate?loan*rate/(1-Math.pow(1+rate,-n)):loan/n;
      const tax=price*num(f('tax'))/100/12, ins=num(f('ins'))/12, hoa=num(f('hoa')); const pmi=dp<.2?loan*num(f('pmi'))/100/12:0;
      const tot=pi+tax+ins+hoa+pmi; const parts=[pi,tax,ins+pmi,hoa]; let acc=0;
      const cols=['var(--gold)','var(--aqua)','#7f8bff','#f08a6c'];
      $('.donut',mc).style.background='conic-gradient('+parts.map((p,i)=>{const a=acc;acc+=p/tot*100;return cols[i]+' '+a+'% '+acc+'%'}).join(',')+')';
      $('#m-total').textContent=money(tot); $('#m-pi').textContent=money(pi); $('#m-tax').textContent=money(tax); $('#m-ins').textContent=money(ins+pmi); $('#m-hoa').textContent=money(hoa);
      $('#m-loan').textContent=money(loan); $('#m-cash').textContent=money(price*dp); $('#m-int').textContent=money(pi*n-loan);
    };
    mc.addEventListener('input',calc); calc();}

  // affordability
  const af=$('#afford');
  if(af){const f=n=>$('[name='+n+']',af);
    const calc=()=>{const inc=num(f('income'))/12,debt=num(f('debts')),dti=num(f('dti'))/100,down=num(f('cash')),r=num(f('rate'))/100/12,n=360,taxr=num(f('tax'))/100/12;
      const maxHousing=Math.max(0,inc*dti-debt);
      // solve price P: P_I(P-down) + P*taxr + ins(=P*0.0035/12) = maxHousing
      const k=r?r/(1-Math.pow(1+r,-n)):1/n; const ins=0.0035/12;
      const P=Math.max(0,(maxHousing+down*k)/(k+taxr+ins));
      $('#a-price').textContent=money(Math.round(P/1000)*1000); $('#a-pay').textContent=money(maxHousing); $('#a-loan').textContent=money(Math.max(0,P-down));
    }; af.addEventListener('input',calc); calc();}

  // rental cash-flow / ROI
  const ro=$('#roi');
  if(ro){const f=n=>$('[name='+n+']',ro);
    const calc=()=>{const price=num(f('price')),dp=num(f('down'))/100,rate=num(f('rate'))/100/12,n=360,rent=num(f('rent')),vac=num(f('vacancy'))/100,mg=num(f('mgmt'))/100,mt=num(f('maint'))/100,taxr=num(f('tax'))/100,ins=num(f('ins')),hoa=num(f('hoa')),close=num(f('closing'))/100,rehab=num(f('rehab'));
      const loan=price*(1-dp); const pi=dp>=1?0:(rate?loan*rate/(1-Math.pow(1+rate,-n)):loan/n);
      const egi=rent*(1-vac); const opex=egi*mg+rent*mt+price*taxr/12+ins/12+hoa; const noi=egi-opex; const cf=noi-pi;
      const cash=price*dp+price*close+rehab; const cap=price?noi*12/price*100:0; const coc=cash?cf*12/cash*100:0; const dscr=pi?noi/pi:0; const grm=rent?price/(rent*12):0;
      const set=(id,v,cls)=>{const el=$(id);el.querySelector('b').textContent=v; if(cls!==undefined){el.classList.toggle('pos',cls>0);el.classList.toggle('neg',cls<0)}};
      $('#r-cf').textContent=money(cf); $('#r-cf').style.color=cf>=0?'var(--aqua-2)':'#ff9c86';
      set('#r-noi',money(noi)); set('#r-cap',cap.toFixed(2)+'%',cap); set('#r-coc',coc.toFixed(2)+'%',coc); set('#r-dscr',dscr?dscr.toFixed(2)+'×':'—',dscr?dscr-1.2:0); set('#r-cash',money(cash)); set('#r-grm',grm.toFixed(1));
      $('#r-pi').textContent=money(pi); $('#r-opex').textContent=money(opex); $('#r-egi').textContent=money(egi); $('#r-mg').textContent=money(egi*mg);
    }; ro.addEventListener('input',calc); calc();}

  // seller prep checklist (saved in this browser only)
  const cl=$('#prep');
  if(cl){const key='bsp-prep-v1', boxes=$$('input[type=checkbox]',cl); let saved={}; try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
    const upd=()=>{const d=boxes.filter(b=>b.checked).length; $('#prep-meter').style.width=(d/boxes.length*100)+'%'; $('#prep-count').textContent=d+' of '+boxes.length+' done'; const s={}; boxes.forEach(b=>s[b.id]=b.checked); try{localStorage.setItem(key,JSON.stringify(s))}catch(e){}};
    boxes.forEach(b=>{b.checked=!!saved[b.id];b.addEventListener('change',upd)}); upd();
    const rs=$('#prep-reset'); rs&&rs.addEventListener('click',()=>{boxes.forEach(b=>b.checked=false);upd()});}

  // Lead forms → Sal's existing CRM endpoints (same payload format as his current site):
  // POST /api/leads (Supabase CRM + Brokerage OS mirror) or /api/master-repair (repair intake),
  // then the same FormSubmit e-mail copy his site already sends. On the preview the Worker answers
  // "preview mode" and nothing is forwarded or e-mailed.
  const FORMSUBMIT='https://formsubmit.co/gharibyar61@gmail.com';
  function emailCopy(fm,fields){
    let fr=document.getElementById('blackstone-email-frame');
    if(!fr){fr=document.createElement('iframe');fr.id=fr.name='blackstone-email-frame';fr.hidden=true;fr.setAttribute('aria-hidden','true');document.body.appendChild(fr);}
    const f=document.createElement('form');f.method='POST';f.action=FORMSUBMIT;f.target='blackstone-email-frame';f.hidden=true;
    const add=(k,v)=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;f.appendChild(i)};
    add('_subject','Blackstone Signature Properties & Investments Website - '+(fm.dataset.subject||'Website Lead'));add('_template','table');add('_captcha','false');
    Object.entries(fields).forEach(([k,v])=>{if(k!=='website_url')add(k,Array.isArray(v)?v.join(', '):v)});
    document.body.appendChild(f);HTMLFormElement.prototype.submit.call(f);setTimeout(()=>f.remove(),4000);
  }
  $$('form[data-lead]').forEach(fm=>{
    if(!fm.querySelector('[name="website_url"]')){const t=document.createElement('input');t.name='website_url';t.tabIndex=-1;t.autocomplete='off';t.setAttribute('aria-hidden','true');t.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;opacity:0';fm.appendChild(t);}
    let busy=false;
    fm.addEventListener('submit',async e=>{e.preventDefault(); if(busy||!fm.reportValidity())return; busy=true;
      const st=$('.form-status',fm), btn=$('button[type="submit"]',fm), label=btn&&btn.innerHTML;
      if(btn){btn.disabled=true;btn.textContent='Sending…'}
      const fields={}; for(const [k,v] of new FormData(fm)){ if(v instanceof File)continue; fields[k]=k in fields?[].concat(fields[k],v):v; }
      const repair=fm.dataset.lead==='repair';
      const body=repair?{name:fields.name||'',email:fields.email||'',phone:fields.phone||'',propertyAddress:fields.property_address||'',area:fields.repair_category||'Other',
          issue:[fields.issue_description||'',fields.urgency?'Urgency: '+fields.urgency:'',fields.permission_to_enter?'Permission to enter: '+fields.permission_to_enter:''].filter(Boolean).join('\n'),priority:'Normal',...(fields.website_url?{website_url:fields.website_url}:{})}
        :{fields,name:fields.name||fields.full_name||'',email:fields.email||'',phone:fields.phone||fields.mobile||'',
          lead_type:fields.lead_type||fields.interest||fields.service||'',property_address:fields.property_address||fields.address||fields.property||'',
          city:fields.city||fields.desired_city||'',timeline:fields.timeline||fields.move_timeline||'',motivation:fields.motivation||fields.reason||'',
          message:fields.message||fields.notes||fields.property_details||fields.repair_details||'',page:location.pathname,source:'Website - '+document.title,
          consent_to_contact:fields.consent_to_contact==='true'};
      try{
        const r=await fetch(repair?'/api/master-repair':'/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        const res=await r.json().catch(()=>({}));
        if(!r.ok||res.ok===false)throw new Error(res.error||res.message||('Request failed ('+r.status+')'));
        if(res.preview){st&&(st.textContent=res.message);}
        else{st&&(st.textContent=res.message||'Thank you. Your request was received and Sal will follow up shortly.');emailCopy(fm,fields);fm.reset();}
      }catch(err){
        st&&(st.innerHTML='');
        if(st){st.append(document.createTextNode((err&&err.message&&!/^(Failed to fetch|Load failed|NetworkError)/i.test(err.message)?err.message+' ':'We could not send your request right now. ')+'Please call or text (925) 722-5144, or '));
          const a=document.createElement('a');let mb='';for(const [k,v] of Object.entries(fields)){if(v&&!/^(website_url|consent_to_contact|lead_type)$/.test(k))mb+=k.replace(/_/g,' ')+': '+v+'\n'}
          a.href='mailto:gharibyar61@gmail.com?subject='+encodeURIComponent(fm.dataset.subject||'Website inquiry')+'&body='+encodeURIComponent(mb);a.textContent='email Sal';st.append(a,document.createTextNode('.'));}
      }finally{busy=false;if(btn){btn.disabled=false;btn.innerHTML=label}}
    });
  });

  // home search box → map search page
  $$('.chip[data-q]').forEach(c=>c.addEventListener('click',()=>{const i=$('#hq');if(i){i.value=c.dataset.q;$$('.chip[data-q]').forEach(x=>x.classList.toggle('on',x===c))}}));

  const y=$('#yr'); y&&(y.textContent=new Date().getFullYear());
})();
