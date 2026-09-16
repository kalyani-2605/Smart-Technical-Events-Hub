const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @route  GET /api/events
// @desc   List events with search + filters. Students/public only ever see approved events.
//         Organizers see their own events (any status) plus all approved events.
//         Admins see everything.
// @access Public (role, if logged in, changes visibility)
const getEvents = asyncHandler(async (req, res) => {
  const { search, category, department, difficulty, status } = req.query;
  const query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }
  if (category && category !== 'all') query.category = category;
  if (department && department !== 'all') query.department = department;
  if (difficulty && difficulty !== 'all') query.difficulty = difficulty;

  // Visibility rules
  if (req.user && req.user.role === 'admin') {
    if (status) query.status = status;
    // else: admin sees all statuses
  } else if (req.user && req.user.role === 'organizer') {
    if (status) {
      query.status = status;
      query.organizer = req.user._id; // organizers filtering by status only see their own
    } else {
      query.$or = [{ status: 'approved' }, { organizer: req.user._id }];
    }
  } else {
    // students / public
    query.status = 'approved';
  }

  const events = await Event.find(query).populate('organizer', 'fullName email').sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: events.length, events });
});

// @route  GET /api/events/:id
// @access Public
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'fullName email');

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Non-approved events are only visible to their organizer or an admin
  const isOwner = req.user && String(event.organizer._id) === String(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  if (event.status !== 'approved' && !isOwner && !isAdmin) {
    res.status(404);
    throw new Error('Event not found');
  }

  let registrationStatus = 'not_registered';
  let isBookmarked = false;

  if (req.user && req.user.role === 'student') {
    const registration = await Registration.findOne({ student: req.user._id, event: event._id, status: 'registered' });
    if (registration) registrationStatus = 'registered';

    const bookmark = await Bookmark.findOne({ student: req.user._id, event: event._id });
    isBookmarked = !!bookmark;
  }

  res.status(200).json({
    success: true,
    event,
    registrationStatus,
    isBookmarked,
    seatsAvailable: Math.max(0, event.capacity - event.registeredCount),
  });
});

// @route  POST /api/events
// @access Private (organizer, admin)
const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    department,
    difficulty,
    date,
    endDate,
    startTime,
    endTime,
    location,
    registrationDeadline,
    capacity,
    image,
    icon,
    agenda,
    eligibility,
    requirements,
    prizes,
    faqs,
    organizerName,
  } = req.body;

  if (!title || !description || !category || !department || !date || !location || !registrationDeadline || !capacity) {
    res.status(400);
    throw new Error('Missing required event fields');
  }

  if (new Date(registrationDeadline) > new Date(date)) {
    res.status(400);
    throw new Error('Registration deadline must be before the event date');
  }

  // Admin-created events go live immediately; organizer-created events need approval
  const status = req.user.role === 'admin' ? 'approved' : 'pending';

  const event = await Event.create({
    title,
    description,
    category,
    department,
    difficulty,
    date,
    endDate,
    startTime,
    endTime,
    location,
    registrationDeadline,
    capacity,
    image,
    icon,
    agenda,
    eligibility,
    requirements,
    prizes,
    faqs,
    organizer: req.user._id,
    organizerName: organizerName || req.user.fullName,
    status,
  });

  if (status === 'pending') {
    // Notify the organizer their event is awaiting approval
    await Notification.create({
      user: req.user._id,
      title: 'Event submitted for approval',
      message: `Your event "${event.title}" has been submitted and is pending admin approval.`,
      type: 'event_created',
      relatedEvent: event._id,
    });
  }

  res.status(201).json({ success: true, message: 'Event created successfully', event });
});

// @route  PUT /api/events/:id
// @access Private (organizer who owns it, or admin)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const isOwner = String(event.organizer) === String(req.user._id);
  if (req.user.role === 'organizer' && !isOwner) {
    res.status(403);
    throw new Error('You can only edit your own events');
  }
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Students cannot edit events');
  }

  const editableFields = [
    'title', 'description', 'category', 'department', 'difficulty', 'date', 'endDate',
    'startTime', 'endTime', 'location', 'registrationDeadline', 'capacity', 'image',
    'icon', 'agenda', 'eligibility', 'requirements', 'prizes', 'faqs', 'organizerName',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });

  // If an organizer edits their event after rejection/approval, send it back to pending
  if (req.user.role === 'organizer') {
    event.status = 'pending';
    event.rejectionReason = '';
  }

  // Admins may directly change status through this route too
  if (req.user.role === 'admin' && req.body.status) {
    event.status = req.body.status;
  }

  const updated = await event.save();

  res.status(200).json({ success: true, message: 'Event updated successfully', event: updated });
});

// @route  DELETE /api/events/:id
// @access Private (organizer who owns it, or admin)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const isOwner = String(event.organizer) === String(req.user._id);
  if (req.user.role === 'organizer' && !isOwner) {
    res.status(403);
    throw new Error('You can only delete your own events');
  }
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Students cannot delete events');
  }

  await Promise.all([
    Registration.deleteMany({ event: event._id }),
    Bookmark.deleteMany({ event: event._id }),
  ]);
  await event.deleteOne();

  res.status(200).json({ success: true, message: 'Event deleted successfully' });
});

// @route  GET /api/events/:eventId/registrations
// @desc   Organizer/admin viewing the participant list for one event
// @access Private (owning organizer, or admin)
const getEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const isOwner = String(event.organizer) === String(req.user._id);
  if (req.user.role === 'organizer' && !isOwner) {
    res.status(403);
    throw new Error('You can only view registrations for your own events');
  }
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const registrations = await Registration.find({ event: event._id, status: 'registered' })
    .populate('student', 'fullName email rollNumber department year')
    .sort({ registrationDate: -1 });

  res.status(200).json({ success: true, count: registrations.length, registrations });
});

// @route  GET /api/events/mine
// @desc   Organizer's own created events, any status
// @access Private (organizer)
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: events.length, events });
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  getMyEvents,
};
