(() => {
  let leaving = false;
  let touchY = null;
  const atTop = () => Math.max(document.scrollingElement?.scrollTop ?? 0, scrollY) <= 1;
  const busy = target => document.body.classList.contains('menu-active') ||
    document.querySelector('dialog[open]') ||
    target?.closest?.('input, textarea, select, [contenteditable], .full-menu');

  function returnToIntro(distance) {
    if (leaving) return;
    leaving = true;
    const reverse = Math.max(1, Math.round(distance));
    location.replace(`./start.html?reverse=${reverse}`);
  }

  addEventListener('wheel', event => {
    if (event.ctrlKey || event.deltaY >= 0 || !atTop() || busy(event.target)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    returnToIntro(-event.deltaY * unit);
  }, { passive: false });

  addEventListener('touchstart', event => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (touchY === null || event.touches.length !== 1 || !atTop() || busy(event.target)) return;
    const distance = event.touches[0].clientY - touchY;
    if (distance < 12) return;
    event.preventDefault();
    returnToIntro(distance);
  }, { passive: false });
  for (const type of ['touchend', 'touchcancel']) addEventListener(type, () => { touchY = null; }, { passive: true });

  addEventListener('keydown', event => {
    if (!atTop() || busy(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    const distance = event.key === 'ArrowUp' ? 40 : event.key === 'PageUp' || (event.key === ' ' && event.shiftKey) ? innerHeight * .8 : 0;
    if (!distance) return;
    event.preventDefault();
    returnToIntro(distance);
  });
})();
