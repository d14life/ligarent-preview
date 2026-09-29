const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const introRoot = existsSync(join(__dirname, '../dist/start.js')) ? '../dist' : '..';
const source = readFileSync(join(__dirname, introRoot, 'start.js'), 'utf8');
const html = readFileSync(join(__dirname, introRoot, 'start.html'), 'utf8');
const css = readFileSync(join(__dirname, introRoot, 'start-dark.css'), 'utf8');

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

async function boot({ reduced = false, delayed = false, failed = false, hash = '', storage = {} } = {}) {
  const elements = {};
  const get = id => elements[id] ??= new Element(id);
  const controls = {};
  get('headline-editor').querySelector = selector => controls[selector] ??= Object.assign(new Element(), { min: -600, max: 600, value: 0 });
  get('poster').querySelectorAll = () => [];
  get('film').getContext = () => ({ drawImage() {} });
  const bundle = new ArrayBuffer(4 + 87 * 4 + 87);
  const view = new DataView(bundle);
  view.setUint32(0, 87, true);
  for (let index = 0; index < 87; index++) view.setUint32(4 + index * 4, 1, true);
  const events = {};
  const frames = [];
  const page = {
    document: { getElementById: get, body: new Element() },
    Blob, DataView, URL, URLSearchParams, console: { error() {} },
    fetch: async () => {
      if (failed) throw new Error('download failed');
      return { ok: true, arrayBuffer: async () => delayed ? new Promise(() => {}) : bundle };
    },
    createImageBitmap: async () => ({ width: 640, height: 360, close() {} }),
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    scrollY: 0, // Deliberately fixed: Safari may clamp actual page scrolling.
    matchMedia: query => ({ matches: query.includes('reduce') && reduced }),
    location: { href: `http://test/start.html${hash}`, hash, hostname: 'test', origin: 'http://test', replace(url) { this.href = url; this.replaced = true; } },
    localStorage: { getItem(key) { return storage[key] ?? null; }, setItem(key, value) { storage[key] = value; } },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    addEventListener(type, listener) { (events[type] ??= []).push(listener); },
  };
  vm.runInNewContext(source, page);
  for (let index = 0; index < 600; index++) await Promise.resolve();
  function emit(target, type, overrides = {}) {
    const event = { target: get('poster'), touches: [], preventDefault() { this.prevented = true; }, ...overrides };
    for (const listener of (target === 'window' ? events : target.listeners)[type] ?? []) listener(event);
    while (frames.length) frames.shift()();
    return event;
  }
  return { page, get, elements, emit, frames };
}

(async () => {
  assert.match(source, /const siteUrl = '\.\/site\.html'/);
  assert.match(html, /href="\.\/site\.html#machines"/);
  assert.match(html, /href="\.\/site\.html#enquiry"/);
  assert.doesNotMatch(html, /href="\.\/index\.html/);
  assert.doesNotMatch(html, /id="live-site"|id="poster-runway"/);
  assert.match(css, /body\s*\{[^}]*overflow:\s*hidden/);
  assert.doesNotMatch(css, /--copy-lower|--copy-text-rise/);

  const legacyHash = await boot({ hash: '#machines' });
  assert.equal(legacyHash.page.location.href, './site.html#machines', 'Intro deep link must reach the real site');
  const oldLayout = await boot({ storage: { 'ligarent-headline-3d': JSON.stringify({ copyY: 400, uiY: 250, x: 16 }) } });
  assert.equal(oldLayout.get('poster').style['--copy-edit-y'], '0px', 'Old saved copy offset must not hide CTAs');
  assert.equal(oldLayout.get('poster').style['--ui-edit-y'], '0px', 'Old saved UI offset must not hide the opening');
  assert.equal(oldLayout.get('hero-title').style['--headline-x'], '16px', 'Unrelated saved headline position stays intact');
  const cold = await boot({ delayed: true });
  assert.equal(cold.get('start-film').disabled, true);
  assert.equal(cold.emit('window', 'wheel', { deltaY: 600, deltaMode: 0 }).prevented, true);
  assert.equal(cold.page.scrollY, 0);
  assert.equal(cold.page.location.href, 'http://test/start.html');

  const { page, get, emit, frames } = await boot();
  assert.equal(get('start-film').disabled, false);
  emit('window', 'wheel', { deltaY: 600, deltaMode: 0 });
  assert.equal(get('film').dataset.frame, '38');
  assert.equal(page.scrollY, 0, 'The intro must advance even when browser scrolling is clamped');
  assert.equal(page.location.href, 'http://test/start.html');
  assert.equal(frames.length, 0, 'Stopping input starts no self-running animation');
  emit('window', 'wheel', { deltaY: -300, deltaMode: 0 });
  assert.equal(get('film').dataset.frame, '14');
  emit('window', 'touchstart', { touches: [{ clientY: 700 }] });
  emit('window', 'touchmove', { touches: [{ clientY: 500 }] });
  assert.equal(get('film').dataset.frame, '30');
  emit('window', 'touchend');
  assert.equal(get('film').dataset.frame, '30', 'Finger release freezes the intro');
  emit('window', 'touchstart', { touches: [{ clientY: 400 }] });
  emit('window', 'touchmove', { touches: [{ clientY: 600 }] });
  assert.equal(get('film').dataset.frame, '14', 'Downward finger reverses the intro');
  emit('window', 'wheel', { deltaY: 9999, deltaMode: 0 });
  assert.equal(page.location.href, './site.html', 'Natural scrolling opens the real site');
  assert.equal(page.location.replaced, true);

  const skipped = await boot();
  skipped.emit('window', 'wheel', { deltaY: 200, deltaMode: 0 });
  skipped.emit(skipped.get('film-skip'), 'click');
  assert.equal(skipped.page.location.href, './site.html');

  const reduced = await boot({ reduced: true });
  reduced.emit('window', 'wheel', { deltaY: 120, deltaMode: 0 });
  assert.equal(reduced.page.location.href, './site.html');

  const unavailable = await boot({ failed: true });
  assert.equal(unavailable.get('start-film').disabled, false);
  unavailable.emit(unavailable.get('start-film'), 'click');
  assert.equal(unavailable.page.location.href, './site.html');

  console.log('PASS: legacy deep link, clamped browser scroll, direct site navigation, pause/reverse, touch, skip, CTA links, reduced motion, and failed frame fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
