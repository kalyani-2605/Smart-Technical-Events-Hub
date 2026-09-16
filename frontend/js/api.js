/* =========================================================================
   SMART TECHNICAL EVENTS HUB — API.JS
   Connects the existing frontend (HTML/CSS/vanilla JS) to the Node/Express
   backend. Loaded AFTER js/script.js on every page.
   ========================================================================= */

const API_URL = 'http://localhost:5003/api';

/* ============================= Auth storage ============================= */

const Auth = {
  getToken() { return localStorage.getItem('sth_token'); },
  setToken(token) { localStorage.setItem('sth_token', token); },
  clearToken() { localStorage.removeItem('sth_token'); },

  getUser() {
    try { return JSON.parse(localStorage.getItem('sth_user') || 'null'); }
    catch (e) { return null; }
  },
  setUser(user) { localStorage.setItem('sth_user', JSON.stringify(user)); },
  clearUser() { localStorage.removeItem('sth_user'); },

  isLoggedIn() { return !!this.getToken(); },

  logout() {
    this.clearToken();
    this.clearUser();
    window.location.href = 'login.html';
  },
};

/* ============================== API helper ============================== */

/**
 * Wrapper around fetch() that:
 * - prefixes API_URL
 * - attaches the JWT if present
 * - parses JSON and throws a readable Error on failure (so callers can just catch(err) { showToast(...) })
 */
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Is the backend running on port 5000?');
  }

  let data = {};
  try { data = await response.json(); } catch (e) { /* empty body */ }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

