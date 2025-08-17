const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(auth);

router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Upload attachments to a task
router.post('/:id/attachments', upload.array('files', 3), async (req, res) => {
  try {
    const Task = require('../models/taskModel');
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Only assigned user or admin can upload
    if (req.user.role !== 'admin' && String(task.assignedTo) !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const files = req.files.map(file => ({
      fileName: file.filename,
      fileSize: file.size,
      uploadedAt: new Date()
    }));

    task.attachments = [...(task.attachments || []), ...files];
    await task.save();

    res.json({ message: 'Files uploaded.', attachments: task.attachments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload files.' });
  }
});

module.exports = router;
