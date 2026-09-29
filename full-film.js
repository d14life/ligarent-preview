(() => {
  const shell = document.getElementById('full-film-overlay');
  const picture = document.getElementById('film-picture');
  const video = document.getElementById('full-film');
  const mark = document.getElementById('film-mark');
  const physical = mark?.querySelector('img');
  const play = document.getElementById('film-play');
  const skip = document.getElementById('film-skip');
  const target = document.querySelector('.site-brand .logo');
  if (!shell || !picture || !video || !mark || !physical || !play || !skip || !target) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageParts = [document.querySelector('.site-header'), document.querySelector('main'), document.querySelector('.footer')].filter(Boolean);
  let finished = false;
  let timeline;

  function finish() {
    if (finished) return;
    finished = true;
    timeline?.kill();
    video.pause();
    target.style.removeProperty('visibility');
    shell.remove();
    document.body.classList.remove('film-playing');
    pageParts.forEach(part => { part.inert = false; });
  }

  function handoff() {
    if (finished || !window.gsap || reduceMotion) { finish(); return; }
    // Coordinates from the saved four-clip cut: the film ends with this exact
    // physical sign on black, before an obsolete page baked into later footage.
    const fit = Math.max(innerWidth / 1920, innerHeight / 1080);
    const x = (innerWidth - 1920 * fit) / 2 + 515 * fit;
    const y = (innerHeight - 1080 * fit) / 2 + 190 * fit;
    const width = 468 * fit;
    const height = 125 * fit;
    const destination = target.getBoundingClientRect();
    const scale = destination.width / width;
    const { gsap } = window;
    const flying = target.cloneNode(true);
    flying.classList.add('full-film__flying-logo');
    flying.setAttribute('aria-hidden', 'true');
    flying.style.fontSize = getComputedStyle(target).fontSize;
    shell.append(flying);
    const flyingRect = flying.getBoundingClientRect();
    const flyingScale = width / Math.max(1, flyingRect.width);
    const flyingY = y + (height - flyingRect.height * flyingScale) / 2;

    // Install the identical still sign before hiding the decoded video frame.
    Object.assign(mark.style, { display: 'block', left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
    gsap.set(mark, { x: 0, y: 0, scale: 1 });
    gsap.set(physical, { opacity: 1 });
    gsap.set(flying, { left: x, top: flyingY, x: 0, y: 0, scale: flyingScale, opacity: 0 });
    target.style.visibility = 'hidden';
    skip.hidden = true;
    video.style.visibility = 'hidden';

    timeline = gsap.timeline({ onComplete: finish })
      .to(mark, { x: destination.left - x, y: destination.top - y, scale, duration: 1.25, ease: 'power3.out' }, 0)
      .to(flying, { x: destination.left - x, y: destination.top - flyingY, scale: 1, duration: 1.25, ease: 'power3.out' }, 0)
      .to(physical, { opacity: 0, duration: .38, ease: 'power1.inOut' }, .56)
      .to(flying, { opacity: 1, duration: .38, ease: 'power1.inOut' }, .56)
      .to(picture, { opacity: 0, duration: .65, ease: 'power2.out' }, .68)
      .to(mark, { opacity: 0, duration: .1 }, 1.0);
  }

  skip.addEventListener('click', finish);
  play.addEventListener('click', () => {
    if (video.error) { finish(); return; }
    video.play().then(() => { play.hidden = true; }).catch(() => { play.hidden = false; });
  });
  video.addEventListener('ended', handoff, { once: true });
  video.addEventListener('error', () => {
    play.hidden = false;
    play.textContent = 'Видео не загрузилось — открыть сайт';
  }, { once: true });
  pageParts.forEach(part => { part.inert = true; });
  if (reduceMotion) { finish(); return; }
  video.play().catch(() => { play.hidden = false; });
})();
