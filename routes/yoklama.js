
const express = require('express');
const router = express.Router();
const { startAttendance, getAttendanceRecordsByCourse, getAttendanceRecordDetails } = require('../controllers/yoklamaController');

// @route   POST api/yoklama/baslat
// @desc    Start a new attendance session
// @access  Private (for teachers)
router.post('/baslat', startAttendance);

// @route   GET api/yoklama/kayitlar/:dersId
// @desc    Get attendance records for a course
// @access  Private
router.get('/kayitlar/:dersId', getAttendanceRecordsByCourse);

// @route   GET api/yoklama/:id
// @desc    Get a single attendance record by ID
// @access  Private
router.get('/:id', getAttendanceRecordDetails);

module.exports = router;
