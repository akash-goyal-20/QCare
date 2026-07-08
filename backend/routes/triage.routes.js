const express = require('express');
const router = express.Router();
const { analyze, getHistory } = require('../controllers/triage.controller');
const { protect, patientOnly } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limited — 10 triage requests per minute per user (Gemini API costs money)
router.post('/', protect, patientOnly, rateLimiter(10, 60), analyze);
router.get('/history', protect, patientOnly, getHistory);

module.exports = router;
