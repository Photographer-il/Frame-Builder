const INITIAL_VISIBLE = 12;
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
const categories = {
  'recommended-bat-mitzvah': { label: 'מסגרות מומלצות לבת מצווה', title: 'מסגרת מומלצת לבת מצווה', count: 41, path: 'assets/frames', demo: 'assets/demo-bat-mitzvah-wide.webp', ids: range(1, 41) },
  'recommended-bar-mitzvah': { label: 'מסגרות מומלצות לבר מצווה', title: 'מסגרת מומלצת לבר מצווה', count: 4, path: 'assets/frames/bar-mitzvah', demo: 'assets/demo-bar-mitzvah-wide.webp', ids: range(1, 4) },
  'bat-mitzvah': { label: 'בת מצווה', title: 'מסגרת בת מצווה', count: 122, path: 'assets/frames', demo: 'assets/demo-bat-mitzvah-wide.webp', ids: [...range(1, 41), ...range(96, 176)] },
  'bar-mitzvah': { label: 'בר מצווה', title: 'מסגרת בר מצווה', count: 19, path: 'assets/frames/bar-mitzvah', demo: 'assets/demo-bar-mitzvah-wide.webp' },
  wedding: { label: 'חתונה', title: 'מסגרת חתונה', count: 120, path: 'assets/frames/wedding', demo: 'assets/demo-wedding-wide.webp', padNumber: false },
  birthday: { label: 'ימי הולדת', title: 'מסגרת יום הולדת', count: 322, path: 'assets/frames/birthday', demo: 'assets/demo-birthday-wide.webp', padNumber: false },
  henna: { label: 'חינה', title: 'מסגרת חינה', count: 13, path: 'assets/frames/henna', demo: 'assets/demo-henna-wide.webp', padNumber: false },
  brit: { label: 'ברית / בריתה', title: 'מסגרת ברית / בריתה', count: 170, path: 'assets/frames/brit', demo: 'assets/demo-brit-wide.webp', padNumber: false },
};

const framesGrid = document.querySelector('#frames-grid');
const previewFrame = document.querySelector('#preview-frame');
const previewPhoto = document.querySelector('#preview-photo');
const previewStage = document.querySelector('#preview-stage');
const selectedName = document.querySelector('#selected-name');
const showMore = document.querySelector('#show-more');
const loading = document.querySelector('#preview-loading');
const toast = document.querySelector('#toast');
const categoryTabs = document.querySelectorAll('.category-tab');
const galleryCount = document.querySelector('#gallery-count');
const previewCard = document.querySelector('.preview-card');
const previewColumn = document.querySelector('.preview-column');
const categoryGroups = document.querySelector('.category-groups');
const selectionPanel = document.querySelector('.selection-panel');

let activeCategory = 'recommended-bat-mitzvah';
let selectedFrame = 1;
let allVisible = false;
let photoX = 0;
let photoY = 0;
let basePhotoWidth = 0;
let basePhotoHeight = 0;

const framePath = (number) => `${categories[activeCategory].path}/frame-${String(number).padStart(3, '0')}.png`;
const defaultPhotoPath = () => categories[activeCategory].demo || 'assets/demo-bat-mitzvah-wide.webp';
const frameTitle = (number) => {
  const config = categories[activeCategory];
  const displayNumber = config.padNumber === false ? number : String(number).padStart(3, '0');
  return `${config.title} ${displayNumber}`;
};

const categoryFrameIds = (config) => config.ids || range(1, config.count);

function makeFrameCard(number, position) {
  const button = document.createElement('button');
  button.className = `frame-card${number === selectedFrame ? ' selected' : ''}${position >= INITIAL_VISIBLE ? ' hidden-card' : ''}`;
  button.type = 'button';
  button.dataset.frame = number;
  button.setAttribute('aria-label', `בחירת ${frameTitle(number)}`);
  button.setAttribute('aria-pressed', number === selectedFrame ? 'true' : 'false');
  button.innerHTML = `
    <img class="frame-thumb" src="${framePath(number)}" alt="${frameTitle(number)}" loading="lazy" />
    <span class="frame-meta"><span class="frame-name">${frameTitle(number)}</span><span class="frame-check">✓</span></span>
  `;
  button.addEventListener('click', () => selectFrame(number, button));
  return button;
}

