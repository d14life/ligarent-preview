(() => {
  const poster = document.getElementById('poster');
  const trigger = document.getElementById('start-film');
  const filmStage = document.getElementById('film-stage');
  const film = document.getElementById('film');
  const skipButton = document.getElementById('film-skip');
  const siteUrl = './site.html';
  const reverseAmount = Number(new URLSearchParams(location.search).get('reverse'));
  const returningFromSite = Number.isFinite(reverseAmount) && reverseAmount > 0;
  // Old intro deep links belong to the live website, not the film.
  if (/^#(machines|selection|work|geography|faq|enquiry)$/.test(location.hash)) {
    location.replace(`${siteUrl}${location.hash}`);
    return;
  }
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
  const layoutStorageKey = 'ligarent-headline-3d-v2';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Decode once; scrolling only draws an already prepared frame. No seeks,
  // playback clock, easing loop, or asynchronous frame swap follows input.
  const sequenceSize = innerWidth <= 900 || matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
  const FRAME_COUNT = 87;
  const FIRST_CLIP_END = 7.25;
  // A single ordinary finger swipe should cover the short first clip.
  const SCROLL_PIXELS_PER_SECOND = 26;
  const frames = new Array(FRAME_COUNT);
  const context = film.getContext('2d', { alpha: false });
  let drawnFrame = -1;
  let assetsReady = false;
  let sequenceFailed = false;
  let leadDistance = 0;
  let filmDistance = 0;
  let totalDistance = 0;
  let introPosition = 0;
  let renderPending = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
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

  async function prepareSequence() {
    let timeoutId;
    try {
      await Promise.race([
        preloadSequence(),
        new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error('Intro frames timed out')), 12000); })
      ]);
      assetsReady = true;
      trigger.disabled = false;
      updateScrollLayout();
      renderScroll();
      document.documentElement.classList.remove('intro-returning');
    } catch (error) {
      sequenceFailed = true;
      trigger.disabled = false;
      document.documentElement.classList.remove('intro-returning');
      console.error('Intro frames could not be prepared:', error);
      trigger.querySelector('span').textContent = 'Открыть сайт';
      trigger.setAttribute('aria-label', 'Открыть сайт напрямую');
      renderScroll();
    } finally {
      clearTimeout(timeoutId);
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
  }

  function saveHeadline() {
    try { localStorage.setItem(layoutStorageKey, JSON.stringify(values)); } catch (_) {}
  }

  try {
    const updatedLayout = localStorage.getItem(layoutStorageKey);
    const saved = JSON.parse(updatedLayout || localStorage.getItem('ligarent-headline-3d') || '{}');
    for (const axis of axes) {
      const control = editor.querySelector(`input[data-axis="${axis}"]`);
      const number = Number(saved[axis]);
      if (Number.isFinite(number)) values[axis] = Math.min(Number(control.max), Math.max(Number(control.min), number));
    }
    // Older layouts placed the copy and UI below the visible opening frame.
    if (!updatedLayout) { values.copyY = 0; values.uiY = 0; }
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
      if (editor.hidden || introPosition > 1) return;
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
    leadDistance = 30;
    filmDistance = reduceMotion ? 0 : FIRST_CLIP_END * SCROLL_PIXELS_PER_SECOND;
    totalDistance = leadDistance + filmDistance;
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
    film.width = Math.round(innerWidth * pixelRatio);
    film.height = Math.round(innerHeight * pixelRatio);
    drawnFrame = -1;
  }

  function renderScroll() {
    if (!assetsReady) {
      const openingReel = document.getElementById('opening-reel');
      if (!openingReel || openingReel.hidden) {
        poster.inert = false;
        poster.setAttribute('aria-hidden', 'false');
      }
      return;
    }
    const distance = clamp(introPosition, 0, totalDistance);
    if (distance >= totalDistance) {
      location.replace(siteUrl);
      return;
    }
    const lead = clamp(distance / leadDistance);
    const frameIndex = reduceMotion ? 0 : Math.round(clamp((distance - leadDistance) / filmDistance) * (FRAME_COUNT - 1));
    const otherUi = 1 - smoothstep(.03, .9, lead);

    filmStage.style.opacity = String(smoothstep(0, .72, lead));
    poster.style.setProperty('--intro-still-opacity', String(1 - smoothstep(.12, .8, lead)));
    poster.style.setProperty('--intro-gradient-opacity', String(1 - smoothstep(.08, .95, lead)));
    poster.style.setProperty('--intro-chrome-opacity', String(1 - smoothstep(0, .72, lead)));
    poster.style.setProperty('--intro-ui-opacity', String(otherUi));
    poster.style.setProperty('--intro-ui-x', '0px');
    poster.style.setProperty('--intro-title-x', '0px');
    poster.style.setProperty('--intro-title-y', '0px');
    poster.style.setProperty('--intro-title-scale', '1');

    if (!reduceMotion) drawFrame(frameIndex);
    const openingReel = document.getElementById('opening-reel');
    const posterInteractive = distance < leadDistance * .92 && (!openingReel || openingReel.hidden);
    poster.inert = !posterInteractive;
    poster.setAttribute('aria-hidden', String(!posterInteractive));
    skipButton.hidden = distance < leadDistance * .9;
    document.body.dataset.phase = distance > leadDistance ? 'film' : 'poster';
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
    location.href = `${siteUrl}${hash}`;
  }

  trigger.addEventListener('click', () => {
    if (sequenceFailed) { location.href = siteUrl; return; }
    if (!assetsReady) return;
    introPosition = leadDistance;
    renderScroll();
  });
  skipButton.addEventListener('click', () => openSite());
  function scrollIntro(delta) {
    introPosition = clamp(introPosition + delta, 0, totalDistance);
    renderScroll();
  }

  addEventListener('wheel', event => {
    if (event.ctrlKey || editor.contains(event.target)) return;
    if (!assetsReady && !sequenceFailed) { event.preventDefault(); return; }
    if (sequenceFailed) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    scrollIntro(event.deltaY * unit);
  }, { passive: false });
  addEventListener('keydown', event => {
    if (editor.contains(event.target) || event.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
    const delta = { ArrowDown: 40, ArrowUp: -40, PageDown: innerHeight * .8, PageUp: -innerHeight * .8, ' ': innerHeight * (event.shiftKey ? -.8 : .8), Home: -totalDistance, End: totalDistance }[event.key];
    if (delta === undefined || sequenceFailed) return;
    event.preventDefault();
    if (!assetsReady) return;
    scrollIntro(delta);
  });
  // Direct touch deltas avoid native fling/inertia continuing the intro after
  // the finger is lifted. The website opens as its own page at the end.
  let touchY = null;
  addEventListener('touchstart', event => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (touchY === null || event.touches.length !== 1 || editor.contains(event.target)) return;
    if (!assetsReady && !sequenceFailed) { event.preventDefault(); return; }
    if (sequenceFailed) return;
    const y = event.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    event.preventDefault();
    scrollIntro(delta);
  }, { passive: false });
  for (const type of ['touchend', 'touchcancel']) addEventListener(type, () => { touchY = null; }, { passive: true });
  addEventListener('resize', () => { updateScrollLayout(); scheduleRender(); }, { passive: true });
  document.addEventListener('intro-loader-ready', renderScroll);
  updateScrollLayout();
  if (returningFromSite) introPosition = clamp(totalDistance - reverseAmount, 0, totalDistance - 1);
  trigger.disabled = true;
  prepareSequence();
})();
