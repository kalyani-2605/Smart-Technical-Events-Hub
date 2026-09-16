# Smart Technical Events Hub — Backend

A complete Node.js / Express / MongoDB backend for the **Smart Technical Events Hub** frontend
(HTML, CSS, vanilla JavaScript). Built for an engineering college project.

---

## 1. Project Overview

Smart Technical Events Hub lets students discover, filter, register for and track technical
events (hackathons, workshops, seminars, tech fests, internship drives, certification programs,
etc.) run across a college campus.

- **Students** browse/search/filter events, register, bookmark, view a personal dashboard,
  manage their profile, and collect certificates.
- **Organizers** create events (which start out `pending`), edit/delete their own events, and
  view who has registered.
- **Admins** approve or reject organizer-submitted events, manage users, view platform-wide
  statistics, and view contact messages.

This backend is a REST API that the existing static frontend talks to via `fetch()` calls
defined in `js/api.js`.

---

## 2. Technologies Used

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Runtime        | Node.js                              |
| Web framework  | Express.js                           |
| Database       | MongoDB (via Mongoose ODM)           |
| Auth           | JSON Web Tokens (jsonwebtoken)       |
| Password hash  | bcryptjs                             |
| Cross-origin   | cors                                 |
| Config         | dotenv                               |
| Optional       | multer (file uploads), nodemailer (email) — installed but not wired up by default; see §12 |

---

## 3. Backend Folder Structure

```text
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/                # All request-handling logic
│   ├── authController.js
│   ├── eventController.js
│   ├── registrationController.js
│   ├── bookmarkController.js
│   ├── userController.js
│   ├── dashboardController.js
│   ├── certificateController.js
│   ├── notificationController.js
│   ├── contactController.js
│   └── adminController.js
├── middleware/
│   ├── authMiddleware.js       # protect() - requires a valid JWT
│   ├── optionalAuthMiddleware.js # optionalAuth() - attaches req.user if present, else continues as guest
│   ├── roleMiddleware.js       # authorize('admin', ...) - role-based access
│   └── errorMiddleware.js      # 404 + centralized error handler
├── models/
│   ├── User.js
│   ├── Event.js
│   ├── Registration.js
│   ├── Bookmark.js
│   ├── Certificate.js
│   ├── Notification.js
│   └── Contact.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── registrationRoutes.js
│   ├── bookmarkRoutes.js
│   ├── userRoutes.js
│   ├── dashboardRoutes.js
│   ├── certificateRoutes.js
│   ├── notificationRoutes.js
│   ├── contactRoutes.js
│   └── adminRoutes.js
├── utils/
│   ├── generateToken.js
│   ├── generateCertificateId.js
│   └── asyncHandler.js         # wraps async controllers so errors reach errorMiddleware
├── seed.js                     # populates sample data
├── server.js                   # app entry point
├── package.json
├── .env                        # your local config (not committed in real projects)
└── .env.example
```

---

## 4. MongoDB Setup

You need a running MongoDB instance. Pick ONE of these:

### Option A — Local MongoDB (Community Server)
1. Install MongoDB Community Server for your OS: https://www.mongodb.com/try/download/community
2. Start it (it usually runs as a service, or run `mongod` manually).
3. Your connection string will be: `mongodb://127.0.0.1:27017/smart_tech_events_hub`

### Option B — MongoDB Atlas (free cloud cluster)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and allow your IP address (or `0.0.0.0/0` for local dev).
3. Copy the connection string it gives you, e.g.:
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/smart_tech_events_hub`

Either way, you'll paste this string into `.env` as `MONGO_URI` (next step).

---

## 5. `.env` Configuration

Inside `backend/`, copy the example file and edit it:

```bash
cd backend
cp .env.example .env
```

Then edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_tech_events_hub
JWT_SECRET=some_long_random_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://127.0.0.1:5500
SEED_PASSWORD=Passw0rd!
```

- `MONGO_URI` — your MongoDB connection string from step 4.
- `JWT_SECRET` — any long random string; used to sign login tokens. Change it for real deployments.
- `CLIENT_URL` — the URL your frontend is served from (used for CORS). If you open the HTML files
  with VS Code's "Live Server" extension, this is usually `http://127.0.0.1:5500`.
- `SEED_PASSWORD` — the password given to every account created by `seed.js`.

A working `.env` is already included in this project for convenience, but **change `JWT_SECRET`
and every seeded password before deploying this anywhere real.**

---

## 6. Installation

```bash
cd backend
npm install
```

This installs Express, Mongoose, JWT, bcryptjs, cors, dotenv, multer and nodemailer.

---

## 7. Running the Backend

Make sure MongoDB is running first, then:

```bash
# Development (auto-restarts on file changes)
npm run dev

# OR plain start
npm start
```

You should see:

```
MongoDB connected: <your host>
Server running on http://localhost:5000
```

Visit `http://localhost:5000/api/health` in a browser — you should get:
```json
{ "success": true, "message": "Smart Technical Events Hub API is running" }
```

