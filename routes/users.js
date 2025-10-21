
const express = require('express');
const router = express.Router();
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');

// @route   GET api/users
// @desc    Get all users (can be filtered by role)
// @access  Private (for Admins)
router.get('/', getUsers);

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private (for Admins)
router.put('/:id', updateUser);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private (for Admins)
router.delete('/:id', deleteUser);

module.exports = router;
