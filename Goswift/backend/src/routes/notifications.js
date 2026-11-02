const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications -> { unreadCount, items }
router.get('/', async (req, res, next) => {
  try {
    const [items, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user._id, read: false })
    ]);
    res.json({ unreadCount, items });
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
