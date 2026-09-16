const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser, makeInitials } = require('./authController');

// @route  GET /api/users/profile
// @access Private
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: sanitizeUser(req.user) });
});

// @route  PUT /api/users/profile
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { fullName, department, year, bio, skills } = req.body;

  // Students can never change their own role - role changes only happen via admin routes
  if (req.body.role && req.body.role !== user.role) {
    res.status(403);
    throw new Error('You are not allowed to change your own role');
  }

  if (fullName !== undefined) {
    user.fullName = fullName;
    user.avatarInitials = makeInitials(fullName);
  }
  if (department !== undefined) user.department = department;
  if (year !== undefined) user.year = year;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) {
    user.skills = Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  }

  const updated = await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: sanitizeUser(updated),
  });
});

module.exports = { getProfile, updateProfile };