### Seed sample data (recommended before first use)

In a **new terminal** (keep the server running or not, either works):

```bash
cd backend
npm run seed
```

This wipes and repopulates the database with sample users, events, registrations, bookmarks,
certificates and notifications (see §10 for the login details it creates).

---

## 8. Running the Frontend

The frontend is plain HTML/CSS/JS — no build step required. Two easy options:

**Option A — VS Code Live Server extension**
1. Open the `frontend` folder in VS Code.
2. Install the "Live Server" extension if you don't have it.
3. Right-click `index.html` → "Open with Live Server".
4. It will open at something like `http://127.0.0.1:5500` — make sure this matches `CLIENT_URL`
   in your backend `.env`.

**Option B — any static file server**
```bash
cd frontend
npx serve .
# or: python -m http.server 5500
```

Whatever port you use, update `CLIENT_URL` in `backend/.env` to match it, and restart the backend.

> **Important:** `js/api.js` calls the backend at `http://localhost:5000/api` (see the
> `API_URL` constant at the top of `frontend/js/api.js`). If you run the backend on a different
> port, update that constant too.

---

## 9. API Endpoints

All routes are prefixed with `/api`.

### Auth (`/api/auth`)
| Method | Route            | Access  | Description               |
|--------|-------------------|---------|----------------------------|
| POST   | `/register`       | Public  | Create a student account   |
| POST   | `/login`          | Public  | Login, returns JWT + user  |
| GET    | `/me`             | Private | Current logged-in user     |

### Events (`/api/events`)
| Method | Route                          | Access                | Description |
|--------|--------------------------------|------------------------|-------------|
| GET    | `/`                            | Public (role-aware)    | List + search/filter events (`?search=&category=&department=&difficulty=&status=`) |
| GET    | `/mine`                        | Organizer/Admin        | The logged-in organizer's own events |
| GET    | `/:id`                         | Public (role-aware)    | Single event details |
| POST   | `/`                            | Organizer/Admin        | Create event (organizer events start `pending`) |
| PUT    | `/:id`                         | Owning organizer/Admin | Edit event |
| DELETE | `/:id`                         | Owning organizer/Admin | Delete event |
| POST   | `/:eventId/register`           | Student                | Register for an event |
| DELETE | `/:eventId/register`           | Student                | Cancel registration |
| GET    | `/:eventId/registrations`      | Owning organizer/Admin | View participants |
| POST   | `/:eventId/bookmark`           | Student                | Bookmark an event |
| DELETE | `/:eventId/bookmark`           | Student                | Remove bookmark |

### Registrations (`/api/registrations`)
| Method | Route  | Access  | Description |
|--------|--------|---------|-------------|
| GET    | `/my`  | Student | The logged-in student's registrations |

### Bookmarks (`/api/bookmarks`)
| Method | Route | Access  | Description |
|--------|-------|---------|-------------|
| GET    | `/`   | Student | The logged-in student's bookmarked events |

### Users (`/api/users`)
| Method | Route       | Access  | Description |
|--------|-------------|---------|-------------|
| GET    | `/profile`  | Private | Current user's profile |
| PUT    | `/profile`  | Private | Update name/department/year/bio/skills (role cannot be changed here) |

### Dashboard (`/api/dashboard`)
| Method | Route | Access  | Description |
|--------|-------|---------|-------------|
| GET    | `/`   | Student | Registered/upcoming/bookmarked events, deadlines, recent activity, certificates, stats — all computed live from MongoDB |

### Certificates (`/api/certificates`)
| Method | Route  | Access  | Description |
|--------|--------|---------|-------------|
| GET    | `/`    | Private | The logged-in student's certificates |
| GET    | `/:id` | Private | A single certificate (owner or admin only) |

### Notifications (`/api/notifications`)
| Method | Route          | Access  | Description |
|--------|----------------|---------|-------------|
| GET    | `/`            | Private | List notifications |
| PUT    | `/:id/read`    | Private | Mark one as read |
| PUT    | `/read-all`    | Private | Mark all as read |

### Contact (`/api/contact`)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST   | `/`   | Public | Submit the contact form |

### Admin (`/api/admin`) — every route below requires an admin account
| Method | Route                    | Description |
|--------|--------------------------|-------------|
| GET    | `/events/pending`        | Events awaiting approval |
| PUT    | `/events/:id/approve`    | Approve an event |
| PUT    | `/events/:id/reject`     | Reject an event (`{ "reason": "..." }`) |
| GET    | `/events`                | All events, any status (`?status=` optional) |
| GET    | `/users`                 | All users (`?role=` optional) |
| PUT    | `/users/:id/role`        | Change a user's role |
| DELETE | `/users/:id`             | Delete a user |
| GET    | `/registrations`         | All registrations platform-wide |
| GET    | `/statistics`            | Dashboard-style counts |
| GET    | `/contact`               | All contact messages |
| PUT    | `/contact/:id/read`      | Mark a contact message as read |
| POST   | `/certificates`          | Manually issue a certificate (`{ studentId, eventId, title }`) |

