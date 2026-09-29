const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const introRoot = existsSync(join(__dirname, '../dist/start.js')) ? '../dist' : '..';
const source = readFileSync(join(__dirname, introRoot, 'start.js'), 'utf8');
const html = readFileSync(join(__dirname, introRoot, 'start.html'), 'utf8');
const css = readFileSync(join(__dirname, introRoot, 'start-dark.css'), 'utf8');
const loaderSource = readFileSync(join(__dirname, introRoot, 'loader-reel.js'), 'utf8');
const siteSource = readFileSync(join(__dirname, introRoot, 'site-return.js'), 'utf8');
const liveHtml = readFileSync(join(__dirname, introRoot, introRoot === '../dist' ? 'index.html' : 'site.html'), 'utf8');
const liveCss = readFileSync(join(__dirname, introRoot, 'style.css'), 'utf8');

class Element {
  constructor(id = '') {
    this.id = id;
    this.dataset = {};
    this.style = { setProperty(key, value) { this[key] = value; } };
    this.listeners = {};
    this.hidden = false;
    this.offsetHeight = 844;
    this.tagName = 'DIV';
    this.classList = { toggle() {}, add() {}, remove() {} };
  }
  addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
  setAttribute(key, value) { this[key] = value; }
  contains(target) { return target === this; }
  closest() { return null; }
  querySelector() { return new Element(); }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 350, width: 390, height: 844 }; }
}

async function boot({ reduced = false, delayed = false, failed = false, hash = '', reverse = 0, loaderVisible = false, storage = {}, width = 390, height = 844 } = {}) {
  const elements = {};
  const get = id => elements[id] ??= new Element(id);
  const controls = {};
  get('headline-editor').querySelector = selector => controls[selector] ??= Object.assign(new Element(), { min: -600, max: 600, value: 0 });
  get('poster').querySelectorAll = () => [];
  get('film').getContext = () => ({ drawImage() {} });
  get('opening-reel').hidden = !loaderVisible;
  const bundle = new ArrayBuffer(4 + 116 * 4 + 116);
  const view = new DataView(bundle);
  view.setUint32(0, 116, true);
  for (let index = 0; index < 116; index++) view.setUint32(4 + index * 4, 1, true);
  const events = {};
  const documentEvents = {};
  const frames = [];
  const timers = new Map();
  let nextTimer = 0;
  const page = {
    document: { getElementById: get, body: new Element(), documentElement: new Element(), addEventListener(type, listener) { (documentEvents[type] ??= []).push(listener); } },
    Blob, DataView, URL, URLSearchParams, console: { error() {} },
    fetch: async url => {
      page.lastFetch = url;
      if (failed) throw new Error('download failed');
      return { ok: true, arrayBuffer: async () => delayed ? new Promise(() => {}) : bundle };
    },
    createImageBitmap: async () => ({ width: width <= 600 && height > width ? 512 : 960, height: width <= 600 && height > width ? 1106 : 540, close() {} }),
    innerWidth: width, innerHeight: height, devicePixelRatio: 2,
    scrollY: 0, // Deliberately fixed: Safari may clamp actual page scrolling.
    matchMedia: query => ({ matches: query.includes('reduce') && reduced }),
    location: { href: `http://test/start.html${reverse ? `?reverse=${reverse}` : ''}${hash}`, search: reverse ? `?reverse=${reverse}` : '', hash, hostname: 'test', origin: 'http://test', replace(url) { this.href = url; this.replaced = true; } },
    localStorage: { getItem(key) { return storage[key] ?? null; }, setItem(key, value) { storage[key] = value; } },
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    addEventListener(type, listener) { (events[type] ??= []).push(listener); },
  };
  vm.runInNewContext(source, page);
  for (let index = 0; index < 600; index++) await Promise.resolve();
  function emit(target, type, overrides = {}, flush = true) {
    const event = { target: get('poster'), touches: [], preventDefault() { this.prevented = true; }, ...overrides };
    for (const listener of (target === 'window' ? events : target === 'document' ? documentEvents : target.listeners)[type] ?? []) listener(event);
    if (flush) while (frames.length) frames.shift()();
    return event;
  }
  async function fireTimeouts() {
    for (const [id, callback] of [...timers]) { timers.delete(id); callback(); }
    for (let index = 0; index < 100; index++) await Promise.resolve();
  }
  return { page, get, elements, emit, frames, fireTimeouts };
}

