const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    certificateUrl: {
      type: String, // path to the generated PDF, e.g. /certificates/STH-FSB-2026-0417.pdf
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
