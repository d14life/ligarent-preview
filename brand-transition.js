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

// Clip 4 ends on the isolated sign, before its obsolete rendered page appears.
// Hold that frame across navigation, then move the sign into the live header.
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'reel') return;
  const overlay = document.createElement('div');
  overlay.className = 'reel-entry-frame';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);
  const curtain = document.createElement('div');
  curtain.className = 'reel-entry-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  document.body.append(curtain);
  document.body.classList.add('intro-playing');
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const blockInput = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  addEventListener('wheel', blockInput, { capture: true, passive: false });
  addEventListener('touchmove', blockInput, { capture: true, passive: false });
  let clone = null;
  let target = null;
  let timeline = null;
  let done = false;
  const safety = setTimeout(cleanup, 2500);

  function cleanup() {
    if (done) return;
    done = true;
    clearTimeout(safety);
    timeline?.kill();
    target?.style.removeProperty('visibility');
    clone?.remove();
    overlay.remove();
    curtain.remove();
    document.body.style.overflow = previousOverflow;
    document.body.classList.remove('intro-playing');
    removeEventListener('wheel', blockInput, true);
    removeEventListener('touchmove', blockInput, true);
    const url = new URL(location.href);
    url.searchParams.delete('from');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function animateEntry() {
    target = document.querySelector('.site-brand .logo');
    if (!target || !window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cleanup();
      return;
    }
    clone = target.cloneNode(true);
    clone.classList.add('reel-entry-logo');
    clone.setAttribute('aria-hidden', 'true');
    document.body.append(clone);
    const destination = target.getBoundingClientRect();
    const cloneRect = clone.getBoundingClientRect();
    const fit = Math.max(innerWidth / 1280, innerHeight / 720);
    const sourceX = (innerWidth - 1280 * fit) / 2 + 333 * fit;
    const sourceY = (innerHeight - 720 * fit) / 2 + 122 * fit;
    const sourceVisible = sourceX >= 0 && sourceX < innerWidth;
    target.style.visibility = 'hidden';
    const { gsap } = window;
    timeline = gsap.timeline({ onComplete: cleanup })
      .to(curtain, { opacity: 1, duration: .17, ease: 'power1.in' }, 0)
      .set(overlay, { opacity: 0 }, .17)
      .fromTo(clone,
        { x: sourceVisible ? sourceX : destination.left, y: sourceVisible ? sourceY : destination.top,
          scale: sourceVisible ? 304 * fit / Math.max(1, cloneRect.width) : 1,
          rotation: sourceVisible ? -1 : 0, opacity: 0 },
        { x: destination.left, y: destination.top, scale: destination.width / Math.max(1, cloneRect.width),
          rotation: 0, opacity: 1, duration: .31, ease: 'power2.out' }, .12)
      .to(curtain, { opacity: 0, duration: .28, ease: 'power2.out' }, .22)
      .call(() => { target.style.visibility = ''; }, null, .43)
      .to(clone, { opacity: 0, duration: .09, ease: 'power1.out' }, .44);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', animateEntry, { once: true });
  else requestAnimationFrame(animateEntry);
})();
