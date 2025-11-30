
const express = require('express');
const router = express.Router();
const { startAttendance, getAttendanceRecordsByCourse, getAttendanceRecordDetails, deleteAttendanceRecord, removeStudentFromAttendance, addStudentToAttendance, downloadYoklamaPDF } = require('../controllers/yoklamaController');

// @route   POST api/yoklama/baslat
// @desc    Start a new attendance session
// @access  Private (for teachers)
router.post('/baslat', startAttendance);

// @route   GET api/yoklama/kayitlar/:dersId
// @desc    Get attendance records for a course
// @access  Private
router.get('/kayitlar/:dersId', getAttendanceRecordsByCourse);

// @route   GET api/yoklama/:id/pdf
// @desc    Download a single attendance record as a PDF
// @access  Private
router.get('/:id/pdf', downloadYoklamaPDF);

// @route   GET api/yoklama/:id
// @desc    Get a single attendance record by ID
// @access  Private
router.get('/:id', getAttendanceRecordDetails);

// @route   DELETE api/yoklama/:id
// @desc    Delete an attendance record
// @access  Private
router.delete('/:id', deleteAttendanceRecord);

// @route   POST api/yoklama/:yoklamaId/ogrenciler
// @desc    Add a student to an attendance record
// @access  Private
router.post('/:yoklamaId/ogrenciler', addStudentToAttendance);

// @route   DELETE api/yoklama/:yoklamaId/ogrenciler/:ogrenciId
// @desc    Remove a student from an attendance record
// @access  Private
router.delete('/:yoklamaId/ogrenciler/:ogrenciId', removeStudentFromAttendance);

module.exports = router;
