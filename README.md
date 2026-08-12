# Intranet Photo Gallery

A professional, advertisement-free, responsive photo gallery and slideshow for organizational intranet use. Built with plain HTML, CSS, and vanilla JavaScript — no external dependencies, no ads, no tracking.

**Live Gallery URL:** https://mshikhar1.github.io/intranet-photo-gallery/

**Repository URL:** https://github.com/mshikhar1/intranet-photo-gallery

---

## Features

- Automatic rotating slideshow with cross-fade transition
- Configurable interval: 3 / 5 / 8 / 10 / 15 seconds
- Previous / Next navigation buttons
- Play / Pause control
- Progress bar
- Sequential and Shuffle playback modes
- Thumbnail strip navigation
- Four layout modes: Slideshow, Hero + Thumbnails, Grid, Masonry
- Full-screen presentation mode
- Keyboard controls: Left/Right arrows, Space (play/pause), F (fullscreen)
- Light / Dark appearance modes
- Captions generated automatically from filenames (editable in photos.js)
- All preferences saved in browser localStorage
- Fully responsive: desktop, tablet, mobile
- No advertisements, no login required, no external services

---

## File Structure

```
intranet-photo-gallery/
├── index.html          # Main page
├── styles.css          # All styling
├── app.js              # Gallery logic
├── config.js           # Site title and defaults (edit this to customize)
├── photos.js           # Photo manifest (auto-generated, do not edit by hand)
├── photos/             # Folder containing all photograph files
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ...
├── update-gallery.ps1  # PowerShell utility to add new photographs
└── README.md
```

---

## How to Add / Update Photographs

### Method 1 — PowerShell utility (recommended for Windows)

This is the easiest method. It copies photographs from your local folder, regenerates the manifest, and pushes to GitHub automatically.

**One-time setup:**

1. Install [Git for Windows](https://git-scm.com/) if not already installed.
2. Open PowerShell and clone the repository:
   ```powershell
   git clone https://github.com/mshikhar1/intranet-photo-gallery.git
   cd intranet-photo-gallery
   ```
3. Configure Git identity (first time only):
   ```powershell
   git config --global user.email "your-email@example.com"
   git config --global user.name "Your Name"
   ```

**To populate your real photographs (run once, or whenever photos change):**

```powershell
cd C:\path\to\intranet-photo-gallery
.\update-gallery.ps1
```

The script will:
- Read all images from `C:\Users\pc365\Desktop\IntranetGalleyCrousalPhotos`
- Copy them to the `photos/` folder in the repository
- Regenerate `photos.js` with captions derived from filenames
- Commit and push to GitHub automatically
- GitHub Pages will update within approximately 60 seconds

**Your original photographs are never deleted or modified.**

### Method 2 — GitHub web interface (no Git required)

1. Go to https://github.com/mshikhar1/intranet-photo-gallery
2. Navigate to the `photos/` folder
3. Click **Add file → Upload files**
4. Drag and drop your photographs
5. Click **Commit changes**
6. Edit `photos.js` to add entries for the new files (see format below)

---

## Photo Manifest Format (photos.js)

```javascript
const PHOTOS = [
  { src: "photos/filename.jpg", caption: "Your Caption Here" },
  { src: "photos/another.jpg",  caption: "Another Caption" }
];
```

- `src` — relative path from the root of the site
- `caption` — text displayed under/over the image (can be anything)

---

## How to Change the Gallery Title

Edit `config.js`:

```javascript
const GALLERY_CONFIG = {
  siteTitle: "My Organization Photo Gallery",
  ...
};
```

---

## How to Change Default Slideshow Timing

Edit `config.js`:

```javascript
defaultIntervalMs: 8000,  // 8 seconds
```

Users can also change the interval themselves through the Settings panel (gear icon) — their choice is saved in localStorage.

---

## How to Change Captions

Edit `photos.js` and update the `caption` value for each entry. If you use `update-gallery.ps1`, captions are automatically generated from filenames; you can then edit `photos.js` manually to refine them.

---

## GitHub Pages Deployment

The site is deployed using **GitHub Pages** from the `main` branch, root folder.

- Settings: Repository → Settings → Pages → Branch: main / (root)
- Any push to `main` triggers a new deployment automatically
- Deployment takes approximately 30–90 seconds
- URL: https://mshikhar1.github.io/intranet-photo-gallery/

---

## Customization

| What to change | Where |
|---|---|
| Gallery title | `config.js` → `siteTitle` |
| Default interval | `config.js` → `defaultIntervalMs` |
| Default theme (light/dark) | `config.js` → `defaultTheme` |
| Default order | `config.js` → `defaultOrder` |
| Add/remove photos | Run `update-gallery.ps1` or edit `photos.js` |
| Photo captions | Edit `caption` values in `photos.js` |
| Visual design | `styles.css` |

---

## Privacy and Security

- No cookies banner required (only localStorage for user preferences)
- No third-party analytics or tracking
- No advertisements
- No login required
- All photographs stored in this repository are publicly accessible (as required for GitHub Pages)
