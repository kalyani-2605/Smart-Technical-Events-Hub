const express = require('express');
const router = express.Router();
const { getBookmarks } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('student'), getBookmarks);

module.exports = router;