function selectFrame(number, button) {
  if (number === selectedFrame) return;
  loading.classList.add('visible');
  const nextImage = new Image();
  nextImage.onload = () => {
    selectedFrame = number;
    previewFrame.src = nextImage.src;
    selectedName.textContent = frameTitle(number);
    document.querySelectorAll('.frame-card').forEach((card) => {
      const isSelected = Number(card.dataset.frame) === number;
      card.classList.toggle('selected', isSelected);
      card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
    loading.classList.remove('visible');
    showToast(`${frameTitle(number)} נבחרה`);
  };
  nextImage.onerror = () => loading.classList.remove('visible');
  nextImage.src = framePath(number);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 1700);
}

function clampPhotoPosition() {
  const stageRect = previewStage.getBoundingClientRect();
  const maxX = Math.max(0, (stageRect.width - basePhotoWidth) / 2);
  const maxY = Math.max(0, (stageRect.height - basePhotoHeight) / 2);
  photoX = Math.max(-maxX, Math.min(maxX, photoX));
  photoY = Math.max(-maxY, Math.min(maxY, photoY));
}

function renderPhotoPosition() {
  clampPhotoPosition();
  previewPhoto.style.transform = `translate(-50%, -50%) translate(${photoX}px, ${photoY}px)`;
}

function layoutPhoto({ reset = false } = {}) {
  if (!previewPhoto.naturalWidth || !previewPhoto.naturalHeight) return;
  previewStage.style.aspectRatio = `${previewPhoto.naturalWidth} / ${previewPhoto.naturalHeight}`;
  const stageRect = previewStage.getBoundingClientRect();
  const scaleX = stageRect.width / previewPhoto.naturalWidth;
  const scaleY = stageRect.height / previewPhoto.naturalHeight;
  const baseScale = Math.min(scaleX, scaleY);
  basePhotoWidth = previewPhoto.naturalWidth * baseScale;
  basePhotoHeight = previewPhoto.naturalHeight * baseScale;
  previewPhoto.style.width = `${basePhotoWidth}px`;
  previewPhoto.style.height = `${basePhotoHeight}px`;
  if (reset) {
    photoX = 0;
    photoY = 0;
  }
  renderPhotoPosition();
}

function syncWorkspaceHeights() {
  if (window.matchMedia('(max-width: 820px)').matches) {
    selectionPanel.style.removeProperty('--preview-card-height');
    return;
  }
  const contentTop = previewCard.getBoundingClientRect().top;
  const contentBottom = categoryGroups.getBoundingClientRect().bottom;
  selectionPanel.style.setProperty('--preview-card-height', `${Math.round(contentBottom - contentTop)}px`);
}

function renderFrames() {
  framesGrid.replaceChildren();
  const config = categories[activeCategory];
  const ids = categoryFrameIds(config);
  const total = ids.length;
  ids.forEach((number, position) => framesGrid.appendChild(makeFrameCard(number, position)));
  galleryCount.textContent = `${total} עיצובים לבחירה`;
  showMore.hidden = total <= INITIAL_VISIBLE;
  showMore.innerHTML = 'הצגת כל המסגרות <span>↓</span>';
  allVisible = false;
}

renderFrames();

showMore.addEventListener('click', () => {
  allVisible = !allVisible;
  document.querySelectorAll('.frame-card').forEach((card, index) => {
    if (index >= INITIAL_VISIBLE) card.classList.toggle('hidden-card', !allVisible);
  });
  showMore.innerHTML = allVisible ? 'הצגת פחות מסגרות <span>↑</span>' : 'הצגת כל המסגרות <span>↓</span>';
});

previewPhoto.addEventListener('load', () => layoutPhoto({ reset: true }));
if (previewPhoto.complete) layoutPhoto({ reset: true });

const previewSizeObserver = new ResizeObserver(syncWorkspaceHeights);
previewSizeObserver.observe(previewCard);
previewSizeObserver.observe(previewColumn);
previewSizeObserver.observe(categoryGroups);
syncWorkspaceHeights();

categoryTabs.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;
    const config = categories[category];
    if (!config.count) {
      showToast(`${config.label} — המסגרות יעלו בקרוב`);
      return;
    }
    if (category === activeCategory) return;
    activeCategory = category;
    selectedFrame = categoryFrameIds(config)[0];
    categoryTabs.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    previewFrame.src = framePath(selectedFrame);
    previewPhoto.src = defaultPhotoPath();
    selectedName.textContent = frameTitle(selectedFrame);
    renderFrames();
    showToast(`קטגוריית ${config.label} נבחרה`);
  });
});

window.addEventListener('resize', () => {
  layoutPhoto();
  syncWorkspaceHeights();
});
