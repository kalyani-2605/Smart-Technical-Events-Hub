/* =========================================================================
   SMART TECHNICAL EVENTS HUB — ADMIN.JS
   Powers two pages:
   - admin-login.html : a login form reserved for admin accounts only
   - admin.html        : lets a logged-in admin publish new events

   Relies on Auth, apiFetch, escapeHtml, formatDate, CATEGORY_LABELS
   (all defined in js/api.js, loaded before this file).
   ========================================================================= */

/* =========================== Admin login page =========================== */

function initAdminLoginPage() {
  const form = document.querySelector('#adminLoginForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = form.querySelector('#adminLoginEmail').value.trim();
    const password = form.querySelector('#adminLoginPassword').value;

    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email) || password.length < 6) {
      showToast('Check your details', 'Enter a valid email and a password of at least 6 characters.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.user.role !== 'admin') {
        // Valid credentials, but not an admin account - this page is admin-only.
        showToast('Not an admin account', 'That login worked, but it is not an admin account. Use the Student / Organizer login instead.');
        return;
      }

      Auth.setToken(data.token);
      Auth.setUser(data.user);
      showToast('Welcome, admin', 'Redirecting to the Admin Dashboard...');
      setTimeout(() => { window.location.href = 'admin.html'; }, 800);
    } catch (err) {
      showToast('Login failed', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login to Admin Dashboard';
    }
  });
}

/* ============================ Admin dashboard page ============================ */

function guardAdminPage() {
  if (!document.querySelector('#createEventForm') || !document.querySelector('#adminAvatar')) return false; // not admin.html
  if (!Auth.isLoggedIn()) {
    window.location.href = 'admin-login.html';
    return false;
  }
  const user = Auth.getUser();
  if (!user || user.role !== 'admin') {
    showToast('Admins only', 'You need an admin account to view this page.');
    setTimeout(() => { window.location.href = 'admin-login.html'; }, 1200);
    return false;
  }
  return true;
}

const publishedThisSession = [];

function renderPublishedList() {
  const list = document.querySelector('#myPublishedList');
  if (!list) return;
  if (!publishedThisSession.length) {
    list.innerHTML = `<p style="color:var(--slate);">Events you publish will appear here.</p>`;
    return;
  }
  list.innerHTML = publishedThisSession.map((ev) => `
    <div class="list-row">
      <div class="list-thumb"><i class="bi ${ev.icon || 'bi-calendar-event'}"></i></div>
      <div class="grow">
        <h4>${escapeHtml(ev.title)}</h4>
        <span>${CATEGORY_LABELS[ev.category] || ev.category} &middot; ${formatDate(ev.date)} &middot; ${escapeHtml(ev.location)}</span>
      </div>
      <a href="event-details.html?id=${ev._id}" class="btn btn-outline btn-sm">View</a>
    </div>`).join('');
}

function initCreateEventForm() {
  const form = document.querySelector('#createEventForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = form.querySelector('#evTitle').value.trim();
    const description = form.querySelector('#evDescription').value.trim();
    const category = form.querySelector('#evCategory').value;
    const department = form.querySelector('#evDepartment').value;
    const difficulty = form.querySelector('#evDifficulty').value;
    const capacity = Number(form.querySelector('#evCapacity').value);
    const date = form.querySelector('#evDate').value;
    const registrationDeadline = form.querySelector('#evDeadline').value;
    const startTime = form.querySelector('#evStartTime').value;
    const endTime = form.querySelector('#evEndTime').value;
    const location = form.querySelector('#evLocation').value.trim();
    const organizerName = form.querySelector('#evOrganizerName').value.trim();

    if (!title || !description || !category || !department || !capacity || !date || !registrationDeadline || !location) {
      showToast('Check your details', 'Please fill in every required field.');
      return;
    }
    if (new Date(registrationDeadline) > new Date(date)) {
      showToast('Check the dates', 'Registration deadline must be on or before the event date.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    try {
      const { event } = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          title, description, category, department, difficulty, capacity,
          date, registrationDeadline, startTime, endTime, location, organizerName,
        }),
      });
      showToast('Event published', `"${title}" is now live on the Events page.`);
      form.reset();
      publishedThisSession.unshift(event);
      renderPublishedList();
    } catch (err) {
      showToast('Could not publish event', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish Event';
    }
  });
}

/* ================================== Boot =================================== */

document.addEventListener('DOMContentLoaded', function () {
  initAdminLoginPage();

  if (!guardAdminPage()) return;

  const user = Auth.getUser();
  const heading = document.querySelector('#adminHeading');
  const avatar = document.querySelector('#adminAvatar');
  if (user) {
    if (heading) heading.textContent = `Welcome, ${user.fullName?.split(' ')[0] || 'Admin'}`;
    if (avatar) avatar.textContent = user.avatarInitials || 'AD';
  }

  if (avatar && !document.querySelector('.sth-logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn btn-outline btn-sm sth-logout-btn';
    logoutBtn.textContent = 'Logout';
    avatar.insertAdjacentElement('afterend', logoutBtn);
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  initCreateEventForm();
  renderPublishedList();
});
