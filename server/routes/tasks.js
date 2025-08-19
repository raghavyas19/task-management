const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const path = require('path');
const fs = require('fs');

router.use((req, res, next) => {
  // Allow unauthenticated GET and OPTIONS requests to /attachments/ for CORS and file access
  if ((req.method === 'GET' || req.method === 'OPTIONS') && req.path.startsWith('/attachments/')) {
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
    // Remove file from uploads directory
    const filePath = path.join(__dirname, '../uploads', fileName);
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

    const files = [];
    for (const file of req.files) {
      // Save file to uploads directory
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      const filePath = path.join(uploadDir, file.originalname);
      fs.writeFileSync(filePath, file.buffer);
      files.push({
        fileName: file.originalname,
        fileSize: file.size,
        url: `/uploads/${file.originalname}`,
        uploadedAt: new Date()
      });
    }

    task.attachments = [...(task.attachments || []), ...files];
    await task.save();

    res.json({ message: 'Files uploaded.', attachments: task.attachments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload files.' });
  }
});


// Download endpoint: just return the Cloudinary URL for the file
router.get('/attachments/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get file.' });
  }
});

module.exports = router;
