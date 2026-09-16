const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Like `protect`, but does NOT reject the request if there's no token / bad token.
// Used on public routes (e.g. GET /api/events) whose response changes based on
// whether the requester is logged in and what role they have.
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch (error) {
    // invalid/expired token on a public route - just proceed as a guest
  }

  next();
};

module.exports = { optionalAuth };
