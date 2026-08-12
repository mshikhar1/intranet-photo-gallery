from pathlib import Path
import zipfile, textwrap, os, json

base = Path("/mnt/data/intranet-photo-gallery")
if base.exists():
    import shutil
    shutil.rmtree(base)
(base / "photos").mkdir(parents=True)

files = {}

files["index.html"] = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Photo Gallery">
  <title>Photo Gallery</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body data-layout="slideshow" data-theme="dark" data-transition="fade">
  <div class="gallery-shell" id="galleryShell">
    <header class="gallery-header">
      <div>
        <div class="eyebrow">PHOTO GALLERY</div>
        <h1 id="appTitle">Photo Gallery</h1>
      </div>
      <div class="header-actions">
        <button class="icon-button" id="settingsToggle" type="button" aria-label="Open settings" aria-expanded="false">⚙</button>
        <button class="icon-button" id="fullscreenBtn" type="button" aria-label="Enter full screen" aria-pressed="false">⛶</button>
      </div>
    </header>

    <main class="gallery-main">
      <section class="stage-wrap">
        <div class="media-stage" id="mediaStage" aria-live="polite"></div>
        <div class="hero-stage" id="heroStage" aria-live="polite"></div>
        <div class="grid-gallery" id="gridGallery"></div>
        <div class="masonry-gallery" id="masonryGallery"></div>

        <div class="empty-state" id="emptyState" hidden>
          <div class="empty-icon">◫</div>
          <h2>No photographs yet</h2>
          <p>Add images to the <code>photos/</code> folder and regenerate <code>photos.js</code> with <code>update-gallery.ps1</code>.</p>
        </div>

        <div class="gallery-overlay">
          <div class="caption-panel" id="captionPanel">
            <div class="caption-title" id="captionTitle"></div>
            <div class="caption-text" id="captionText"></div>
          </div>
          <div class="counter" aria-label="Photo counter">
            <span id="currentSlide">0</span><span class="counter-separator">/</span><span id="totalSlides">0</span>
          </div>
        </div>
      </section>

      <div class="progress-track" aria-hidden="true">
        <div class="progress-bar" id="progressBar"></div>
      </div>

      <nav class="controls" aria-label="Gallery controls">
        <button class="control-button" id="prevBtn" type="button" aria-label="Previous photo">‹</button>
        <button class="control-button primary" id="playPauseBtn" type="button" aria-label="Pause slideshow">Pause</button>
        <button class="control-button" id="nextBtn" type="button" aria-label="Next photo">›</button>
        <div class="mode-group">
          <button class="mode-button is-active" id="sequentialBtn" type="button" aria-pressed="true">Sequential</button>
          <button class="mode-button" id="shuffleBtn" type="button" aria-pressed="false">Shuffle</button>
        </div>
      </nav>

      <div class="thumbs-strip" id="thumbsStrip" aria-label="Photo thumbnails"></div>
    </main>

    <footer class="gallery-footer">
      <span>Use ← → to navigate · Space to play/pause · F for full screen</span>
    </footer>
  </div>

  <aside class="settings-panel" id="settingsPanel" aria-hidden="true">
    <div class="settings-card">
      <div class="settings-header">
        <h2>Gallery settings</h2>
        <button class="icon-button" id="closeSettingsBtn" type="button" aria-label="Close settings">×</button>
      </div>

      <label>Layout
        <select id="layoutSelect">
          <option value="slideshow">Full-screen slideshow</option>
          <option value="hero">Hero + thumbnails</option>
          <option value="grid">Photo grid</option>
          <option value="masonry">Masonry gallery</option>
        </select>
      </label>

      <label>Auto-change interval
        <select id="intervalSelect">
          <option value="3000">3 seconds</option>
          <option value="5000">5 seconds</option>
          <option value="8000">8 seconds</option>
          <option value="10000">10 seconds</option>
          <option value="15000">15 seconds</option>
        </select>
      </label>

      <label>Transition
        <select id="transitionSelect">
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="zoom">Zoom</option>
        </select>
      </label>

      <label>Theme
        <select id="themeSelect">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>

      <label class="switch-row">
        <span>Show captions</span>
        <input id="captionsToggle" type="checkbox">
      </label>

      <label class="switch-row">
        <span>Show thumbnails</span>
        <input id="thumbsToggle" type="checkbox">
      </label>

      <p class="settings-note">Your display preferences are saved in this browser.</p>
    </div>
  </aside>

  <script src="config.js"></script>
  <script src="photos.js"></script>
  <script src="app.js"></script>
