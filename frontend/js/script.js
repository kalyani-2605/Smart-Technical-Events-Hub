/* =========================================================================
   SMART TECHNICAL EVENTS HUB — SCRIPT.JS
   Vanilla JS only. Handles nav, theme, filtering, validation, misc widgets.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------- Mobile navigation ---------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  /* ---------------- Active nav link highlight ---------------- */
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });

  /* ---------------- Dark mode toggle ---------------- */
  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  let storedTheme = 'light';
  try { storedTheme = window.__STEH_THEME__ || 'light'; } catch (e) {}

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (themeToggle) themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
      root.removeAttribute('data-theme');
      if (themeToggle) themeToggle.innerHTML = '<i class="bi bi-moon-stars"></i>';
    }
    window.__STEH_THEME__ = theme;
  }
  applyTheme(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  /* ---------------- Scroll-to-top button ---------------- */
  const scrollBtn = document.querySelector('.scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 420) scrollBtn.classList.add('show');
      else scrollBtn.classList.remove('show');
    });
    scrollBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- Smooth scroll for on-page anchors ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------------- Hero background slider (rotating gradient words) ---------------- */
  const heroWord = document.querySelector('.hero-rotate');
  if (heroWord) {
    const words = ['Hackathons', 'Workshops', 'Tech Fests', 'Internships', 'Certifications'];
    let idx = 0;
    setInterval(function () {
      idx = (idx + 1) % words.length;
      heroWord.style.opacity = 0;
      setTimeout(function () {
        heroWord.textContent = words[idx];
        heroWord.style.opacity = 1;
      }, 220);
    }, 2200);
  }

  /* ---------------- Bookmark toggle & Register button ----------------
     Real, backend-connected handlers for these live in js/api.js
     (wireCardButtons / initEventDetailsPage), since they now need to
     call the API and know which event they belong to. */

  /* ---------------- Share button demo ---------------- */
  document.querySelectorAll('.js-share').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('Link copied', 'Event link copied to clipboard.');
    });
  });

  /* ---------------- Toast notification ---------------- */
  let toastTimer = null;
  window.showToast = function (title, body) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<i class="bi bi-bell-fill"></i><div><div class="t-title"></div><div class="t-body"></div></div>';
      document.body.appendChild(toast);
    }
    toast.querySelector('.t-title').textContent = title;
    toast.querySelector('.t-body').textContent = body;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3600);
  };

  /* ---------------- Events page: search + filter ----------------
     Real, backend-connected search/filtering (querying the API and
     rendering cards dynamically) lives in js/api.js -> initEventsPage(). */

  /* ---------------- Home page category quick filter ---------------- */
  document.querySelectorAll('.cat-card[data-goto]').forEach(function (card) {
    card.addEventListener('click', function () {
      window.location.href = 'events.html?category=' + card.dataset.goto;
    });
  });
  // Reading ?category= from the URL on events.html is handled in js/api.js -> initEventsPage(),
  // since the category filter now drives a real API request rather than a client-side toggle.

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    const q = item.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', function () {
        const isOpen = item.classList.contains('open');
        item.closest('.faq-list') && item.closest('.faq-list').querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  /* ---------------- Countdown timer (event details) ----------------
     Reads countdown.dataset.deadline fresh on every tick (rather than once,
     up front) because js/api.js updates that attribute with the real
     event's registration deadline shortly after this runs. */
  const countdown = document.querySelector('.countdown');
  if (countdown) {
    function tick() {
      const deadline = new Date(countdown.dataset.deadline || Date.now() + 5 * 86400000).getTime();
      const now = Date.now();
      let diff = Math.max(0, deadline - now);
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      const set = function (sel, val) { const el = countdown.querySelector(sel); if (el) el.textContent = String(val).padStart(2, '0'); };
      set('.cd-d', d); set('.cd-h', h); set('.cd-m', m); set('.cd-s', s);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- Form validation ---------------- */
  function validateField(field, condition, message) {
    const wrap = field.closest('.field');
    if (!wrap) return condition;
    let hint = wrap.querySelector('.hint');
    if (!condition) {
      wrap.classList.add('error');
      if (hint) hint.textContent = message;
    } else {
      wrap.classList.remove('error');
    }
    return condition;
  }

  /* ---------------- Login / Signup / Contact / Profile forms ----------------
     Field-level validation helper (validateField) above is still used by
     js/api.js. The actual submit handlers that call the backend API for
     #loginForm, #signupForm, #contactForm and #profileForm live in
     js/api.js (initLoginPage, initSignupPage, initContactPage, initProfilePage). */

  /* ---------------- Notification bell ----------------
     Real, backend-connected handler (fetches actual notifications) lives
     in js/api.js -> initNotificationBell(). */

  window.validateField = validateField;

});
