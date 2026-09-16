const Certificate = require('../models/Certificate');
const asyncHandler = require('../utils/asyncHandler');

// @route  GET /api/certificates
// @desc   Student's own certificates
// @access Private (student)
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .populate('event', 'title date category')
    .sort({ issuedDate: -1 });

  res.status(200).json({ success: true, count: certificates.length, certificates });
});

// @route  GET /api/certificates/:id
// @access Private (owning student, or admin)
const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id).populate('event').populate('student', 'fullName email rollNumber');

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  const isOwner = String(certificate.student._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this certificate');
  }

  res.status(200).json({ success: true, certificate });
});

module.exports = { getMyCertificates, getCertificateById };
