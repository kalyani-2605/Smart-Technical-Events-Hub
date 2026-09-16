/**
 * Smart Technical Events Hub — Frontend Server
 * ---------------------------------------------
 * A tiny Express static file server for the frontend, so the site can be
 * run with `npm start` instead of opening index.html directly or using
 * VS Code Live Server.
 *
 * This server ONLY serves static files (HTML, CSS, JS, images). It does
 * NOT talk to the database and does NOT define any /api routes — all of
 * that is handled by the separate backend server (see ../backend/server.js),
 * which the frontend calls via fetch() using the API_URL defined in
 * js/api.js.
 */

const path = require('path');
const express = require('express');

const app = express();

// ---- Serve every static file in this folder (html, css, js, images) ----
// index: 'index.html' makes "/" resolve to index.html automatically, and
// extensions: ['html'] lets a bare path like "/about" also resolve to
// "about.html" if it's ever linked that way (existing links already use
// the .html extension, so this is just a safety net and changes nothing).
app.use(
  express.static(__dirname, {
    index: 'index.html',
    extensions: ['html'],
  })
);

// ---- Explicit root route (in addition to the static index above) ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---- 404 fallback for anything not found under the frontend folder ----
// (Kept as a plain 404 rather than redirecting to index.html, so missing
// files/typos surface clearly instead of silently loading the homepage.)
app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
  console.log('Make sure the backend API server is also running (see backend/server.js).');
});
