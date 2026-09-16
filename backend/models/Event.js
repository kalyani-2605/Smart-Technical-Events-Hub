const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'hackathons',
  'coding',
  'workshops',
  'seminars',
  'fests',
  'papers',
  'internships',
  'certifications',
  'bootcamps',
  'clubs',
];

const DEPARTMENTS = ['cse', 'it', 'ece', 'mech', 'eee', 'civil'];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    category: {
      type: String,
      required: true,
      enum: EVENT_CATEGORIES,
    },
    department: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String, // denormalized for quick display (e.g. "CSE Coding Club")
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: {
      type: Date, // optional, for multi-day events
    },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    location: {
      type: String,
      required: [true, 'Event location is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String, // bootstrap-icon class used by the existing frontend cards, e.g. "bi-code-slash"
      default: 'bi-calendar-event',
    },
    agenda: [
      {
        time: String,
        title: String,
        description: String,
      },
    ],
    eligibility: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    prizes: {
      type: [String],
      default: [],
    },
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text' });

eventSchema.statics.CATEGORIES = EVENT_CATEGORIES;
eventSchema.statics.DEPARTMENTS = DEPARTMENTS;

module.exports = mongoose.model('Event', eventSchema);
