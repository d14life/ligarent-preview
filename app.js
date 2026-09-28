const machines=[{id:'d6r',name:'Cat D6R',weight:'19 010',power:'130–145',bladeCapacity:'5,61',bladeWidth:'3 260'},{id:'d7r',name:'Cat D7R',weight:'25 880',power:'179',bladeCapacity:'6,86',bladeWidth:'3 693'},{id:'d8r',name:'Cat D8R',weight:'37 630',power:'226',bladeCapacity:'8,70',bladeWidth:'3 937'}];
document.querySelector('#machine-grid').innerHTML=machines.map(m=>`<div class="machine-atropos atropos"><div class="atropos-scale"><div class="atropos-rotate"><div class="atropos-inner"><article class="machine" id="${m.id}"><h3 class="sr-only">${m.name}</h3><div class="machine-stage"><div class="machine-model" data-atropos-offset="-5" aria-hidden="true"><span>Cat</span><strong>${m.name.split(" ")[1]}</strong></div><img class="product" data-atropos-offset="12" src="assets/${m.id}.png" alt="Бульдозер ${m.name}, вид в три четверти"></div><dl class="machine-specs" data-atropos-offset="2"><div class="machine-spec"><dt>МАССА</dt><dd>${m.weight} <small>кг</small></dd></div><div class="machine-spec"><dt>МОЩНОСТЬ</dt><dd>${m.power} <small>кВт</small></dd></div><div class="machine-spec"><dt>ОБЪЁМ SU-ОТВАЛА</dt><dd>${m.bladeCapacity} <small>м³</small></dd></div><div class="machine-spec"><dt>ШИРИНА SU-ОТВАЛА</dt><dd>${m.bladeWidth} <small>мм</small></dd></div></dl><img class="drawing" data-atropos-offset="10" src="assets/${m.id}-drawing.png" alt="Габаритная схема ${m.name}"><button data-machine="${m.name}">Запросить эту машину</button></article></div></div></div></div>`).join('');
document.querySelector('#d6r .product').src='assets/d6r-no-rods.png';
const workTitles=['Расчистка территории','Массовые земляные работы','Дороги и площадки','Рыхление скалы','Чистовая планировка','Зимние работы'];
const workAlbums=[
 {title:'Расчистка территории',summary:'Подготовка площадки: сдвиг растительности, поверхностного грунта и препятствий.',cover:'album-clearing-wide.jpg',coverRatio:999/475,photos:[{file:'album-clearing-wide.jpg',title:'Бульдозер расчищает выгоревший кустарник',source:'https://www.dvidshub.net/image/9649570/clearing-brush',credit:'Фото: Sgt. Jordan McNeal / Georgia National Guard (public domain). Расчистка выгоревшего кустарника; модель бульдозера не указана.'},{i:0,title:'D6R: сдвиг растительности и грунта'},{i:6,title:'D6R: подготовка площадки'}]},
 {title:'Массовые земляные работы',summary:'Срезка, перемещение и распределение больших объёмов грунта.',cover:'album-d6r-earth.jpg',coverRatio:1280/853,photos:[{file:'album-d6r-earth.jpg',title:'D6R перемещает грунт',source:'https://commons.wikimedia.org/wiki/File:CaterpillarD6R1.JPG',credit:'Фото: Witold Grzesiek / Wikimedia Commons · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a>.'},{i:1,title:'D6R перемещает грунт на участке'},{i:10,title:'D7R работает с грунтом'},{file:'album-d6r-truck.jpg',title:'D6R и самосвал на земляных работах',source:'https://commons.wikimedia.org/wiki/File:Bulldozer_and_truck_work.jpg',credit:'Фото: Gentry George / USFWS, public domain. D6R и самосвал на земляных работах.'}]},
 {title:'Дороги и площадки',summary:'Планировка и подготовка основания для проездов и строительных площадок.',cover:'album-d7r-road.jpg',coverRatio:1000/667,photos:[{file:'album-d7r-road.jpg',title:'D7R толкает грунт и камни при строительстве дороги',source:'https://www.dvidshub.net/image/7814365/transatlantic-castle-road-construction',credit:'Фото: Sgt. Rebecca Call / U.S. Army (public domain). Военный T-9/D7R на дорожных работах.'},{i:2,title:'D7R: подготовка грунтовой площадки'},{i:9,title:'D6R: распределение грунта'}]},
 {title:'Рыхление скалы',summary:'Работа рыхлителем по плотному и каменистому грунту перед перемещением.',cover:'album-ripping-wide.jpg',coverRatio:1920/1078,photos:[{file:'album-ripping-wide.jpg',title:'D11T рыхлит плотные слои сланца',source:'https://commons.wikimedia.org/wiki/File:Narva_mine_bulldozer.jpg',credit:'Фото: Siim Roov / Wikimedia Commons · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Иллюстрация работы рыхлителя; D11T не входит в парк LIGARENT.'},{i:7,title:'D6R на каменистом участке'},{i:3,title:'D7R: вид на задний рыхлитель'},{i:8,title:'Крупный план рыхлителя в плотном грунте'}]},
 {title:'Чистовая планировка',summary:'Распределение грунта по заданным отметкам; точность зависит от оснащения машины.',cover:'album-d7r-site.jpg',coverRatio:1000/667,photos:[{file:'album-d7r-site.jpg',title:'D7R выравнивает строительную площадку',source:'https://www.dvidshub.net/image/7112936/us-army-soldiers-prepare-construction-site-hadr-warehouse-during-salaknib-and-balikatan-22',credit:'Фото: Spc. Matthew Mackintosh / U.S. Army (public domain). D7R выравнивает площадку перед строительством склада.'},{i:4,title:'D7R с системой контроля отметок'},{i:9,title:'D6R распределяет грунт на площадке'}]},
 {title:'Зимние работы',summary:'Расчистка снежных проходов и подготовка проездов по условиям объекта.',cover:'work-5.jpg',coverRatio:1280/853,photos:[{i:5,title:'Расчистка снежного проезда; модель не указана'},{i:15,title:'D7R в снежных условиях; машина не показана в работе'}]}
];
const selectField=(id,title,placeholder,values)=>`<div><label for="${id}">${id==='job'?'<img class="inline-dozer-mark" src="assets/bulldozer-mark.svg?v=3" alt="" aria-hidden="true">':''}${title}</label><select id="${id}" name="${id}" required><option value="">${placeholder}</option>${values.map((v,i)=>`<option value="${i}">${v}</option>`).join('')}</select></div>`;
function renderWorkCard(album,index){
  return `<button class="work-card" data-album="${index}" style="--cover-ratio:${album.coverRatio}" aria-label="Открыть альбом: ${album.title}"><span class="work-image"><span class="work-image-main"><img data-src="assets/${album.cover}" alt="${album.title}: пример техники на объекте" loading="lazy" decoding="async" fetchpriority="low"></span></span><span class="work-card-content"><strong><span class="work-card-number">${String(index+1).padStart(2,'0')}</span> ${album.title}</strong><small>${album.summary}</small><em>${album.photos.length} фото · Смотреть альбом</em></span></button>`;
}
document.querySelector('#remaining').innerHTML=`
<section class="selector light" id="selection"><div class="wrap"><h2>Четыре вопроса — и машина подобрана</h2><div class="selector-layout"><form id="selector"><div class="fields">${selectField('job','Какая работа?','Выберите работу',workTitles)}${selectField('area','Площадь объекта','Выберите площадь',['До 1 000 м²','1 000–5 000 м²','Более 5 000 м²'])}${selectField('ground','Грунт','Выберите вариант',['Песок / мягкий грунт','Суглинок / глина','Скала / мёрзлый грунт'])}${selectField('access','Подъезд','Выберите вариант',['Свободный подъезд','Ограниченный подъезд','Нужно уточнить'])}</div><div class="selector-action"><button type="submit">Подобрать машину</button><p class="result" id="selection-result" role="status"></p></div></form><div class="selector-art"><img class="decor" src="assets/bulldozer-top-landscape.png" alt="" loading="lazy" decoding="async" fetchpriority="low"><p class="caption">Правильная машина<br>для ваших задач</p></div></div></div></section>
<section class="work dark" id="work"><div class="wrap"><div class="work-heading"><h2>Если надо толкать, срезать, рыхлить или ровнять</h2><p>Прокрутите страницу, чтобы увидеть все виды работ. Нажмите на карточку, чтобы открыть фотографии.</p></div><div class="work-scroll" id="work-scroll"><div class="work-sticky"><div class="work-status"><button class="work-view-toggle" id="work-view-toggle" type="button" aria-label="Показать обычную сетку видов работ"><img class="work-view-icon" src="assets/road-mark.svg?v=2" alt=""><span class="work-view-label">Показать сетку</span></button><span id="work-position" aria-live="off">01 / 06</span><span class="work-hint">Прокрутите страницу, чтобы сменить вид работ</span></div><div class="work-grid"><div class="work-track">${workAlbums.map(renderWorkCard).join('')}</div></div></div></div></div></section>
<section class="coverage light" id="geography"><div class="wrap"><div class="coverage-copy"><div class="coverage-title"><p class="coverage-eyebrow">Республика Татарстан · Республика Башкортостан</p><h2>Куда выезжают машины</h2></div><p class="coverage-intro">Работаем в Татарстане и Башкортостане. Перетаскивайте карту и меняйте масштаб кнопками + и −.</p></div><div class="map-shell"><div id="service-map" class="service-map" role="region" aria-label="Интерактивная карта Татарстана и Башкортостана. Перетаскивайте карту и используйте кнопки масштаба."></div><p class="map-loading" id="map-loading" role="status">Загружаем интерактивную карту…</p></div><p class="map-explainer">Маршрут и стоимость доставки уточняем для вашего объекта. <a href="https://www.openstreetmap.org/#map=6/54.3/53.5" target="_blank" rel="noopener noreferrer">Открыть в OpenStreetMap ↗</a></p></div></section>
<section class="faq light" id="faq"><div class="wrap"><h2>О чём спрашивают до заказа</h2><div class="split"><div><details><summary>У вас свои операторы?</summary><p>Машины предоставляются с оператором. Состав смены, опыт работы и график согласовываются при подтверждении заявки.</p></details><details><summary>Как вы перевозите технику?</summary><p>Бульдозер доставляется на трале. Для расчёта доставки укажите расположение объекта и условия подъезда.</p></details><details><summary><span class="faq-question"><img class="inline-dozer-mark" src="assets/bulldozer-mark.svg?v=3" alt="" aria-hidden="true">Какую машину выбрать?</span></summary><p>D6R — для планировки и компактных объектов, D7R — для массовых земляных работ, D8R — для тяжёлого грунта и больших объёмов. Подбор предварительный: окончательное решение зависит от грунта, объёма работ и доступа на площадку.</p></details></div><div class="art-side"><img class="decor" src="assets/bulldozer-front-transparent.png" alt="" loading="lazy" decoding="async" fetchpriority="low"><p class="caption">Вопросы сегодня —<br>уверенность завтра</p></div></div></div></section>
<section class="enquiry light" id="enquiry"><div class="wrap"><h2>Расскажите про объект</h2><div class="split"><form id="enquiry-form"><input type="hidden" name="machine" id="chosen-machine"><div class="form-grid"><div><div class="field"><label for="name">Ваше имя</label><input id="name" name="name" placeholder="Иван Иванов" autocomplete="name" required maxlength="100"></div><div class="field"><label for="phone">Контактный телефон</label><input id="phone" name="phone" placeholder="+7 (___) ___-__-__" type="tel" autocomplete="tel" required pattern="[+0-9() .-]{10,22}" title="Укажите телефон: от 10 до 22 символов"></div><div class="field"><label for="whatsapp">Номер WhatsApp</label><input id="whatsapp" name="whatsapp" placeholder="+7 (___) ___-__-__" type="tel" pattern="[+0-9() .-]{10,22}"></div></div><div><div class="field"><label for="description">Описание объекта</label><textarea id="description" name="description" placeholder="Расскажите, что нужно сделать" required maxlength="4000"></textarea></div><div class="field"><label for="volume">Примерно сколько тонн</label><input id="volume" name="volume" type="number" min="1" placeholder="Например, 5000"></div><div class="field"><label for="location">Расположение объекта</label><input id="location" name="location" placeholder="Например, Альметьевский район, Татарстан" required maxlength="300"></div></div></div><div class="form-footer"><button type="submit">Скачать заявку</button><p class="notice">Заявка сохранится файлом. Отправка пока не подключена.</p><p class="form-status" id="form-status" role="status"></p></div></form></div></div></section>
<footer class="footer"><div class="wrap"><div class="footer-top"><a class="brand" href="#machines" aria-label="LIGARENT — к машинам"><span class="logo">LIGARENT</span><p>Аренда бульдозеров<br>с оператором.</p></a><nav aria-label="Навигация внизу страницы"><a href="#machines">Машины</a><a href="#selection">Какая машина</a><a href="#work">Что делаем</a><a href="#geography">География</a><a href="#faq">Вопросы</a></nav><a class="button" href="#enquiry">Оставить заявку</a></div><div class="footer-bottom"><span>© LIGARENT. Все права защищены.</span><a class="asset-link" href="assets/sources.md" target="_blank">Источники изображений</a><span>Двигаем грунт. В срок.</span></div></div></footer>
<dialog id="photo-dialog" aria-labelledby="photo-title"><button class="close" type="button" aria-label="Закрыть альбом">×</button><div class="album-intro"><p class="album-kicker">ПРИМЕРЫ РАБОТ</p><h3 id="photo-title"></h3><p id="album-summary"></p></div><div class="album-gallery" id="album-gallery" aria-label="Фотографии в альбоме"></div><p class="album-note">Иллюстративные фото из открытых источников, не объекты LIGARENT. Модель указывается только при подтверждении источником.</p></dialog><dialog id="photo-zoom" aria-labelledby="zoom-title"><button class="close" type="button" aria-label="Закрыть фотографию">×</button><div class="zoom-body"><img id="zoom-image" alt=""><div class="zoom-info"><h3 id="zoom-title"></h3><div id="zoom-credit"></div><a id="zoom-source" target="_blank" rel="noopener noreferrer">Источник фотографии</a></div></div></dialog>`;
let selectedMachine='';
function chooseMachine(name,scroll=true){selectedMachine=name;try{sessionStorage.setItem('ligarent-machine',name)}catch{}const hidden=document.querySelector('#chosen-machine');if(hidden)hidden.value=name;document.querySelectorAll('.machine').forEach(card=>card.classList.toggle('selected',card.querySelector('h3').textContent===name));const status=document.querySelector('#form-status');if(status)status.textContent=`Выбрана машина: ${name}`;if(scroll){if(window.ligarentNavigate){window.ligarentNavigate('enquiry')}else{document.querySelector('#enquiry').scrollIntoView({behavior:'smooth'})}}}
document.querySelectorAll('[data-machine]').forEach(b=>b.addEventListener('click',()=>chooseMachine(b.dataset.machine)));
document.querySelector('#selector').addEventListener('submit',e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));let index=Number(values.ground)===2||Number(values.job)===3?2:Number(values.area)===2||Number(values.job)===1?1:0;const name=machines[index].name;chooseMachine(name,false);document.querySelector('#selection-result').innerHTML=`Предварительно: ${name}.${values.access!=='0'?' Условия подъезда требуют уточнения.':''} <a class="selection-next" href="#enquiry">Перейти к заявке →</a>`;});

