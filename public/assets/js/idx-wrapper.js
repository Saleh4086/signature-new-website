/* Header interactions only; leave IDX search and forms under IDX control. */
(()=>{'use strict';
 const menu=document.querySelector('.menu-btn');
 if(menu)menu.addEventListener('click',()=>{const on=document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',String(on));});
 document.querySelectorAll('.nav a').forEach(link=>link.addEventListener('click',()=>{document.body.classList.remove('nav-open');if(menu)menu.setAttribute('aria-expanded','false');}));
 const fa=document.querySelector('.fa-btn');
 if(fa)fa.addEventListener('click',()=>{window.location.href='https://blackstonesignatureproperty.com/?lang=fa';});
})();
