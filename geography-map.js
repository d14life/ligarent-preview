(() => {
  const shell = document.querySelector('#geography .map-shell');
  const mapElement = document.querySelector('#service-map');
  const loading = document.querySelector('#map-loading');
  const info = document.querySelector('#zone-info');
  const buttons = [...document.querySelectorAll('#geography [data-zone]')];
  if (!shell || !mapElement || !buttons.length) return;

  // Kaleykino is a separate village northwest of Almetyevsk.
  const origin = [54.932333, 52.191947];
  const almetyevsk = [54.9005, 52.2964];
  const localCenter = [(origin[0] + almetyevsk[0]) / 2, (origin[1] + almetyevsk[1]) / 2];
  const messages = [
    'До 50 км от Калейкино — перевозка входит в ставку.',
    'От 50 до 100 км от Калейкино — перевозка входит в ставку.',
    'Дальше 100 км от Калейкино — стоимость перевозки рассчитывается отдельно.'
  ];
  const desktopZoom = [12, 8, 7];
  const mobileZoom = [11, 7, 6];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let map;
  let nearCircle;
  let outerCircle;
  let activeZone = 0;

  function setZone(index, moveMap = true) {
    activeZone = index;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.zone) === index)));
    info.textContent = messages[index];
    if (!map) return;

    nearCircle.setStyle({
      color: '#d4ae00',
      weight: index === 0 ? 3 : 2,
      opacity: index === 2 ? 0.45 : 1,
      fillColor: '#ffda23',
      fillOpacity: index === 0 ? 0.18 : 0.02,
      dashArray: index === 0 ? null : '6 6'
    });
    outerCircle.setStyle({
      color: index === 2 ? '#ef6771' : '#d4ae00',
      weight: index === 0 ? 2 : 3,
      opacity: index === 0 ? 0.45 : 1,
      fillColor: index === 2 ? '#ef6771' : '#ffda23',
      fillOpacity: index === 1 ? 0.11 : 0.01,
      dashArray: index === 0 ? '7 7' : null
    });

    if (moveMap) {
      const zoom = (mapElement.clientWidth < 700 ? mobileZoom : desktopZoom)[index];
      map.stop();
      const center = index === 0 ? localCenter : origin;
      if (reducedMotion.matches) map.setView(center, zoom, { animate: false });
      else map.flyTo(center, zoom, { duration: 0.75 });
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => setZone(Number(button.dataset.zone))));

  function startMap() {
    if (map) return;
    if (!window.L) {
      loading.textContent = 'Интерактивная карта временно недоступна. Откройте её по ссылке ниже.';
      shell.classList.add('is-error');
      return;
    }

    map = L.map(mapElement, {
      center: localCenter,
      zoom: 12,
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

    outerCircle = L.circle(origin, { radius: 100000, interactive: false }).addTo(map);
    nearCircle = L.circle(origin, { radius: 50000, interactive: false }).addTo(map);
    L.circleMarker(origin, {
      radius: 8,
      color: '#14232b',
      weight: 3,
      fillColor: '#ffda23',
      fillOpacity: 1
    }).addTo(map).bindTooltip('Калейкино', {
      permanent: true,
      direction: 'top',
      offset: [0, -10],
      className: 'map-place-label'
    }).bindPopup('<strong>Калейкино</strong><br>Село за пределами города Альметьевска.');

    const cityMarker = L.circleMarker(almetyevsk, {
      radius: 5,
      color: '#14232b',
      weight: 2,
      fillColor: '#f6f8f9',
      fillOpacity: 1
    }).bindTooltip('Альметьевск', {
      permanent: true,
      direction: 'bottom',
      offset: [0, 8],
      className: 'map-place-label map-city-label'
    });
    function updateCityMarker() {
      if (map.getZoom() >= 10 && !map.hasLayer(cityMarker)) cityMarker.addTo(map);
      else if (map.getZoom() < 10 && map.hasLayer(cityMarker)) map.removeLayer(cityMarker);
    }
    map.on('zoomend', updateCityMarker);

    setZone(activeZone, false);
    map.setView(localCenter, (mapElement.clientWidth < 700 ? mobileZoom : desktopZoom)[activeZone], { animate: false });
    updateCityMarker();
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
