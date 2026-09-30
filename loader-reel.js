(() => {
  const reel = document.getElementById('opening-reel');
  const video = document.getElementById('opening-video');
  const progress = document.getElementById('opening-progress');
  const count = document.getElementById('opening-count');
  if (!reel || !video || !progress || !count) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const returning = new URLSearchParams(location.search).has('reverse');
  function releaseIntro() {
    reel.hidden = true;
    reel.inert = true;
    reel.setAttribute('aria-busy', 'false');
    video.pause();
    video.removeAttribute('src');
    video.load();
    document.body.classList.remove('is-loading');
    document.dispatchEvent(new Event('intro-loader-ready'));
  }

  // Backward scrolling from the site returns directly to clip 1's frames.
  if (returning) {
    releaseIntro();
    return;
  }
  if (reducedMotion) {
    releaseIntro();
    return;
  }

  let closing = false;
  const safetyTimer = setTimeout(() => finish(false), 8000);
  function finish(animate) {
    if (closing) return;
    closing = true;
    clearTimeout(safetyTimer);
    video.pause();
    const poster = document.getElementById('poster');
    const target = poster?.querySelector('.poster__brand');
    if (!animate || !globalThis.gsap || !target) {
      releaseIntro();
      return;
    }

    // Capture the exact last video sign, so the handoff never paints two signs.
    const fit = Math.max(innerWidth / 1280, innerHeight / 720);
    const sourceWidth = 304 * fit;
    const sourceX = (innerWidth - 1280 * fit) / 2 + 333 * fit;
    const sourceY = (innerHeight - 720 * fit) / 2 + 122 * fit;
    const sourceVisible = sourceX + sourceWidth > 0 && sourceX < innerWidth;
    let captured = null;
    try {
      captured = document.createElement('canvas');
      captured.width = 304;
      captured.height = 83;
      captured.getContext('2d').drawImage(video, 333, 122, 304, 83, 0, 0, 304, 83);
      captured.className = 'opening-reel__captured-mark';
      captured.style.width = `${sourceWidth}px`;
      captured.style.height = `${83 * fit}px`;
      document.body.append(captured);
    } catch (_) {
      captured?.remove();
      captured = null;
    }

    // Morph that single captured mark into the clean header mark while the
    // actual bulldozer hero fades up underneath it.
    const clone = target.cloneNode(true);
    clone.classList.add('opening-reel__moving-mark');
    clone.setAttribute('aria-hidden', 'true');
    document.body.append(clone);
    const destination = target.getBoundingClientRect();
    const cloneRect = clone.getBoundingClientRect();
    const { gsap } = globalThis;
    const previousBackground = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000';
    target.style.visibility = 'hidden';
    gsap.set(poster, { opacity: 0 });
    gsap.set(clone, {
      x: sourceVisible ? sourceX : destination.left,
      y: sourceVisible ? sourceY : destination.top,
      scale: sourceVisible ? sourceWidth / Math.max(1, cloneRect.width) : 1,
      opacity: captured ? 0 : 1
    });
    if (captured) gsap.set(captured, { x: sourceX, y: sourceY, opacity: 1 });
    // Remove the video in the same paint that installs its captured sign.
    reel.style.transition = 'none';
    gsap.set(reel, { opacity: 0 });
    let completed = false;
    const complete = () => {
      if (completed) return;
      completed = true;
      clearTimeout(animationSafety);
      target.style.visibility = '';
      gsap.set(poster, { clearProps: 'opacity' });
      document.body.style.backgroundColor = previousBackground;
      captured?.remove();
      clone.remove();
      releaseIntro();
    };
    const animationSafety = setTimeout(complete, 1500);
    const timeline = gsap.timeline({ onComplete: complete })
      .to(poster, { opacity: 1, duration: .42, ease: 'power1.out' }, 0)
      .to(clone, { x: destination.left, y: destination.top, scale: 1,
        duration: .5, ease: 'power2.out' }, 0)
      .call(() => { target.style.visibility = ''; }, null, .44)
      .to(clone, { opacity: 0, duration: .08, ease: 'power1.out' }, .44);
    if (captured) timeline
      .to(captured, { x: destination.left, y: destination.top,
        scale: destination.width / sourceWidth, duration: .5, ease: 'power2.out' }, 0)
      .to(captured, { opacity: 0, duration: .16, ease: 'power1.out' }, .18)
      .to(clone, { opacity: 1, duration: .16, ease: 'power1.out' }, .18);
  }

  function updateProgress() {
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 5.5;
    const ratio = Math.min(1, video.currentTime / duration);
    progress.style.width = `${Math.round(ratio * 100)}%`;
    const clip = video.currentTime < 8 / 3 ? '02' : video.currentTime < 14.541667 / 3 ? '03' : '04';
    count.textContent = `${clip} / 04 · ${Math.round(ratio * 100)}%`;
  }
  video.addEventListener('waiting', () => { count.textContent = 'Загружаем видео…'; });
  video.addEventListener('playing', () => {
    updateProgress();
    document.dispatchEvent(new Event('intro-loader-playing'));
  }, { once: true });
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('ended', () => { updateProgress(); finish(true); });
  video.addEventListener('error', () => finish(false));

  // Only the first intro is scroll-controlled; the opening reel finishes itself.
  function blockScroll(event) {
    if (reel.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  addEventListener('wheel', blockScroll, { capture: true, passive: false });
  addEventListener('touchmove', blockScroll, { capture: true, passive: false });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) blockScroll(event);
  }, true);

  video.play().catch(() => finish(false));
})();
