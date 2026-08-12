// ============================================================
// Site configuration
// Edit the values below to customize the gallery without
// touching any HTML/CSS/JS logic.
// ============================================================
const GALLERY_CONFIG = {
  // Title shown in the header and browser tab.
  siteTitle: "Photo Gallery",

  // Default slideshow interval in milliseconds (can be overridden by user in Settings).
  defaultIntervalMs: 5000,

  // Default order: "sequential" or "shuffle"
  defaultOrder: "sequential",

  // Default theme: "light" or "dark"
  defaultTheme: "dark",

  // Show thumbnails / captions by default
  defaultShowThumbnails: true,
  defaultShowCaptions: true,

  // Default transition: "fade" or "slide"
  defaultTransition: "fade",

  // Optional small text in the footer (leave empty string for none).
  footerText: ""
};

document.title = GALLERY_CONFIG.siteTitle;
