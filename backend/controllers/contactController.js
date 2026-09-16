const Contact = require('../models/Contact');
const asyncHandler = require('../utils/asyncHandler');

// @route  POST /api/contact
// @access Public
const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('All fields are required');
  }

  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address');
  }

  const contact = await Contact.create({ name, email, subject, message });

  res.status(201).json({
    success: true,
    message: "Thanks for reaching out — our team will reply within 2 working days.",
    contact,
  });
});

module.exports = { submitContactMessage };