/* ========================== Small render helpers ========================= */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr, opts) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(startStr, endStr) {
  if (!startStr) return '';
  const start = new Date(startStr);
  if (!endStr) return formatDate(startStr);
  const end = new Date(endStr);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${formatDate(startStr)} – ${formatDate(endStr)}`;
}

const CATEGORY_LABELS = {
  hackathons: 'Hackathon', coding: 'Coding Competition', workshops: 'Workshop',
  seminars: 'Seminar', fests: 'Technical Fest', papers: 'Paper Presentation',
  internships: 'Internship Drive', certifications: 'Certification', bootcamps: 'Bootcamp', clubs: 'Tech Club Event',
};
const DEPT_LABELS = {
  cse: 'Computer Science', it: 'Information Technology', ece: 'Electronics & Comm.',
  mech: 'Mechanical', eee: 'Electrical', civil: 'Civil',
};

function eventStatusBadge(event) {
  const now = new Date();
  const deadline = new Date(event.registrationDeadline);
  const full = event.registeredCount >= event.capacity;
  if (full) return { cls: 'closed', label: 'Registrations Closed' };
  if (deadline < now) return { cls: 'closed', label: 'Registrations Closed' };
  const hoursLeft = (deadline - now) / 3600000;
  if (hoursLeft <= 72) return { cls: 'closing', label: 'Closing Soon' };
  return { cls: 'open', label: 'Registrations Open' };
}

/**
 * Builds the exact same .event-card markup the original static frontend used,
 * so the existing CSS in css/style.css applies without any changes.
 */
function eventCardHtml(event, bookmarkedIds) {
  const badge = eventStatusBadge(event);
  const isFull = event.registeredCount >= event.capacity;
  const isClosed = badge.cls === 'closed';
  const isBookmarked = bookmarkedIds && bookmarkedIds.has(event._id);

  const registerBtn = isClosed
    ? `<a href="#" class="btn btn-ghost btn-sm" disabled>${isFull ? 'Full' : 'Closed'}</a>`
    : `<a href="#" class="btn btn-primary btn-sm js-register" data-event-id="${event._id}">Register</a>`;

  return `
    <div class="event-card" data-category="${event.category}" data-dept="${event.department}" data-difficulty="${event.difficulty}" data-title="${escapeHtml(event.title)}" data-event-id="${event._id}">
      <div class="event-poster">
        <div class="bar"><span></span><span></span><span></span></div>
        <i class="bi ${event.icon || 'bi-calendar-event'} icon-big"></i>
        <span class="cat-label">${CATEGORY_LABELS[event.category] || event.category}</span>
        <button class="event-bookmark${isBookmarked ? ' active' : ''}" aria-label="Bookmark" data-event-id="${event._id}">
          <i class="bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
        </button>
      </div>
      <div class="event-body">
        <span class="event-status ${badge.cls}">${badge.label}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-desc">${escapeHtml((event.description || '').slice(0, 110))}${(event.description || '').length > 110 ? '…' : ''}</p>
        <div class="event-meta">
          <div><i class="bi bi-calendar3"></i> ${formatDateRange(event.date, event.endDate)}</div>
          <div><i class="bi bi-geo-alt"></i> ${escapeHtml(event.location)}</div>
          <div><i class="bi bi-people"></i> ${event.registeredCount} / ${event.capacity} seats</div>
        </div>
        <div class="event-foot">
          <a href="event-details.html?id=${event._id}" class="btn btn-outline btn-sm">Details</a>
          ${registerBtn}
        </div>
      </div>
    </div>`;
}

/* ============================ Nav auth state ============================ */

function renderNavAuthState() {
  const user = Auth.getUser();
  const desktopSlot = document.querySelector('.nav-auth-desktop')?.parentElement;
  if (!desktopSlot) return;

  const desktopLinks = desktopSlot.querySelectorAll('.nav-auth-desktop');
  const mobileLinks = document.querySelectorAll('.nav-auth-mobile');

  if (user) {
    desktopLinks.forEach((el) => (el.style.display = 'none'));
    mobileLinks.forEach((el) => (el.style.display = 'none'));

    if (!document.querySelector('.sth-user-menu')) {
      const initials = user.avatarInitials || (user.fullName || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
      const wrap = document.createElement('div');
      wrap.className = 'sth-user-menu';
      wrap.style.cssText = 'display:flex; align-items:center; gap:8px;';
      const adminLink = user.role === 'admin' ? `<a href="admin.html" class="btn btn-outline btn-sm">Admin</a>` : '';
      wrap.innerHTML = `
        ${adminLink}
        <a href="profile.html" class="avatar" style="width:34px; height:34px; font-size:0.8rem; text-decoration:none;">${escapeHtml(initials)}</a>
        <button class="btn btn-outline btn-sm sth-logout-btn" type="button">Logout</button>`;
      desktopSlot.insertBefore(wrap, document.querySelector('.nav-toggle'));
      wrap.querySelector('.sth-logout-btn').addEventListener('click', () => Auth.logout());
    }
  }
}

/* ============================ Route guarding ============================ */

const PROTECTED_PAGES = ['dashboard.html', 'profile.html', 'certificates.html'];

function guardProtectedPage() {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'admin.html') {
    // admin.html has its own guard in js/admin.js (guardAdminPage), which
    // redirects to admin-login.html rather than the student/organizer login.
    return;
  }

  if (PROTECTED_PAGES.includes(page) && !Auth.isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

/* ================================ Toast =================================
   showToast() is already defined in script.js and attached to window there.
   We fall back to a minimal version here only if script.js hasn't run yet. */
if (typeof window.showToast !== 'function') {
  window.showToast = function (title, body) { alert(`${title}\n${body}`); };
}

/* ============================== Page: Signup ============================= */

function initSignupPage() {
  const form = document.querySelector('#signupForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = form.querySelector('#suName').value.trim();
    const email = form.querySelector('#suEmail').value.trim();
    const roll = form.querySelector('#suRoll').value.trim();
    const dept = form.querySelector('#suDept').value;
    const year = form.querySelector('#suYear').value;
    const password = form.querySelector('#suPassword').value;
    const confirm = form.querySelector('#suConfirm').value;

    // client-side checks (mirrors the validation already in script.js)
    if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email) || roll.length < 4 ||
        !dept || !year || password.length < 6 || confirm !== password) {
      showToast('Check your details', 'Please fix the highlighted fields and try again.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName: name, email, rollNumber: roll, department: dept, year, password, confirmPassword: confirm }),
      });
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      showToast('Account created', 'Welcome to Smart Technical Events Hub!');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } catch (err) {
      showToast('Signup failed', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

/* ============================== Page: Login =============================== */

function initLoginPage() {
  const form = document.querySelector('#loginForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = form.querySelector('#loginEmail').value.trim();
    const password = form.querySelector('#loginPassword').value;

    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email) || password.length < 6) {
      showToast('Check your details', 'Enter a valid email and a password of at least 6 characters.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.user.role === 'admin') {
        // Admin accounts sign in through the dedicated admin login page only.
        showToast('Use the Admin login', 'This account is an admin account — please sign in from the Admin Login page instead.');
        return;
      }

      Auth.setToken(data.token);
      Auth.setUser(data.user);
      showToast('Welcome back', 'Login successful. Redirecting...');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } catch (err) {
      showToast('Login failed', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
}

/* ============================== Page: Events =============================== */

function initEventsPage() {
  const grid = document.querySelector('.event-grid');
  const resultsCount = document.querySelector('#resultsCount');
  if (!grid || !document.querySelector('#eventSearch')) return; // only run on events.html

  const searchInput = document.querySelector('#eventSearch');
  const filterCategory = document.querySelector('#filterCategory');
  const filterDept = document.querySelector('#filterDept');
  const filterDifficulty = document.querySelector('#filterDifficulty');

  let bookmarkedIds = new Set();
  let debounceTimer = null;

  async function loadBookmarks() {
    if (!Auth.isLoggedIn() || Auth.getUser()?.role !== 'student') return;
    try {
      const data = await apiFetch('/bookmarks');
      bookmarkedIds = new Set(data.bookmarks.map((b) => b.event && b.event._id).filter(Boolean));
    } catch (e) { /* not fatal */ }
  }

  async function loadEvents() {
    grid.innerHTML = `<p style="padding:24px 0; color:var(--slate);">Loading events…</p>`;

    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (filterCategory.value !== 'all') params.set('category', filterCategory.value);
    if (filterDept.value !== 'all') params.set('department', filterDept.value);
    if (filterDifficulty.value !== 'all') params.set('difficulty', filterDifficulty.value);

    try {
      const data = await apiFetch(`/events?${params.toString()}`);
      if (resultsCount) {
        resultsCount.textContent = `${data.count} event${data.count === 1 ? '' : 's'} found`;
      }
      if (!data.events.length) {
        grid.innerHTML = `<p style="padding:24px 0; color:var(--slate);">No events match your filters yet.</p>`;
        return;
      }
      grid.innerHTML = data.events.map((ev) => eventCardHtml(ev, bookmarkedIds)).join('');
      wireCardButtons(grid);
    } catch (err) {
      grid.innerHTML = `<p style="padding:24px 0; color:var(--red);">Could not load events: ${escapeHtml(err.message)}</p>`;
    }
  }

  function debouncedLoad() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadEvents, 300);
  }

  [searchInput, filterCategory, filterDept, filterDifficulty].forEach((el) => {
    el.addEventListener('input', debouncedLoad);
  });

  // support ?category= coming from the homepage category cards
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) filterCategory.value = params.get('category');

  loadBookmarks().then(loadEvents);
}

/* ===================== Shared: register / bookmark buttons ===================== */

function wireCardButtons(scope) {
  scope.querySelectorAll('.js-register[data-event-id]').forEach((btn) => {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        showToast('Please login', 'You need to log in to register for events.');
        setTimeout(() => (window.location.href = 'login.html'), 900);
        return;
      }
      if (Auth.getUser()?.role !== 'student') {
        showToast('Students only', 'Only student accounts can register for events.');
        return;
      }
      const eventId = btn.dataset.eventId;
      try {
        await apiFetch(`/events/${eventId}/register`, { method: 'POST' });
        showToast('Registration confirmed', 'You are registered. Check your dashboard for details.');
        btn.textContent = 'Registered';
        btn.classList.add('btn-ghost');
        btn.classList.remove('btn-primary');
        btn.setAttribute('disabled', 'true');
      } catch (err) {
        showToast('Registration failed', err.message);
      }
    });
  });

  scope.querySelectorAll('.event-bookmark[data-event-id]').forEach((btn) => {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        showToast('Please login', 'You need to log in to bookmark events.');
        setTimeout(() => (window.location.href = 'login.html'), 900);
        return;
      }
      const eventId = btn.dataset.eventId;
      const icon = btn.querySelector('i');
      const isActive = btn.classList.contains('active');
      try {
        if (isActive) {
          await apiFetch(`/events/${eventId}/bookmark`, { method: 'DELETE' });
          btn.classList.remove('active');
          if (icon) { icon.classList.add('bi-bookmark'); icon.classList.remove('bi-bookmark-fill'); }
          showToast('Bookmark updated', 'Event removed from bookmarks.');
        } else {
          await apiFetch(`/events/${eventId}/bookmark`, { method: 'POST' });
          btn.classList.add('active');
          if (icon) { icon.classList.remove('bi-bookmark'); icon.classList.add('bi-bookmark-fill'); }
          showToast('Bookmark updated', 'Event saved to your dashboard.');
        }
      } catch (err) {
        showToast('Something went wrong', err.message);
      }
    });
  });
}

/* ============================ Page: Event Details ============================ */

function initEventDetailsPage() {
  const banner = document.querySelector('.details-banner');
  if (!banner) return;

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  if (!eventId) {
    banner.querySelector('h1').textContent = 'Event not found';
    return;
  }

  apiFetch(`/events/${eventId}`)
    .then(({ event, registrationStatus, isBookmarked, seatsAvailable }) => {
      document.title = `${event.title} — Event Details`;

      // Breadcrumb + heading
      const crumb = banner.querySelector('.details-crumb');
      if (crumb) crumb.innerHTML = `<a href="events.html">Events</a> / <a href="events.html?category=${event.category}">${CATEGORY_LABELS[event.category] || event.category}</a> / ${escapeHtml(event.title)}`;
      const tag = banner.querySelector('.tag');
      if (tag) tag.textContent = CATEGORY_LABELS[event.category] || event.category;
      banner.querySelector('h1').textContent = event.title;
      const bannerDesc = banner.querySelector('.container > p');
      if (bannerDesc) bannerDesc.textContent = event.description;

      // Register button(s) + bookmark button(s) everywhere on the page
      document.querySelectorAll('.js-register').forEach((btn) => {
        btn.dataset.eventId = event._id;
        if (registrationStatus === 'registered') {
          btn.textContent = 'Registered';
          btn.classList.add('btn-ghost');
        }
      });
      document.querySelectorAll('.event-bookmark').forEach((btn) => {
        btn.dataset.eventId = event._id;
        const icon = btn.querySelector('i');
        if (isBookmarked) {
          btn.classList.add('active');
          if (icon) { icon.classList.remove('bi-bookmark'); icon.classList.add('bi-bookmark-fill'); }
        }
      });
      wireCardButtons(document);

      // About
      const aboutBlock = document.querySelectorAll('.details-block')[0];
      if (aboutBlock) aboutBlock.querySelector('p').textContent = event.description;

      // Agenda
      const timeline = document.querySelector('.timeline');
      if (timeline) {
        if (event.agenda && event.agenda.length) {
          timeline.innerHTML = event.agenda.map((a) => `
            <div class="timeline-item"><div class="tl-time">${escapeHtml(a.time || '')}</div><h4>${escapeHtml(a.title || '')}</h4><p>${escapeHtml(a.description || '')}</p></div>`).join('');
        } else {
          timeline.closest('.details-block').style.display = 'none';
        }
      }

      // Eligibility
      const eligBlocks = document.querySelectorAll('.details-block');
      const eligBlock = Array.from(eligBlocks).find((b) => b.querySelector('h2')?.textContent.trim() === 'Eligibility');
      if (eligBlock) {
        const ul = eligBlock.querySelector('ul');
        if (event.eligibility && event.eligibility.length) {
          ul.innerHTML = event.eligibility.map((li) => `<li style="margin-bottom:8px;">${escapeHtml(li)}</li>`).join('');
        } else {
          eligBlock.style.display = 'none';
        }
      }

      // Venue
      const venueBlock = Array.from(eligBlocks).find((b) => b.querySelector('h2')?.textContent.trim() === 'Venue');
      if (venueBlock) {
        const p = venueBlock.querySelector('p');
        p.innerHTML = `<i class="bi bi-geo-alt" style="color:var(--blue);"></i> ${escapeHtml(event.location)}`;
      }

      // Organizer
      const orgBlock = Array.from(eligBlocks).find((b) => b.querySelector('h2')?.textContent.trim() === 'Organizer');
      if (orgBlock) {
        const nameEl = orgBlock.querySelector('h4');
        const avatarEl = orgBlock.querySelector('.avatar');
        const orgName = event.organizerName || event.organizer?.fullName || 'Organizer';
        if (nameEl) nameEl.textContent = orgName;
        if (avatarEl) avatarEl.textContent = orgName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
      }

      // FAQs
      const faqList = document.querySelector('.details-block .faq-list');
      if (faqList) {
        if (event.faqs && event.faqs.length) {
          faqList.innerHTML = event.faqs.map((f, i) => `
            <div class="faq-item${i === 0 ? ' open' : ''}">
              <div class="faq-q">${escapeHtml(f.question)} <i class="bi bi-plus-lg"></i></div>
              <div class="faq-a">${escapeHtml(f.answer)}</div>
            </div>`).join('');
          // re-wire click handlers since we replaced the DOM nodes
          faqList.querySelectorAll('.faq-item').forEach((item) => {
            item.querySelector('.faq-q').addEventListener('click', function () {
              const isOpen = item.classList.contains('open');
              faqList.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
              if (!isOpen) item.classList.add('open');
            });
          });
        } else {
          faqList.closest('.details-block').style.display = 'none';
        }
      }

      // Sidebar: countdown + info rows
      const countdown = document.querySelector('.countdown');
      if (countdown) countdown.dataset.deadline = new Date(event.registrationDeadline).toISOString();

      const scRows = document.querySelectorAll('.side-card .sc-row');
      const badge = eventStatusBadge(event);
      const rowMap = {
        Status: badge.label.replace('Registrations ', ''),
        Dates: formatDateRange(event.date, event.endDate),
        Venue: event.location,
        Seats: `${event.registeredCount} / ${event.capacity}`,
        'Team Size': '—',
        Fee: 'Free',
        Deadline: formatDate(event.registrationDeadline),
      };
      scRows.forEach((row) => {
        const label = row.querySelector('span')?.textContent.trim();
        if (label && rowMap[label] !== undefined) {
          row.querySelectorAll('span')[1].textContent = rowMap[label];
        }
      });
    })
    .catch((err) => {
      banner.querySelector('h1').textContent = 'Event not found';
      const p = banner.querySelector('.container > p');
      if (p) p.textContent = err.message;
      document.querySelectorAll('.details-block, aside').forEach((el) => (el.style.display = 'none'));
    });
}

/* ============================== Page: Dashboard ============================== */

function initDashboardPage() {
  const dashGrid = document.querySelector('.dash-grid');
  if (!dashGrid) return;

  const user = Auth.getUser();

  // /api/dashboard is student-only on the backend; send other roles somewhere sensible
  if (user && user.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }
  if (user && user.role === 'organizer') {
    showToast('Organizer account', 'The student dashboard is not available for organizer accounts yet.');
    return;
  }

  const heroTitle = document.querySelector('.dash-hero h1');
  const heroSub = document.querySelector('.dash-hero p');
  const avatarLink = document.querySelector('.nav-actions .avatar');

  if (user && heroTitle) heroTitle.textContent = `Hi ${user.fullName?.split(' ')[0] || 'there'}, here's what's happening`;
  if (user && avatarLink) avatarLink.textContent = user.avatarInitials || 'U';

  // dashboard.html's nav shows an avatar rather than Login/Sign Up links, so it
  // doesn't get the injected logout button from renderNavAuthState() - add one here.
  if (avatarLink && !document.querySelector('.sth-logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn btn-outline btn-sm sth-logout-btn';
    logoutBtn.textContent = 'Logout';
    avatarLink.insertAdjacentElement('afterend', logoutBtn);
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  apiFetch('/dashboard')
    .then((data) => {
      const stats = data.statistics;
      const statEls = dashGrid.querySelectorAll('.dash-stat b');
      if (statEls[0]) statEls[0].textContent = stats.eventsRegistered;
      if (statEls[1]) statEls[1].textContent = data.upcomingEvents.length;
      if (statEls[2]) statEls[2].textContent = stats.certificatesEarned;
      if (statEls[3]) statEls[3].textContent = stats.unreadNotifications;
      if (statEls[4]) statEls[4].textContent = stats.bookmarks;

      if (heroSub) {
        heroSub.textContent = `You have ${data.upcomingEvents.length} upcoming event${data.upcomingEvents.length === 1 ? '' : 's'} and ${stats.certificatesEarned} certificate${stats.certificatesEarned === 1 ? '' : 's'} earned.`;
      }

      // Upcoming events panel (first panel in left column)
      const panels = document.querySelectorAll('.panel');
      const upcomingPanel = Array.from(panels).find((p) => p.querySelector('h3')?.textContent.trim() === 'Upcoming Events');
      if (upcomingPanel) {
        const rows = data.upcomingEvents.slice(0, 5).map((ev) => `
          <div class="list-row">
            <div class="list-thumb"><i class="bi ${ev.icon || 'bi-calendar-event'}"></i></div>
            <div class="grow"><h4>${escapeHtml(ev.title)}</h4><span>${formatDateRange(ev.date, ev.endDate)} &middot; ${escapeHtml(ev.location)}</span></div>
            <a href="event-details.html?id=${ev._id}" class="btn btn-outline btn-sm">View</a>
          </div>`).join('');
        upcomingPanel.innerHTML = `<h3>Upcoming Events</h3>${rows || '<p style="color:var(--slate);">No upcoming events yet — go register for something!</p>'}`;
      }

      // Deadlines panel
      const deadlinesPanel = Array.from(panels).find((p) => p.querySelector('h3')?.textContent.trim() === 'Upcoming Deadlines');
      if (deadlinesPanel) {
        const rows = data.deadlines.map((d) => `
          <div class="deadline-item"><span>${escapeHtml(d.eventTitle)} — Registration</span><span class="d-date">${formatDate(d.deadline, { month: 'short', day: 'numeric' })}</span></div>`).join('');
        deadlinesPanel.innerHTML = `<h3>Upcoming Deadlines</h3>${rows || '<p style="color:var(--slate);">No deadlines right now.</p>'}`;
      }

      // Recent activity panel
      const activityPanel = Array.from(panels).find((p) => p.querySelector('h3')?.textContent.trim() === 'Recent Activity');
      if (activityPanel) {
        const rows = data.recentActivity.map((a) => `
          <div class="activity-item"><div class="activity-dot"></div><div><div>${escapeHtml(a.text)}</div><div class="t">${formatDate(a.date)}</div></div></div>`).join('');
        activityPanel.innerHTML = `<h3>Recent Activity</h3>${rows || '<p style="color:var(--slate);">No recent activity yet.</p>'}`;
      }

      // Bookmarked events panel
      const bookmarkPanel = Array.from(panels).find((p) => p.querySelector('h3')?.textContent.trim() === 'Bookmarked Events');
      if (bookmarkPanel) {
        const rows = data.bookmarkedEvents.slice(0, 6).map((ev) => `
          <div class="list-row"><div class="list-thumb"><i class="bi ${ev.icon || 'bi-bookmark'}"></i></div><div class="grow"><h4>${escapeHtml(ev.title)}</h4><span>${formatDate(ev.date)}</span></div></div>`).join('');
        bookmarkPanel.innerHTML = `<h3>Bookmarked Events</h3>${rows || '<p style="color:var(--slate);">Nothing bookmarked yet.</p>'}`;
      }
    })
    .catch((err) => showToast('Could not load dashboard', err.message));
}

/* ============================== Page: Profile ================================ */

function initProfilePage() {
  const form = document.querySelector('#profileForm');
  if (!form) return;

  const nameHeading = document.querySelector('.profile-info h1');
  const metaLine = document.querySelector('.profile-info p');
  const emailSpan = document.querySelector('.profile-meta span:nth-child(1)');
  const certSpan = document.querySelector('.profile-meta span:nth-child(3)');
  const picEl = document.querySelector('.profile-pic');
  const skillsPanel = document.querySelector('.panel .skill-chip')?.closest('.panel');

  apiFetch('/users/profile')
    .then(({ user }) => {
      if (nameHeading) nameHeading.textContent = user.fullName;
      if (metaLine) metaLine.innerHTML = `${escapeHtml(user.year || '')} &middot; ${escapeHtml(user.department || '')} &middot; Roll No. ${escapeHtml(user.rollNumber || '—')}`;
      if (emailSpan) emailSpan.innerHTML = `<i class="bi bi-envelope"></i> ${escapeHtml(user.email)}`;
      if (picEl) picEl.textContent = user.avatarInitials || 'U';

      if (skillsPanel && user.skills) {
        skillsPanel.querySelector('div:not(.panel)')?.remove();
        const chipWrap = skillsPanel.querySelector('div');
        if (chipWrap) chipWrap.innerHTML = user.skills.map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`).join('') || '<span style="color:var(--slate);">No skills added yet.</span>';
      }

      form.querySelector('#pfName').value = user.fullName || '';
      form.querySelector('#pfDept').value = user.department || '';
      form.querySelector('#pfBio').value = user.bio || '';

      apiFetch('/certificates').then((certData) => {
        if (certSpan) certSpan.innerHTML = `<i class="bi bi-patch-check"></i> ${certData.count} Certificate${certData.count === 1 ? '' : 's'} Earned`;
      }).catch(() => {});
    })
    .catch((err) => showToast('Could not load profile', err.message));

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const fullName = form.querySelector('#pfName').value.trim();
    const department = form.querySelector('#pfDept').value.trim();
    const bio = form.querySelector('#pfBio').value.trim();

    try {
      const data = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, department, bio }),
      });
      Auth.setUser(data.user);
      showToast('Profile updated', 'Your changes have been saved.');
      if (nameHeading) nameHeading.textContent = data.user.fullName;
    } catch (err) {
      showToast('Update failed', err.message);
    }
  });
}