function bootLoader({ reverse = false, reduced = false } = {}) {
  const reel = new Element('opening-reel');
  const video = new Element('opening-video');
  const progress = new Element('opening-progress');
  const count = new Element('opening-count');
  video.currentTime = 0;
  video.duration = 16.5;
  video.dataset.src = 'assets/ligarent-loader-clips-234-clean-720p.mp4';
  video.play = () => Promise.resolve();
  video.pause = () => {};
  video.load = () => {};
  video.removeAttribute = () => {};
  const elements = { 'opening-reel': reel, 'opening-video': video, 'opening-progress': progress, 'opening-count': count };
  const events = {};
  const timers = new Map();
  let nextTimer = 0;
  const document = {
    getElementById: id => elements[id],
    body: new Element(),
    dispatchEvent(event) { this.lastEvent = event.type; },
  };
  const page = {
    document, URLSearchParams, Event,
    location: { search: reverse ? '?reverse=120' : '', href: 'http://test/start.html', replace(url) { this.href = url; } },
    matchMedia: () => ({ matches: reduced }),
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(type, listener) { (events[type] ??= []).push(listener); },
  };
  vm.runInNewContext(loaderSource, page);
  function emit(target, type, overrides = {}) {
    const event = { preventDefault() { this.prevented = true; }, stopImmediatePropagation() {}, ...overrides };
    for (const listener of (target === 'window' ? events : target.listeners)[type] ?? []) listener(event);
    return event;
  }
  function flushTimers() {
    while (timers.size) {
      const [id, callback] = timers.entries().next().value;
      timers.delete(id);
      callback();
    }
  }
  return { reel, video, count, progress, document, location: page.location, emit, flushTimers };
}

function bootSite({ top = 0, menu = false, dialog = false } = {}) {
  const events = {};
  const location = { href: 'http://test/site.html', replace(url) { this.href = url; } };
  const document = {
    scrollingElement: { scrollTop: top },
    body: { classList: { contains: () => menu } },
    querySelector: () => dialog ? {} : null,
  };
  const page = { document, location, innerHeight: 800, scrollY: top, addEventListener(type, listener) { (events[type] ??= []).push(listener); } };
  vm.runInNewContext(siteSource, page);
  function emit(type, overrides = {}) {
    const event = { target: { closest: () => null }, touches: [], preventDefault() { this.prevented = true; }, ...overrides };
    for (const listener of events[type] ?? []) listener(event);
    return event;
  }
  return { page, emit };
}

