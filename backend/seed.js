/**
 * Seed script for Smart Technical Events Hub.
 * Wipes the relevant collections and inserts sample admin/organizer/student
 * accounts plus sample events, registrations, bookmarks and certificates.
 *
 * Run with:  npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Bookmark = require('./models/Bookmark');
const Certificate = require('./models/Certificate');
const Notification = require('./models/Notification');
const Contact = require('./models/Contact');
const generateCertificateId = require('./utils/generateCertificateId');

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Passw0rd!';

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    Bookmark.deleteMany({}),
    Certificate.deleteMany({}),
    Notification.deleteMany({}),
    Contact.deleteMany({}),
  ]);

  console.log('Creating users...');

  const admin = await User.create({
    fullName: 'Admin User',
    email: 'admin@sth.com',
    password: SEED_PASSWORD,
    role: 'admin',
    department: 'Administration',
    year: '-',
    avatarInitials: 'AD',
  });

  const organizer = await User.create({
    fullName: 'CSE Coding Club',
    email: 'organizer@sth.com',
    password: SEED_PASSWORD,
    role: 'organizer',
    department: 'Computer Science',
    year: '-',
    avatarInitials: 'CC',
  });

  const organizer2 = await User.create({
    fullName: 'ECE Robotics Club',
    email: 'organizer2@sth.com',
    password: SEED_PASSWORD,
    role: 'organizer',
    department: 'Electronics & Communication',
    year: '-',
    avatarInitials: 'ER',
  });

  const student = await User.create({
    fullName: 'Ananya Sharma',
    email: 'student@sth.com',
    rollNumber: '22CSE1042',
    password: SEED_PASSWORD,
    role: 'student',
    department: 'Computer Science',
    year: '3rd Year',
    bio: 'Aspiring full-stack developer, hackathon regular and CSE Coding Club core member.',
    skills: ['Python', 'React', 'Embedded C', 'Data Structures', 'Public Speaking', 'Figma'],
    avatarInitials: 'AS',
  });

  const student2 = await User.create({
    fullName: 'Rahul Verma',
    email: 'rahul.verma@sth.com',
    rollNumber: '22ECE1078',
    password: SEED_PASSWORD,
    role: 'student',
    department: 'Electronics & Communication',
    year: '2nd Year',
    skills: ['C++', 'Embedded Systems'],
    avatarInitials: 'RV',
  });

  console.log('Creating events...');

  const now = Date.now();
  const days = (n) => new Date(now + n * 86400000);

  const events = await Event.insertMany([
    {
      title: 'CodeStorm Hackathon 2026',
      description:
        "CodeStorm is the CSE department's flagship hackathon, open to all engineering branches. Teams of up to four will have 36 hours to design, build and pitch a working prototype addressing one of three campus-life tracks: Smart Campus, Accessibility, and Sustainability.",
      category: 'hackathons',
      department: 'cse',
      difficulty: 'intermediate',
      organizer: organizer._id,
      organizerName: 'CSE Coding Club',
      date: days(10),
      endDate: days(11),
      startTime: '09:00',
      endTime: '21:00',
      location: 'CSE Seminar Hall',
      registrationDeadline: days(6),
      capacity: 250,
      registeredCount: 184,
      icon: 'bi-code-slash',
      agenda: [
        { time: 'Day 1 — 09:00 AM', title: 'Opening Ceremony & Track Reveal', description: 'Kickoff, rules briefing and problem statement release.' },
        { time: 'Day 1 — 11:00 AM', title: 'Hacking Begins', description: 'Teams start building; mentors available on floor.' },
        { time: 'Day 2 — 09:00 PM', title: 'Submissions Close', description: 'Final code freeze and submission upload.' },
        { time: 'Day 2 — 10:00 PM', title: 'Finale & Award Ceremony', description: 'Top 10 teams present live to judges.' },
      ],
      eligibility: [
        'Open to all currently enrolled undergraduate students.',
        'Teams of 2–4 members; solo entries not permitted.',
        'At least one team member must be from a core engineering branch.',
      ],
      requirements: ['Laptop and required hardware to be arranged by participants.'],
      prizes: ['Cash prizes for top 3 teams', 'Fast-tracked interview slots with sponsor companies'],
      faqs: [
        { question: 'Can first-year students participate?', answer: 'Yes — open to students from all years, as long as team eligibility rules are met.' },
        { question: 'Is there a registration fee?', answer: 'No, participation is completely free.' },
      ],
      status: 'approved',
    },
    {
      title: 'Embedded Systems with ARM Cortex',
      description: 'Hands-on firmware, GPIO and RTOS fundamentals on ARM dev boards.',
      category: 'workshops',
      department: 'ece',
      difficulty: 'intermediate',
      organizer: organizer2._id,
      organizerName: 'ECE Robotics Club',
      date: days(3),
      startTime: '10:00',
      endTime: '16:00',
      location: 'ECE Lab 2',
      registrationDeadline: days(1),
      capacity: 60,
      registeredCount: 58,
      icon: 'bi-cpu',
      eligibility: ['Basic C programming knowledge recommended.'],
      requirements: ['Laptop with Arduino IDE / STM32CubeIDE installed.'],
      status: 'approved',
    },
    {
      title: 'Vertex 2026 Annual Tech Fest',
      description: 'A campus-wide multi-day technical festival with competitions, exhibits and guest talks.',
      category: 'fests',
      department: 'cse',
      difficulty: 'beginner',
      organizer: organizer._id,
      organizerName: 'CSE Coding Club',
      date: days(37),
      endDate: days(39),
      location: 'Main Campus Grounds',
      registrationDeadline: days(30),
      capacity: 1000,
      registeredCount: 420,
      icon: 'bi-stars',
      status: 'approved',
    },
    {
      title: 'Algorithm Arena — Season 5',
      description: 'Competitive programming round covering DP, graphs and greedy strategies.',
      category: 'coding',
      department: 'it',
      difficulty: 'advanced',
      organizer: organizer._id,
      organizerName: 'IT Coders Guild',
      date: days(9),
      location: 'IT Computer Lab 3',
      registrationDeadline: days(7),
      capacity: 120,
      registeredCount: 96,
      icon: 'bi-braces',
      status: 'approved',
    },
    {
      title: 'Future of Power Electronics',
      description: 'Guest talk by an alumnus researcher on wide-bandgap semiconductors.',
      category: 'seminars',
      department: 'eee',
      difficulty: 'beginner',
      organizer: organizer2._id,
      organizerName: 'EEE Department',
      date: days(6),
      location: 'EEE Auditorium',
      registrationDeadline: days(5),
      capacity: 200,
      registeredCount: 140,
      icon: 'bi-mic',
      status: 'approved',
    },
    {
      title: 'National Paper Presentation Meet',
      description: 'Present original research across mechanical design and sustainable energy.',
      category: 'papers',
      department: 'mech',
      difficulty: 'advanced',
      organizer: organizer2._id,
      organizerName: 'Mechanical Department',
      date: days(21),
      location: 'Mechanical Block, Hall A',
      registrationDeadline: days(19),
      capacity: 100,
      registeredCount: 72,
      icon: 'bi-file-earmark-text',
      status: 'approved',
    },
    {
      title: 'Campus Internship Drive',
      description: 'Six product-based companies hiring interns across software and data roles.',
      category: 'internships',
      department: 'cse',
      difficulty: 'intermediate',
      organizer: organizer._id,
      organizerName: 'Placement Cell',
      date: days(28),
      location: 'Placement Cell',
      registrationDeadline: days(25),
      capacity: 400,
      registeredCount: 310,
      icon: 'bi-briefcase',
      status: 'approved',
    },
    {
      title: 'Cloud Practitioner Certification',
      description: '4-week guided program leading up to an industry-recognized cloud certificate.',
      category: 'certifications',
      department: 'it',
      difficulty: 'beginner',
      organizer: organizer._id,
      organizerName: 'IT Department',
      date: days(5),
      location: 'Online + IT Lab 1',
      registrationDeadline: days(3),
      capacity: 300,
      registeredCount: 210,
      icon: 'bi-patch-check',
      status: 'approved',
    },
    {
      title: 'Full-Stack Development Bootcamp',
      description: '5-day intensive covering React, Node.js and deployment pipelines.',
      category: 'bootcamps',
      department: 'cse',
      difficulty: 'intermediate',
      organizer: organizer._id,
      organizerName: 'CSE Coding Club',
      date: days(-15),
      endDate: days(-11),
      location: 'CSE Lab 4',
      registrationDeadline: days(-20),
      capacity: 80,
      registeredCount: 80,
      icon: 'bi-lightning-charge',
      status: 'completed',
    },
    {
      title: 'BuildCraft — Tech Club Meetup',
      description: 'Monthly meetup for the Civil Structures Club — 3D-printed model showcase.',
      category: 'clubs',
      department: 'civil',
      difficulty: 'beginner',
      organizer: organizer2._id,
      organizerName: 'Civil Structures Club',
      date: days(2),
      location: 'Civil Block Courtyard',
      registrationDeadline: days(1),
      capacity: 60,
      registeredCount: 40,
      icon: 'bi-people-fill',
      status: 'approved',
    },
    {
      title: 'AI in Healthcare — Guest Lecture',
      description: 'A newly submitted event, awaiting admin approval, to demonstrate the approval workflow.',
      category: 'seminars',
      department: 'cse',
      difficulty: 'beginner',
      organizer: organizer._id,
      organizerName: 'CSE Coding Club',
      date: days(15),
      location: 'CSE Seminar Hall',
      registrationDeadline: days(13),
      capacity: 150,
      registeredCount: 0,
      icon: 'bi-heart-pulse',
      status: 'pending',
    },
  ]);

  const [
    codeStorm, arm, vertex, algoArena, powerSeminar, paperMeet, internshipDrive,
    cloudCert, bootcamp, buildCraft,
  ] = events;

  console.log('Creating registrations...');
  await Registration.insertMany([
    { student: student._id, event: codeStorm._id, status: 'registered' },
    { student: student._id, event: arm._id, status: 'registered' },
    { student: student._id, event: internshipDrive._id, status: 'registered' },
    { student: student._id, event: bootcamp._id, status: 'attended', attendance: true },
    { student: student2._id, event: arm._id, status: 'registered' },
    { student: student2._id, event: buildCraft._id, status: 'registered' },
  ]);

  console.log('Creating bookmarks...');
  await Bookmark.insertMany([
    { student: student._id, event: vertex._id },
    { student: student._id, event: algoArena._id },
    { student: student2._id, event: codeStorm._id },
  ]);

  console.log('Creating certificates...');
  await Certificate.insertMany([
    {
      certificateId: generateCertificateId('Full-Stack Development Bootcamp'),
      student: student._id,
      event: bootcamp._id,
      title: 'Full-Stack Development Bootcamp',
      issuedDate: days(-9),
      certificateUrl: '/certificates/sample.pdf',
    },
    {
      certificateId: generateCertificateId('Embedded Systems Workshop'),
      student: student._id,
      event: arm._id,
      title: 'Embedded Systems with ARM Cortex',
      issuedDate: days(-40),
      certificateUrl: '/certificates/sample.pdf',
    },
  ]);

  console.log('Creating notifications...');
  await Notification.insertMany([
    {
      user: student._id,
      title: 'Registration successful',
      message: `You're registered for "${codeStorm.title}". See you there!`,
      type: 'registration',
      relatedEvent: codeStorm._id,
      read: false,
    },
    {
      user: student._id,
      title: 'Certificate issued',
      message: 'Your certificate for "Full-Stack Development Bootcamp" is ready to download.',
      type: 'certificate_issued',
      relatedEvent: bootcamp._id,
      read: true,
    },
    {
      user: organizer._id,
      title: 'Event submitted for approval',
      message: 'Your event "AI in Healthcare — Guest Lecture" has been submitted and is pending admin approval.',
      type: 'event_created',
      read: false,
    },
  ]);

  console.log('Creating a sample contact message...');
  await Contact.create({
    name: 'Priya Nair',
    email: 'priya.nair@college.edu',
    subject: 'Requesting organizer access for Robotics Club',
    message: 'Hi team, we would like to list our upcoming robotics workshop on the platform. Could you set us up with organizer access?',
  });

  console.log('\nSeed complete!\n');
  console.log('Sample accounts (password for all: ' + SEED_PASSWORD + '):');
  console.log('  Admin:      admin@sth.com');
  console.log('  Organizer:  organizer@sth.com');
  console.log('  Organizer:  organizer2@sth.com');
  console.log('  Student:    student@sth.com');
  console.log('  Student:    rahul.verma@sth.com');
  console.log('\nChange these passwords before any real deployment.\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
