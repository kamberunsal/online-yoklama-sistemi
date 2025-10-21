
const express = require('express');
const router = express.Router();
const { createDers, getDerslerByUserId, deleteDers, addStudentToDers, removeStudentFromDers, getAllDersler, getDersById, updateDers } = require('../controllers/dersController');
// const auth = require('../middleware/auth'); // Assuming you have an auth middleware

// @route   POST api/dersler
// @desc    Create a course
// @access  Private
// In a real app, you would protect this route with auth middleware
// router.post('/', auth, createDers);
router.post('/', createDers);

// @route   GET api/dersler/all
// @desc    Get all courses for admin
// @access  Private
router.get('/all', getAllDersler);

// @route   GET api/dersler/detay/:id
// @desc    Get single course details for admin
// @access  Private
router.get('/detay/:id', getDersById);

// @route   PUT api/dersler/:id
// @desc    Update a course
// @access  Private
router.put('/:id', updateDers);

// @route   DELETE api/dersler/:id
// @desc    Delete a course
// @access  Private
router.delete('/:id', deleteDers);

// @route   GET api/dersler/:userId
// @desc    Get all courses for a user
// @access  Private
// router.get('/:userId', auth, getDerslerByUserId);
router.get('/:userId', getDerslerByUserId);

// @route   POST api/dersler/:dersId/ogrenciler
// @desc    Add student to a course
// @access  Private
router.post('/:dersId/ogrenciler', addStudentToDers);

// @route   DELETE api/dersler/:dersId/ogrenciler/:ogrenciId
// @desc    Remove student from a course
// @access  Private
router.delete('/:dersId/ogrenciler/:ogrenciId', removeStudentFromDers);



module.exports = router;