</body>
</html>
"""

files["config.js"] = r"""window.GALLERY_CONFIG = {
  title: "Photo Gallery",
  defaultInterval: 5000,
  defaultMode: "sequential",
  defaultLayout: "slideshow",
  defaultTheme: "dark",
  defaultTransition: "fade",
  showCaptionsByDefault: true,
  showThumbnailsByDefault: true
};
"""

files["photos.js"] = r"""// This file is regenerated by update-gallery.ps1.
// Do not manually add Windows paths here.
window.PHOTOS = [
];
"""

files["app.js"] = r"""(() => {
  "use strict";

  const STORAGE_KEY = "intranet-photo-gallery-settings";
  const VALID_INTERVALS = [3000, 5000, 8000, 10000, 15000];
  const VALID_LAYOUTS = ["slideshow", "hero", "grid", "masonry"];
  const VALID_THEMES = ["dark", "light"];
  const VALID_TRANSITIONS = ["fade", "slide", "zoom"];

  const defaultState = {
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
  let progressFrame = null;
  let progressStart = 0;
  let shufflePool = [];

  initialize();

  function initialize() {
    applyConfig();
    normalizeState();
    applyControls();
    applyTheme();
    bindEvents();

    if (!photos.length) {
      renderEmptyState();
      return;
    }

    normalizePhotoData();
    buildSlides();
    buildHero();
    buildThumbs();
    buildGrid();
    buildMasonry();
    render();
    if (state.mode === "shuffle") refillShufflePool();
    startAutoplay();
  }

  function applyConfig() {
    const title = typeof config.title === "string" && config.title.trim()
      ? config.title.trim()
      : "Photo Gallery";

    document.title = title;
    if (dom.appTitle) dom.appTitle.textContent = title;

    if (!hasSavedState()) {
      if (VALID_INTERVALS.includes(Number(config.defaultInterval))) {
        state.interval = Number(config.defaultInterval);
      }
      if (VALID_THEMES.includes(config.defaultTheme)) state.theme = config.defaultTheme;
      if (VALID_LAYOUTS.includes(config.defaultLayout)) state.layout = config.defaultLayout;
      if (VALID_TRANSITIONS.includes(config.defaultTransition)) state.transition = config.defaultTransition;
      if (config.defaultMode === "shuffle" || config.defaultMode === "sequential") {
        state.mode = config.defaultMode;
      }
      if (typeof config.showCaptionsByDefault === "boolean") {
        state.showCaptions = config.showCaptionsByDefault;
      }
      if (typeof config.showThumbnailsByDefault === "boolean") {
        state.showThumbnails = config.showThumbnailsByDefault;
      }
    }
  }

  function hasSavedState() {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  function normalizeState() {
    state.interval = VALID_INTERVALS.includes(Number(state.interval)) ? Number(state.interval) : 5000;
    state.layout = VALID_LAYOUTS.includes(state.layout) ? state.layout : "slideshow";
    state.theme = VALID_THEMES.includes(state.theme) ? state.theme : "dark";
    state.transition = VALID_TRANSITIONS.includes(state.transition) ? state.transition : "fade";
    state.mode = state.mode === "shuffle" ? "shuffle" : "sequential";
    state.playing = state.playing !== false;
    state.showCaptions = state.showCaptions !== false;
    state.showThumbnails = state.showThumbnails !== false;
    state.currentIndex = Number.isInteger(Number(state.currentIndex)) ? Number(state.currentIndex) : 0;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function normalizePhotoData() {
    photos.forEach((photo, index) => {
      photo.id = photo.id || `photo-${index + 1}`;
      photo.src = photo.src || photo.path || "";
      photo.thumb = photo.thumb || photo.thumbnail || photo.src;
      photo.caption = typeof photo.caption === "string" && photo.caption.trim()
        ? photo.caption.trim()
        : `Photo ${index + 1}`;
      photo.description = typeof photo.description === "string" ? photo.description.trim() : "";
      photo.alt = typeof photo.alt === "string" && photo.alt.trim() ? photo.alt.trim() : photo.caption;
    });
    state.currentIndex = clampIndex(state.currentIndex);
  }

  function applyControls() {
    if (dom.layoutSelect) dom.layoutSelect.value = state.layout;
    if (dom.intervalSelect) dom.intervalSelect.value = String(state.interval);
    if (dom.transitionSelect) dom.transitionSelect.value = state.transition;
    if (dom.themeSelect) dom.themeSelect.value = state.theme;
    if (dom.captionsToggle) dom.captionsToggle.checked = state.showCaptions;
    if (dom.thumbsToggle) dom.thumbsToggle.checked = state.showThumbnails;
    updateModeButtons();
    updatePlayPauseButton();
  }

  function applyTheme() {
    dom.html.dataset.theme = state.theme;
    dom.body.dataset.theme = state.theme;
    if (dom.themeSelect) dom.themeSelect.value = state.theme;
  }

  function bindEvents() {
    dom.prevBtn?.addEventListener("click", () => {
      previous();
      restartAutoplay();
    });
    dom.nextBtn?.addEventListener("click", () => {
      next();
      restartAutoplay();
    });
    dom.playPauseBtn?.addEventListener("click", togglePlayback);
    dom.fullscreenBtn?.addEventListener("click", toggleFullscreen);

    dom.shuffleBtn?.addEventListener("click", () => {
      setMode("shuffle");
      restartAutoplay();
    });
    dom.sequentialBtn?.addEventListener("click", () => {
      setMode("sequential");
      restartAutoplay();
    });

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
      const button = e.target.closest(".thumb-button");
      if (!button) return;
      goTo(Number(button.dataset.index));
      restartAutoplay();
    });

    const cardHandler = e => {
      const button = e.target.closest("[data-index]");
      if (!button) return;
      state.layout = "slideshow";
      if (dom.layoutSelect) dom.layoutSelect.value = "slideshow";
      goTo(Number(button.dataset.index));
      restartAutoplay();
    };

    dom.gridGallery?.addEventListener("click", cardHandler);
    dom.masonryGallery?.addEventListener("click", cardHandler);

    document.addEventListener("keydown", handleKeyboard);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibility);

    const touchTargets = [dom.mediaStage, dom.heroStage].filter(Boolean);
    touchTargets.forEach(target => {
      let startX = 0;
      target.addEventListener("touchstart", e => {
        startX = e.changedTouches[0].clientX;
      }, { passive: true });
      target.addEventListener("touchend", e => {
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) >= 40) {
          delta > 0 ? previous() : next();
          restartAutoplay();
        }
      }, { passive: true });
    });
  }

  function handleKeyboard(e) {
    const tag = document.activeElement?.tagName;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      previous();
      restartAutoplay();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
      restartAutoplay();
    } else if (e.code === "Space") {
      e.preventDefault();
      togglePlayback();
    } else if (e.key?.toLowerCase() === "f") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === "Escape" && dom.settingsPanel?.classList.contains("is-open")) {
      toggleSettings(false);
    }
  }

  function createImage(photo, className) {
    const img = document.createElement("img");
    img.className = className;
    img.src = photo.src;
    img.alt = photo.alt || photo.caption;
    img.decoding = "async";
    img.addEventListener("error", () => {
      const parent = img.closest("figure, article, button, div");
      parent?.classList.add("is-broken");
    });
    return img;
  }

  function buildSlides() {
    dom.mediaStage.innerHTML = "";
    photos.forEach((photo, index) => {
      const figure = document.createElement("figure");
      figure.className = "gallery-slide";
      figure.dataset.index = String(index);
      figure.appendChild(createImage(photo, "gallery-slide-image"));
      dom.mediaStage.appendChild(figure);
    });
  }

  function buildHero() {
    dom.heroStage.innerHTML = "";
    photos.forEach((photo, index) => {
      const figure = document.createElement("figure");
      figure.className = "hero-slide";
      figure.dataset.index = String(index);
      figure.appendChild(createImage(photo, "hero-slide-image"));
      dom.heroStage.appendChild(figure);
    });
  }

  function buildThumbs() {
    dom.thumbsStrip.innerHTML = "";
    photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "thumb-button";
      button.dataset.index = String(index);
      button.setAttribute("aria-label", `Show ${photo.caption}`);

      const img = createImage({
        ...photo,
        src: photo.thumb || photo.src,
        alt: photo.caption
      }, "thumb-image");

      const label = document.createElement("span");
      label.className = "thumb-label";
      label.textContent = photo.caption;

      button.append(img, label);
      dom.thumbsStrip.appendChild(button);
    });
  }

  function buildGrid() {
    dom.gridGallery.innerHTML = "";
    photos.forEach((photo, index) => {
      const card = document.createElement("article");
      card.className = "gallery-card";
      card.dataset.index = String(index);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-card-media";
      button.dataset.index = String(index);
      button.appendChild(createImage(photo, "gallery-card-image"));

      const meta = document.createElement("div");
      meta.className = "gallery-card-meta";
      meta.innerHTML = "";
      const title = document.createElement("h3");
      title.className = "gallery-card-title";
      title.textContent = photo.caption;
      const desc = document.createElement("p");
      desc.className = "gallery-card-description";
      desc.textContent = photo.description || `Photo ${index + 1}`;
      meta.append(title, desc);

      card.append(button, meta);
      dom.gridGallery.appendChild(card);
    });
  }

  function buildMasonry() {
    dom.masonryGallery.innerHTML = "";
    photos.forEach((photo, index) => {
      const card = document.createElement("article");
      card.className = "masonry-card";
      card.dataset.index = String(index);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "masonry-card-button";
      button.dataset.index = String(index);
      button.appendChild(createImage(photo, "masonry-image"));

      const meta = document.createElement("div");
      meta.className = "masonry-meta";
      const title = document.createElement("h3");
      title.className = "masonry-title";
      title.textContent = photo.caption;
      meta.appendChild(title);

      if (photo.description) {
        const desc = document.createElement("p");
        desc.className = "masonry-description";
        desc.textContent = photo.description;
        meta.appendChild(desc);
      }

      card.append(button, meta);
      dom.masonryGallery.appendChild(card);
    });
  }

  function render() {
    if (!photos.length) return;
    state.currentIndex = clampIndex(state.currentIndex);
    dom.body.dataset.layout = state.layout;
    dom.body.dataset.transition = state.transition;

    updateActive(".gallery-slide", dom.mediaStage);
    updateActive(".hero-slide", dom.heroStage);
    updateThumbs();
    updateCounters();
    renderCaption();
    renderLayoutVisibility();
    updateModeButtons();
    updatePlayPauseButton();
    saveState();
  }

  function updateActive(selector, container) {
    if (!container) return;
    container.querySelectorAll(selector).forEach((el, i) => {
      const active = i === state.currentIndex;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", String(!active));
    });
  }

  function updateThumbs() {
    dom.thumbsStrip?.querySelectorAll(".thumb-button").forEach((button, i) => {
      const active = i === state.currentIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function updateCounters() {
    if (dom.currentSlide) dom.currentSlide.textContent = String(state.currentIndex + 1);
    if (dom.totalSlides) dom.totalSlides.textContent = String(photos.length);
  }

  function renderCaption() {
    const photo = photos[state.currentIndex];
    const show = state.showCaptions && Boolean(photo);

    if (dom.captionPanel) dom.captionPanel.hidden = !show;
    if (!photo) return;

    dom.captionTitle.textContent = show ? photo.caption : "";
    dom.captionText.textContent = show ? photo.description : "";
    dom.captionText.hidden = !show || !photo.description;
  }

  function renderLayoutVisibility() {
    const layout = state.layout;
    toggle(dom.mediaStage, layout === "slideshow");
    toggle(dom.heroStage, layout === "hero");
    toggle(dom.gridGallery, layout === "grid");
    toggle(dom.masonryGallery, layout === "masonry");

    const showThumbs = state.showThumbnails && photos.length > 1 &&
      (layout === "slideshow" || layout === "hero");
    toggle(dom.thumbsStrip, showThumbs);
  }

  function renderEmptyState() {
    dom.emptyState.hidden = false;
    [dom.mediaStage, dom.heroStage, dom.gridGallery, dom.masonryGallery, dom.thumbsStrip]
      .forEach(el => el && (el.hidden = true));
    dom.currentSlide.textContent = "0";
    dom.totalSlides.textContent = "0";
  }

  function toggle(el, visible) {
    if (el) el.hidden = !visible;
  }

  function updateModeButtons() {
    const shuffle = state.mode === "shuffle";
    dom.shuffleBtn?.classList.toggle("is-active", shuffle);
    dom.shuffleBtn?.setAttribute("aria-pressed", String(shuffle));
    dom.sequentialBtn?.classList.toggle("is-active", !shuffle);
    dom.sequentialBtn?.setAttribute("aria-pressed", String(!shuffle));
  }

  function updatePlayPauseButton() {
    if (!dom.playPauseBtn) return;
    dom.playPauseBtn.textContent = state.playing ? "Pause" : "Play";
    dom.playPauseBtn.setAttribute("aria-label", state.playing ? "Pause slideshow" : "Play slideshow");
    dom.playPauseBtn.classList.toggle("is-paused", !state.playing);
  }

  function startAutoplay() {
    stopAutoplay();
    if (!state.playing || photos.length <= 1) {
      updateProgress(true);
      return;
    }

    progressStart = performance.now();
    timer = setTimeout(() => {
      next();
      startAutoplay();
    }, state.interval);

    animateProgress();
  }

  function stopAutoplay() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (progressFrame) cancelAnimationFrame(progressFrame);
    progressFrame = null;
    updateProgress(true);
  }

  function restartAutoplay() {
    if (state.playing) startAutoplay();
  }

  function animateProgress() {
    if (!state.playing || !dom.progressBar) return;
    const elapsed = performance.now() - progressStart;
    const percent = Math.min(100, (elapsed / state.interval) * 100);
    dom.progressBar.style.setProperty("--progress", `${percent}%`);
    if (percent < 100) progressFrame = requestAnimationFrame(animateProgress);
  }

  function updateProgress(reset = false) {
    if (!dom.progressBar) return;
    if (reset || !state.playing || photos.length <= 1) {
      dom.progressBar.style.setProperty("--progress", "0%");
    }
  }

  function previous() {
    if (!photos.length) return;
    if (state.mode === "shuffle") {
      state.currentIndex = randomOtherIndex();
    } else {
      state.currentIndex = (state.currentIndex - 1 + photos.length) % photos.length;
    }
    render();
  }

  function next() {
    if (!photos.length) return;
    if (state.mode === "shuffle") {
      state.currentIndex = getNextShuffleIndex();
    } else {
      state.currentIndex = (state.currentIndex + 1) % photos.length;
    }
    render();
  }

  function goTo(index) {
    state.currentIndex = clampIndex(index);
    render();
  }

  function setMode(mode) {
    state.mode = mode === "shuffle" ? "shuffle" : "sequential";
    if (state.mode === "shuffle") refillShufflePool();
    else shufflePool = [];
    updateModeButtons();
    saveState();
  }

  function refillShufflePool() {
    shufflePool = photos.map((_, i) => i).filter(i => i !== state.currentIndex);
    for (let i = shufflePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shufflePool[i], shufflePool[j]] = [shufflePool[j], shufflePool[i]];
    }
  }

  function getNextShuffleIndex() {
    if (!shufflePool.length) refillShufflePool();
    return shufflePool.shift() ?? state.currentIndex;
  }

  function randomOtherIndex() {
    if (photos.length <= 1) return 0;
    let candidate = state.currentIndex;
    while (candidate === state.currentIndex) {
      candidate = Math.floor(Math.random() * photos.length);
    }
    return candidate;
  }

  function clampIndex(index) {
    if (!photos.length) return 0;
    const n = Number(index);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(photos.length - 1, Math.floor(n)));
  }

  function togglePlayback() {
    state.playing = !state.playing;
    updatePlayPauseButton();
    saveState();
    state.playing ? startAutoplay() : stopAutoplay();
  }

  function toggleSettings(force) {
    if (!dom.settingsPanel) return;
    const open = typeof force === "boolean"
      ? force
      : !dom.settingsPanel.classList.contains("is-open");
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

  function handleFullscreenChange() {
    const active = Boolean(document.fullscreenElement);
    dom.body.classList.toggle("is-fullscreen", active);
    dom.fullscreenBtn?.setAttribute("aria-pressed", String(active));
    dom.fullscreenBtn?.setAttribute("aria-label", active ? "Exit full screen" : "Enter full screen");
  }

  function handleVisibility() {
    if (document.hidden) stopAutoplay();
    else if (state.playing) startAutoplay();
  }
})();
"""

files["styles.css"] = r"""* { box-sizing: border-box; }
:root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color-scheme: dark; }
html[data-theme="light"] { color-scheme: light; }
body {
  margin: 0; min-height: 100vh; overflow-x: hidden;
  background: #080b10; color: #f5f7fa;
  transition: background .25s ease, color .25s ease;
}
body[data-theme="light"] { background: #f4f6f8; color: #17202a; }
button, select { font: inherit; }
button { cursor: pointer; }
.gallery-shell { min-height: 100vh; display: flex; flex-direction: column; }
.gallery-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 28px; gap:20px; background:rgba(8,11,16,.88);
  border-bottom:1px solid rgba(255,255,255,.08); backdrop-filter:blur(14px); z-index:10;
}
body[data-theme="light"] .gallery-header { background:rgba(255,255,255,.9); border-color:rgba(0,0,0,.08); }
.eyebrow { font-size:11px; letter-spacing:.18em; opacity:.6; font-weight:700; }
h1 { margin:4px 0 0; font-size:clamp(20px,2.4vw,30px); }
.header-actions { display:flex; gap:8px; }
.icon-button, .control-button, .mode-button {
  border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07);
  color:inherit; border-radius:10px; min-height:40px; padding:8px 13px;
}
body[data-theme="light"] .icon-button,
body[data-theme="light"] .control-button,
body[data-theme="light"] .mode-button { border-color:rgba(0,0,0,.12); background:rgba(0,0,0,.04); }
.icon-button { width:42px; padding:0; font-size:20px; }
.gallery-main { width:min(1500px,100%); margin:auto; flex:1; padding:18px 24px 0; }
.stage-wrap { position:relative; min-height:58vh; height:calc(100vh - 235px); max-height:900px; overflow:hidden; border-radius:18px; background:#11161d; box-shadow:0 20px 60px rgba(0,0,0,.28); }
body[data-theme="light"] .stage-wrap { background:#e5e8ec; }
.media-stage, .hero-stage { position:absolute; inset:0; }
.gallery-slide, .hero-slide { position:absolute; inset:0; margin:0; opacity:0; visibility:hidden; transform:translateX(0) scale(1); transition:opacity .8s ease, transform .8s ease; }
.gallery-slide.is-active, .hero-slide.is-active { opacity:1; visibility:visible; z-index:1; }
body[data-transition="slide"] .gallery-slide:not(.is-active),
body[data-transition="slide"] .hero-slide:not(.is-active) { transform:translateX(4%); }
body[data-transition="zoom"] .gallery-slide:not(.is-active),
body[data-transition="zoom"] .hero-slide:not(.is-active) { transform:scale(1.05); }
.gallery-slide-image, .hero-slide-image { width:100%; height:100%; object-fit:contain; display:block; }
.hero-slide-image { object-fit:cover; }
.gallery-overlay { position:absolute; inset:0; pointer-events:none; z-index:4; display:flex; flex-direction:column; justify-content:flex-end; padding:28px; background:linear-gradient(transparent 48%, rgba(0,0,0,.7)); }
.caption-panel { max-width:min(850px,85%); }
.caption-title { font-size:clamp(20px,3vw,36px); font-weight:750; }
.caption-text { margin-top:7px; opacity:.82; line-height:1.5; }
.caption-panel[hidden] { display:none; }
.counter { align-self:flex-end; margin-top:12px; font-size:13px; font-weight:700; opacity:.85; }
.counter-separator { margin:0 5px; opacity:.45; }
.progress-track { height:3px; background:rgba(255,255,255,.12); overflow:hidden; }
.progress-bar { height:100%; width:var(--progress,0%); background:currentColor; opacity:.75; transition:width .05s linear; }
.controls { display:flex; align-items:center; justify-content:center; gap:8px; padding:14px 0; flex-wrap:wrap; }
.control-button.primary { min-width:90px; font-weight:700; }
.mode-group { display:flex; margin-left:10px; gap:5px; }
.mode-button { font-size:13px; }
.mode-button.is-active { background:rgba(255,255,255,.18); font-weight:700; }
body[data-theme="light"] .mode-button.is-active { background:rgba(0,0,0,.1); }
.thumbs-strip { display:flex; gap:8px; overflow-x:auto; padding:2px 0 15px; scrollbar-width:thin; }
.thumb-button { flex:0 0 105px; padding:0; border:2px solid transparent; border-radius:8px; overflow:hidden; background:transparent; color:inherit; position:relative; }
.thumb-button.is-active { border-color:currentColor; }
.thumb-image { display:block; width:105px; height:65px; object-fit:cover; }
.thumb-label { display:block; position:absolute; left:0; right:0; bottom:0; padding:3px 5px; font-size:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; background:rgba(0,0,0,.65); }
.grid-gallery { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; padding:10px; overflow:auto; height:100%; }
.gallery-card, .masonry-card { background:rgba(255,255,255,.05); border-radius:12px; overflow:hidden; }
.gallery-card-media, .masonry-card-button { width:100%; border:0; padding:0; background:transparent; color:inherit; display:block; }
.gallery-card-image, .masonry-image { display:block; width:100%; height:220px; object-fit:cover; }
.gallery-card-meta, .masonry-meta { padding:11px 13px 14px; text-align:left; }
.gallery-card-title, .masonry-title { margin:0; font-size:15px; }
.gallery-card-description, .masonry-description { margin:5px 0 0; opacity:.65; font-size:12px; line-height:1.4; }
.masonry-gallery { height:100%; overflow:auto; padding:10px; columns:4 220px; column-gap:14px; }
.masonry-card { break-inside:avoid; margin:0 0 14px; }
.masonry-image { height:auto; min-height:150px; object-fit:cover; }
.empty-state { position:absolute; inset:0; display:grid; place-content:center; text-align:center; padding:30px; }
.empty-state[hidden] { display:none; }
.empty-icon { font-size:45px; opacity:.5; }
.empty-state p { max-width:520px; opacity:.65; line-height:1.6; }
.gallery-footer { text-align:center; padding:8px 20px 16px; opacity:.45; font-size:11px; }
.settings-panel { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; justify-content:flex-end; z-index:50; opacity:0; visibility:hidden; transition:.2s; }
.settings-panel.is-open { opacity:1; visibility:visible; }
.settings-card { width:min(380px,92vw); height:100%; background:#121820; padding:24px; box-shadow:-20px 0 60px rgba(0,0,0,.3); transform:translateX(30px); transition:.2s; }
.settings-panel.is-open .settings-card { transform:none; }
body[data-theme="light"] .settings-card { background:#fff; }
.settings-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; }
.settings-header h2 { margin:0; }
.settings-card label { display:block; margin:16px 0; font-size:13px; font-weight:650; }
.settings-card select { width:100%; margin-top:7px; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,.15); background:#1b232d; color:inherit; }
body[data-theme="light"] .settings-card select { background:#f4f6f8; border-color:rgba(0,0,0,.12); }
.switch-row { display:flex !important; justify-content:space-between; align-items:center; }
.settings-note { font-size:12px; opacity:.55; line-height:1.5; margin-top:25px; }
[hidden] { display:none !important; }
.is-broken { opacity:.35; }
body.is-fullscreen .gallery-header, body.is-fullscreen .gallery-footer { display:none; }
body.is-fullscreen .gallery-main { padding:0; width:100%; }
body.is-fullscreen .stage-wrap { height:100vh; max-height:none; border-radius:0; }
body.is-fullscreen .controls, body.is-fullscreen .thumbs-strip { position:fixed; bottom:0; left:0; right:0; z-index:20; background:rgba(0,0,0,.55); backdrop-filter:blur(12px); }
body.is-fullscreen .thumbs-strip { bottom:58px; padding:8px 18px; }

@media (max-width:800px) {
  .gallery-header { padding:14px 16px; }
  .gallery-main { padding:10px 10px 0; }
  .stage-wrap { height:calc(100vh - 245px); min-height:420px; border-radius:12px; }
  .gallery-overlay { padding:18px; }
  .controls { padding:10px 0; }
  .mode-group { margin-left:0; width:100%; justify-content:center; }
  .masonry-gallery { columns:2 150px; }
  .thumb-button, .thumb-image { width:82px; }
  .thumb-image { height:52px; }
  .gallery-footer { display:none; }
}
"""

files["README.md"] = r"""# Intranet Photo Gallery

A static, advertisement-free photo gallery designed for GitHub Pages.

## Features

- Automatic slideshow
- 3/5/8/10/15 second intervals
- Fade, slide and zoom transitions
- Sequential or shuffle mode
- Full screen
- Keyboard navigation
- Touch swipe
- Full-screen slideshow
- Hero + thumbnails
- Grid layout
- Masonry layout
- Captions
- Light/dark theme
- Browser preference persistence
- No database and no login

## Repository structure

- `index.html` — page structure
- `styles.css` — visual design
- `app.js` — gallery engine
- `config.js` — title and default settings
- `photos.js` — generated photo manifest
- `photos/` — photographs
- `update-gallery.ps1` — Windows update utility

## Adding photographs

Place the new photographs in:

`C:\Users\pc365\Desktop\IntranetGalleyCrousalPhotos`

Then run PowerShell from this repository directory:

```powershell
powershell -ExecutionPolicy Bypass -File .\update-gallery.ps1
