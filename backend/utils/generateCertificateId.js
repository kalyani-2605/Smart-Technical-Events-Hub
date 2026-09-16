// Generates a certificate ID like: STH-FSB-2026-0417
// STH        -> Smart Technical Events Hub
// FSB        -> first letters of the significant words in the event title
// 2026       -> current year
// 0417       -> random 4-digit number

function makeInitials(eventTitle) {
  const stopWords = new Set(['the', 'a', 'an', 'of', 'with', 'and', 'for', 'to', 'in', 'on']);
  const words = eventTitle
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !stopWords.has(w.toLowerCase()));

  let initials = words.map((w) => w[0].toUpperCase()).join('');
  if (initials.length < 2) initials = (eventTitle.replace(/[^a-zA-Z]/g, '').toUpperCase() + 'XX').slice(0, 3);
  return initials.slice(0, 4) || 'STH';
}

function generateCertificateId(eventTitle) {
  const initials = makeInitials(eventTitle || 'Event');
  const year = new Date().getFullYear();
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `STH-${initials}-${year}-${random}`;
}

module.exports = generateCertificateId;