/* ============================= Page: Certificates ============================= */

function initCertificatesPage() {
  const grid = document.querySelector('.cert-grid');
  if (!grid) return;

  grid.innerHTML = `<p style="padding:24px 0; color:var(--slate);">Loading certificates…</p>`;

  apiFetch('/certificates')
    .then(({ certificates }) => {
      if (!certificates.length) {
        grid.innerHTML = `<p style="padding:24px 0; color:var(--slate);">You haven't earned any certificates yet — complete an event to unlock one!</p>`;
        return;
      }
      grid.innerHTML = certificates.map((c) => `
        <div class="cert-card">
          <div class="cert-preview">
            <div class="seal"><i class="bi bi-award"></i></div>
            <div class="cert-name">${escapeHtml(c.title)}</div>
            <div class="cert-sub">CERT ID &middot; ${escapeHtml(c.certificateId)}</div>
          </div>
          <div class="cert-info">
            <h4>${escapeHtml(c.title)}</h4>
            <span>Issued ${formatDate(c.issuedDate)}</span>
            <div class="cert-actions">
              <a href="${c.certificateUrl || '#'}" target="_blank" class="btn btn-primary btn-sm btn-block"><i class="bi bi-download"></i> Download</a>
              <button class="btn btn-outline btn-sm js-share"><i class="bi bi-share"></i></button>
            </div>
          </div>
        </div>`).join('');

      grid.querySelectorAll('.js-share').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Link copied', 'Certificate link copied to clipboard.');
        });
      });
    })
    .catch((err) => {
      grid.innerHTML = `<p style="padding:24px 0; color:var(--red);">Could not load certificates: ${escapeHtml(err.message)}</p>`;
    });
}

