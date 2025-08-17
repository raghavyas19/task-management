const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// All routes below require authentication and admin role
router.use(auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
});

// Example: GET /api/users
router.get('/', userController.getAllUsers);

// Example: GET /api/users/:id
router.get('/:id', userController.getUserById);

// Example: PUT /api/users/:id
router.put('/:id', userController.updateUser);

// Example: DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;
