const express = require('express');
const router = express.Router();
const { getMyRegistrations } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/my', protect, authorize('student'), getMyRegistrations);

module.exports = router;
