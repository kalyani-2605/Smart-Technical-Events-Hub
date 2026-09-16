const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// Turns "Ananya Sharma" into "AS" for the little avatar circles the frontend uses
function makeInitials(fullName) {
  if (!fullName) return 'ST';
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  return initials || 'ST';
}

function sanitizeUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.password;
  return user;
}

// @route  POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, rollNumber, department, year, password, confirmPassword } = req.body;

  // ---- Validation ----
  if (!fullName || !email || !rollNumber || !department || !year || !password) {
    res.status(400);
    throw new Error('All fields are required');
  }

  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    res.status(400);
    throw new Error('Please enter a valid college email address');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const emailExists = await User.findOne({ email: email.toLowerCase() });
  if (emailExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const rollExists = await User.findOne({ rollNumber });
  if (rollExists) {
    res.status(400);
    throw new Error('An account with this roll number already exists');
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    rollNumber,
    department,
    year,
    password, // hashed automatically by the User model's pre-save hook
    role: 'student', // signup always creates a student account
    avatarInitials: makeInitials(fullName),
  });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: sanitizeUser(user),
  });
});

// @route  POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // password field has `select: false` on the schema, so we explicitly ask for it here
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: sanitizeUser(user),
  });
});

// @route  GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the `protect` middleware
  res.status(200).json({ success: true, user: sanitizeUser(req.user) });
});

module.exports = { registerUser, loginUser, getMe, sanitizeUser, makeInitials };
