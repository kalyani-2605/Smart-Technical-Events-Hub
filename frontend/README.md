# Smart Technical Events Hub — Frontend

A centralized platform where engineering students can discover, register for, and manage **technical events only** within their college — hackathons, coding competitions, workshops, seminars, technical fests, paper presentations, internship drives, certification programs, bootcamps and tech club events.

Built with **HTML5, CSS3 and vanilla JavaScript** for the UI, now connected to a real
**Node.js / Express / MongoDB backend** (see `../backend/README.md` for full setup instructions).
Data — events, registrations, bookmarks, certificates, dashboard stats — comes live from the API
in `js/api.js` rather than being hard-coded.

## Getting Started

1. Set up and start the backend first — see `../backend/README.md` (install deps, configure
   `.env`, start MongoDB, run `npm run seed`, then `npm run dev`).
2. Open this folder in VS Code and use the "Live Server" extension (recommended, so `fetch()`
   calls aren't blocked by `file://` restrictions), **or** serve it with any static file server
   (`npx serve .`).
3. Sign up for a new account, or log in with one of the seeded test accounts
   (`student@sth.com` / the password from the backend's `.env`).

If `js/api.js`'s `API_URL` constant doesn't match where your backend is running, update it.

## Project Structure

```
Smart-Technical-Events-Hub/
│
├── index.html            Home page
├── login.html             Login page
├── signup.html            Signup page
├── events.html             Events listing with search & filters
├── event-details.html       Single event detail page
├── dashboard.html           Student dashboard
├── certificates.html        Certificate wallet
├── profile.html              Student profile
├── about.html                 About the platform
├── contact.html                Contact form & info
│
├── css/
│   └── style.css           All styling (design tokens, layout, components, responsive rules)
│
├── js/
│   ├── script.js            UI interactivity (nav, theme, FAQ, countdown, toast)
│   └── api.js               Talks to the backend API (auth, events, dashboard, etc.)
│
├── images/                   (see note below)
│
└── README.md
```

See `../backend/` for the Node.js/Express/MongoDB API this frontend now talks to.

## A note on images

Rather than shipping placeholder stock photography (`hero.png`, `hackathon.jpg`, etc.) that would need to be swapped out anyway, every "poster" in this build is a lightweight CSS/icon composition — a gradient panel with a Bootstrap Icon, styled like an IDE window. This keeps the project self-contained (nothing to broken-link if an image file goes missing) and on-brand with the "console card" visual identity used throughout. The `images/` folder is kept in the structure so you can drop in real event posters, a hero photo, or a profile picture — just reference them from the relevant `<img>` / `background-image` in the HTML/CSS.

## Design system

- **Palette:** deep ink blue (`#0B1B33`), electric blue (`#2E5EFF`), cyan accent (`#4CC9FF`) on white/paper backgrounds — with amber for deadlines and green/red for open/closed status.
- **Type:** Space Grotesk (display/headings), Inter (body), JetBrains Mono (all event metadata — dates, seat counts, countdowns, certificate IDs) loaded from Google Fonts.
- **Signature element:** the "console card" — every event card and the hero mock look like a code editor window (traffic-light dots, monospace status lines), tying the visual language to the engineering-student audience.
- **Icons:** [Bootstrap Icons](https://icons.getbootstrap.com/) via CDN.

## JavaScript features implemented

**UI (`js/script.js`)**
- Mobile navigation menu (hamburger toggle)
- Active navigation link highlighting per page
- Dark mode toggle
- Deep-linking from home page category cards into the Events page (`events.html?category=hackathons`)
- Scroll-to-top button, smooth scrolling for in-page anchors
- FAQ accordion (event details & contact pages)
- Live countdown timer to registration deadline (event details page)
- Toast notification system (`window.showToast`)

**Backend-connected (`js/api.js`)**
- Real signup/login/logout with JWT, stored in `localStorage`
- Live search + category/department/difficulty filtering on the Events page (queries the API)
- Event details, registration and bookmarking against real events in MongoDB
- Student dashboard, profile, and certificate wallet populated from the API
- Contact form submits to the backend and is viewable by admins
- Route guarding: `dashboard.html`, `profile.html`, `certificates.html` redirect to `login.html` if you're not logged in

## Customizing

- Update colors/fonts in `css/style.css` under `:root` — everything else derives from those tokens.
- Add or edit events by duplicating an `.event-card` block in `index.html` / `events.html` and updating its `data-category`, `data-dept`, `data-difficulty` and `data-title` attributes so it works with the filter script.
- All pages share the same navbar and footer markup — update both in each file if you change navigation structure (no templating engine is used, by design, to keep the project dependency-free).

---
Built as a final-year engineering project reference implementation.