const photoDialog=document.querySelector('#photo-dialog');
const photoZoom=document.querySelector('#photo-zoom');
const albumGallery=document.querySelector('#album-gallery');
let activeAlbum=0;
function photoFile(photo){return `assets/${photo.file||`work-${photo.i}.jpg`}`;}
function photoSource(photo){return photo.source||window.photoSources?.[photo.i]||'assets/sources.md';}
function photoCredit(photo){return photo.credit||window.photoCredits?.[photo.i]||(photo.i===5?'Фото: Timothy A. Gonsalves / Wikimedia Commons · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Модель не указана.':'Фото © Caterpillar. Иллюстрация типа работ из каталога производителя.');}
function openPhoto(index){
  const photo=workAlbums[activeAlbum].photos[index];
  const image=document.querySelector('#zoom-image');
  image.src=photoFile(photo);
  image.alt=photo.title;
  document.querySelector('#zoom-title').textContent=photo.title;
  document.querySelector('#zoom-credit').innerHTML=photoCredit(photo);
  document.querySelector('#zoom-source').href=photoSource(photo);
  photoZoom.showModal();
}
function openAlbum(index,photoIndex=0){
  activeAlbum=index;
  const album=workAlbums[index];
  document.querySelector('#photo-title').textContent=album.title;
  document.querySelector('#album-summary').textContent=album.summary;
  albumGallery.replaceChildren(...album.photos.map((photo,photoIndex)=>{
    const figure=document.createElement('figure');
    figure.className='album-photo-card';
    const button=document.createElement('button');
    button.className='album-photo-open';
    button.type='button';
    button.setAttribute('aria-label',`Увеличить фото ${photoIndex+1}: ${photo.title}`);
    const image=document.createElement('img');
    image.src=photoFile(photo);
    image.alt=photo.title;
    image.loading='lazy';
    image.decoding='async';
    const hint=document.createElement('span');
    hint.textContent='Увеличить фото';
    button.append(image,hint);
    button.addEventListener('click',()=>openPhoto(photoIndex));
    const caption=document.createElement('figcaption');
    const title=document.createElement('strong');
    title.textContent=`${String(photoIndex+1).padStart(2,'0')}  ${photo.title}`;
    const credit=document.createElement('p');
    credit.className='album-photo-credit';
    credit.innerHTML=photoCredit(photo);
    const source=document.createElement('a');
    source.href=photoSource(photo);
    source.target='_blank';
    source.rel='noopener noreferrer';
    source.textContent='Источник фотографии';
    caption.append(title,credit,source);
    figure.append(button,caption);
    return figure;
  }));
  photoDialog.showModal();
  const selectedPhoto=albumGallery.querySelectorAll('.album-photo-card')[photoIndex];
  if(selectedPhoto&&photoIndex>0)requestAnimationFrame(()=>selectedPhoto.scrollIntoView({block:'center'}));
}
document.querySelectorAll('[data-album]').forEach(b=>b.addEventListener('click',()=>openAlbum(Number(b.dataset.album))));
for(const dialog of [photoDialog,photoZoom]){
  dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}
