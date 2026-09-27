(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const overlay = document.createElement('div');
  overlay.className = 'brand-transition';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  overlay.innerHTML = '<div class="brand-transition__panel"><span class="brand-transition__yellow"></span><span class="brand-transition__black"></span><span class="brand-transition__sign"><span class="logo">LIGARENT</span></span></div>';
  document.body.append(overlay);

  const panel = overlay.firstElementChild;
  const sign = overlay.querySelector('.brand-transition__sign');
  let active = null;

  window.ligarentWipe = ({ onCovered, kind = 'navigation' } = {}) => {
    if (reducedMotion.matches || !window.gsap || document.body.classList.contains('intro-playing')) {
      onCovered?.();
      return Promise.resolve();
    }
    if (active) return kind === 'scroll' ? Promise.resolve() : active.then(() => window.ligarentWipe({ onCovered, kind }));

    overlay.hidden = false;
    const { gsap } = window;
    gsap.set(panel, { xPercent: -105 });
    gsap.set(sign, { scale: .88, opacity: 0 });
    active = new Promise(resolve => {
      const finish = () => {
        overlay.hidden = true;
        gsap.set(panel, { clearProps: 'transform' });
        gsap.set(sign, { clearProps: 'transform,opacity' });
        active = null;
        resolve();
      };
      gsap.timeline({ onComplete: finish })
        .to(panel, { xPercent: 0, duration: .75, ease: 'power2.inOut' })
        .to(sign, { scale: 1, opacity: 1, duration: .4, ease: 'power2.out' }, .31)
        .call(() => onCovered?.())
        .to(panel, { xPercent: 105, duration: .75, ease: 'power2.inOut' }, '+=.3');
    });
    return active;
  };
})();
