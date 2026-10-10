/* Shared localization for the static page and the asynchronously embedded intro.
   Keep source text per node so switching back never translates a translation.
   Observe only copy mutations, not the animation loop's style/class changes. */
(() => {
  if (window.ligarentI18n) return;
  const locales = {ru:'Русский', en:'English', tt:'Татарча', zh:'中文', es:'Español'};
  const columns = {en:0, tt:1, zh:2, es:3};
  const dictionary = window.LIGARENT_TRANSLATIONS;
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phrases = Object.keys(dictionary).filter(key => key.length > 3).sort((a,b) => b.length-a.length);
  const pattern = new RegExp(phrases.map(escape).join('|'), 'g');
  let language = 'ru';
  try { const saved = localStorage.getItem('ligarent.lang'); if (locales[saved]) language = saved; } catch {}
  const requested = new URLSearchParams(location.search).get('lang');
  if (locales[requested]) language = requested;
  function translate(source) {
    if (language === 'ru') return source;
    const trimmed = source.trim();
    if (dictionary[trimmed]) return source.replace(trimmed, dictionary[trimmed][columns[language]]);
    return source.replace(pattern, key => dictionary[key][columns[language]]);
  }
  const records = new WeakMap();
  const attributes = ['alt', 'title', 'aria-label', 'placeholder'];
  function update(node, name, read, write) {
    let values = records.get(node);
    if (!values) records.set(node, values = {});
    const current = read();
    let entry = values[name];
    if (!entry || current !== entry.rendered) entry = values[name] = {source:current};
    const next = translate(entry.source);
    if (current !== next) write(next);
    entry.rendered = next;
  }
  function visit(node) {
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!parent || parent.closest?.('script,style,textarea,[data-no-translate],.headline-editor')) return;
    if (node.nodeType === Node.TEXT_NODE) {
      update(node,'text',()=>node.data,value=>node.data=value);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const name of attributes) if (node.hasAttribute(name))
        update(node,name,()=>node.getAttribute(name),value=>node.setAttribute(name,value));
      if (node.matches('meta[name="description"]'))
        update(node,'content',()=>node.content,value=>node.content=value);
      for (const child of node.childNodes) visit(child);
    }
  }
  const observer = new MutationObserver(mutations => {
    observer.disconnect();
    const roots = new Set();
    for (const mutation of mutations) {
      if (mutation.type === 'childList') for (const node of mutation.addedNodes) roots.add(node);
      else roots.add(mutation.target);
    }
    for (const root of roots) if (root.isConnected) visit(root);
    observe();
  });
  function observe() {
    observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes});
  }
  function apply() {
    observer.disconnect();
    document.documentElement.lang = language;
    visit(document.documentElement);
    document.querySelectorAll('[data-language-select]').forEach(select => {
      select.value = language;
      select.setAttribute('aria-label', {ru:'Язык',en:'Language',tt:'Тел',zh:'语言',es:'Idioma'}[language]);
    });
    observe();
    // Gallery cards measure translated copy as well as viewport dimensions.
    window.dispatchEvent(new Event('resize'));
  }
  function setLanguage(next) {
    if (!locales[next]) return;
    language = next;
    try { localStorage.setItem('ligarent.lang',next); } catch {}
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) { url.searchParams.set('lang',next); history.replaceState(history.state,'',url); }
    apply();
    document.dispatchEvent(new CustomEvent('ligarent-language-change',{detail:{language}}));
  }
  window.ligarentI18n = {translate,setLanguage,get language(){return language;}};
  function boot() {
    const control = document.createElement('label');
    control.className = 'language-control';
    control.dataset.noTranslate = '';
    control.innerHTML = '<span aria-hidden="true">◎</span><select data-language-select>'+Object.entries(locales).map(([code,label])=>`<option value="${code}" lang="${code}">${label}</option>`).join('')+'</select>';
    control.querySelector('select').addEventListener('change',event=>setLanguage(event.target.value));
    document.body.append(control);
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
