const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication

// All routes except attachments require authentication
router.use((req, res, next) => {
  // Allow public access to GET /attachments/:filename
  if (req.method === 'GET' && req.path.startsWith('/attachments/')) {
    return next();
  }
  return auth(req, res, next);
});

router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.delete('/:id/attachments/:fileName', async (req, res) => {
  try {
    const Task = require('../models/taskModel');
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (req.user.role !== 'admin' && !task.assignedTo.map(u => String(u)).includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const fileName = req.params.fileName;
    const attachmentIndex = (task.attachments || []).findIndex(att => att.fileName === fileName);
    if (attachmentIndex === -1) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    task.attachments.splice(attachmentIndex, 1);
    await task.save();
    res.json({ message: 'Attachment deleted.', attachments: task.attachments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete attachment.' });
  }
});

router.post('/:id/attachments', upload.array('files', 3), async (req, res) => {
  try {
    const Task = require('../models/taskModel');
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

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

const path = require('path');
const fs = require('fs');
router.get('/attachments/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download file.' });
  }
});

module.exports = router;
