(() => {
  const reel = document.getElementById('opening-reel');
  const video = document.getElementById('opening-video');
  const progress = document.getElementById('opening-progress');
  const poster = document.getElementById('poster');
  const introTrigger = document.getElementById('start-film');
  if (!reel || !video || !progress || !poster || !introTrigger) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const returning = new URLSearchParams(location.search).has('reverse');
  let finished = reducedMotion || returning;
  let closing = false;
  let revealed = false;

  function updateProgress() {
    if (!Number.isFinite(video.duration) || !video.duration) return;
    progress.style.width = `${Math.min(100, 100 * video.currentTime / video.duration)}%`;
  }

  function reveal(force = false) {
    if (!finished || closing || (!force && introTrigger.disabled)) return;
    closing = true;
    clearInterval(readyPoll);
    clearTimeout(safetyTimer);
    reel.setAttribute('aria-busy', 'false');
    reel.classList.add('is-done');
    setTimeout(() => {
      reel.hidden = true;
      reel.inert = true;
      reel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-loading');
      poster.inert = false;
      poster.setAttribute('aria-hidden', 'false');
      revealed = true;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }, reducedMotion || returning ? 0 : 380);
  }

  const readyPoll = setInterval(() => reveal(), 100);
  const safetyTimer = setTimeout(() => {
    finished = true;
    reveal(true);
  }, 30000);

  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('ended', () => {
    updateProgress();
    finished = true;
    reveal();
  });
  video.addEventListener('error', () => {
    finished = true;
    reveal();
  });

  // Do not let the film's scroll handlers run until the loader has faded away.
  const blockScroll = event => {
    if (revealed) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  addEventListener('wheel', blockScroll, { capture: true, passive: false });
  addEventListener('touchmove', blockScroll, { capture: true, passive: false });
  addEventListener('keydown', event => {
    if (revealed) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) blockScroll(event);
  }, true);

  if (finished) {
    reveal();
  } else {
    video.src = video.dataset.src;
    video.playbackRate = 2;
    video.play().catch(() => { finished = true; reveal(); });
  }
})();
