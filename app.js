```javascript
(() => {
  'use strict';

  const STORAGE_KEY = 'intranet-photo-gallery-settings';

  const defaultState = {
    currentIndex: 0,
    playing: true,
    interval: 5000,
    mode: 'sequential',
    showThumbnails: true,
    showCaptions: true,
    layout: 'slideshow',
    theme: 'dark',
    transition: 'fade'
  };

  const dom = {
    html: document.documentElement,
    body: document.body,
    appTitle: document.getElementById('appTitle'),
    currentSlide: document.getElementById('currentSlide'),
    totalSlides: document.getElementById('totalSlides'),
    progressBar: document.getElementById('progressBar'),
    mediaStage: document.getElementById('mediaStage'),
    heroStage: document.getElementById('heroStage'),
    thumbsStrip: document.getElementById('thumbsStrip'),
    gridGallery: document.getElementById('gridGallery'),
    masonryGallery: document.getElementById('masonryGallery'),
    captionTitle: document.getElementById('captionTitle'),
    captionText: document.getElementById('captionText'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    sequentialBtn: document.getElementById('sequentialBtn'),
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    layoutSelect: document.getElementById('layoutSelect'),
    intervalSelect: document.getElementById('intervalSelect'),
    transitionSelect: document.getElementById('transitionSelect'),
    themeSelect: document.getElementById('themeSelect'),
    captionsToggle: document.getElementById('captionsToggle'),
    thumbsToggle: document.getElementById('thumbsToggle'),
    emptyState: document.getElementById('emptyState')
  };

  const photos = Array.isArray(window.PHOTOS) ? window.PHOTOS.filter(Boolean) : [];
  const config = window.GALLERY_CONFIG || {};
  const state = loadState();

  let timer = null;
  let progressStart = 0;
  let progressFrame = null;
  let shufflePool = [];
  let isFullscreen = false;
  let touchStartX = 0;
  let touchDeltaX = 0;

  initialize();

  function initialize() {
    applyConfig();
    applyStateToControls();
    applyTheme(state.theme);
    updateModeButtons();

    if (!photos.length) {
      renderEmptyState();
      return;
    }

    normalizePhotoData();
    dom.totalSlides.textContent = String(photos.length);

    buildSlides();
    buildHeroLayout();
    buildThumbs();
    buildGridLayout();
    buildMasonryLayout();

    render(true);
    bindEvents();
    startAutoplay();
  }

  function applyConfig() {
    const title = config.title && String(config.title).trim() ? String(config.title).trim() : 'Photo Gallery';
    document.title = title;
    if (dom.appTitle) dom.appTitle.textContent = title;

    if (config.defaultInterval && [3000, 5000, 8000, 10000, 15000].includes(Number(config.defaultInterval))) {
      if (!hasSavedState()) state.interval = Number(config.defaultInterval);
    }

    if (config.defaultTheme && ['light', 'dark'].includes(config.defaultTheme)) {
      if (!hasSavedState()) state.theme = config.defaultTheme;
    }

    if (config.defaultLayout && ['slideshow', 'hero', 'grid', 'masonry'].includes(config.defaultLayout)) {
      if (!hasSavedState()) state.layout = config.defaultLayout;
    }
  }

  function hasSavedState() {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return false;
    }
  }

  function normalizePhotoData() {
    photos.forEach((photo, index) => {
      photo.id = photo.id || `photo-${index + 1}`;
      photo.src = photo.src || photo.path || '';
      photo.thumb = photo.thumb || photo.thumbnail || photo.src;
      photo.caption = typeof photo.caption === 'string' && photo.caption.trim() ? photo.caption.trim() : `Photo ${index + 1}`;
      photo.description = typeof photo.description === 'string' ? photo.description.trim() : '';
      photo.alt = typeof photo.alt === 'string' && photo.alt.trim() ? photo.alt.trim() : photo.caption;
    });
  }

  function buildSlides() {
    dom.mediaStage.innerHTML = '';
    photos.forEach((photo, index) => {
      const slide = document.createElement('figure');
      slide.className = 'gallery-slide';
      slide.dataset.index = String(index);

      const img = createImage(photo, 'gallery-slide-image');
      img.loading = index < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';

      slide.appendChild(img);
      dom.mediaStage.appendChild(slide);
    });
  }

  function buildHeroLayout() {
    dom.heroStage.innerHTML = '';
    photos.forEach((photo, index) => {
      const slide = document.createElement('figure');
      slide.className = 'hero-slide';
      slide.dataset.index = String(index);

      const img = createImage(photo, 'hero-slide-image');
      img.loading = index < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';

      slide.appendChild(img);
      dom.heroStage.appendChild(slide);
    });
  }

  function buildThumbs() {
    dom.thumbsStrip.innerHTML = '';
    photos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb-button';
      button.dataset.index = String(index);
      button.setAttribute('aria-label', `Show ${photo.caption}`);

      const img = createImage(
        {
          ...photo,
          src: photo.thumb || photo.src,
          alt: photo.caption
        },
        'thumb-image'
      );
      img.loading = 'lazy';
      img.decoding = 'async';

      const label = document.createElement('span');
      label.className = 'thumb-label';
      label.textContent = photo.caption;

      button.appendChild(img);
      button.appendChild(label);
      dom.thumbsStrip.appendChild(button);
    });
  }

  function buildGridLayout() {
    dom.gridGallery.innerHTML = '';
    photos.forEach((photo, index) => {
      const card = document.createElement('article');
      card.className = 'gallery-card';
      card.dataset.index = String(index);
      card.tabIndex = 0;

      const media = document.createElement('button');
      media.type = 'button';
      media.className = 'gallery-card-media';
      media.dataset.index = String(index);
      media.setAttribute('aria-label', `Open ${photo.caption} in slideshow`);

      const img = createImage(photo, 'gallery-card-image');
      img.loading = 'lazy';

      media.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'gallery-card-meta';

      const title = document.createElement('h3');
      title.className = 'gallery-card-title';
      title.textContent = photo.caption;

      const desc = document.createElement('p');
      desc.className = 'gallery-card-description';
      desc.textContent = photo.description || `Photo ${index + 1}`;

      meta.appendChild(title);
      meta.appendChild(desc);

      card.appendChild(media);
      card.appendChild(meta);
      dom.gridGallery.appendChild(card);
    });
  }

  function buildMasonryLayout() {
    dom.masonryGallery.innerHTML = '';
    photos.forEach((photo, index) => {
      const card = document.createElement('article');
      card.className = 'masonry-card';
      card.dataset.index = String(index);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'masonry-card-button';
      button.dataset.index = String(index);
      button.setAttribute('aria-label', `Open ${photo.caption} in slideshow`);

      const img = createImage(photo, 'masonry-image');
      img.loading = 'lazy';

      const meta = document.createElement('div');
      meta.className = 'masonry-meta';

      const title = document.createElement('h3');
      title.className = 'masonry-title';
      title.textContent = photo.caption;

      if (photo.description) {
        const desc = document.createElement('p');
        desc.className = 'masonry-description';
        desc.textContent = photo.description;
        meta.appendChild(title);
        meta.appendChild(desc);
      } else {
        meta.appendChild(title);
      }

      button.appendChild(img);
      card.appendChild(button);
      card.appendChild(meta);
      dom.masonryGallery.appendChild(card);
    });
  }

  function createImage(photo, className) {
    const img = document.createElement('img');
    img.className = className;
    img.src = photo.src;
    img.alt = photo.alt || photo.caption;
    img.addEventListener('error', () => {
      img.closest('figure, article, button, div')?.classList.add('is-broken');
      img.alt = `${photo.caption} unavailable`;
    });
    return img;
  }

  function bindEvents() {
    dom.prevBtn?.addEventListener('click', () => {
      previous();
      pauseTemporarilyAndResume();
    });

    dom.nextBtn?.addEventListener('click', () => {
      next();
      pauseTemporarilyAndResume();
    });

    dom.playPauseBtn?.addEventListener('click', togglePlayback);
    dom.fullscreenBtn?.addEventListener('click', toggleFullscreen);

    dom.shuffleBtn?.addEventListener('click', () => {
      setMode('shuffle');
      pauseTemporarilyAndResume();
    });

    dom.sequentialBtn?.addEventListener('click', () => {
      setMode('sequential');
      pauseTemporarilyAndResume();
    });

    dom.layoutSelect?.addEventListener('change', (event) => {
      state.layout = event.target.value;
      saveState();
      render(false);
    });

    dom.intervalSelect?.addEventListener('change', (event) => {
      state.interval = Number(event.target.value);
      saveState();
      restartAutoplay();
    });

    dom.transitionSelect?.addEventListener('change', (event) => {
      state.transition = event.target.value;
      saveState();
      applyTransition();
    });

    dom.themeSelect?.addEventListener('change', (event) => {
      state.theme = event.target.value;
      applyTheme(state.theme);
      saveState();
    });

    dom.captionsToggle?.addEventListener('change', (event) => {
      state.showCaptions = !!event.target.checked;
      saveState();
      renderCaption();
    });

    dom.thumbsToggle?.addEventListener('change', (event) => {
      state.showThumbnails = !!event.target.checked;
      saveState();
      renderLayoutVisibility();
    });

    dom.settingsToggle?.addEventListener('click', () => toggleSettings(true));
    dom.closeSettingsBtn?.addEventListener('click', () => toggleSettings(false));

    dom.settingsPanel?.addEventListener('click', (event) => {
      if (event.target === dom.settingsPanel) toggleSettings(false);
    });

    dom.thumbsStrip?.addEventListener('click', handleThumbClick);
    dom.gridGallery?.addEventListener('click', handleCardClick);
    dom.masonryGallery?.addEventListener('click', handleCardClick);

    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    dom.mediaStage?.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.mediaStage?.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.mediaStage?.addEventListener('touchend', onTouchEnd, { passive: true });

    dom.heroStage?.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.heroStage?.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.heroStage?.addEventListener('touchend', onTouchEnd, { passive: true });

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', updateProgress);
  }

  function handleThumbClick(event) {
    const button = event.target.closest('.thumb-button');
    if (!button) return;
    const index = Number(button.dataset.index);
    goTo(index, true);
    pauseTemporarilyAndResume();
  }

  function handleCardClick(event) {
    const trigger = event.target.closest('[data-index]');
    if (!trigger) return;
    const index = Number(trigger.dataset.index);
    state.layout = 'slideshow';
    if (dom.layoutSelect) dom.layoutSelect.value = 'slideshow';
    goTo(index, true);
    pauseTemporarilyAndResume();
  }

  function handleKeyboard(event) {
    const tag = document.activeElement?.tagName;
    const isFormField = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

    if (isFormField) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
      pauseTemporarilyAndResume();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
      pauseTemporarilyAndResume();
    }

    if (event.code === 'Space') {
      event.preventDefault();
      togglePlayback();
    }

    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }

    if (event.key === 'Escape' && dom.settingsPanel?.classList.contains('is-open')) {
      toggleSettings(false);
    }
  }

  function onTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
    touchDeltaX = 0;
  }

  function onTouchMove(event) {
    touchDeltaX = event.changedTouches[0].clientX - touchStartX;
  }

  function onTouchEnd() {
    if (Math.abs(touchDeltaX) < 40) return;
    if (touchDeltaX > 0) {
      previous();
    } else {
      next();
    }
    pauseTemporarilyAndResume();
    touchStartX = 0;
    touchDeltaX = 0;
  }

  function handleVisibility() {
    if (document.hidden) {
      stopAutoplay();
    } else if (state.playing) {
      startAutoplay();
    }
  }

  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
    dom.body.classList.toggle('is-fullscreen', isFullscreen);
    dom.fullscreenBtn?.classList.toggle('is-active', isFullscreen);
    dom.fullscreenBtn?.setAttribute('aria-pressed', String(isFullscreen));
  }

  function render(initial) {
    if (!photos.length) return;

    const safeIndex = clampIndex(state.currentIndex);
    state.currentIndex = safeIndex;

    applyTransition();
    updateSlides(initial);
    updateHeroSlides(initial);
    updateThumbs();
    updateCounters();
    renderCaption();
    renderLayoutVisibility();
    updateModeButtons();
    updatePlayPauseButton();
    updateProgress();
    saveState();
  }

  function renderEmptyState() {
    dom.emptyState?.removeAttribute('hidden');
    dom.mediaStage?.setAttribute('hidden', '');
    dom.heroStage?.setAttribute('hidden', '');
    dom.gridGallery?.setAttribute('hidden', '');
    dom.masonryGallery?.setAttribute('hidden', '');
    if (dom.totalSlides) dom.totalSlides.textContent = '0';
    if (dom.currentSlide) dom.currentSlide.textContent = '0';
    if (dom.captionTitle) dom.captionTitle.textContent = 'No photos available';
    if (dom.captionText) dom.captionText.textContent = 'Add images to the /photos directory and regenerate the manifest to populate the gallery.';
  }

  function renderCaption() {
    const photo = photos[state.currentIndex];
    const show = !!state.showCaptions;

    dom.body.classList.toggle('captions-hidden', !show);

    if (!photo) return;

    if (dom.captionTitle) dom.captionTitle.textContent = show ? photo.caption : '';
    if (dom.captionText) {
      dom.captionText.textContent = show ? (photo.description || '') : '';
      dom.captionText.style.display = show && photo.description ? '' : show ? 'none' : 'none';
    }
  }

  function renderLayoutVisibility() {
    const layout = state.layout;
    const showThumbs = !!state.showThumbnails && photos.length > 1;

    dom.body.dataset.layout = layout;

    toggleElement(dom.mediaStage, layout === 'slideshow');
    toggleElement(dom.heroStage, layout === 'hero');
    toggleElement(dom.gridGallery, layout === 'grid');
    toggleElement(dom.masonryGallery, layout === 'masonry');
    toggleElement(dom.thumbsStrip, (layout === 'slideshow' || layout === 'hero') && showThumbs);

    dom.body.classList.toggle('thumbs-hidden', !showThumbs);
  }

  function updateSlides(initial) {
    const slides = dom.mediaStage?.querySelectorAll('.gallery-slide') || [];
    slides.forEach((slide, index) => {
      const active = index === state.currentIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if (initial && active) slide.classList.add('is-initial');
      else slide.classList.remove('is-initial');
    });
  }

  function updateHeroSlides(initial) {
    const slides = dom.heroStage?.querySelectorAll('.hero-slide') || [];
    slides.forEach((slide, index) => {
      const active = index === state.currentIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if (initial && active) slide.classList.add('is-initial');
      else slide.classList.remove('is-initial');
    });
  }

  function updateThumbs() {
    const thumbs = dom.thumbsStrip?.querySelectorAll('.thumb-button') || [];
    thumbs.forEach((button, index) => {
      const active = index === state.currentIndex;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
    });

    const activeThumb = dom.thumbsStrip?.querySelector('.thumb-button.is-active');
    activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function updateCounters() {
    if (dom.currentSlide) dom.currentSlide.textContent = String(state.currentIndex + 1);
    if (dom.totalSlides) dom.totalSlides.textContent = String(photos.length);
  }

  function updateModeButtons() {
    const shuffle = state.mode === 'shuffle';
    dom.shuffleBtn?.classList.toggle('is-active', shuffle);
    dom.sequentialBtn?.classList.toggle('is-active', !shuffle);
    dom.shuffleBtn?.setAttribute('aria-pressed', String(shuffle));
    dom.sequentialBtn?.setAttribute('aria-pressed', String(!shuffle));
  }

  function updatePlayPauseButton() {
    if (!dom.playPauseBtn) return;
    dom.playPauseBtn.classList.toggle('is-paused', !state.playing);
    dom.playPauseBtn.setAttribute('aria-pressed', String(!state.playing));
    dom.playPauseBtn.setAttribute('aria-label', state.playing ? 'Pause slideshow' : 'Play slideshow');
    dom.playPauseBtn.textContent = state.playing ? 'Pause' : 'Play';
  }

  function applyTransition() {
    dom.body.dataset.transition = state.transition;
  }

  function applyTheme(theme) {
    const selected = theme === 'light' ? 'light' : 'dark';
    dom.html.setAttribute('data-theme', selected);
    dom.body.dataset.theme = selected;
    if (dom.themeSelect) dom.themeSelect.value = selected;
  }

  function toggleSettings(forceOpen) {
    if (!dom.settingsPanel) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : !dom.settingsPanel.classList.contains('is-open');
    dom.settingsPanel.classList.toggle('is-open', open);
    dom.settingsPanel.setAttribute('aria-hidden', String(!open));
    dom.settingsToggle?.setAttribute('aria-expanded', String(open));
  }

  function togglePlayback() {
    state.playing = !state.playing;
    updatePlayPauseButton();
    saveState();

    if (state.playing) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (!state.playing || photos.length <= 1) {
      updateProgress(true);
      return;
    }

    progressStart = performance.now();
    timer = window.setTimeout(() => {
      next(true);
      startAutoplay();
    }, state.interval);

    animateProgress();
    updatePlayPauseButton();
  }

  function stopAutoplay() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (progressFrame) {
      window.cancelAnimationFrame(progressFrame);
      progressFrame = null;
    }
    updateProgress(true);
  }

  function restartAutoplay() {
    if (state.playing) startAutoplay();
    else updateProgress(true);
  }

  function animateProgress() {
    if (!state.playing) return;
    const now = performance.now();
    const elapsed = now - progressStart;
    const percent = Math.min(100, (elapsed / state.interval) * 100);
    if (dom.progressBar) dom.progressBar.style.setProperty('--progress', `${percent}%`);
    if (percent < 100) {
      progressFrame = window.requestAnimationFrame(animateProgress);
    }
  }

  function updateProgress(reset) {
    if (!dom.progressBar) return;
    if (reset || !state.playing || photos.length <= 1) {
      dom.progressBar.style.setProperty('--progress', '0%');
    }
  }

  function previous() {
    if (!photos.length) return;
    if (state.mode === 'shuffle') {
      state.currentIndex = getPreviousShuffleIndex();
    } else {
      state.currentIndex = (state.currentIndex - 1 + photos.length) % photos.length;
    }
    render(false);
  }

  function next(fromAuto) {
    if (!photos.length) return;
    if (state.mode === 'shuffle') {
      state.currentIndex = getNextShuffleIndex();
    } else {
      state.currentIndex = (state.currentIndex + 1) % photos.length;
    }
    render(false);

    if (!fromAuto && state.playing) {
      restartAutoplay();
    }
  }

  function goTo(index, restart) {
    state.currentIndex = clampIndex(index);
    render(false);
    if (restart && state.playing) restartAutoplay();
  }

  function setMode(mode) {
    state.mode = mode === 'shuffle' ? 'shuffle' : 'sequential';
    if (state.mode === 'shuffle') refillShufflePool();
    saveState();
    updateModeButtons();
  }

  function getNextShuffleIndex() {
    if (photos.length <= 1) return 0;
    if (!shufflePool.length) refillShufflePool();
    const nextIndex = shufflePool.shift();
    return typeof nextIndex === 'number' ? nextIndex : state.currentIndex;
  }

  function getPreviousShuffleIndex() {
    if (photos.length <= 1) return 0;
    let candidate = state.currentIndex;
    while (candidate === state.currentIndex) {
      candidate = Math.floor(Math.random() * photos.length);
    }
    return candidate;
  }

  function refillShufflePool() {
    shufflePool = photos.map((_, index) => index).filter((index) => index !== state.currentIndex);
    for (let i = shufflePool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shufflePool[i], shufflePool[j]] = [shufflePool[j], shufflePool[i]];
    }
  }

  function toggleFullscreen() {
    const target = document.querySelector('.gallery-shell') || document.documentElement;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function pauseTemporarilyAndResume() {
    if (!state.playing) return;
    restartAutoplay();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed
      };
    } catch (error) {
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentIndex: state.currentIndex,
        playing: state.playing,
        interval: state.interval,
        mode: state.mode,
        showThumbnails: state.showThumbnails,
        showCaptions: state.showCaptions,
        layout: state.layout,
        theme: state.theme,
        transition: state.transition
      }));
    } catch (error) {
      // ignore storage errors
    }
  }

  function applyStateToControls() {
    if (dom.layoutSelect) dom.layoutSelect.value = state.layout;
    if (dom.intervalSelect) dom.intervalSelect.value = String(state.interval);
    if (dom.transitionSelect) dom.transitionSelect.value = state.transition;
    if (dom.themeSelect) dom.themeSelect.value = state.theme;
    if (dom.captionsToggle) dom.captionsToggle.checked = !!state.showCaptions;
    if (dom.thumbsToggle) dom.thumbsToggle.checked = !!state.showThumbnails;
  }

  function clampIndex(index) {
    if (!photos.length) return 0;
    if (Number.isNaN(Number(index))) return 0;
    return Math.max(0, Math.min(photos.length - 1, Number(index)));
  }

  function toggleElement(element, show) {
    if (!element) return;
    if (show) element.removeAttribute('hidden');
    else element.setAttribute('hidden', '');
  }
})();
```