/* ============================== Page: Contact ================================ */

function initContactPage() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = form.querySelector('#cName').value.trim();
    const email = form.querySelector('#cEmail').value.trim();
    const subject = form.querySelector('#cSubject').value.trim();
    const message = form.querySelector('#cMessage').value.trim();

    if (!name || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email) || !subject || !message) {
      showToast('Check your details', 'Please fill in every field with a valid email.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const data = await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });
      showToast('Message sent', data.message);
      form.reset();
    } catch (err) {
      showToast('Message failed', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

/* ========================= Page: Home (featured events) ======================== */

function initHomePage() {
  const grid = document.querySelectorAll('.event-grid')[0];
  // only run on index.html, where the featured grid isn't inside the events-filter page
  if (!grid || document.querySelector('#eventSearch')) return;
  if (!document.querySelector('.hero')) return;

  apiFetch('/events?status=approved')
    .then((data) => {
      const upcoming = data.events
        .filter((e) => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      if (!upcoming.length) return; // keep the static marketing cards if nothing to show
      grid.innerHTML = upcoming.map((ev) => eventCardHtml(ev)).join('');
      wireCardButtons(grid);
    })
    .catch(() => { /* keep static fallback content on failure */ });
}

/* =========================== Notification bell ============================ */

function initNotificationBell() {
  const bell = document.querySelector('.notif-bell');
  if (!bell || !Auth.isLoggedIn()) return;

  bell.addEventListener('click', async function () {
    try {
      const data = await apiFetch('/notifications');
      if (!data.notifications.length) {
        showToast('No notifications', "You're all caught up!");
        return;
      }
      const latest = data.notifications[0];
      showToast(`${data.unreadCount} new notification${data.unreadCount === 1 ? '' : 's'}`, latest.message);
      await apiFetch('/notifications/read-all', { method: 'PUT' });
    } catch (err) {
      showToast('Could not load notifications', err.message);
    }
  });
}

/* ================================== Boot ================================== */

document.addEventListener('DOMContentLoaded', function () {
  guardProtectedPage();
  renderNavAuthState();
  initSignupPage();
  initLoginPage();
  initEventsPage();
  initEventDetailsPage();
  initDashboardPage();
  initProfilePage();
  initCertificatesPage();
  initContactPage();
  initHomePage();
  initNotificationBell();
});
