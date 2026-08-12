(function(){'use strict';
var photos=PHOTOS||[];
var cfg=GALLERY_CONFIG;
var prefs={};
var idx=0;
var playing=true;
var shuffle=false;
var order=[];
var timer=null;
var progressTimer=null;
var progressStart=null;
var currentLayout='slideshow';

function loadPrefs(){
  try{
    var s=localStorage.getItem('galleryPrefs');
    if(s)prefs=JSON.parse(s);
  }catch(e){prefs={};}
  prefs.interval=prefs.interval||cfg.defaultIntervalMs||5000;
  prefs.order=prefs.order||cfg.defaultOrder||'sequential';
  prefs.theme=prefs.theme||cfg.defaultTheme||'dark';
  prefs.showThumbs=prefs.showThumbs!==undefined?prefs.showThumbs:(cfg.defaultShowThumbnails!==false);
  prefs.showCaptions=prefs.showCaptions!==undefined?prefs.showCaptions:(cfg.defaultShowCaptions!==false);
  prefs.transition=prefs.transition||cfg.defaultTransition||'fade';
}
function savePrefs(){
  try{localStorage.setItem('galleryPrefs',JSON.stringify(prefs));}catch(e){}
}
function applyTheme(){
  document.documentElement.setAttribute('data-theme',prefs.theme);
}
function buildOrder(){
  order=photos.map(function(_,i){return i;});
  if(prefs.order==='shuffle'){
    for(var i=order.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));

// ---- SLIDESHOW BUILD ----
var slidesContainer=document.getElementById('slidesContainer');
var thumbStrip=document.getElementById('thumbStrip');
var captionOverlay=document.getElementById('captionOverlay');
var counter=document.getElementById('counter');
var progressFill=document.getElementById('progressFill');
var playPauseBtn=document.getElementById('playPauseBtn');
var shuffleBtn=document.getElementById('shuffleBtn');
var prevBtn=document.getElementById('prevBtn');
var nextBtn=document.getElementById('nextBtn');

var slideEls=[];
var thumbEls=[];

function buildSlides(){
  slidesContainer.innerHTML='';
  thumbStrip.innerHTML='';
  slideEls=[];
  thumbEls=[];
  photos.forEach(function(p,i){
    var div=document.createElement('div');
    div.className='slide';
    var img=document.createElement('img');
    img.src=p.src;
    img.alt=getCaption(p);
    img.loading='lazy';
    div.appendChild(img);
    slidesContainer.appendChild(div);
    slideEls.push(div);
    // thumb
    var ti=document.createElement('img');
    ti.src=p.src;
    ti.alt=getCaption(p);
    ti.title=getCaption(p);
    ti.loading='lazy';
    ti.addEventListener('click',(function(pi){
      return function(){goTo(pi);if(!playing)startSlide(false);};
    })(i));
    thumbStrip.appendChild(ti);
    thumbEls.push(ti);
  });
}

function updateSlideshow(){
  var pi=currentPhotoIndex();
  slideEls.forEach(function(el,i){
    el.classList.toggle('active',i===pi);
  });
  thumbEls.forEach(function(el,i){
    el.classList.toggle('active',i===pi);
  });
  var p=photos[pi];
  captionOverlay.textContent=prefs.showCaptions?getCaption(p):'';
  captionOverlay.classList.toggle('hidden',!prefs.showCaptions);
  counter.textContent=(idx+1)+' / '+order.length;
  // scroll thumb into view
  if(thumbEls[pi])thumbEls[pi].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
}

function goTo(pi){
  var oIdx=order.indexOf(pi);
  if(oIdx>=0)idx=oIdx;
  else idx=pi;
  updateSlideshow();
  resetProgress();
}
function goNext(){
  idx=(idx+1)%order.length;
  updateSlideshow();
  resetProgress();
}
function goPrev(){
  idx=(idx-1+order.length)%order.length;
  updateSlideshow();
  resetProgress();
}

// ---- TIMER / PROGRESS ----
function startTimer(){
  stopTimer();
  if(!playing)return;
  timer=setTimeout(function(){goNext();startTimer();},prefs.interval);
}
function stopTimer(){clearTimeout(timer);timer=null;}
function resetProgress(){
  progressFill.style.transition='none';
  progressFill.style.width='0%';
  clearInterval(progressTimer);
  if(playing){
    progressStart=Date.now();
    requestAnimationFrame(function(){
      progressFill.style.transition='width '+prefs.interval+'ms linear';
      progressFill.style.width='100%';
    });
  }
}
function startSlide(reset){
  playing=true;
  playPauseBtn.innerHTML='&#10073;&#10073;';
  playPauseBtn.title='Pause';
  startTimer();
  if(reset!==false)resetProgress();
}
function pauseSlide(){
  playing=false;
  playPauseBtn.innerHTML='&#9654;';
  playPauseBtn.title='Play';
  stopTimer();
  progressFill.style.transition='none';
  progressFill.style.width='0%';
}
function togglePlay(){
  if(playing)pauseSlide();
  else{startSlide();}
}

// ---- HERO LAYOUT ----
var heroImage=document.getElementById('heroImage');
var heroCaption=document.getElementById('heroCaption');
var heroThumbStrip=document.getElementById('heroThumbStrip');
var heroThumbEls=[];

function buildHero(){
  heroThumbStrip.innerHTML='';
  heroThumbEls=[];
  photos.forEach(function(p,i){
    var ti=document.createElement('img');
    ti.src=p.src;
    ti.alt=getCaption(p);
    ti.loading='lazy';
    ti.addEventListener('click',(function(i){return function(){
      var pi=order[i]||i;
      heroImage.src=photos[pi].src;
      heroCaption.textContent=prefs.showCaptions?getCaption(photos[pi]):'';
      heroThumbEls.forEach(function(e){e.classList.remove('active');});
      ti.classList.add('active');
    };})(i));
    heroThumbStrip.appendChild(ti);
    heroThumbEls.push(ti);
  });
  if(photos.length){
    var pi=currentPhotoIndex();
    heroImage.src=photos[pi].src;
    heroCaption.textContent=prefs.showCaptions?getCaption(photos[pi]):'';
    if(heroThumbEls[pi])heroThumbEls[pi].classList.add('active');
  }
}

// ---- GRID LAYOUT ----
var gridGallery=document.getElementById('gridGallery');
function buildGrid(){
  gridGallery.innerHTML='';
  photos.forEach(function(p,i){
    var div=document.createElement('div');
    div.className='grid-item';
    div.addEventListener('click',function(){switchLayout('slideshow');goTo(i);});
    var img=document.createElement('img');
    img.src=p.src;
    img.alt=getCaption(p);
    img.loading='lazy';
    var cap=document.createElement('div');
    cap.className='cap';
    if(prefs.showCaptions)cap.textContent=getCaption(p);
    div.appendChild(img);
    div.appendChild(cap);
    gridGallery.appendChild(div);
  });
}

// ---- MASONRY LAYOUT ----
var masonryGallery=document.getElementById('masonryGallery');
function buildMasonry(){
  masonryGallery.innerHTML='';
  photos.forEach(function(p,i){
    var div=document.createElement('div');
    div.className='masonry-item';
    div.addEventListener('click',function(){switchLayout('slideshow');goTo(i);});
    var img=document.createElement('img');
    img.src=p.src;
    img.alt=getCaption(p);
    img.loading='lazy';
    var cap=document.createElement('div');
    cap.className='cap';
    if(prefs.showCaptions)cap.textContent=getCaption(p);
    div.appendChild(img);
    div.appendChild(cap);
    masonryGallery.appendChild(div);
  });
}

// ---- LAYOUT SWITCHING ----
var views={slideshow:document.getElementById('slideshowView'),hero:document.getElementById('heroView'),grid:document.getElementById('gridView'),masonry:document.getElementById('masonryView')};
function switchLayout(name){
  currentLayout=name;
  Object.keys(views).forEach(function(k){
    views[k].classList.toggle('active',k===name);
  });
  document.querySelectorAll('.layout-tab').forEach(function(btn){
    btn.classList.toggle('active',btn.dataset.layout===name);
  });
  if(name==='hero')buildHero();
  if(name==='grid')buildGrid();
  if(name==='masonry')buildMasonry();
  if(name!=='slideshow'){pauseSlide();}
  else{startSlide();}
}

// ---- SETTINGS PANEL ----
var settingsPanel=document.getElementById('settingsPanel');
var overlayBackdrop=document.getElementById('overlayBackdrop');
function openSettings(){
  settingsPanel.classList.add('open');
  overlayBackdrop.classList.add('show');
}
function closeSettings(){
  settingsPanel.classList.remove('open');
  overlayBackdrop.classList.remove('show');
}
document.getElementById('settingsBtn').addEventListener('click',openSettings);
document.getElementById('closeSettings').addEventListener('click',closeSettings);
overlayBackdrop.addEventListener('click',closeSettings);

// sync controls to prefs
function syncSettingsUI(){
  var intEl=document.getElementById('intervalSelect');
  var ordEl=document.getElementById('orderSelect');
  var thmEl=document.getElementById('thumbToggle');
  var capEl=document.getElementById('captionToggle');
  var trEl=document.getElementById('transitionSelect');
  var thEl=document.getElementById('themeSelect');
  if(intEl)intEl.value=String(prefs.interval);
  if(ordEl)ordEl.value=prefs.order;
  if(thmEl)thmEl.checked=prefs.showThumbs;
  if(capEl)capEl.checked=prefs.showCaptions;
  if(trEl)trEl.value=prefs.transition;
  if(thEl)thEl.value=prefs.theme;
}
function bindSettings(){
  document.getElementById('intervalSelect').addEventListener('change',function(){
    prefs.interval=parseInt(this.value,10);
    savePrefs();
    if(playing){stopTimer();startTimer();resetProgress();}
  });
  document.getElementById('orderSelect').addEventListener('change',function(){
    prefs.order=this.value;
    savePrefs();
    buildOrder();
    idx=0;
    updateSlideshow();
  });
  document.getElementById('thumbToggle').addEventListener('change',function(){
    prefs.showThumbs=this.checked;
    savePrefs();
    thumbStrip.classList.toggle('hidden',!prefs.showThumbs);
    heroThumbStrip.classList.toggle('hidden',!prefs.showThumbs);
  });
  document.getElementById('captionToggle').addEventListener('change',function(){
    prefs.showCaptions=this.checked;
    savePrefs();
    updateSlideshow();
    buildHero();
    buildGrid();
    buildMasonry();
  });
  document.getElementById('transitionSelect').addEventListener('change',function(){
    prefs.transition=this.value;
    savePrefs();
  });
  document.getElementById('themeSelect').addEventListener('change',function(){
    prefs.theme=this.value;
    savePrefs();
    applyTheme();
  });
}

// ---- KEYBOARD CONTROLS ----
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;
  switch(e.key){
    case 'ArrowLeft':goPrev();break;
    case 'ArrowRight':goNext();break;
    case ' ':e.preventDefault();togglePlay();break;
    case 'f':case 'F':toggleFullscreen();break;
  }
});

// ---- FULLSCREEN ----
var fsBtn=document.getElementById('fullscreenBtn');
function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen().then(function(){
      document.body.classList.add('fullscreen-active');
      fsBtn.innerHTML='&#10006;';
      fsBtn.title='Exit Fullscreen';
    }).catch(function(){});
  }else{
    document.exitFullscreen().then(function(){
      document.body.classList.remove('fullscreen-active');
      fsBtn.innerHTML='&#9974;';
      fsBtn.title='Full Screen';
    }).catch(function(){});
  }
}
document.addEventListener('fullscreenchange',function(){
  if(!document.fullscreenElement){
    document.body.classList.remove('fullscreen-active');
    fsBtn.innerHTML='&#9974;';
  }
});
fsBtn.addEventListener('click',toggleFullscreen);