Authenticated requests must include:
```
Authorization: Bearer <token>
```

---

## 10. Test Accounts

Created by `npm run seed`. The password for **every** seeded account is the value of
`SEED_PASSWORD` in your `.env` (default: `Passw0rd!`).

| Role      | Email                  | Where to log in |
|-----------|--------------------------|------------------|
| Admin     | admin@sth.com            | `frontend/admin-login.html` |
| Organizer | organizer@sth.com        | `frontend/login.html` (student/organizer login) |
| Organizer | organizer2@sth.com       | `frontend/login.html` |
| Student   | student@sth.com          | `frontend/login.html` |
| Student   | rahul.verma@sth.com      | `frontend/login.html` |

**Change these before deploying anywhere real.** They exist purely to make the seeded data (and
this README) demonstrable end-to-end.

---

## 11. How the Frontend Connects to the Backend

- `frontend/js/script.js` is unchanged in spirit — it still owns navigation, dark mode, the FAQ
  accordion, the countdown ticker, and the toast helper (`window.showToast`). A few pieces that
  used to be **fake/demo** behavior (login, signup, contact, profile forms; register/bookmark
  buttons; the notification bell) were removed from `script.js` because `js/api.js` now provides
  the real, backend-connected versions of the exact same features.
- `frontend/js/api.js` is a new file, loaded right after `script.js` on every page. It:
  - Stores the JWT + user object in `localStorage` after login/signup.
  - Sends `Authorization: Bearer <token>` on every authenticated request.
  - Redirects to `login.html` if you open `dashboard.html`, `profile.html` or `certificates.html`
    while logged out.
  - Renders the exact same `.event-card` HTML structure the original static design used, so all
    the existing CSS in `css/style.css` keeps working with zero style changes.
  - Populates `events.html` (search/filter), `event-details.html` (single event), `dashboard.html`,
    `profile.html`, `certificates.html`, `contact.html`, and the featured events on `index.html`.

**Important scope note:** admin accounts now sign in through a dedicated `admin-login.html`
page (separate from the student/organizer `login.html`) and land on `admin.html`, which lets
the admin publish new events directly (auto-approved on creation). The student/organizer login
form rejects admin credentials and points them to the admin login page instead — so there's a
clean split between the two entry points. The backend's fuller admin toolkit (approve/reject
organizer-submitted events, view all events by status, platform statistics, user management,
contact messages) still exists as working API endpoints — see §9 — even though the current
admin UI only exposes event creation. Organizer actions (create/edit/delete their own events,
view registrations) are also fully implemented on the backend; there's no organizer UI page yet.
You can exercise both with a REST client (Postman/Insomnia/curl) using the seeded
`organizer@sth.com` / `admin@sth.com` accounts.

---

## 12. Common Errors and Solutions

| Symptom | Likely cause | Fix |
|---|---|---|
| `MongoDB connection error: connect ECONNREFUSED` | MongoDB isn't running, or `MONGO_URI` is wrong | Start MongoDB locally, or double-check your Atlas connection string |
| Browser console: `Could not reach the server. Is the backend running on port 5000?` | Backend isn't running, or `API_URL` in `js/api.js` doesn't match your backend's port | Run `npm run dev` in `backend/`; make sure the port matches |
| CORS error in the browser console | `CLIENT_URL` in `.env` doesn't match the URL your frontend is actually served from | Update `CLIENT_URL` and restart the backend |
| `"message": "Not authorized, no token provided"` on a page that should be public | You're calling a route that requires login without being logged in | Log in first, or check that the route is meant to be public |
| `"message": "already registered for this event"` | Duplicate registration attempt (this is expected, working validation) | N/A — this is correct behavior |
| Seed script errors with a duplicate key | You ran `npm run seed` twice without it fully finishing, or the DB has leftover data from a manual test | Re-run `npm run seed` — it clears collections first, so a clean re-run usually fixes it |
| `bcryptjs`/`jsonwebtoken` not found | Dependencies not installed | Run `npm install` inside `backend/` |
| Logging in works but pages show no data | The JWT expired (`JWT_EXPIRES_IN`), or `localStorage` was cleared | Log out and log back in |

---

## 13. Security Notes

- Passwords are hashed with bcrypt before being stored — never stored in plain text.
- The `password` field is `select: false` in the Mongoose schema, so it's never returned in API
  responses unless a query explicitly asks for it (only done internally, for login).
- All mutating routes (create/update/delete event, admin actions, registration, etc.) are
  protected by `protect` + `authorize(...)` middleware.
- Students cannot change their own `role` via `PUT /api/users/profile` — that field is rejected
  server-side even if sent.
- `.env` holds secrets (`JWT_SECRET`, DB credentials) and should never be committed to a public
  repository in a real project.

---

Built as an engineering college project — feel free to extend it (email notifications via
nodemailer, real certificate PDF generation, event poster uploads via multer, organizer/admin
UI pages, etc.). The dependencies for the first two are already in `package.json`, just not
wired up yet.
