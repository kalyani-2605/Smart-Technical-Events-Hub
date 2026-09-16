const jwt = require('jsonwebtoken');

// Creates a signed JWT containing the user's id and role.
// The frontend stores this token and sends it back as: Authorization: Bearer <token>
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
