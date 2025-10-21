
const express = require('express');
const router = express.Router();
const { startAttendance } = require('../controllers/yoklamaController');

// @route   POST api/yoklama/baslat
// @desc    Start a new attendance session
// @access  Private (for teachers)
router.post('/baslat', startAttendance);

module.exports = router;
