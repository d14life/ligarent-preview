(() => {
  const pages = [
    {id:'machines',label:'Машины',teaser:'CAT D6R · D7R · D8R',image:'assets/d6r-no-rods.png'},
    {id:'selection',label:'Подбор',teaser:'ПОДОБРАТЬ ПОД ЗАДАЧУ',image:'assets/d7r.png'},
    {id:'work',label:'Виды работ',teaser:'ЗЕМЛЯ · ДОРОГИ · СНЕГ',image:'assets/work-0.jpg'},
    {id:'geography',label:'Зоны выезда',teaser:'ТАТАРСТАН · БАШКОРТОСТАН',image:''},
    {id:'faq',label:'Вопросы',teaser:'ОТВЕТЫ ДО ЗАКАЗА',image:'assets/bulldozer-front.png'},
    {id:'enquiry',label:'Заявка',teaser:'РАССКАЖИТЕ ПРО ОБЪЕКТ',image:'assets/d8r.png'}
  ];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="wrap site-header-inner"><a class="site-brand" href="#machines" aria-label="LIGARENT — машины"><span class="logo">LIGARENT</span></a><span class="site-current">Машины</span><span class="site-page-count">01 / 06</span><button class="site-menu-toggle" type="button" aria-controls="site-menu" aria-expanded="false" aria-label="Открыть меню"><span class="menu-toggle-lines" aria-hidden="true"><i></i><i></i></span><span>Меню</span></button></div>`;
  document.body.prepend(header);


  const menuShell = document.createElement('div');
  menuShell.innerHTML = `<div class="menu-stairs" aria-hidden="true" hidden>${Array.from({length:5},()=>'<span class="menu-stair"></span>').join('')}</div><div class="full-menu" id="site-menu" role="dialog" aria-modal="true" aria-label="Разделы LIGARENT" hidden><div class="full-menu-head"><span class="logo">LIGARENT</span><button class="full-menu-close" type="button" aria-label="Закрыть меню"><span aria-hidden="true">×</span></button></div><nav class="full-menu-nav" aria-label="Все разделы">${pages.map((p,i)=>`<div class="full-menu-row"><a href="#${p.id}" class="full-menu-link" data-section="${p.id}"><span class="full-menu-index">${String(i+1).padStart(2,'0')}</span><span>${p.label}</span><span class="full-menu-arrow" aria-hidden="true">↗</span></a><div class="full-menu-hover" aria-hidden="true"><div class="full-menu-marquee">${Array.from({length:3},()=>`<span>${p.teaser}</span>${p.image?`<img src="${p.image}" alt="" loading="lazy">`:""}`).join('')}</div></div></div>`).join('')}</nav><div class="full-menu-foot"><span>Двигаем грунт. В срок.</span><a href="#enquiry" data-section="enquiry">Оставить заявку ↗</a></div></div>`;
  document.body.appendChild(menuShell);
  const menu = menuShell.querySelector('#site-menu');
  const stairs = menuShell.querySelector('.menu-stairs');
  const bars = [...menuShell.querySelectorAll('.menu-stair')];
  const toggle = header.querySelector('.site-menu-toggle');
  const close = menu.querySelector('.full-menu-close');
  const menuLinks = [...menu.querySelectorAll('[data-section]')];
  const sections = pages.map(p => document.getElementById(p.id));
  let menuOpen = false;
  let menuBusy = false;
  let navigating = false;
  let returnFocus = null;
  const settle = animations => Promise.all(animations.map(animation => animation.finished.catch(()=>{})));
  const background = () => [header,document.querySelector('main'),document.querySelector('.footer')].filter(Boolean);
  const cancelAnimations = element => element.getAnimations().forEach(animation => animation.cancel());

  function resetMenu() {
    menuLinks.forEach(cancelAnimations);
    [menu,...bars].forEach(cancelAnimations);
    bars.forEach(bar => { bar.style.transform = 'scaleY(0)'; });
    menu.classList.remove('ready');
    menu.style.opacity = '0';
    menu.hidden = true;
    stairs.hidden = true;
    document.body.classList.remove('menu-active');
    background().forEach(element => { element.inert = false; });
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Открыть меню');
    menuOpen = false;
    menuBusy = false;
  }
  async function openMenu() {
    if (menuBusy || menuOpen || navigating) return;
    menuBusy = true;
    menuOpen = true;
    returnFocus = document.activeElement;
    menu.hidden = false;
    stairs.hidden = false;
    menu.style.opacity = '0';
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Закрыть меню');
    document.body.classList.add('menu-active');
    background().forEach(element => { element.inert = true; });
    if (!reduceMotion) {
      bars.forEach(bar => { bar.style.transform = 'scaleY(0)'; });
      await settle(bars.map((bar,i) => bar.animate([{transform:'scaleY(0)'},{transform:'scaleY(1)'}],{duration:200,delay:(4-i)*35,easing:'cubic-bezier(.33,1,.68,1)',fill:'forwards'})));
      bars.forEach(bar => { cancelAnimations(bar); bar.style.transform = 'scaleY(1)'; });
      await settle([menu.animate([{opacity:0},{opacity:1}],{duration:130,fill:'forwards'}),...menuLinks.map((link,i) => link.animate([{transform:'translateY(15px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:180,delay:i*14,easing:'ease-out',fill:'forwards'}))]);
    } else bars.forEach(bar => { bar.style.transform = 'scaleY(1)'; });
    menu.style.opacity = '1';
    [menu,...menuLinks].forEach(cancelAnimations);
    menu.classList.add('ready');
    menuBusy = false;
    close.focus();
  }
  async function closeMenu() {
    if (menuBusy || !menuOpen) return;
    menuBusy = true;
    menu.classList.remove('ready');
    if (!reduceMotion) await settle([menu.animate([{opacity:1},{opacity:0}],{duration:110,fill:'forwards'}),...bars.map((bar,i) => bar.animate([{transform:'scaleY(1)'},{transform:'scaleY(0)'}],{duration:165,delay:i*20,easing:'ease-in',fill:'forwards'}))]);
    resetMenu();
    returnFocus?.focus?.();
  }
  toggle.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
  close.addEventListener('click',closeMenu);
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(); return; }
    if (event.key === 'Tab') {
      const focusable = [...menu.querySelectorAll('a,button')].filter(element => element.offsetParent !== null);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  menu.querySelectorAll('.full-menu-row').forEach(row => {
    const hover = row.querySelector('.full-menu-hover');
    row.addEventListener('pointerenter',event => {
      if (event.pointerType === 'touch') return;
      const box = row.getBoundingClientRect();
      hover.style.transition = 'none';
      hover.style.transform = event.clientY < box.top + box.height/2 ? 'translateY(-101%)' : 'translateY(101%)';
      requestAnimationFrame(() => { hover.style.transition = 'transform 300ms cubic-bezier(.33,1,.68,1)'; hover.style.transform = 'translateY(0)'; });
    });
    row.addEventListener('pointerleave',event => {
      const box = row.getBoundingClientRect();
      hover.style.transform = event.clientY < box.top + box.height/2 ? 'translateY(-101%)' : 'translateY(101%)';
    });
    row.addEventListener('focusin',() => { hover.style.transition = 'transform 200ms ease'; hover.style.transform = 'translateY(0)'; });
    row.addEventListener('focusout',() => { hover.style.transform = 'translateY(101%)'; });
  });

  const headerCurrent=header.querySelector('.site-current');
  const headerCount=header.querySelector('.site-page-count');
  const menuRows=[...menu.querySelectorAll('.full-menu-row')];
  let activeIndex=-1;
  function updateActiveSection() {
    const threshold = innerHeight * .38;
    let index = 0;
    sections.forEach((section,i) => { if (section.getBoundingClientRect().top <= threshold) index = i; });
    if(index===activeIndex)return index;
    activeIndex=index;
    headerCurrent.textContent = pages[index].label;
    headerCount.textContent = `${String(index+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
    menuLinks.forEach(link => {
      if (link.dataset.section === pages[index].id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    menuRows.forEach((row,i) => { row.dataset.current = String(i === index); });
    return index;
  }
  let scrollTicking = false;
  updateActiveSection();
  addEventListener('scroll',() => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateActiveSection();
      scrollTicking = false;
    });
  },{passive:true});
  addEventListener('resize',updateActiveSection,{passive:true});

  const revealSelectors = [
    '#machines .machine',
    '#selection h2','#selection .fields > div','#selection .selector-action','#selection .selector-art',
    '#work .work-heading','#work .work-disclosure',
    '#geography .coverage-copy h2','#geography .map-shell',
    '#faq h2','#faq details','#faq .art-side',
    '#enquiry h2','#enquiry .field','#enquiry .form-footer'
  ];
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealItems = [...document.querySelectorAll(revealSelectors.join(','))];
    revealItems.forEach((item,i) => {
      item.classList.add('reveal-item');
      item.style.setProperty('--reveal-delay',`${(i % 4)*90}ms`);
    });
    document.documentElement.classList.add('reveal-enabled');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio >= .25) entry.target.classList.add('is-visible');
        else if (!entry.isIntersecting) entry.target.classList.remove('is-visible');
      });
    },{threshold:[0,.25],rootMargin:'0px 0px -12% 0px'});
    revealItems.forEach(item => revealObserver.observe(item));
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/image-cache-sw.js').catch(()=>{});
  }

  function scrollToSection(id,historyMode='push',behavior=reduceMotion?'instant':'smooth') {
    const section = document.getElementById(id);
    if (!section) return;
    if (historyMode === 'push' && location.hash !== `#${id}`) history.pushState(null,'',`#${id}`);
    section.scrollIntoView({behavior,block:'start'});
    requestAnimationFrame(updateActiveSection);
  }
  async function navigateFromMenu(id) {
    if (navigating || !document.getElementById(id)) return;
    navigating = true;
    if (reduceMotion || !window.ligarentWipe) {
      resetMenu();
      scrollToSection(id,'push','instant');
      navigating = false;
      return;
    }
    try {
      await window.ligarentWipe({ onCovered: () => {
        resetMenu();
        scrollToSection(id,'push','instant');
      }});
    } finally {
      if (menuOpen) resetMenu();
      navigating = false;
    }
  }
  menuLinks.forEach(link => link.addEventListener('click',event => {
    event.preventDefault();
    navigateFromMenu(link.dataset.section);
  }));
  window.ligarentNavigate = target => {
    const id = target.replace(/^#/, '').replace(/\.html$/, '');
    scrollToSection(id);
  };
  addEventListener('popstate',() => {
    const id = location.hash.slice(1);
    if (pages.some(page => page.id === id)) scrollToSection(id,'none','instant');
  });
  if (location.hash) requestAnimationFrame(() => {
    const id = location.hash.slice(1);
    if (pages.some(page => page.id === id)) scrollToSection(id,'none','instant');
  });
})();
