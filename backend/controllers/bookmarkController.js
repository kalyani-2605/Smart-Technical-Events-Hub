const Event = require('../models/Event');
const Bookmark = require('../models/Bookmark');
const asyncHandler = require('../utils/asyncHandler');

// @route  POST /api/events/:eventId/bookmark
// @access Private (student)
const addBookmark = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const existing = await Bookmark.findOne({ student: req.user._id, event: event._id });
  if (existing) {
    return res.status(200).json({ success: true, message: 'Event already bookmarked' });
  }

  await Bookmark.create({ student: req.user._id, event: event._id });

  res.status(201).json({ success: true, message: 'Event bookmarked successfully' });
});

// @route  DELETE /api/events/:eventId/bookmark
// @access Private (student)
const removeBookmark = asyncHandler(async (req, res) => {
  const result = await Bookmark.findOneAndDelete({ student: req.user._id, event: req.params.eventId });

  if (!result) {
    res.status(404);
    throw new Error('Bookmark not found');
  }

  res.status(200).json({ success: true, message: 'Event removed from bookmarks' });
});

// @route  GET /api/bookmarks
// @access Private (student)
const getBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ student: req.user._id }).populate('event').sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: bookmarks.length, bookmarks });
});

module.exports = { addBookmark, removeBookmark, getBookmarks };
