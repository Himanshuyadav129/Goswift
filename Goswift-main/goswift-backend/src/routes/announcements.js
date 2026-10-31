const express = require('express');
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendPushToUsers } = require('../services/push');

const router = express.Router();
const isId = (id) => mongoose.isValidObjectId(id);

// GET /api/announcements            -> active announcements for everyone
// GET /api/announcements?busId=..&routeId=..  -> those + ones for that bus / route   (public)
router.get('/', async (req, res, next) => {
  try {
    const or = [{ scope: 'all' }];
    if (isId(req.query.busId)) or.push({ scope: 'bus', bus: req.query.busId });
    if (isId(req.query.routeId)) or.push({ scope: 'route', route: req.query.routeId });
    const list = await Announcement.find({ expiresAt: { $gt: new Date() }, $or: or })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('message severity scope createdAt expiresAt');
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/announcements/admin  (admin) - last 50 incl. expired
router.get('/admin', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    res.json(await Announcement.find().sort({ createdAt: -1 }).limit(50).populate('bus', 'busNumber').populate('route', 'name'));
  } catch (err) {
    next(err);
  }
});

// POST /api/announcements (admin) { message, severity, scope, busId?, routeId?, expiresInMinutes? }
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Message is required' });
    if (message.length > 300) return res.status(400).json({ message: 'Message can be at most 300 characters' });
    const severity = ['info', 'delay', 'alert'].includes(req.body.severity) ? req.body.severity : 'info';
    const scope = ['all', 'bus', 'route'].includes(req.body.scope) ? req.body.scope : 'all';
    const mins = Math.min(10080, Math.max(5, parseInt(req.body.expiresInMinutes, 10) || 360));

    let bus = null;
    let route = null;
    if (scope === 'bus') {
      if (!isId(req.body.busId) || !(bus = await Bus.findById(req.body.busId))) return res.status(400).json({ message: 'Choose a valid bus' });
    }
    if (scope === 'route') {
      if (!isId(req.body.routeId) || !(route = await Route.findById(req.body.routeId))) return res.status(400).json({ message: 'Choose a valid route' });
    }

    // Who gets a personal notification?
    let userIds;
    if (scope === 'all') {
      userIds = (await User.find({ role: 'user' }).select('_id')).map((u) => u._id);
    } else {
      const busIds = scope === 'bus' ? [bus._id] : (await Bus.find({ route: route._id }).select('_id')).map((b) => b._id);
      userIds = await Subscription.distinct('user', { bus: { $in: busIds } });
    }

    const title = severity === 'delay' ? 'Delay' : severity === 'alert' ? 'Important alert' : 'GoSwift update';
    const ann = await Announcement.create({
      message, severity, scope,
      bus: bus ? bus._id : null,
      route: route ? route._id : null,
      expiresAt: new Date(Date.now() + mins * 60000),
      sentTo: userIds.length,
      createdBy: req.user._id
    });

    const io = req.app.get('io');
    if (userIds.length) {
      const docs = await Notification.insertMany(
        userIds.map((u) => ({ user: u, bus: bus ? bus._id : undefined, type: 'info', title, message }))
      );
      if (io) docs.forEach((n) => io.to(`user:${n.user}`).emit('notification', n));
      sendPushToUsers(userIds, { title: `GoSwift: ${title}`, body: message, url: '/dashboard', tag: `ann-${ann._id}` }); // fire and forget
    }
    if (io) io.emit('announcement', { _id: ann._id, message, severity, scope, bus: ann.bus, route: ann.route, expiresAt: ann.expiresAt, createdAt: ann.createdAt });

    res.status(201).json(ann);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/announcements/:id (admin) - removes it from banners (past notifications stay)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const a = await Announcement.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ message: 'Announcement not found' });
    const io = req.app.get('io');
    if (io) io.emit('announcementRemoved', { _id: a._id });
    res.json({ message: 'Announcement removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
