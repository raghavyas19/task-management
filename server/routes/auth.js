const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Example: POST /api/auth/login
router.post('/login', authController.login);

// Example: POST /api/auth/register
router.post('/register', authController.register);

module.exports = router;
