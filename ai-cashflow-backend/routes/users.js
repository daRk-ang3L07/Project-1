const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// POST /api/users - Create new user (business owner)
router.post('/', UserController.createUser);

// GET /api/users - Get all users
router.get('/', UserController.getUsers);

// GET /api/users/:id - Get single user by ID
router.get('/:id', UserController.getUser);

// PUT /api/users/:id - Update user
router.put('/:id', UserController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', UserController.deleteUser);

module.exports = router;