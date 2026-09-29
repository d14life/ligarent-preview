(() => {
  const reel = document.getElementById('opening-reel');
  const video = document.getElementById('opening-video');
  const progress = document.getElementById('opening-progress');
  if (!reel || !video || !progress) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const returning = new URLSearchParams(location.search).has('reverse');
  function releaseIntro() {
    reel.hidden = true;
    reel.inert = true;
    reel.setAttribute('aria-busy', 'false');
    document.body.classList.remove('is-loading');
    document.dispatchEvent(new Event('intro-loader-ready'));
  }

  // Returning from the live site goes straight to the scroll-controlled frames.
  if (returning || reducedMotion) {
    releaseIntro();
    return;
  }

  let closing = false;
  const safetyTimer = setTimeout(finish, 12000);
  function finish() {
    if (closing) return;
    closing = true;
    clearTimeout(safetyTimer);
    reel.classList.add('is-done');
    setTimeout(() => {
      releaseIntro();
      video.pause();
      video.removeAttribute('src');
      video.load();
    }, 360);
  }

  video.addEventListener('timeupdate', () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      progress.style.width = `${Math.min(100, 100 * video.currentTime / video.duration)}%`;
    }
  });
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);

  // The reel plays on its own; input controls only the first intro's frames.
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
  video.playbackRate = 2;
  video.play().catch(finish);
})();