(async () => {
  assert.match(source, /const siteUrl = '\.\/site\.html'/);
  assert.match(html, /href="\.\/site\.html#machines"/);
  assert.match(html, /href="\.\/site\.html#enquiry"/);
  assert.doesNotMatch(html, /href="\.\/index\.html/);
  assert.match(html, /id="opening-reel"/);
  assert.match(html, /loader-reel\.js/);
  assert.match(html, /vendor\/gsap\.min\.js/);
  assert.doesNotMatch(loaderSource, /location\.replace\(`\.\/site\.html/);
  assert.match(loaderSource, /drawImage\(video, 333, 122, 304, 83/, 'The moving mark comes from the final video frame');
  assert.match(loaderSource, /reel\.style\.transition = 'none'/, 'The old video sign cannot ghost over its moving copy');
  assert.doesNotMatch(html, /Ускорить ×10|opening-skip/);
  assert.match(css, /\.opening-reel/);
  assert.doesNotMatch(css, /\.opening-reel__skip/);
  assert.match(liveHtml, /site-return\.js/);
  assert.match(liveCss, /#machines\.fleet\{padding-top:24px\}/);
  for (const asset of ['assets/ligarent-loader-first.jpg', 'assets/ligarent-loader-clean-last-720p.jpg', 'assets/ligarent-loader-clips-234-clean-720p.mp4', 'assets/intro-sequence/desktop/frame-000.webp', 'assets/intro-sequence/desktop/frame-115.webp', 'assets/intro-sequence/mobile/frame-000.webp', 'assets/intro-sequence/mobile/frame-115.webp', 'assets/d6r-no-rods.png', 'assets/d7r.png', 'assets/d8r.png']) {
    assert.ok(existsSync(join(__dirname, introRoot, asset)), `${asset} must load on the opening or live page`);
  }
  for (const size of ['desktop', 'mobile']) {
    const bundle = readFileSync(join(__dirname, introRoot, `assets/intro-sequence/${size}.frames`));
    assert.equal(bundle.readUInt32LE(0), 116, `${size} bundle has the smoother 16 fps frame count`);
  }
  assert.doesNotMatch(html, /id="live-site"|id="poster-runway"/);
  assert.match(css, /body\s*\{[^}]*overflow:\s*hidden/);
  assert.doesNotMatch(css, /--copy-lower|--copy-text-rise/);
  assert.doesNotMatch(css, /--intro-brand-cover/, 'The top-left brand stays visible over the bulldozer');
  assert.match(source, /renderHeadlineOcclusion\(filmTime,/, 'The title disappears as the machine crosses it');
  assert.doesNotMatch(source, /--intro-brand-cover/, 'Scrolling never covers the top-left brand');
  assert.match(html, /mobile\/frame-000\.webp/, 'Phones preload their own 4K-source portrait still');
  assert.match(source, /SCROLL_PIXELS_PER_SECOND = 26/, 'The approved fast swipe distance stays intact');

  const legacyHash = await boot({ hash: '#machines' });
  assert.equal(legacyHash.page.location.href, './site.html#machines', 'Intro deep link must reach the real site');
  const oldLayout = await boot({ storage: { 'ligarent-headline-3d': JSON.stringify({ copyY: 400, uiY: 250, x: 16 }) } });
  assert.equal(oldLayout.get('poster').style['--copy-edit-y'], '0px', 'Old saved copy offset must not hide CTAs');
  assert.equal(oldLayout.get('poster').style['--ui-edit-y'], '0px', 'Old saved UI offset must not hide the opening');
  assert.equal(oldLayout.get('hero-title').style['--headline-x'], '16px', 'Unrelated saved headline position stays intact');
  const loader = bootLoader();
  assert.equal(loader.video.src, 'assets/ligarent-loader-clips-234-clean-720p.mp4');
  assert.equal(loader.video.playbackRate, 3);
  assert.equal(loader.emit('window', 'wheel').prevented, true, 'The reel receives no accidental frame scroll');
  loader.video.currentTime = 10;
  loader.emit(loader.video, 'timeupdate');
  assert.match(loader.count.textContent, /^03 \/ 04 · 6[0-9]%$/, 'The visible count advances with clip 3');
  loader.video.currentTime = 16;
  loader.emit(loader.video, 'timeupdate');
  assert.match(loader.count.textContent, /^04 \/ 04 · 9[0-9]%$/, 'The visible count advances with clip 4');
  loader.emit(loader.video, 'ended');
  assert.equal(loader.location.href, 'http://test/start.html', 'Finished reel stays on the bulldozer hero page');
  assert.equal(loader.reel.hidden, true, 'Finished reel reveals the live bulldozer hero');
  assert.equal(loader.document.lastEvent, 'intro-loader-ready', 'The hero receives its ready event');
  const stalledLoader = bootLoader();
  stalledLoader.flushTimers();
  assert.equal(stalledLoader.reel.hidden, true, 'The reel failsafe reveals the hero rather than trapping visitors');
  const loaderReturn = bootLoader({ reverse: true });
  assert.equal(loaderReturn.reel.hidden, true, 'Returning from the site bypasses the loader');
  assert.equal(loaderReturn.video.src, undefined);
  const loaderReduced = bootLoader({ reduced: true });
  assert.equal(loaderReduced.reel.hidden, true, 'Reduced motion skips directly to the bulldozer hero');
  const loadingIntro = await boot({ loaderVisible: true });
  assert.equal(loadingIntro.get('poster').inert, true, 'Poster stays inert under the reel');
  loadingIntro.get('opening-reel').hidden = true;
  loadingIntro.emit('document', 'intro-loader-ready');
  assert.equal(loadingIntro.get('poster').inert, false, 'Poster becomes interactive when the reel closes');
  const cold = await boot({ delayed: true });
  assert.equal(cold.get('start-film').disabled, true);
  assert.equal(cold.emit('window', 'wheel', { deltaY: 600, deltaMode: 0 }).prevented, true);
  assert.equal(cold.page.scrollY, 0);
  assert.equal(cold.page.location.href, 'http://test/start.html');
  await cold.fireTimeouts();
  assert.equal(cold.get('start-film').disabled, false, 'Timed-out frames allow direct site access');
  cold.emit(cold.get('start-film'), 'click');
  assert.equal(cold.page.location.href, './site.html');

  const { page, get, emit, frames } = await boot();
  assert.equal(get('start-film').disabled, false);
  assert.match(page.lastFetch, /mobile\.frames\?v=/, 'Portrait phones load the mobile sequence');
  emit('window', 'wheel', { deltaY: 70, deltaMode: 0 });
  const forwardFrame = Number(get('film').dataset.frame);
  assert.ok(forwardFrame >= 15, 'A short wheel swipe advances far into the film');
  assert.equal(page.scrollY, 0, 'The intro must advance even when browser scrolling is clamped');
  assert.equal(page.location.href, 'http://test/start.html');
  assert.equal(frames.length, 0, 'Stopping input starts no self-running animation');
  assert.match(get('hero-title').style.clipPath, /^polygon\(/, 'The approaching bulldozer clips the headline');
  emit('window', 'wheel', { deltaY: -35, deltaMode: 0 });
  assert.ok(Number(get('film').dataset.frame) < forwardFrame, 'Upward scrolling immediately reverses the film');

  const coalesced = await boot();
  coalesced.emit('window', 'wheel', { deltaY: 20, deltaMode: 0 }, false);
  coalesced.emit('window', 'wheel', { deltaY: 20, deltaMode: 0 }, false);
  assert.equal(coalesced.frames.length, 1, 'Rapid scroll events draw once per animation frame');
  coalesced.frames.shift()();
  assert.ok(Number(coalesced.get('film').dataset.frame) > 0, 'The coalesced draw uses the latest scroll position');

  const nearEnd = await boot();
  nearEnd.emit('window', 'wheel', { deltaY: 210, deltaMode: 0 });
  assert.ok(Number(nearEnd.get('film').dataset.frame) > 80, 'The final bulldozer frames render before site handoff');
  assert.match(nearEnd.get('hero-title').style.clipPath, /^polygon\(/, 'The headline disappears before the final frame');
  assert.equal(nearEnd.get('poster').style['--intro-brand-cover'], undefined, 'The top-left brand remains uncovered');
  assert.equal(nearEnd.page.location.href, 'http://test/start.html');
  nearEnd.emit('window', 'wheel', { deltaY: -175, deltaMode: 0 });
  assert.equal(nearEnd.page.document.body.dataset.phase, 'film', 'Reversing from the final frame restores earlier frames');
  nearEnd.emit('window', 'wheel', { deltaY: -100, deltaMode: 0 });
  assert.equal(nearEnd.get('hero-title').style.clipPath, '', 'Reversing to the poster restores the full headline');

  const landscape = await boot({ width: 844, height: 390 });
  assert.match(landscape.page.lastFetch, /desktop\.frames\?v=/, 'Phone landscape uses full-width frames');

  const touch = await boot();
  touch.emit('window', 'touchstart', { touches: [{ clientY: 700 }] });
  touch.emit('window', 'touchmove', { touches: [{ clientY: 620 }] });
  const touchFrame = touch.get('film').dataset.frame;
  assert.ok(Number(touchFrame) > 15, 'A short finger movement advances the film visibly');
  touch.emit('window', 'touchend');
  assert.equal(touch.get('film').dataset.frame, touchFrame, 'Finger release freezes the intro');
  touch.emit('window', 'touchstart', { touches: [{ clientY: 400 }] });
  touch.emit('window', 'touchmove', { touches: [{ clientY: 460 }] });
  assert.equal(touch.page.document.body.dataset.phase, 'poster', 'Dragging back reaches the opening page');

  const singleSwipe = await boot();
  singleSwipe.emit('window', 'touchstart', { touches: [{ clientY: 700 }] });
  singleSwipe.emit('window', 'touchmove', { touches: [{ clientY: 450 }] });
  assert.equal(singleSwipe.page.location.href, './site.html', 'One ordinary 250px swipe finishes the film');
  assert.equal(singleSwipe.page.location.replaced, true);
  const wheelSwipe = await boot();
  wheelSwipe.emit('window', 'wheel', { deltaY: 240, deltaMode: 0 });
  assert.equal(wheelSwipe.page.location.href, './site.html', 'One trackpad swipe can finish the film');

  const reverse = await boot({ reverse: 60 });
  const reverseFirstFrame = Number(reverse.get('film').dataset.frame);
  assert.ok(reverseFirstFrame > 40, 'Returning from the site reopens the film near its later frames');
  reverse.emit('window', 'wheel', { deltaY: -450, deltaMode: 0 });
  assert.ok(Number(reverse.get('film').dataset.frame) < reverseFirstFrame, 'Upward scrolling rewinds the frames');
  reverse.emit('window', 'wheel', { deltaY: -9999, deltaMode: 0 });
  assert.equal(reverse.page.document.body.dataset.phase, 'poster', 'Rewinding reaches the opening page');
  assert.equal(reverse.page.location.href, 'http://test/start.html?reverse=60');

  const siteMiddle = bootSite({ top: 200 });
  siteMiddle.emit('wheel', { deltaY: -120 });
  assert.equal(siteMiddle.page.location.href, 'http://test/site.html', 'Upward scrolling within the site stays in the site');
  const siteTop = bootSite();
  assert.equal(siteTop.emit('wheel', { deltaY: -120, deltaMode: 0 }).prevented, true);
  assert.equal(siteTop.page.location.href, './start.html?reverse=120', 'Upward scroll at the site top reopens the frames');
  const siteTouch = bootSite();
  siteTouch.emit('touchstart', { touches: [{ clientY: 200 }] });
  siteTouch.emit('touchmove', { touches: [{ clientY: 280 }] });
  assert.equal(siteTouch.page.location.href, './start.html?reverse=80', 'Downward pull at site top reopens the frames');
  const siteMenu = bootSite({ menu: true });
  siteMenu.emit('wheel', { deltaY: -120 });
  assert.equal(siteMenu.page.location.href, 'http://test/site.html', 'Open menu does not trigger an intro return');

  const skipped = await boot();
  skipped.emit('window', 'wheel', { deltaY: 200, deltaMode: 0 });
  skipped.emit(skipped.get('film-skip'), 'click');
  assert.equal(skipped.page.location.href, './site.html');

  const reduced = await boot({ reduced: true });
  reduced.emit('window', 'wheel', { deltaY: 120, deltaMode: 0 });
  assert.equal(reduced.page.location.href, './site.html');

  const unavailable = await boot({ failed: true });
  assert.equal(unavailable.get('start-film').disabled, false);
  assert.equal(unavailable.get('poster').inert, false, 'Frame failure leaves the opening links usable');
  unavailable.emit(unavailable.get('start-film'), 'click');
  assert.equal(unavailable.page.location.href, './site.html');

  console.log('PASS: 4K-source mobile assets, title occlusion with persistent brand, numbered opening reel, one-swipe completion, immediate pause/reverse, site return, timeout fallback, skip, CTA links, and reduced motion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
