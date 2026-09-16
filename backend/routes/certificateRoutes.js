const express = require('express');
const router = express.Router();
const { getMyCertificates, getCertificateById } = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyCertificates);
router.get('/:id', protect, getCertificateById);

module.exports = router;
