(() => {
  const root = document.getElementById('site-root');
  const source = document.body.dataset.siteUrl || './site.html';
  window.ligarentSiteStatus = 'loading';

  // Let the opening poster and first moving frame get the network first.
  const waitForOpeningFrame = () => new Promise(resolve => {
    const reel = document.getElementById('opening-reel');
    const video = document.getElementById('opening-video');
    if (!reel || reel.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches ||
        (video?.readyState >= 2 && !video.paused)) { resolve(); return; }
    let settled = false;
    let timer;
    const ready = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      document.removeEventListener('intro-loader-playing', ready);
      document.removeEventListener('intro-loader-ready', ready);
      resolve();
    };
    document.addEventListener('intro-loader-playing', ready, { once: true });
    document.addEventListener('intro-loader-ready', ready, { once: true });
    timer = setTimeout(ready, 1200);
  });

  const loadStyle = href => new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.append(link);
  });
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.body.append(script);
  });

  window.ligarentSiteReady = (async () => {
    await waitForOpeningFrame();
    const response = await fetch(source, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Site returned ${response.status}`);
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const main = page.querySelector('main');
    if (!main?.querySelector('#machine-grid')) throw new Error('Site sections unavailable');
    const filters = page.querySelector('body > svg');
    if (filters) root.append(document.importNode(filters, true));
    root.append(document.importNode(main, true));

    for (const link of page.querySelectorAll('link[rel="stylesheet"]')) {
      await loadStyle(link.getAttribute('href'));
    }
    for (const script of page.querySelectorAll('script[src]')) {
      const src = script.getAttribute('src');
      // The embedded page uses the same scroll controller as the intro.
      if (src.includes('site-return.js')) continue;
      if (src.includes('gsap.min.js') && window.gsap) continue;
      await loadScript(src);
    }
    const header = document.querySelector('body > .site-header');
    if (header) root.prepend(header);
    // The first site viewport must be painted before it can be revealed.
    await Promise.allSettled([...root.querySelectorAll('#machine-grid .product')].map(img => img.decode()));
    window.ligarentSiteStatus = 'ready';
    document.dispatchEvent(new Event('ligarent-site-ready'));
  })().catch(error => {
    window.ligarentSiteStatus = 'failed';
    console.error('The live site could not be prepared:', error);
    document.dispatchEvent(new Event('ligarent-site-failed'));
  });
})();
