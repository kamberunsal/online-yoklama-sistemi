
const express = require('express');
const router = express.Router();
const { register, login, updatePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   PUT api/auth/update-password
// @desc    Update user password
// @access  Private
router.put('/update-password', authMiddleware, updatePassword);

module.exports = router;
