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
  const safetyTimer = setTimeout(() => finish(false), 12000);
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

    // The generated reel ends on the sign against black. Move a live copy of
    // that sign into the bulldozer hero header; the fleet page comes later.
    const clone = target.cloneNode(true);
    clone.classList.add('opening-reel__moving-mark');
    clone.setAttribute('aria-hidden', 'true');
    document.body.append(clone);
    const destination = target.getBoundingClientRect();
    const cloneRect = clone.getBoundingClientRect();
    const fit = Math.max(innerWidth / 1280, innerHeight / 720);
    const sourceX = (innerWidth - 1280 * fit) / 2 + 333 * fit;
    const sourceY = (innerHeight - 720 * fit) / 2 + 122 * fit;
    const sourceVisible = sourceX >= 0 && sourceX < innerWidth;
    const { gsap } = globalThis;
    target.style.visibility = 'hidden';
    gsap.set(poster, { opacity: 0 });
    gsap.set(clone, {
      x: sourceVisible ? sourceX : destination.left,
      y: sourceVisible ? sourceY : destination.top,
      scale: sourceVisible ? 304 * fit / Math.max(1, cloneRect.width) : 1,
      opacity: 0
    });
    const complete = () => {
      target.style.visibility = '';
      gsap.set(poster, { clearProps: 'opacity' });
      clone.remove();
      releaseIntro();
    };
    gsap.timeline({ onComplete: complete })
      .to(reel, { opacity: 0, duration: .42, ease: 'power1.inOut' }, 0)
      .to(poster, { opacity: 1, duration: .4, ease: 'power1.out' }, .06)
      .to(clone, { opacity: 1, duration: .12, ease: 'power1.out' }, 0)
      .to(clone, { x: destination.left, y: destination.top, scale: 1,
        duration: .48, ease: 'power2.out' }, .04)
      .call(() => { target.style.visibility = ''; }, null, .42)
      .to(clone, { opacity: 0, duration: .1, ease: 'power1.out' }, .43);
  }

  function updateProgress() {
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 16.5;
    const ratio = Math.min(1, video.currentTime / duration);
    progress.style.width = `${Math.round(ratio * 100)}%`;
    const clip = video.currentTime < 8 ? '02' : video.currentTime < 14.541667 ? '03' : '04';
    count.textContent = `${clip} / 04 · ${Math.round(ratio * 100)}%`;
  }
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

  video.src = video.dataset.src;
  video.playbackRate = 3;
  video.play().catch(() => finish(false));
})();
