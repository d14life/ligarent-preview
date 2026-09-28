(() => {
  const shell = document.querySelector('#geography .map-shell');
  const mapElement = document.querySelector('#service-map');
  const loading = document.querySelector('#map-loading');
  if (!shell || !mapElement || !loading) return;

  // Bounds encompass the Republic of Tatarstan and the Republic of Bashkortostan.
  const regionBounds = [[51.5, 47.0], [56.8, 60.1]];
  let map;

  function startMap() {
    if (map) return;
    if (!window.L) {
      loading.textContent = 'Интерактивная карта временно недоступна. Откройте её по ссылке ниже.';
      shell.classList.add('is-error');
      return;
    }

    map = L.map(mapElement, {
      center: [54.15, 53.55],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: false,
      zoomSnap: 0.25,
      keyboard: true
    });

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 5,
      maxZoom: 18,
      updateWhenIdle: true,
      keepBuffer: 1,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);
    tiles.on('tileload', () => {
      shell.classList.remove('is-error');
      shell.classList.add('is-ready');
    });
    tiles.on('tileerror', () => {
      if (!shell.classList.contains('is-ready')) {
        loading.textContent = 'Картографический слой недоступен. Откройте карту в OpenStreetMap по ссылке ниже.';
        shell.classList.add('is-error');
      }
    });

    L.control.zoom({ position: 'topright', zoomInTitle: 'Приблизить карту', zoomOutTitle: 'Отдалить карту' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 130 }).addTo(map);
    map.fitBounds(regionBounds, { padding: [22, 22], animate: false });
    requestAnimationFrame(() => map.invalidateSize());
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      startMap();
    }, { rootMargin: '300px 0px' });
    observer.observe(shell);
  } else startMap();
})();
