const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

// A student can only bookmark an event once
bookmarkSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
