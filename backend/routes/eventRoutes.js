const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  getMyEvents,
} = require('../controllers/eventController');
const { registerForEvent, cancelRegistration } = require('../controllers/registrationController');
const { addBookmark, removeBookmark } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/optionalAuthMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public listing / details (visibility rules handled inside controller based on req.user)
router.get('/', optionalAuth, getEvents);
router.get('/mine', protect, authorize('organizer', 'admin'), getMyEvents);
router.get('/:id', optionalAuth, getEventById);

// Organizer / admin manage events
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

// Registration
router.post('/:eventId/register', protect, authorize('student'), registerForEvent);
router.delete('/:eventId/register', protect, authorize('student'), cancelRegistration);
router.get('/:eventId/registrations', protect, authorize('organizer', 'admin'), getEventRegistrations);

// Bookmarks (nested under events, matches spec's route shape)
router.post('/:eventId/bookmark', protect, authorize('student'), addBookmark);
router.delete('/:eventId/bookmark', protect, authorize('student'), removeBookmark);

module.exports = router;
