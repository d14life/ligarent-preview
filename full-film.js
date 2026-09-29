(() => {
  const video = document.getElementById('full-film');
  const play = document.getElementById('film-play');
  if (!video || !play) return;

  const openSite = () => location.replace('./site.html');
  video.addEventListener('ended', () => {
    document.body.classList.add('is-ending');
    setTimeout(openSite, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
  });
  video.addEventListener('error', () => { play.hidden = false; play.textContent = 'Видео не загрузилось — открыть сайт'; });
  play.addEventListener('click', () => {
    if (video.error) { openSite(); return; }
    video.play().then(() => { play.hidden = true; }).catch(() => { play.hidden = false; });
  });

  // Honor reduced-motion settings while leaving the complete film available.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
    play.hidden = false;
    return;
  }
  video.play().catch(() => { play.hidden = false; });
})();
