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
    location.replace('./site.html');
    return;
  }

  let closing = false;
  const safetyTimer = setTimeout(() => finish(false), 12000);
  function finish(showHandoff) {
    if (closing) return;
    closing = true;
    clearTimeout(safetyTimer);
    video.pause();
    location.replace(`./site.html${showHandoff ? '?from=reel' : ''}`);
  }

  function updateProgress() {
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 19.041667;
    const ratio = Math.min(1, video.currentTime / duration);
    progress.style.width = `${Math.round(ratio * 100)}%`;
    const clip = ratio < 8 / 19.041667 ? '02' : ratio < 14.541667 / 19.041667 ? '03' : '04';
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
