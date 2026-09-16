const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Every route in this file is admin-only
router.use(protect, authorize('admin'));

router.get('/events/pending', getPendingEvents);
router.put('/events/:id/approve', approveEvent);
router.put('/events/:id/reject', rejectEvent);
router.get('/events', getAllEventsAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/registrations', getAllRegistrations);
router.get('/statistics', getStatistics);

router.get('/contact', getContactMessages);
router.put('/contact/:id/read', markContactAsRead);

router.post('/certificates', issueCertificate);

module.exports = router;
