const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');


router.use(auth);

router.get('/:id', (req, res, next) => {
  if (req.user.role === 'admin' || req.user.userId === req.params.id) {
    return userController.getUserById(req, res, next);
  }
  return res.status(403).json({ error: 'Access denied.' });
});

router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
});

router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
