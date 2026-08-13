(() => {
  "use strict";

  const STORAGE_KEY = "intranet-photo-gallery-settings";
  const INTERVALS = [3000, 5000, 8000, 10000, 15000];
  const LAYOUTS = ["slideshow", "hero", "grid", "masonry"];
  const THEMES = ["dark", "light"];
  const TRANSITIONS = ["fade", "slide", "zoom"];

  const defaults = {
    currentIndex: 0,
    playing: true,
    interval: 5000,
    mode: "sequential",
    showThumbnails: true,
    showCaptions: true,
    layout: "slideshow",
    theme: "dark",
    transition: "fade"
  };

  const dom = {
    html: document.documentElement,
    body: document.body,
    shell: document.getElementById("galleryShell"),
    appTitle: document.getElementById("appTitle"),
    currentSlide: document.getElementById("currentSlide"),
    totalSlides: document.getElementById("totalSlides"),
    progressBar: document.getElementById("progressBar"),
    mediaStage: document.getElementById("mediaStage"),
    heroStage: document.getElementById("heroStage"),
    thumbsStrip: document.getElementById("thumbsStrip"),
    gridGallery: document.getElementById("gridGallery"),
    masonryGallery: document.getElementById("masonryGallery"),
    captionTitle: document.getElementById("captionTitle"),
    captionText: document.getElementById("captionText"),
    captionPanel: document.getElementById("captionPanel"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    sequentialBtn: document.getElementById("sequentialBtn"),
    settingsToggle: document.getElementById("settingsToggle"),
    settingsPanel: document.getElementById("settingsPanel"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    layoutSelect: document.getElementById("layoutSelect"),
    intervalSelect: document.getElementById("intervalSelect"),
    transitionSelect: document.getElementById("transitionSelect"),
    themeSelect: document.getElementById("themeSelect"),
    captionsToggle: document.getElementById("captionsToggle"),
    thumbsToggle: document.getElementById("thumbsToggle"),
    emptyState: document.getElementById("emptyState")
  };

  const photos = Array.isArray(window.PHOTOS) ? window.PHOTOS.filter(Boolean) : [];
  const config = window.GALLERY_CONFIG || {};
  let state = loadState();
  let timer = null;
  let animationFrame = null;
  let progressStart = 0;
  let shufflePool = [];

  init();

  function init() {
    applyConfig();
    normalizeState();
    applyControls();
    applyTheme();
    bindEvents();

    if (!photos.length) {
      renderEmpty();
      return;
    }

    normalizePhotos();
    buildAll();
    render();
    if (state.mode === "shuffle") refillShuffle();
    startAutoplay();
  }

  function applyConfig() {
    const title = typeof config.title === "string" && config.title.trim()
      ? config.title.trim() : "Photo Gallery";
    document.title = title;
    if (dom.appTitle) dom.appTitle.textContent = title;

    if (!hasSavedState()) {
      if (INTERVALS.includes(Number(config.defaultInterval))) state.interval = Number(config.defaultInterval);
      if (THEMES.includes(config.defaultTheme)) state.theme = config.defaultTheme;
      if (LAYOUTS.includes(config.defaultLayout)) state.layout = config.defaultLayout;
      if (TRANSITIONS.includes(config.defaultTransition)) state.transition = config.defaultTransition;
      if (config.defaultMode === "shuffle" || config.defaultMode === "sequential") state.mode = config.defaultMode;
      if (typeof config.showCaptionsByDefault === "boolean") state.showCaptions = config.showCaptionsByDefault;
      if (typeof config.showThumbnailsByDefault === "boolean") state.showThumbnails = config.showThumbnailsByDefault;
    }
  }

  function hasSavedState() {
    try { return Boolean(localStorage.getItem(STORAGE_KEY)); } catch { return false; }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch { return { ...defaults }; }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function normalizeState() {
    state.interval = INTERVALS.includes(Number(state.interval)) ? Number(state.interval) : 5000;
    state.layout = LAYOUTS.includes(state.layout) ? state.layout : "slideshow";
    state.theme = THEMES.includes(state.theme) ? state.theme : "dark";
    state.transition = TRANSITIONS.includes(state.transition) ? state.transition : "fade";
    state.mode = state.mode === "shuffle" ? "shuffle" : "sequential";
    state.playing = state.playing !== false;
    state.showCaptions = state.showCaptions !== false;
    state.showThumbnails = state.showThumbnails !== false;
    state.currentIndex = Number.isFinite(Number(state.currentIndex)) ? Number(state.currentIndex) : 0;
  }

  function normalizePhotos() {
    photos.forEach((p, i) => {
      p.id = p.id || `photo-${i + 1}`;
      p.src = p.src || p.path || "";
      p.thumb = p.thumb || p.thumbnail || p.src;
      p.caption = typeof p.caption === "string" && p.caption.trim() ? p.caption.trim() : `Photo ${i + 1}`;
      p.description = typeof p.description === "string" ? p.description.trim() : "";
      p.alt = typeof p.alt === "string" && p.alt.trim() ? p.alt.trim() : p.caption;
    });
    state.currentIndex = clamp(state.currentIndex);
  }

  function applyControls() {
    if (dom.layoutSelect) dom.layoutSelect.value = state.layout;
    if (dom.intervalSelect) dom.intervalSelect.value = String(state.interval);
    if (dom.transitionSelect) dom.transitionSelect.value = state.transition;
    if (dom.themeSelect) dom.themeSelect.value = state.theme;
    if (dom.captionsToggle) dom.captionsToggle.checked = state.showCaptions;
    if (dom.thumbsToggle) dom.thumbsToggle.checked = state.showThumbnails;
    updateModeButtons();
    updatePlayButton();
  }

  function applyTheme() {
    dom.html.dataset.theme = state.theme;
    dom.body.dataset.theme = state.theme;
    if (dom.themeSelect) dom.themeSelect.value = state.theme;
  }

  function bindEvents() {
    dom.prevBtn?.addEventListener("click", () => { previous(); restartAutoplay(); });
    dom.nextBtn?.addEventListener("click", () => { next(); restartAutoplay(); });
    dom.playPauseBtn?.addEventListener("click", togglePlayback);
    dom.fullscreenBtn?.addEventListener("click", toggleFullscreen);

    dom.shuffleBtn?.addEventListener("click", () => { setMode("shuffle"); restartAutoplay(); });
    dom.sequentialBtn?.addEventListener("click", () => { setMode("sequential"); restartAutoplay(); });

    dom.layoutSelect?.addEventListener("change", e => {
      state.layout = e.target.value;
      saveState();
      render();
    });
    dom.intervalSelect?.addEventListener("change", e => {
      state.interval = Number(e.target.value);
      saveState();
      restartAutoplay();
    });
    dom.transitionSelect?.addEventListener("change", e => {
      state.transition = e.target.value;
      saveState();
      render();
    });
    dom.themeSelect?.addEventListener("change", e => {
      state.theme = e.target.value;
      applyTheme();
      saveState();
    });
    dom.captionsToggle?.addEventListener("change", e => {
      state.showCaptions = e.target.checked;
      saveState();
      renderCaption();
    });
    dom.thumbsToggle?.addEventListener("change", e => {
      state.showThumbnails = e.target.checked;
      saveState();
      renderLayoutVisibility();
    });

    dom.settingsToggle?.addEventListener("click", () => toggleSettings());
    dom.closeSettingsBtn?.addEventListener("click", () => toggleSettings(false));
    dom.settingsPanel?.addEventListener("click", e => {
      if (e.target === dom.settingsPanel) toggleSettings(false);
    });

    dom.thumbsStrip?.addEventListener("click", e => {
      const b = e.target.closest(".thumb-button");
      if (!b) return;
      goTo(Number(b.dataset.index));
      restartAutoplay();
    });

    const cardClick = e => {
      const target = e.target.closest("[data-index]");
      if (!target) return;
      state.layout = "slideshow";
      if (dom.layoutSelect) dom.layoutSelect.value = "slideshow";
      goTo(Number(target.dataset.index));
      restartAutoplay();
    };
    dom.gridGallery?.addEventListener("click", cardClick);
    dom.masonryGallery?.addEventListener("click", cardClick);

    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibility);

    [dom.mediaStage, dom.heroStage].filter(Boolean).forEach(target => {
      let startX = 0;
      target.addEventListener("touchstart", e => { startX = e.changedTouches[0].clientX; }, { passive: true });
      target.addEventListener("touchend", e => {
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) >= 40) {
          delta > 0 ? previous() : next();
          restartAutoplay();
        }
      }, { passive: true });
    });
  }

  function onKey(e) {
    const tag = document.activeElement?.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); previous(); restartAutoplay(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); next(); restartAutoplay(); }
    else if (e.code === "Space") { e.preventDefault(); togglePlayback(); }
    else if (e.key?.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
    else if (e.key === "Escape" && dom.settingsPanel?.classList.contains("is-open")) toggleSettings(false);
  }

  function createImage(photo, className) {
    const img = document.createElement("img");
    img.className = className;
    img.src = photo.src;
    img.alt = photo.alt || photo.caption;
    img.decoding = "async";
    img.addEventListener("error", () => img.closest("figure,article,button,div")?.classList.add("is-broken"));
    return img;
  }

  function buildAll() {
    dom.mediaStage.innerHTML = "";
    dom.heroStage.innerHTML = "";
    dom.thumbsStrip.innerHTML = "";
    dom.gridGallery.innerHTML = "";
    dom.masonryGallery.innerHTML = "";

    photos.forEach((p, i) => {
      const slide = document.createElement("figure");
      slide.className = "gallery-slide";
      slide.dataset.index = String(i);
      slide.appendChild(createImage(p, "gallery-slide-image"));
      dom.mediaStage.appendChild(slide);

      const hero = document.createElement("figure");
      hero.className = "hero-slide";
      hero.dataset.index = String(i);
      hero.appendChild(createImage(p, "hero-slide-image"));
      dom.heroStage.appendChild(hero);

      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "thumb-button";
      thumb.dataset.index = String(i);
      thumb.setAttribute("aria-label", `Show ${p.caption}`);
      thumb.appendChild(createImage({ ...p, src: p.thumb, alt: p.caption }, "thumb-image"));
      const label = document.createElement("span");
      label.className = "thumb-label";
      label.textContent = p.caption;
      thumb.appendChild(label);
      dom.thumbsStrip.appendChild(thumb);

      const card = document.createElement("article");
      card.className = "gallery-card";
      card.dataset.index = String(i);
      const media = document.createElement("button");
      media.type = "button";
      media.className = "gallery-card-media";
      media.dataset.index = String(i);
      media.appendChild(createImage(p, "gallery-card-image"));
      const meta = document.createElement("div");
      meta.className = "gallery-card-meta";
      const title = document.createElement("h3");
      title.className = "gallery-card-title";
      title.textContent = p.caption;
      const desc = document.createElement("p");
      desc.className = "gallery-card-description";
      desc.textContent = p.description || `Photo ${i + 1}`;
      meta.append(title, desc);
      card.append(media, meta);
      dom.gridGallery.appendChild(card);

      const masonry = document.createElement("article");
      masonry.className = "masonry-card";
      masonry.dataset.index = String(i);
      const mbutton = document.createElement("button");
      mbutton.type = "button";
      mbutton.className = "masonry-card-button";
      mbutton.dataset.index = String(i);
      mbutton.appendChild(createImage(p, "masonry-image"));
      const mmeta = document.createElement("div");
      mmeta.className = "masonry-meta";
      const mtitle = document.createElement("h3");
      mtitle.className = "masonry-title";
      mtitle.textContent = p.caption;
      mmeta.appendChild(mtitle);
      if (p.description) {
        const md = document.createElement("p");
        md.className = "masonry-description";
        md.textContent = p.description;
        mmeta.appendChild(md);
      }
      masonry.append(mbutton, mmeta);
      dom.masonryGallery.appendChild(masonry);
    });
  }

  function render() {
    if (!photos.length) return;
    state.currentIndex = clamp(state.currentIndex);
    dom.body.dataset.layout = state.layout;
    dom.body.dataset.transition = state.transition;

    updateActive(dom.mediaStage, ".gallery-slide");
    updateActive(dom.heroStage, ".hero-slide");

    dom.thumbsStrip?.querySelectorAll(".thumb-button").forEach((b, i) => {
      const active = i === state.currentIndex;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-current", active ? "true" : "false");
    });

    dom.currentSlide.textContent = String(state.currentIndex + 1);
    dom.totalSlides.textContent = String(photos.length);
    renderCaption();
    renderLayoutVisibility();
    updateModeButtons();
    updatePlayButton();
    saveState();
  }

  function updateActive(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach((el, i) => {
      const active = i === state.currentIndex;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", String(!active));
    });
  }

  function renderCaption() {
    const p = photos[state.currentIndex];
    const show = Boolean(p) && state.showCaptions;
    dom.captionPanel.hidden = !show;
    if (!p) return;
    dom.captionTitle.textContent = show ? p.caption : "";
    dom.captionText.textContent = show ? p.description : "";
    dom.captionText.hidden = !show || !p.description;
  }

  function renderLayoutVisibility() {
    const layout = state.layout;
    toggle(dom.mediaStage, layout === "slideshow");
    toggle(dom.heroStage, layout === "hero");
    toggle(dom.gridGallery, layout === "grid");
    toggle(dom.masonryGallery, layout === "masonry");
    toggle(dom.thumbsStrip, state.showThumbnails && photos.length > 1 && (layout === "slideshow" || layout === "hero"));
  }

  function renderEmpty() {
    dom.emptyState.hidden = false;
    [dom.mediaStage, dom.heroStage, dom.gridGallery, dom.masonryGallery, dom.thumbsStrip].forEach(e => { if (e) e.hidden = true; });
    dom.currentSlide.textContent = "0";
    dom.totalSlides.textContent = "0";
  }

  function toggle(el, show) { if (el) el.hidden = !show; }

  function updateModeButtons() {
    const shuffle = state.mode === "shuffle";
    dom.shuffleBtn?.classList.toggle("is-active", shuffle);
    dom.shuffleBtn?.setAttribute("aria-pressed", String(shuffle));
    dom.sequentialBtn?.classList.toggle("is-active", !shuffle);
    dom.sequentialBtn?.setAttribute("aria-pressed", String(!shuffle));
  }

  function updatePlayButton() {
    dom.playPauseBtn.textContent = state.playing ? "Pause" : "Play";
    dom.playPauseBtn.setAttribute("aria-label", state.playing ? "Pause slideshow" : "Play slideshow");
  }

  function startAutoplay() {
    stopAutoplay();
    if (!state.playing || photos.length <= 1) { updateProgress(true); return; }
    progressStart = performance.now();
    timer = setTimeout(() => { next(); startAutoplay(); }, state.interval);
    animateProgress();
  }

  function stopAutoplay() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    updateProgress(true);
  }

  function restartAutoplay() { if (state.playing) startAutoplay(); }

  function animateProgress() {
    if (!state.playing || !dom.progressBar) return;
    const percent = Math.min(100, ((performance.now() - progressStart) / state.interval) * 100);
    dom.progressBar.style.setProperty("--progress", `${percent}%`);
    if (percent < 100) animationFrame = requestAnimationFrame(animateProgress);
  }

  function updateProgress(reset) {
    if (dom.progressBar && reset) dom.progressBar.style.setProperty("--progress", "0%");
  }

  function previous() {
    if (!photos.length) return;
    state.currentIndex = state.mode === "shuffle" ? randomOtherIndex() : (state.currentIndex - 1 + photos.length) % photos.length;
    render();
  }

  function next() {
    if (!photos.length) return;
    state.currentIndex = state.mode === "shuffle" ? getNextShuffle() : (state.currentIndex + 1) % photos.length;
    render();
  }

  function goTo(index) { state.currentIndex = clamp(index); render(); }

  function setMode(mode) {
    state.mode = mode === "shuffle" ? "shuffle" : "sequential";
    if (state.mode === "shuffle") refillShuffle(); else shufflePool = [];
    updateModeButtons();
    saveState();
  }

  function refillShuffle() {
    shufflePool = photos.map((_, i) => i).filter(i => i !== state.currentIndex);
    for (let i = shufflePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shufflePool[i], shufflePool[j]] = [shufflePool[j], shufflePool[i]];
    }
  }

  function getNextShuffle() {
    if (!shufflePool.length) refillShuffle();
    return shufflePool.shift() ?? state.currentIndex;
  }

  function randomOtherIndex() {
    if (photos.length <= 1) return 0;
    let n = state.currentIndex;
    while (n === state.currentIndex) n = Math.floor(Math.random() * photos.length);
    return n;
  }

  function clamp(index) {
    if (!photos.length) return 0;
    const n = Number(index);
    return Number.isFinite(n) ? Math.max(0, Math.min(photos.length - 1, Math.floor(n))) : 0;
  }

  function togglePlayback() {
    state.playing = !state.playing;
    updatePlayButton();
    saveState();
    state.playing ? startAutoplay() : stopAutoplay();
  }

  function toggleSettings(force) {
    const open = typeof force === "boolean" ? force : !dom.settingsPanel.classList.contains("is-open");
    dom.settingsPanel.classList.toggle("is-open", open);
    dom.settingsPanel.setAttribute("aria-hidden", String(!open));
    dom.settingsToggle?.setAttribute("aria-expanded", String(open));
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (dom.shell || document.documentElement).requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function onFullscreenChange() {
    const active = Boolean(document.fullscreenElement);
    dom.body.classList.toggle("is-fullscreen", active);
    dom.fullscreenBtn?.setAttribute("aria-pressed", String(active));
    dom.fullscreenBtn?.setAttribute("aria-label", active ? "Exit full screen" : "Enter full screen");
  }

  function onVisibility() {
    if (document.hidden) stopAutoplay();
    else if (state.playing) startAutoplay();
  }
})();
