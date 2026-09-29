(() => {
  const poster = document.getElementById('poster');
  const trigger = document.getElementById('start-film');
  const runway = document.getElementById('poster-runway');
  const filmStage = document.getElementById('film-stage');
  const film = document.getElementById('film');
  const skipButton = document.getElementById('film-skip');
  const siteStage = document.getElementById('site-stage');
  const siteFrame = document.getElementById('live-site');
  const headline = document.getElementById('hero-title');
  const details = [...poster.querySelectorAll('.poster__details > span')];
  const editor = document.getElementById('headline-editor');
  const editorToggle = document.getElementById('editor-toggle');
  const editorClose = document.getElementById('editor-close');
  const editorReset = document.getElementById('editor-reset');
  const controls = [...editor.querySelectorAll('input[data-axis]')];
  const detailAxes = details.flatMap((_, index) => [`detail${index + 1}X`, `detail${index + 1}Y`]);
  const axes = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'scale', 'copyY', 'uiX', 'uiY', ...detailAxes];
  const values = Object.fromEntries(axes.map(axis => [axis, axis === 'scale' ? 1 : 0]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Decode once; scrolling only draws an already prepared frame. No seeks,
  // playback clock, easing loop, or asynchronous frame swap follows input.
  const sequenceSize = innerWidth <= 900 || matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
  const FRAME_COUNT = 87;
  const FIRST_CLIP_END = 7.25;
  const SCROLL_PIXELS_PER_SECOND = 180;
  const frames = new Array(FRAME_COUNT);
  const context = film.getContext('2d', { alpha: false });
  let drawnFrame = -1;
  let assetsReady = false;
  let siteReady = false;
  let sequenceFailed = false;
  let leadDistance = 0;
  let filmDistance = 0;
  let handoffDistance = 0;
  let totalDistance = 0;
  let renderPending = false;
  let siteInteractive = false;
  let occlusionMetrics = null;
  let reverseScrollDocument = null;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const smoothstep = (start, end, value) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };

  async function preloadSequence() {
    if (reduceMotion) return;
    const response = await fetch(`assets/intro-sequence/${sequenceSize}.frames`, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Intro frames unavailable');
    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);
    if (view.getUint32(0, true) !== FRAME_COUNT) throw new Error('Invalid intro frame count');
    let offset = 4 + FRAME_COUNT * 4;
    const slices = Array.from({ length: FRAME_COUNT }, (_, index) => {
      const length = view.getUint32(4 + index * 4, true);
      const start = offset;
      offset += length;
      return [start, offset];
    });
    if (offset !== buffer.byteLength) throw new Error('Invalid intro frame bundle');
    let next = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < FRAME_COUNT) {
        const index = next++;
        const [start, end] = slices[index];
        frames[index] = await createImageBitmap(new Blob([buffer.slice(start, end)], { type: 'image/webp' }));
      }
    }));
  }

  function drawFrame(index) {
    if (index === drawnFrame || !frames[index]) return;
    const frame = frames[index];
    const scale = Math.max(film.width / frame.width, film.height / frame.height);
    const width = frame.width * scale;
    const height = frame.height * scale;
    context.drawImage(frame, (film.width - width) * (innerWidth <= 600 ? .63 : .5), (film.height - height) / 2, width, height);
    drawnFrame = index;
    film.dataset.frame = String(index);
  }

  function prepareSite() {
    siteFrame.src = siteFrame.dataset.src;
    const started = performance.now();
    const poll = setInterval(() => {
      try {
        const siteDocument = siteFrame.contentDocument;
        if (siteDocument?.querySelector('#machine-grid article')) {
          siteReady = true;
          attachReverseScroll();
          scheduleRender();
          clearInterval(poll);
        } else if (performance.now() - started > 20000) {
          clearInterval(poll);
        }
      } catch (_) { clearInterval(poll); }
    }, 50);
  }

  async function prepareSequence() {
    try {
      await preloadSequence();
      assetsReady = true;
      trigger.disabled = false;
      updateScrollLayout();
      renderScroll();
    } catch (error) {
      sequenceFailed = true;
      trigger.disabled = false;
      console.error('Intro frames could not be prepared:', error);
      trigger.querySelector('span').textContent = 'Открыть сайт';
      trigger.setAttribute('aria-label', 'Открыть сайт напрямую');
    }
  }

  function applyHeadline() {
    for (const axis of axes) {
      const unit = axis === 'scale' ? '' : axis.startsWith('r') ? 'deg' : 'px';
      if (axis === 'copyY') {
        poster.style.setProperty('--copy-edit-y', `${values[axis]}px`);
      } else if (axis === 'uiX' || axis === 'uiY') {
        poster.style.setProperty(`--ui-edit-${axis === 'uiX' ? 'x' : 'y'}`, `${values[axis]}px`);
      } else if (detailAxes.includes(axis)) {
        const index = Number(axis.slice(6, 7)) - 1;
        details[index].style.setProperty(axis.endsWith('X') ? '--detail-x' : '--detail-y', `${values[axis]}px`);
      } else {
        headline.style.setProperty(`--headline-${axis}`, `${values[axis]}${unit}`);
      }
      const control = editor.querySelector(`input[data-axis="${axis}"]`);
      const output = editor.querySelector(`output[data-value="${axis}"]`);
      control.value = values[axis];
      output.value = `${values[axis]}${axis === 'scale' ? '×' : axis.startsWith('r') ? '°' : ''}`;
    }
    occlusionMetrics = null;
  }

  function saveHeadline() {
    try { localStorage.setItem('ligarent-headline-3d', JSON.stringify(values)); } catch (_) {}
  }

  try {
    const saved = JSON.parse(localStorage.getItem('ligarent-headline-3d') || '{}');
    for (const axis of axes) {
      const control = editor.querySelector(`input[data-axis="${axis}"]`);
      const number = Number(saved[axis]);
      if (Number.isFinite(number)) values[axis] = Math.min(Number(control.max), Math.max(Number(control.min), number));
    }
  } catch (_) {}
  applyHeadline();

  const editRequested = new URLSearchParams(location.search).has('edit');
  if (editRequested || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) editorToggle.hidden = false;
  function setEditorOpen(open) {
    editor.hidden = !open;
    editorToggle.setAttribute('aria-expanded', String(open));
    editorToggle.textContent = open ? 'Скрыть настройки' : 'Настроить текст';
    poster.classList.toggle('is-editing', open);
  }
  if (editRequested) setEditorOpen(true);
  editorToggle.addEventListener('click', () => setEditorOpen(editor.hidden));
  for (const control of controls) {
    control.addEventListener('input', () => {
      values[control.dataset.axis] = Number(control.value);
      applyHeadline();
      saveHeadline();
      scheduleRender();
    });
  }
  editorClose.addEventListener('click', () => {
    setEditorOpen(false);
  });
  editorReset.addEventListener('click', () => {
    for (const axis of axes) values[axis] = axis === 'scale' ? 1 : 0;
    applyHeadline();
    saveHeadline();
    scheduleRender();
  });

  function enablePositionDrag(element, xAxis, yAxis) {
    let drag = null;
    element.addEventListener('pointerdown', event => {
      if (editor.hidden || scrollY > 1) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: values[xAxis], startY: values[yAxis] };
    });
    element.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const xControl = editor.querySelector(`input[data-axis="${xAxis}"]`);
      const yControl = editor.querySelector(`input[data-axis="${yAxis}"]`);
      values[xAxis] = Math.round(clamp(drag.startX + event.clientX - drag.x, Number(xControl.min), Number(xControl.max)));
      values[yAxis] = Math.round(clamp(drag.startY + event.clientY - drag.y, Number(yControl.min), Number(yControl.max)));
      applyHeadline();
      scheduleRender();
    });
    function endDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag = null;
      saveHeadline();
    }
    element.addEventListener('pointerup', endDrag);
    element.addEventListener('pointercancel', endDrag);
  }
  enablePositionDrag(headline, 'x', 'y');
  details.forEach((detail, index) => enablePositionDrag(detail, `detail${index + 1}X`, `detail${index + 1}Y`));

  function updateScrollLayout() {
    leadDistance = 120;
    filmDistance = reduceMotion ? 0 : FIRST_CLIP_END * SCROLL_PIXELS_PER_SECOND;
    handoffDistance = 240;
    totalDistance = leadDistance + filmDistance + handoffDistance;
    // Account for mobile browser chrome: the sticky poster uses svh, while
    // the current viewport may be taller. The final handoff must stay reachable.
    runway.style.height = `${totalDistance + innerHeight - poster.offsetHeight}px`;
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
    film.width = Math.round(innerWidth * pixelRatio);
    film.height = Math.round(innerHeight * pixelRatio);
    drawnFrame = -1;
  }

  // Left edge of the approaching bulldozer/blade in the 1280 × 720 video.
  // Keeping the headline on the sky side of this contour makes the machine
  // pass in front of stationary lettering instead of moving the lettering away.
  const contourHeights = [0, 120, 220, 300, 450, 720];
  const bulldozerContour = [
    [0,    900, 850, 780, 710, 460, 0],
    [1.5,  760, 675, 650, 600, 350, -80],
    [3,    580, 540, 510, 410, 0, -100],
    [3.5,  510, 495, 460, 300, -60, -120],
    [4.25, 380, 370, 345, -20, -120, -120],
    [5,    180, -40, -100, -120, -120, -120]
  ];

  function sampleBulldozerEdge(time, height) {
    const nextIndex = bulldozerContour.findIndex(frame => frame[0] >= time);
    const frameIndex = nextIndex < 0 ? bulldozerContour.length - 1 : nextIndex;
    const after = bulldozerContour[frameIndex];
    const before = bulldozerContour[Math.max(0, frameIndex - 1)];
    const blend = before === after ? 0 : clamp((time - before[0]) / (after[0] - before[0]));
    let heightIndex = contourHeights.findIndex(value => value >= height);
    if (heightIndex < 0) heightIndex = contourHeights.length - 1;
    const upper = Math.max(0, heightIndex - 1);
    const heightBlend = upper === heightIndex ? 0 : clamp((height - contourHeights[upper]) / (contourHeights[heightIndex] - contourHeights[upper]));
    return lerp(lerp(before[upper + 1], before[heightIndex + 1], heightBlend),
      lerp(after[upper + 1], after[heightIndex + 1], heightBlend), blend);
  }

  function renderHeadlineOcclusion(time, active) {
    if (!active) {
      headline.style.clipPath = '';
      return;
    }
    if (!occlusionMetrics) {
      const stage = filmStage.getBoundingClientRect();
      const title = headline.getBoundingClientRect();
      const scale = Math.max(stage.width / 1280, stage.height / 720);
      occlusionMetrics = {
        title,
        scale,
        offsetX: stage.left + (stage.width - 1280 * scale) * (innerWidth <= 600 ? .63 : .5),
        offsetY: stage.top + (stage.height - 720 * scale) / 2
      };
    }
    const { title, scale, offsetX, offsetY } = occlusionMetrics;
    const enter = smoothstep(0, 1, time);
    // A closely sampled silhouette avoids the long straight diagonal that used
    // to slice through entire words as the blade passed the headline.
    const points = Array.from({ length: 33 }, (_, index) => index / 32).map(fraction => {
      const sourceY = (title.top + title.height * fraction - offsetY) / scale;
      const machineX = offsetX + (sampleBulldozerEdge(time, sourceY) - 4) * scale;
      const boundary = lerp(title.right + title.width, machineX, enter);
      const relativeX = 100 * (boundary - title.left) / Math.max(1, title.width);
      return `${relativeX.toFixed(2)}% ${(100 * fraction).toFixed(2)}%`;
    });
    headline.style.clipPath = `polygon(0 0, ${points.join(', ')}, 0 100%)`;
  }

  function setSiteInteractive(active) {
    if (siteInteractive === active) return;
    siteInteractive = active;
    siteStage.classList.toggle('is-active', active);
    siteStage.inert = !active;
    siteStage.setAttribute('aria-hidden', String(!active));
    siteFrame.tabIndex = active ? 0 : -1;
  }

  function renderScroll() {
    if (!assetsReady) return;
    const distance = clamp(scrollY, 0, totalDistance);
    const lead = clamp(distance / leadDistance);
    const frameIndex = reduceMotion ? 0 : Math.round(clamp((distance - leadDistance) / filmDistance) * (FRAME_COUNT - 1));
    const filmTime = frameIndex / (FRAME_COUNT - 1) * FIRST_CLIP_END;
    const first = reduceMotion ? 1 : clamp(filmTime / FIRST_CLIP_END);
    const outro = clamp((distance - leadDistance - filmDistance) / handoffDistance);
    const otherUi = 1 - smoothstep(.03, .9, lead);
    const titleOpacity = reduceMotion ? 1 - lead : 1;
    const brandCover = reduceMotion ? 100 * lead : 100 * smoothstep(.69, .98, first);

    // The first clip ends on the bulldozer tracks; dissolve directly into
    // the live site instead of playing the later dirt/sign clips.
    filmStage.style.opacity = String(smoothstep(0, .72, lead) * (siteReady ? 1 - smoothstep(0, .8, outro) : 1));
    poster.style.setProperty('--intro-still-opacity', String(1 - smoothstep(.12, .8, lead)));
    poster.style.setProperty('--intro-gradient-opacity', String(1 - smoothstep(.08, .95, lead)));
    poster.style.setProperty('--intro-chrome-opacity', String(1 - smoothstep(0, .72, lead)));
    poster.style.setProperty('--intro-ui-opacity', String(otherUi));
    poster.style.setProperty('--intro-ui-x', '0px');
    poster.style.setProperty('--intro-brand-cover', `${brandCover}%`);
    poster.style.setProperty('--intro-title-opacity', String(titleOpacity));
    poster.style.setProperty('--intro-title-x', '0px');
    poster.style.setProperty('--intro-title-y', '0px');
    poster.style.setProperty('--intro-title-scale', '1');

    if (!reduceMotion) drawFrame(frameIndex);
    renderHeadlineOcclusion(filmTime, !reduceMotion && distance >= leadDistance);
    if (outro >= .995 && !siteReady) { location.href = siteFrame.dataset.src; return; }
    siteStage.style.opacity = String(siteReady ? smoothstep(0, .8, outro) : 0);
    setSiteInteractive(outro >= .995);
    const posterInteractive = distance < leadDistance * .92;
    poster.inert = !posterInteractive;
    poster.setAttribute('aria-hidden', String(!posterInteractive));
    skipButton.hidden = distance < leadDistance * .9 || siteInteractive;
    document.body.dataset.phase = outro > 0 ? 'handoff' : distance > leadDistance ? 'film' : 'poster';
  }

  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
      renderPending = false;
      renderScroll();
    });
  }

  function openSite(hash = '') {
    // Explicit buttons go straight to their destination. There is no animation
    // clock for scroll events to accidentally start, resume, or reverse.
    if (!assetsReady || !siteReady) { location.href = `${siteFrame.dataset.src}${hash}`; return; }
    if (hash) {
      try {
        const site = siteFrame.contentWindow;
        const section = site.document.getElementById(hash.slice(1));
        if (!section) throw new Error('Missing destination');
        // scrollIntoView inside an iframe may also scroll its outer document,
        // rewinding the intro. Position only the iframe's own scroll container.
        const margin = parseFloat(site.getComputedStyle(section).scrollMarginTop) || 0;
        site.history.pushState(null, '', hash);
        site.scrollTo({ top: site.scrollY + section.getBoundingClientRect().top - margin, behavior: 'instant' });
      } catch (_) { location.href = `${siteFrame.dataset.src}${hash}`; return; }
    }
    scrollTo({ top: totalDistance, behavior: 'instant' });
    renderScroll();
    siteFrame.focus({ preventScroll: true });
  }

  function attachReverseScroll() {
    let frameWindow;
    try { frameWindow = siteFrame.contentWindow; } catch (_) { return; }
    if (!frameWindow) return;
    let frameDocument;
    try { frameDocument = frameWindow.document; } catch (_) { return; }
    if (reverseScrollDocument === frameDocument) return;
    reverseScrollDocument = frameDocument;
    frameWindow.addEventListener('wheel', event => {
      if (!siteInteractive || event.ctrlKey || event.deltaY >= 0) return;
      const frameScroll = frameWindow.document.scrollingElement?.scrollTop || 0;
      if (frameScroll > 1) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      scrollIntro(event.deltaY * unit);
    }, { passive: false });
    let touchY = null;
    let reversingIntro = false;
    frameWindow.addEventListener('touchstart', event => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      reversingIntro = false;
    }, { passive: true });
    frameWindow.addEventListener('touchmove', event => {
      if ((!siteInteractive && !reversingIntro) || touchY === null || event.touches.length !== 1) return;
      const y = event.touches[0]?.clientY;
      if (y === undefined) return;
      const delta = y - touchY;
      touchY = y;
      if (!reversingIntro && (delta <= 0 || (frameWindow.document.scrollingElement?.scrollTop || 0) > 1)) return;
      event.preventDefault();
      reversingIntro = true;
      scrollIntro(-delta);
    }, { passive: false });
  }

  poster.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || !poster.contains(link)) return;
    const destination = new URL(link.href);
    if (destination.origin !== location.origin || destination.pathname !== new URL(siteFrame.dataset.src, location.href).pathname) return;
    if (!assetsReady) return; // Native links remain usable during loading/errors.
    event.preventDefault();
    openSite(destination.hash);
  });
  trigger.addEventListener('click', () => {
    if (sequenceFailed) { location.href = siteFrame.dataset.src; return; }
    if (!assetsReady) return;
    scrollTo({ top: leadDistance, behavior: 'instant' });
    renderScroll();
  });
  skipButton.addEventListener('click', () => openSite());
  function scrollIntro(delta) {
    scrollTo({ top: clamp(scrollY + delta, 0, totalDistance), behavior: 'instant' });
    renderScroll();
  }

  addEventListener('wheel', event => {
    if (siteInteractive || event.ctrlKey || editor.contains(event.target)) return;
    if (!assetsReady && !sequenceFailed) { event.preventDefault(); return; }
    if (sequenceFailed) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    scrollIntro(event.deltaY * unit);
  }, { passive: false });
  addEventListener('keydown', event => {
    if (siteInteractive || editor.contains(event.target) || event.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
    const delta = { ArrowDown: 40, ArrowUp: -40, PageDown: innerHeight * .8, PageUp: -innerHeight * .8, ' ': innerHeight * (event.shiftKey ? -.8 : .8), Home: -totalDistance, End: totalDistance }[event.key];
    if (delta === undefined || sequenceFailed) return;
    event.preventDefault();
    if (!assetsReady) return;
    scrollIntro(delta);
  });
  // Direct touch deltas avoid native fling/inertia continuing the intro after
  // the finger is lifted. The embedded live website keeps normal scrolling.
  let touchY = null;
  addEventListener('touchstart', event => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (siteInteractive || touchY === null || event.touches.length !== 1 || editor.contains(event.target)) return;
    if (!assetsReady && !sequenceFailed) { event.preventDefault(); return; }
    if (sequenceFailed) return;
    const y = event.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    event.preventDefault();
    scrollIntro(delta);
  }, { passive: false });
  for (const type of ['touchend', 'touchcancel']) addEventListener(type, () => { touchY = null; }, { passive: true });
  addEventListener('scroll', scheduleRender, { passive: true });
  addEventListener('resize', () => { occlusionMetrics = null; updateScrollLayout(); scheduleRender(); }, { passive: true });
  siteFrame.addEventListener('load', () => { attachReverseScroll(); scheduleRender(); });
  updateScrollLayout();
  trigger.disabled = true;
  prepareSite();
  prepareSequence();
})();
