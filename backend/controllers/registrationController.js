const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @route  POST /api/events/:eventId/register
// @access Private (student)
const registerForEvent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can register for events');
  }

  const event = await Event.findById(req.params.eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (event.status !== 'approved') {
    res.status(400);
    throw new Error('This event is not open for registration');
  }

  if (new Date(event.registrationDeadline) < new Date()) {
    res.status(400);
    throw new Error('Event registration is closed');
  }

  if (event.registeredCount >= event.capacity) {
    res.status(400);
    throw new Error('This event is already full');
  }

  const existing = await Registration.findOne({ student: req.user._id, event: event._id });
  if (existing && existing.status === 'registered') {
    res.status(400);
    throw new Error('You are already registered for this event');
  }

  let registration;
  if (existing) {
    // they had previously cancelled - re-register instead of creating a duplicate doc
    existing.status = 'registered';
    existing.registrationDate = new Date();
    registration = await existing.save();
  } else {
    registration = await Registration.create({ student: req.user._id, event: event._id });
  }

  event.registeredCount += 1;
  await event.save();

  await Notification.create({
    user: req.user._id,
    title: 'Registration successful',
    message: `You're registered for "${event.title}". See you there!`,
    type: 'registration',
    relatedEvent: event._id,
  });

  res.status(201).json({ success: true, message: 'Registration successful', registration });
});

// @route  DELETE /api/events/:eventId/register
// @desc   Student cancels their own registration
// @access Private (student)
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findOne({
    student: req.user._id,
    event: req.params.eventId,
    status: 'registered',
  });

  if (!registration) {
    res.status(404);
    throw new Error('You are not registered for this event');
  }

  registration.status = 'cancelled';
  await registration.save();

  const event = await Event.findById(req.params.eventId);
  if (event && event.registeredCount > 0) {
    event.registeredCount -= 1;
    await event.save();
  }

  res.status(200).json({ success: true, message: 'Registration cancelled' });
});

// @route  GET /api/registrations/my
// @access Private (student)
const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ student: req.user._id, status: 'registered' })
    .populate('event')
    .sort({ registrationDate: -1 });

  res.status(200).json({ success: true, count: registrations.length, registrations });
});

module.exports = { registerForEvent, cancelRegistration, getMyRegistrations };
