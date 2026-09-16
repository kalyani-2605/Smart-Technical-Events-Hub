const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Contact = require('../models/Contact');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const generateCertificateId = require('../utils/generateCertificateId');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('./authController');

// @route  GET /api/admin/events/pending
// @access Private (admin)
const getPendingEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ status: 'pending' }).populate('organizer', 'fullName email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: events.length, events });
});

// @route  PUT /api/admin/events/:id/approve
// @access Private (admin)
const approveEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  event.status = 'approved';
  event.rejectionReason = '';
  await event.save();

  await Notification.create({
    user: event.organizer,
    title: 'Event approved',
    message: `Your event "${event.title}" has been approved and is now live.`,
    type: 'event_approved',
    relatedEvent: event._id,
  });

  res.status(200).json({ success: true, message: 'Event approved', event });
});

// @route  PUT /api/admin/events/:id/reject
// @access Private (admin)
const rejectEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  event.status = 'rejected';
  event.rejectionReason = req.body.reason || 'Did not meet platform guidelines';
  await event.save();

  await Notification.create({
    user: event.organizer,
    title: 'Event rejected',
    message: `Your event "${event.title}" was rejected. Reason: ${event.rejectionReason}`,
    type: 'event_rejected',
    relatedEvent: event._id,
  });

  res.status(200).json({ success: true, message: 'Event rejected', event });
});

// @route  GET /api/admin/events
// @desc   All events, any status, with optional ?status= filter
// @access Private (admin)
const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const events = await Event.find(query).populate('organizer', 'fullName email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: events.length, events });
});

// @route  GET /api/admin/users
// @access Private (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;

  const users = await User.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, users });
});

// @route  PUT /api/admin/users/:id/role
// @desc   Admin changes a user's role (e.g. promote a student to organizer)
// @access Private (admin)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'organizer', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.status(200).json({ success: true, message: 'User role updated', user: sanitizeUser(user) });
});

// @route  DELETE /api/admin/users/:id
// @access Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
});

// @route  GET /api/admin/registrations
// @access Private (admin)
const getAllRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ status: 'registered' })
    .populate('student', 'fullName email rollNumber')
    .populate('event', 'title date category')
    .sort({ registrationDate: -1 });

  res.status(200).json({ success: true, count: registrations.length, registrations });
});

// @route  GET /api/admin/statistics
// @access Private (admin)
const getStatistics = asyncHandler(async (req, res) => {
  const now = new Date();

  const [
    totalStudents,
    totalOrganizers,
    totalEvents,
    pendingEvents,
    approvedEvents,
    totalRegistrations,
    upcomingEvents,
    completedEvents,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'organizer' }),
    Event.countDocuments({}),
    Event.countDocuments({ status: 'pending' }),
    Event.countDocuments({ status: 'approved' }),
    Registration.countDocuments({ status: 'registered' }),
    Event.countDocuments({ status: 'approved', date: { $gte: now } }),
    Event.countDocuments({ status: 'completed' }),
  ]);

  res.status(200).json({
    success: true,
    statistics: {
      totalStudents,
      totalOrganizers,
      totalEvents,
      pendingEvents,
      approvedEvents,
      totalRegistrations,
      upcomingEvents,
      completedEvents,
    },
  });
});

// @route  GET /api/admin/contact
// @access Private (admin)
const getContactMessages = asyncHandler(async (req, res) => {
  const messages = await Contact.find({}).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: messages.length, messages });
});

// @route  PUT /api/admin/contact/:id/read
// @access Private (admin)
const markContactAsRead = asyncHandler(async (req, res) => {
  const message = await Contact.findById(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  message.read = true;
  await message.save();
  res.status(200).json({ success: true, message: 'Marked as read' });
});

// @route  POST /api/admin/certificates
// @desc   Admin manually issues a certificate to a student for an event
// @access Private (admin)
const issueCertificate = asyncHandler(async (req, res) => {
  const { studentId, eventId, title } = req.body;

  if (!studentId || !eventId) {
    res.status(400);
    throw new Error('studentId and eventId are required');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const certificateTitle = title || event.title;
  const certificateId = generateCertificateId(certificateTitle);

  const certificate = await Certificate.create({
    certificateId,
    student: studentId,
    event: eventId,
    title: certificateTitle,
    certificateUrl: `/certificates/${certificateId}.pdf`,
  });

  await Notification.create({
    user: studentId,
    title: 'Certificate issued',
    message: `Your certificate for "${certificateTitle}" is ready to download.`,
    type: 'certificate_issued',
    relatedEvent: eventId,
  });

  res.status(201).json({ success: true, message: 'Certificate issued', certificate });
});

module.exports = {
  getPendingEvents,
  approveEvent,
  rejectEvent,
  getAllEventsAdmin,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllRegistrations,
  getStatistics,
  getContactMessages,
  markContactAsRead,
  issueCertificate,
};
