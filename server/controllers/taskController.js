const Task = require('../models/taskModel');

exports.getAllTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user.userId;
    }
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'email role')
      .populate('createdBy', 'email role');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'email role')
      .populate('createdBy', 'email role');
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (req.user.role !== 'admin' && !task.assignedTo.map(u => String(u._id)).includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [assignedTo],
      createdBy: req.user.userId
    });
    const io = req.app.get('io');
    if (io) io.emit('taskCreated', task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (req.user.role !== 'admin' && !task.assignedTo.map(u => String(u)).includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.body.assignedTo && !Array.isArray(req.body.assignedTo)) {
      req.body.assignedTo = [req.body.assignedTo];
    }
    Object.assign(task, req.body, { updatedAt: new Date() });
    await task.save();
    const io = req.app.get('io');
    if (io) io.emit('taskUpdated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (req.user.role !== 'admin' && !task.assignedTo.map(u => String(u)).includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    await task.deleteOne();
    const io = req.app.get('io');
    if (io) io.emit('taskDeleted', { id: req.params.id });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};
