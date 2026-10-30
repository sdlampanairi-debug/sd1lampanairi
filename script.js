(() => {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const year = document.getElementById('year');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  let previousFocus = null;

  year.textContent = new Date().getFullYear();

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Buka menu navigasi');
    });
  });

  const updateActiveLink = () => {
    const marker = window.scrollY + 150;
    let currentId = 'beranda';
    sections.forEach(section => {
      if (section.offsetTop <= marker) currentId = section.id;
    });
    navLinks.forEach(link => {
      const selected = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (previousFocus) previousFocus.focus();
  };

  let gPhotos = [], gIndex = 0, gTitle = '';
  const gMakeNav = (cls, label, text) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lightbox-nav ' + cls; b.setAttribute('aria-label', label); b.textContent = text;
    lightbox.appendChild(b); return b;
  };
  const gPrev = gMakeNav('lightbox-prev', 'Foto sebelumnya', '\u2039');
  const gNext = gMakeNav('lightbox-next', 'Foto berikutnya', '\u203a');
  const gShow = i => {
    gIndex = (i + gPhotos.length) % gPhotos.length;
    const s = gPhotos[gIndex];
    lightboxImage.style.backgroundImage = getComputedStyle(s).backgroundImage;
    const cap = (s.dataset && s.dataset.cap) || gTitle;
    lightboxCaption.textContent = gPhotos.length > 1 ? cap + ' (' + (gIndex + 1) + ' dari ' + gPhotos.length + ')' : cap;
    const multi = gPhotos.length > 1;
    gPrev.style.display = gNext.style.display = multi ? '' : 'none';
  };
  gPrev.addEventListener('click', e => { e.stopPropagation(); gShow(gIndex - 1); });
  gNext.addEventListener('click', e => { e.stopPropagation(); gShow(gIndex + 1); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') gShow(gIndex - 1);
    if (e.key === 'ArrowRight') gShow(gIndex + 1);
  });
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      previousFocus = item;
      gTitle = item.dataset.caption || 'Galeri sekolah';
      gPhotos = Array.from(item.querySelectorAll('.gallery-slide'));
      if (!gPhotos.length) gPhotos = [item.querySelector('.gallery-image')];
      gShow(0);
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  // ===== Slideshow beranda =====
  // Lama tiap foto tampil (milidetik). 6000 = 6 detik.
  const HERO_INTERVAL = 6000;
  const hero = document.getElementById('beranda');
  const slides = [...document.querySelectorAll('.hero-slide')];
  const dotsWrap = document.getElementById('heroDots');
  const heroCurrent = document.getElementById('heroCurrent');
  const heroCaption = document.getElementById('heroCaption');
  const heroPrev = document.getElementById('heroPrev');
  const heroNext = document.getElementById('heroNext');
  const heroPause = document.getElementById('heroPause');

  if (hero && slides.length > 1) {
    hero.style.setProperty('--hero-interval', `${HERO_INTERVAL}ms`);
    let index = 0;
    let timer = null;
    let startedAt = 0;
    let remaining = HERO_INTERVAL;
    let userPaused = false;
    let tabHidden = document.hidden;
    const pad = n => String(n).padStart(2, '0');
    const isRunning = () => !userPaused && !tabHidden;

    const schedule = ms => {
      clearTimeout(timer);
      startedAt = Date.now();
      remaining = ms;
      timer = setTimeout(() => goTo(index + 1), ms);
    };

    const dots = slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hero-dot';
      dot.setAttribute('aria-label', `Tampilkan foto ${i + 1}${slide.dataset.caption ? ': ' + slide.dataset.caption : ''}`);
      dot.innerHTML = '<span></span>';
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, n) => slide.classList.toggle('is-active', n === index));
      dots.forEach(dot => { dot.classList.remove('is-active'); dot.removeAttribute('aria-current'); });
      void dotsWrap.offsetWidth; // mulai ulang animasi garis progres
      dots[index].classList.add('is-active');
      dots[index].setAttribute('aria-current', 'true');
      heroCurrent.textContent = pad(index + 1);
      heroCaption.textContent = slides[index].dataset.caption || '';
      if (isRunning()) schedule(HERO_INTERVAL);
      else remaining = HERO_INTERVAL;
    }

    const pause = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
      }
      hero.classList.add('is-paused');
    };

    const resume = () => {
      if (!isRunning()) return;
      hero.classList.remove('is-paused');
      schedule(remaining);
    };

    heroPrev.addEventListener('click', () => goTo(index - 1));
    heroNext.addEventListener('click', () => goTo(index + 1));
    heroPause.addEventListener('click', () => {
      userPaused = !userPaused;
      heroPause.setAttribute('aria-pressed', String(userPaused));
      heroPause.setAttribute('aria-label', userPaused ? 'Putar slideshow' : 'Jeda slideshow');
      if (userPaused) pause(); else resume();
    });

    // Berhenti sementara saat tab browser tidak dibuka
    document.addEventListener('visibilitychange', () => {
      tabHidden = document.hidden;
      if (tabHidden) pause(); else resume();
    });

    // Geser (swipe) kiri/kanan di HP
    let touchX = null;
    let touchY = null;
    hero.addEventListener('touchstart', event => {
      touchX = event.touches[0].clientX;
      touchY = event.touches[0].clientY;
    }, { passive: true });
    hero.addEventListener('touchend', event => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      const dy = event.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });

    if (tabHidden) hero.classList.add('is-paused');
    goTo(0);
  }
})();
