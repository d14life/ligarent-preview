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
  const loader = document.getElementById('asset-loader');
  const loaderStatus = document.getElementById('loader-status');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderProgress = document.getElementById('loader-progress');
  const loaderFill = document.getElementById('loader-fill');
  const loaderRetry = document.getElementById('loader-retry');
  const loaderBypass = document.getElementById('loader-bypass');
  // Scrubbing a long-GOP 4K stream can require decoding several seconds for
  // every seek. These short-GOP variants put a keyframe every six frames.
  const videoPath = innerWidth <= 1280 || matchMedia('(pointer: coarse)').matches
    ? 'assets/ligarent-intro-first-1080p-scrub.mp4'
    : 'assets/ligarent-intro-first-1440p-scrub.mp4';
  const sitePages = ['site.html', 'selection.html', 'work.html', 'geography.html', 'faq.html', 'enquiry.html'];
  // Every first-party image used by the current site, including its later sections.
  const siteMedia = [
    'album-d6r-earth.jpg', 'album-d6r-truck.jpg', 'album-d7r-road.jpg', 'album-d7r-site.jpg',
    'bulldozer-front-transparent.png', 'bulldozer-front.png', 'bulldozer-mark-yellow.svg',
    'bulldozer-mark.svg', 'bulldozer-top-landscape.png', 'bulldozer-top-portrait-transparent.png',
    'bulldozer-top-portrait.png', 'd6r-drawing.png', 'd6r.png', 'd7r-drawing.png', 'd7r.png',
    'd8r-drawing.png', 'd8r.png', 'intro-first-frame.jpg', 'ligarent-video1-seedream-v5-pro-first-2048.png',
    'map-kaleykino.webp', 'road-mark.svg', 'work-0.jpg', 'work-1.jpg', 'work-10.jpg',
    'work-11.jpg', 'work-15.jpg', 'work-2.jpg', 'work-3.jpg', 'work-4.jpg', 'work-5.jpg',
    'work-6.jpg', 'work-7.jpg', 'work-8.jpg', 'work-9.jpg'
  ].map(name => `assets/${name}`);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let assetsReady = false;
  let videoObjectURL = null;
  let preloadController = null;
  let videoProgress = reduceMotion ? 1 : 0;
  let siteProgress = 0;
  const FIRST_CLIP_END = 7.25;
  const SCROLL_PIXELS_PER_SECOND = 180;
  const IDLE_MOTION_SPEED = 2;
  let leadDistance = 0;
  let videoDistance = 0;
  let filmDistance = 0;
  let handoffDistance = 0;
  let totalDistance = 0;
  let renderPending = false;
  let siteInteractive = false;
  let motionDirection = 0;
  let motionSpeed = 1;
  let motionFrame = 0;
  let lastMotionTime = 0;
  let pendingSiteHash = null;
  let activeActionLink = null;
  let occlusionMetrics = null;
  let lastVideoSeekAt = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const smoothstep = (start, end, value) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };

  function renderLoadingProgress(done = false) {
    const percent = done ? 100 : Math.min(99, Math.floor(videoProgress * 30 + siteProgress * 70));
    loaderPercent.textContent = `${String(percent).padStart(2, '0')}%`;
    loaderProgress.setAttribute('aria-valuenow', String(percent));
    loaderFill.style.width = `${percent}%`;
  }

  async function fetchComplete(url, signal) {
    const response = await fetch(url, { signal, cache: 'force-cache' });
    if (!response.ok) throw new Error(`Не загрузился файл: ${url}`);
    await response.arrayBuffer();
  }

  async function preloadVideo(signal) {
    if (reduceMotion) return;
    const response = await fetch(videoPath, { signal, cache: 'force-cache' });
    if (!response.ok) throw new Error('Не удалось загрузить видео.');
    const total = Number(response.headers.get('content-length')) || 0;
    const chunks = [];
    let received = 0;
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (total) {
          videoProgress = Math.min(.98, received / total);
          renderLoadingProgress();
        }
      }
    } else {
      chunks.push(await response.arrayBuffer());
    }
    if (videoObjectURL) URL.revokeObjectURL(videoObjectURL);
    videoObjectURL = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('Видео не подготовилось к воспроизведению.')), 20000);
      const onReady = () => finish();
      const onError = () => finish(new Error('Браузер не может воспроизвести видео.'));
      const onAbort = () => finish(signal.reason || new Error('Загрузка отменена.'));
      function finish(error) {
        clearTimeout(timer);
        film.removeEventListener('loadeddata', onReady);
        film.removeEventListener('error', onError);
        signal.removeEventListener('abort', onAbort);
        if (error) reject(error); else resolve();
      }
      film.addEventListener('loadeddata', onReady, { once: true });
      film.addEventListener('error', onError, { once: true });
      signal.addEventListener('abort', onAbort, { once: true });
      film.src = videoObjectURL;
      film.load();
      if (film.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) finish();
    });
    videoProgress = 1;
    renderLoadingProgress();
  }

  function waitForSiteFrame(signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('Сайт загружается слишком долго.')), 90000);
      const onLoad = () => {
        try {
          if (siteFrame.contentWindow?.location.href === 'about:blank') return;
        } catch (_) { /* The static asset checks below still verify this page. */ }
        finish();
      };
      const onAbort = () => finish(signal.reason || new Error('Загрузка отменена.'));
      function finish(error) {
        clearTimeout(timer);
        siteFrame.removeEventListener('load', onLoad);
        signal.removeEventListener('abort', onAbort);
        if (error) reject(error); else resolve();
      }
      siteFrame.addEventListener('load', onLoad);
      signal.addEventListener('abort', onAbort, { once: true });
      siteFrame.src = siteFrame.dataset.src;
    });
  }

  async function fetchPool(urls, signal, onItem) {
    let next = 0;
    let complete = 0;
    const workers = Array.from({ length: Math.min(6, urls.length) }, async () => {
      while (next < urls.length) {
        const url = urls[next++];
        await fetchComplete(url, signal);
        onItem(++complete, urls.length);
      }
    });
    await Promise.all(workers);
  }

  async function preloadSite(signal) {
    const frameReady = waitForSiteFrame(signal);
    frameReady.catch(() => {});
    const pages = await Promise.all(sitePages.map(async page => {
      const response = await fetch(page, { signal, cache: 'force-cache' });
      if (!response.ok) throw new Error(`Не загрузилась страница: ${page}`);
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    }));
    const shell = pages.flatMap(page => [...page.querySelectorAll('script[src], link[rel="stylesheet"][href]')]
      .map(node => node.getAttribute('src') || node.getAttribute('href')));
    const urls = [...new Set([...shell, ...siteMedia])];
    siteProgress = .03;
    renderLoadingProgress();
    await fetchPool(urls, signal, (complete, total) => {
      siteProgress = .03 + .85 * complete / total;
      renderLoadingProgress();
    });
    await frameReady;
    siteProgress = .9;
    renderLoadingProgress();
    let siteDocument = null;
    try { siteDocument = siteFrame.contentDocument; } catch (_) {}
    if (siteDocument) {
      const extra = [...siteDocument.querySelectorAll('img[src], source[src], video[poster]')]
        .map(node => node.getAttribute('src') || node.getAttribute('poster'))
        .filter(Boolean)
        .map(path => new URL(path, siteFrame.src))
        .filter(url => url.origin === location.origin && !urls.some(item => new URL(item, location.href).pathname === url.pathname))
        .map(url => url.href);
      await fetchPool([...new Set(extra)], signal, (complete, total) => {
        siteProgress = .9 + .08 * complete / total;
        renderLoadingProgress();
      });
      await siteDocument.fonts?.ready;
    }
    await document.fonts.ready;
    siteProgress = 1;
    renderLoadingProgress();
  }

  async function preloadEverything() {
    preloadController?.abort();
    const controller = new AbortController();
    preloadController = controller;
    const started = performance.now();
    videoProgress = reduceMotion ? 1 : 0;
    siteProgress = 0;
    loader.dataset.state = 'loading';
    loader.setAttribute('aria-busy', 'true');
    loaderStatus.textContent = 'Подготавливаем видео и сайт';
    loaderRetry.hidden = true;
    loaderBypass.hidden = true;
    renderLoadingProgress();
    try {
      await Promise.all([preloadVideo(controller.signal), preloadSite(controller.signal)]);
      assetsReady = true;
      renderLoadingProgress(true);
      loaderStatus.textContent = 'Всё готово';
      loader.dataset.state = 'ready';
      loader.setAttribute('aria-busy', 'false');
      const remaining = Math.max(0, 450 - (performance.now() - started));
      if (remaining) await new Promise(resolve => setTimeout(resolve, remaining));
      updateScrollLayout();
      renderScroll();
      loader.classList.add('is-done');
      setTimeout(() => {
        loader.hidden = true;
        document.body.classList.remove('is-loading');
      }, reduceMotion ? 0 : 330);
    } catch (error) {
      controller.abort();
      if (preloadController !== controller) return;
      loader.dataset.state = 'error';
      loader.setAttribute('aria-busy', 'false');
      loaderStatus.textContent = error?.message || 'Не удалось загрузить видео или сайт.';
      loaderRetry.hidden = false;
      loaderBypass.hidden = false;
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
    leadDistance = Math.max(380, innerHeight * .58);
    videoDistance = reduceMotion ? 0 : Math.min(FIRST_CLIP_END, Math.max(0, film.duration - 1 / 24)) * SCROLL_PIXELS_PER_SECOND;
    filmDistance = videoDistance;
    handoffDistance = Math.max(300, innerHeight * .45);
    totalDistance = leadDistance + filmDistance + handoffDistance;
    runway.style.height = `${totalDistance}px`;
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
    const filmTime = reduceMotion ? 0 : clamp((distance - leadDistance) / SCROLL_PIXELS_PER_SECOND, 0, FIRST_CLIP_END);
    const first = reduceMotion ? 1 : clamp(filmTime / FIRST_CLIP_END);
    const outro = clamp((distance - leadDistance - filmDistance) / handoffDistance);
    const otherUi = 1 - smoothstep(.03, .9, lead);
    const titleOpacity = reduceMotion ? 1 - lead : 1;
    const brandCover = reduceMotion ? 100 * lead : 100 * smoothstep(.69, .98, first);

    // The first clip ends on the bulldozer tracks; dissolve directly into
    // the live site instead of playing the later dirt/sign clips.
    filmStage.style.opacity = String(smoothstep(0, .72, lead) * (1 - smoothstep(0, .8, outro)));
    poster.style.setProperty('--intro-still-opacity', String(1 - smoothstep(.12, .8, lead)));
    poster.style.setProperty('--intro-gradient-opacity', String(1 - smoothstep(.08, .95, lead)));
    poster.style.setProperty('--intro-chrome-opacity', String(1 - smoothstep(0, .72, lead)));
    poster.style.setProperty('--intro-ui-opacity', String(otherUi));
    poster.style.setProperty('--intro-ui-x', `${Math.round(-34 * (1 - otherUi))}px`);
    poster.style.setProperty('--intro-brand-cover', `${brandCover}%`);
    poster.style.setProperty('--intro-title-opacity', String(titleOpacity));
    poster.style.setProperty('--intro-title-x', '0px');
    poster.style.setProperty('--intro-title-y', '0px');
    poster.style.setProperty('--intro-title-scale', '1');

    const seekNow = performance.now();
    if (!reduceMotion && film.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !film.seeking && Math.abs(film.currentTime - filmTime) > 1 / 24 && (seekNow - lastVideoSeekAt >= 40 || distance >= leadDistance + filmDistance)) {
      lastVideoSeekAt = seekNow;
      film.currentTime = filmTime;
    }
    renderHeadlineOcclusion(filmTime, !reduceMotion && distance >= leadDistance);
    siteStage.style.opacity = String(smoothstep(0, .8, outro));
    setSiteInteractive(outro >= .995);
    const posterInteractive = distance < leadDistance * .92;
    poster.inert = !posterInteractive;
    poster.setAttribute('aria-hidden', String(!posterInteractive));
    skipButton.hidden = reduceMotion || distance < leadDistance * .7 || outro > 0;
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

  function restoreActionLink() {
    if (!activeActionLink) return;
    activeActionLink.textContent = activeActionLink.dataset.originalText;
    activeActionLink.removeAttribute('aria-busy');
    activeActionLink = null;
  }

  function finishMotion() {
    motionDirection = 0;
    motionFrame = 0;
    lastMotionTime = 0;
    restoreActionLink();
    skipButton.textContent = 'Перейти к сайту';
    if (pendingSiteHash === null) return;
    const hash = pendingSiteHash;
    pendingSiteHash = null;
    if (hash) {
      try {
        const site = siteFrame.contentWindow;
        if (typeof site.ligarentNavigate === 'function') site.ligarentNavigate(hash);
        else {
          site.location.hash = hash;
          site.document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
        }
      }
      catch (_) { siteFrame.src = `${siteFrame.dataset.src}${hash}`; }
    }
  }

  function motionTick(now) {
    if (!motionDirection || !assetsReady) {
      motionFrame = 0;
      return;
    }
    const elapsed = lastMotionTime ? Math.min((now - lastMotionTime) / 1000, .05) : 0;
    lastMotionTime = now;
    const next = clamp(scrollY + motionDirection * elapsed * SCROLL_PIXELS_PER_SECOND * motionSpeed, 0, totalDistance);
    scrollTo({ top: next, behavior: 'auto' });
    scheduleRender();
    if ((motionDirection < 0 && next <= 0) || (motionDirection > 0 && next >= totalDistance)) {
      renderScroll();
      finishMotion();
      return;
    }
    motionFrame = requestAnimationFrame(motionTick);
  }

  function continueMotion(direction, speed = IDLE_MOTION_SPEED, siteHash = null) {
    if (!assetsReady) return;
    if (reduceMotion) {
      scrollTo({ top: direction > 0 ? totalDistance : 0, behavior: 'auto' });
      renderScroll();
      if (siteHash) {
        try {
          const navigate = siteFrame.contentWindow?.ligarentNavigate;
          if (typeof navigate === 'function') navigate(siteHash);
          else siteFrame.src = `${siteFrame.dataset.src}${siteHash}`;
        } catch (_) { siteFrame.src = `${siteFrame.dataset.src}${siteHash}`; }
      }
      restoreActionLink();
      return;
    }
    const directionChanged = motionDirection !== direction;
    motionDirection = direction;
    // A stray forward wheel event must not slow a button-triggered trip.
    motionSpeed = direction > 0 && siteHash === null && pendingSiteHash !== null
      ? Math.max(speed, motionSpeed) : speed;
    if (siteHash !== null) pendingSiteHash = siteHash;
    else if (direction < 0) {
      pendingSiteHash = null;
      restoreActionLink();
      skipButton.textContent = 'Перейти к сайту';
    }
    if (directionChanged || !motionFrame) lastMotionTime = 0;
    if (!motionFrame) motionFrame = requestAnimationFrame(motionTick);
  }

  function attachReverseScroll() {
    let frameWindow;
    try { frameWindow = siteFrame.contentWindow; } catch (_) { return; }
    if (!frameWindow) return;
    frameWindow.addEventListener('wheel', event => {
      if (!siteInteractive || event.deltaY >= 0) return;
      const frameScroll = frameWindow.document.scrollingElement?.scrollTop || 0;
      if (frameScroll > 1) return;
      event.preventDefault();
      scrollBy({ top: event.deltaY, behavior: 'auto' });
      continueMotion(-1);
    }, { passive: false });
    let touchY = null;
    frameWindow.addEventListener('touchstart', event => { touchY = event.touches[0]?.clientY ?? null; }, { passive: true });
    frameWindow.addEventListener('touchmove', event => {
      if (!siteInteractive || touchY === null) return;
      const y = event.touches[0]?.clientY;
      if (y === undefined) return;
      const delta = y - touchY;
      touchY = y;
      if (delta <= 0 || (frameWindow.document.scrollingElement?.scrollTop || 0) > 1) return;
      event.preventDefault();
      scrollBy({ top: -delta, behavior: 'auto' });
      continueMotion(-1);
    }, { passive: false });
  }

  poster.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || !poster.contains(link)) return;
    const destination = new URL(link.href);
    if (destination.origin !== location.origin || destination.pathname !== new URL(siteFrame.dataset.src, location.href).pathname) return;
    event.preventDefault();
    restoreActionLink();
    link.dataset.originalText = link.textContent;
    link.textContent = destination.hash === '#enquiry' ? 'Открываем заявку…' : 'Открываем машины…';
    link.setAttribute('aria-busy', 'true');
    activeActionLink = link;
    skipButton.textContent = destination.hash === '#enquiry' ? 'Открываем заявку…' : 'Открываем машины…';
    continueMotion(1, 10, destination.hash);
  });
  trigger.addEventListener('click', () => continueMotion(1));
  skipButton.addEventListener('click', () => continueMotion(1, 10));
  addEventListener('wheel', event => {
    if (!assetsReady || siteInteractive || editor.contains(event.target) || loader.contains(event.target)) return;
    if (Math.abs(event.deltaY) > 1) continueMotion(Math.sign(event.deltaY));
  }, { passive: true });
  let touchY = null;
  addEventListener('touchstart', event => { touchY = event.touches[0]?.clientY ?? null; }, { passive: true });
  addEventListener('touchmove', event => {
    if (!assetsReady || siteInteractive || touchY === null || editor.contains(event.target)) return;
    const y = event.touches[0]?.clientY;
    if (y === undefined) return;
    const delta = touchY - y;
    touchY = y;
    if (Math.abs(delta) > 1) continueMotion(Math.sign(delta));
  }, { passive: true });
  addEventListener('keydown', event => {
    if (!assetsReady || siteInteractive || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) continueMotion(1);
    if (['ArrowUp', 'PageUp'].includes(event.key)) continueMotion(-1);
  });
  addEventListener('scroll', scheduleRender, { passive: true });
  addEventListener('resize', () => { occlusionMetrics = null; updateScrollLayout(); scheduleRender(); }, { passive: true });
  film.addEventListener('loadeddata', scheduleRender);
  film.addEventListener('seeked', scheduleRender);
  siteFrame.addEventListener('load', () => { attachReverseScroll(); scheduleRender(); });
  loaderRetry.addEventListener('click', preloadEverything);
  preloadEverything();
})();
