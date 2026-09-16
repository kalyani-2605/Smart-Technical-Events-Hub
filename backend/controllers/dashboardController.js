const Registration = require('../models/Registration');
const Bookmark = require('../models/Bookmark');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');

// @route  GET /api/dashboard
// @desc   Everything the student dashboard page needs, calculated live from MongoDB
// @access Private (student)
const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const now = new Date();

  const registrations = await Registration.find({ student: studentId, status: 'registered' })
    .populate('event')
    .sort({ registrationDate: -1 });

  const bookmarks = await Bookmark.find({ student: studentId }).populate('event').sort({ createdAt: -1 });

  const certificates = await Certificate.find({ student: studentId }).populate('event').sort({ issuedDate: -1 });

  const registeredEvents = registrations.map((r) => r.event).filter(Boolean);

  const upcomingEvents = registeredEvents.filter((e) => e && new Date(e.date) >= now);

  const eventsCompleted = registeredEvents.filter((e) => e && e.status === 'completed').length;

  const deadlines = registeredEvents
    .filter((e) => e && new Date(e.registrationDeadline) >= now)
    .map((e) => ({
      eventId: e._id,
      eventTitle: e.title,
      deadline: e.registrationDeadline,
    }))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  // Build a simple "recent activity" feed out of registrations, bookmarks and certificates
  const activity = [];
  registrations.forEach((r) => {
    if (r.event) {
      activity.push({
        type: 'registration',
        text: `Registered for ${r.event.title}`,
        date: r.registrationDate,
      });
    }
  });
  bookmarks.forEach((b) => {
    if (b.event) {
      activity.push({
        type: 'bookmark',
        text: `Bookmarked ${b.event.title}`,
        date: b.createdAt,
      });
    }
  });
  certificates.forEach((c) => {
    activity.push({
      type: 'certificate',
      text: `Certificate issued for ${c.title}`,
      date: c.issuedDate,
    });
  });
  activity.sort((a, b) => new Date(b.date) - new Date(a.date));

  const unreadNotifications = await Notification.countDocuments({ user: studentId, read: false });

  res.status(200).json({
    success: true,
    registeredEvents,
    upcomingEvents,
    bookmarkedEvents: bookmarks.map((b) => b.event).filter(Boolean),
    deadlines,
    recentActivity: activity.slice(0, 10),
    certificates,
    statistics: {
      eventsRegistered: registeredEvents.length,
      eventsCompleted,
      certificatesEarned: certificates.length,
      bookmarks: bookmarks.length,
      unreadNotifications,
    },
  });
});

module.exports = { getDashboard };
