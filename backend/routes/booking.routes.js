const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getHospitalBookings,
  updateBookingStatus,
} = require('../controllers/booking.controller');
const { protect, adminOnly, patientOnly } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const rateLimiter = require('../middleware/rateLimiter');

// Patient routes
// 5 booking attempts per minute per user
router.post('/', protect, patientOnly, rateLimiter(5, 60), idempotency, createBooking);
router.get('/my', protect, patientOnly, getMyBookings);
router.delete('/:id', protect, patientOnly, cancelBooking);

// Admin routes
router.get('/admin', protect, adminOnly, getHospitalBookings);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);

module.exports = router;