const workScroll=document.querySelector('#work-scroll');
const workSticky=workScroll.querySelector('.work-sticky');
const workGrid=workScroll.querySelector('.work-grid');
const workTrack=workGrid.querySelector('.work-track');
const workCards=[...workScroll.querySelectorAll('.work-card')];
const workPosition=document.querySelector('#work-position');
const workViewToggle=document.querySelector('#work-view-toggle');
const workViewLabel=workViewToggle.querySelector('.work-view-label');
const workIntro=document.querySelector('.work-heading p');
const deckIntro=workIntro.textContent;
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  workScroll.classList.add('is-enhanced');
  let deckActive=true,workStart=0,workEnd=0,workTravel=1,stickyTop=0,lastSelected=-1,cardHeights=[];
  let currentPosition=0,targetPosition=0,frame=0,lastFrameTime=0,initialized=false;
  function loadWorkImages(container){
    container.querySelectorAll('img[data-src]').forEach(img=>{img.src=img.dataset.src;delete img.dataset.src;});
  }
  function sizeWorkCards(){
    const maxWidth=Math.min(workTrack.clientWidth-20,1160);
    const maxHeight=Math.max(220,workTrack.clientHeight-24);
    const minWidth=Math.min(maxWidth,innerWidth<=620?200:450);
    workCards.forEach((card,index)=>{
      const ratio=workAlbums[index].coverRatio;
      const content=card.querySelector('.work-card-content');
      let width=Math.min(maxWidth,Math.max(minWidth,(maxHeight-120)*ratio));
      for(let pass=0;pass<3;pass++){
        card.style.width=`${width}px`;
        const contentHeight=content.getBoundingClientRect().height;
        const fittedWidth=Math.min(maxWidth,Math.max(minWidth,(maxHeight-contentHeight)*ratio));
        if(Math.abs(fittedWidth-width)<1)break;
        width=fittedWidth;
      }
      card.style.width=`${width}px`;
      cardHeights[index]=Math.ceil(width/ratio+content.getBoundingClientRect().height);
      card.style.height=`${cardHeights[index]}px`;
    });
    stickyTop=parseFloat(getComputedStyle(workSticky).top)||0;
    workStart=workScroll.getBoundingClientRect().top+scrollY;
    workEnd=workStart+workScroll.offsetHeight;
    workTravel=Math.max(1,workScroll.offsetHeight-workSticky.offsetHeight);
  }
  function renderWorkGallery(position){
    const front=Math.floor(position);
    const progress=position-front;
    const selected=progress>.78?Math.min(front+1,workCards.length-1):front;
    const frontWidth=parseFloat(workCards[front].style.width);
    const nextWidth=parseFloat(workCards[Math.min(front+1,workCards.length-1)].style.width);
    const deckWidth=frontWidth+(nextWidth-frontWidth)*progress;
    workCards.forEach((card,index)=>{
      const depth=(index-front+workCards.length)%workCards.length;
      let offset=0,scale=1;
      if(depth===0){offset=-(cardHeights[index]+75)*progress;}
      else if(depth>0){
        const referenceHeight=cardHeights[front]*(1-progress)+cardHeights[Math.min(front+1,workCards.length-1)]*progress;
        const virtualDepth=depth-progress;
        offset=(cardHeights[index]-referenceHeight)/2-virtualDepth*(innerWidth<=620?15:20);
        scale=1-Math.min(workCards.length-1,virtualDepth)*0.008;
      }
      card.style.transform=`translate3d(-50%,calc(-50% + ${(offset+25).toFixed(1)}px),0) scale(${scale.toFixed(3)})`;
      const sliver=innerWidth<=620?15:20;
      const revealed=depth===0?cardHeights[index]:sliver+(depth===1?Math.min(1,progress/.78):0)*(cardHeights[index]-sliver);
      const sideInset=depth>0?Math.max(0,(parseFloat(card.style.width)-deckWidth+depth*8)/2):0;
      card.style.clipPath=`inset(0 ${sideInset.toFixed(1)}px ${Math.max(0,cardHeights[index]-revealed).toFixed(1)}px ${sideInset.toFixed(1)}px)`;
      card.style.opacity=depth===0?String(1-Math.max(0,(progress-.78)/.22)):'1';
      card.style.zIndex=String(10-Math.max(0,depth));
      card.style.pointerEvents=index===selected?'auto':'none';
      card.tabIndex=index===selected?0:-1;
      card.setAttribute('aria-hidden',String(index!==selected));
    });
    workCards.forEach(loadWorkImages);
    if(selected!==lastSelected){
      workCards[lastSelected]?.removeAttribute('aria-current');
      workCards[selected].setAttribute('aria-current','true');
      workPosition.textContent=`${String(selected+1).padStart(2,'0')} / ${String(workCards.length).padStart(2,'0')}`;
      lastSelected=selected;
    }
  }
  function tick(time){
    frame=0;
    if(!deckActive)return;
    const elapsed=lastFrameTime?Math.min(48,time-lastFrameTime):16;
    lastFrameTime=time;
    currentPosition+=(targetPosition-currentPosition)*(1-Math.exp(-elapsed/160));
    if(Math.abs(targetPosition-currentPosition)<.002)currentPosition=targetPosition;
    renderWorkGallery(currentPosition);
    if(currentPosition!==targetPosition)frame=requestAnimationFrame(tick);
  }
  function updateWorkPosition(instant=false){
    if(!deckActive)return;
    targetPosition=Math.max(0,Math.min(workCards.length-1,(scrollY-workStart+stickyTop)/workTravel*(workCards.length-1)));
    if(instant||!initialized){currentPosition=targetPosition;initialized=true;renderWorkGallery(currentPosition);return;}
    if(!frame)frame=requestAnimationFrame(tick);
  }
  function clearWorkCards(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;lastFrameTime=0;
    workCards.forEach(card=>{
      for(const property of ['width','height','transform','clipPath','opacity','zIndex','pointerEvents'])card.style[property]='';
      card.tabIndex=0;
      card.removeAttribute('aria-current');
      card.removeAttribute('aria-hidden');
    });
    lastSelected=-1;
  }
  workViewToggle.addEventListener('click',()=>{
    const sectionTop=document.querySelector('#work').getBoundingClientRect().top+scrollY;
    deckActive=!deckActive;
    workScroll.classList.toggle('is-enhanced',deckActive);
    workScroll.classList.toggle('is-grid',!deckActive);
    workViewLabel.textContent=deckActive?'Показать сетку':'Листать карточки';
    workViewToggle.setAttribute('aria-label',deckActive?'Показать обычную сетку видов работ':'Вернуться к прокручиваемым карточкам');
    workIntro.textContent=deckActive?deckIntro:'Выберите вид работ, чтобы открыть фотографии.';
    if(deckActive)sizeWorkCards();
    else {clearWorkCards();workCards.forEach(loadWorkImages);}
    scrollTo({top:Math.max(0,sectionTop-68),behavior:'instant'});
    if(deckActive)requestAnimationFrame(()=>updateWorkPosition(true));
  });
  addEventListener('scroll',()=>{if(deckActive&&scrollY>workStart-innerHeight&&scrollY<workEnd+innerHeight)updateWorkPosition()},{passive:true});
  addEventListener('resize',()=>{if(deckActive){sizeWorkCards();updateWorkPosition(true)}},{passive:true});
  requestAnimationFrame(()=>{sizeWorkCards();updateWorkPosition(true)});
  document.fonts?.ready.then(()=>{if(deckActive){sizeWorkCards();updateWorkPosition(true)}});
}else{workScroll.classList.add('is-grid');workCards.forEach(card=>card.querySelectorAll('img[data-src]').forEach(img=>{img.src=img.dataset.src;delete img.dataset.src;}));workViewToggle.hidden=true;workIntro.textContent='Выберите вид работ, чтобы открыть фотографии.';}
document.querySelector('#enquiry-form').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const phone=data.phone.replace(/\D/g,'');if(phone.length<10||phone.length>15){document.querySelector('#phone').setCustomValidity('Укажите номер телефона: от 10 до 15 цифр');document.querySelector('#phone').reportValidity();return;}const text=`ЗАЯВКА LIGARENT\n\nМашина: ${data.machine||'Нужен подбор'}\nИмя: ${data.name}\nТелефон: ${data.phone}\nWhatsApp: ${data.whatsapp||'Не указан'}\nОбъект: ${data.location}\nОбъём: ${data.volume||'Нужно уточнить'} тонн\nОписание: ${data.description}\n\nЗаявка подготовлена. Отправка не подключена.`;const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ligarent-zayavka.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#form-status').textContent='Заявка подготовлена и скачана. Она никуда не отправлена.';});
document.querySelector('#phone').addEventListener('input',e=>e.target.setCustomValidity(''));
if(navigator.modelContext?.registerTool){navigator.modelContext.registerTool({name:'select_bulldozer',description:'Select a Cat D6R, D7R or D8R for the enquiry on this page. Does not send an enquiry.',inputSchema:{type:'object',properties:{model:{type:'string',enum:['Cat D6R','Cat D7R','Cat D8R']}},required:['model']},execute:async({model})=>{if(!machines.some(m=>m.name===model))throw new Error('Unknown model');chooseMachine(model,false);return{content:[{type:'text',text:`Selected ${model}`}]};}});}

