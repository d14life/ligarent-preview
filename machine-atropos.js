(() => {
  if (!window.Atropos) return;

  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...document.querySelectorAll('#machine-grid .machine-atropos')];
  const visibleCards = new Set();
  const instances = new Map();

  function reset(card) {
    const instance = instances.get(card);
    if (!instance) return;
    instance.destroy();
    instances.delete(card);
    card.classList.remove('atropos-active');
    card.querySelector('.atropos-highlight')?.remove();
    card.querySelectorAll('.atropos-scale,.atropos-rotate,[data-atropos-offset]').forEach(element => {
      element.style.removeProperty('transform');
      element.style.removeProperty('transition-duration');
      element.style.removeProperty('transition-timing-function');
    });
  }

  function sync(card) {
    if (!visibleCards.has(card) || motionPreference.matches) {
      reset(card);
      return;
    }
    if (instances.has(card)) return;
    instances.set(card, Atropos({
      el: card,
      activeOffset: 32,
      rotateXMax: 12,
      rotateYMax: 15,
      rotateTouch: 'scroll-y',
      duration: 300,
      shadow: false,
      highlight: true
    }));
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleCards.add(entry.target);
        else visibleCards.delete(entry.target);
        sync(entry.target);
      });
    }, {rootMargin: '200px 0px'});
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(card => { visibleCards.add(card); sync(card); });
  }
  motionPreference.addEventListener?.('change', () => cards.forEach(sync));
})();
