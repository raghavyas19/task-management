const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use((req, res, next) => {
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
    const cloudinary = require('../utils/cloudinary');
    const publicId = task.attachments[attachmentIndex].public_id;
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
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

    const cloudinary = require('../utils/cloudinary');
    const files = [];
    for (const file of req.files) {
      const uploadRes = await cloudinary.uploader.upload_stream({
        resource_type: 'auto',
        folder: 'task-attachments'
      }, (error, result) => {
        if (error) throw error;
        return result;
      });
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          resource_type: 'auto',
          folder: 'task-attachments'
        }, (error, result) => {
          if (error) return reject(error);
          files.push({
            fileName: result.original_filename,
            fileSize: file.size,
            url: result.secure_url,
            public_id: result.public_id,
            uploadedAt: new Date()
          });
          resolve();
        });
        stream.end(file.buffer);
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
    const Task = require('../models/taskModel');
    // Find the task that has this attachment
    const task = await Task.findOne({ 'attachments.fileName': req.params.filename });
    if (!task) return res.status(404).json({ error: 'File not found.' });
    const attachment = (task.attachments || []).find(att => att.fileName === req.params.filename);
    if (!attachment || !attachment.url) return res.status(404).json({ error: 'File not found.' });
    // Redirect to Cloudinary URL
    res.redirect(attachment.url);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get file.' });
  }
});

module.exports = router;