window.photoSources=["https://s7d2.scene7.com/is/content/Caterpillar/C766876","https://catmachine.co.in/assets/pdf/D6R-Product-Brochure.pdf","https://brookshire.com.au/BrooksHire/media/Media/Spec%20Sheets/Cat-D7-Dozer.pdf","https://brookshire.com.au/BrooksHire/media/Media/Spec%20Sheets/Cat-D7-Dozer.pdf","https://brookshire.com.au/BrooksHire/media/Media/Spec%20Sheets/Cat-D7-Dozer.pdf","https://commons.wikimedia.org/wiki/File:Bulldozer_Snow_Clearance_Shinko_La_Lungnak_Jun24_A7CR_00326.jpg"];

window.photoSources.push(...Array(4).fill("https://catmachine.co.in/assets/pdf/D6R-Product-Brochure.pdf"),...Array(2).fill("https://brookshire.com.au/BrooksHire/media/Media/Spec%20Sheets/Cat-D7-Dozer.pdf"));

window.photoSources[15]="https://commons.wikimedia.org/wiki/File:Caterpillar_D7R_Antarctica.JPG";
window.photoCredits={15:'Фото: Allan Timm / Wikimedia Commons · <a href="https://creativecommons.org/publicdomain/mark/1.0/" target="_blank" rel="noopener">Public domain</a>. Машина стоит в снежных условиях; расчистка на фото не показана.'};