// ---- PLAY/PAUSE / SHUFFLE / NAV ----
playPauseBtn.addEventListener('click',togglePlay);
shuffleBtn.addEventListener('click',function(){
  prefs.order=prefs.order==='shuffle'?'sequential':'shuffle';
  savePrefs();
  buildOrder();
  idx=0;
  updateSlideshow();
  shuffleBtn.textContent='Shuffle: '+(prefs.order==='shuffle'?'On':'Off');
  document.getElementById('orderSelect').value=prefs.order;
});
prevBtn.addEventListener('click',function(){goPrev();if(!playing)startSlide(false);});
nextBtn.addEventListener('click',function(){goNext();if(!playing)startSlide(false);});

// ---- LAYOUT TABS ----
document.querySelectorAll('.layout-tab').forEach(function(btn){
  btn.addEventListener('click',function(){switchLayout(btn.dataset.layout);});
});

// ---- SITE TITLE ----
document.getElementById('siteTitle').textContent=cfg.siteTitle;
document.getElementById('footerText').textContent=cfg.footerText||'';

// ---- INIT ----
function init(){
  if(!photos||!photos.length){
    document.getElementById('app').innerHTML='<p style="padding:40px;text-align:center;color:var(--text-dim)">No photographs found. Run update-gallery.ps1 to add photographs, or add images to the photos/ folder and update photos.js.</p>';
    return;
  }
  loadPrefs();
  applyTheme();
  buildOrder();
  buildSlides();
  updateSlideshow();
  thumbStrip.classList.toggle('hidden',!prefs.showThumbs);
  syncSettingsUI();
  bindSettings();
  shuffleBtn.textContent='Shuffle: '+(prefs.order==='shuffle'?'On':'Off');
  startSlide();
  // apply initial transition class
  slideEls.forEach(function(el){
    if(prefs.transition==='slide')el.classList.add('slide-anim');
  });
}
init();
})();

      var t=order[i];order[i]=order[j];order[j]=t;
    }
  }
}
function currentPhotoIndex(){return order[idx];}
function filenameToCaption(src){
  var name=src.split('/').pop().replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
  return name.replace(/\b\w/g,function(c){return c.toUpperCase();});
}
function getCaption(p){
  return p.caption||(p.caption===''?'':filenameToCaption(p.src));
}
