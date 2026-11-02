const express = require('express');
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Subscription = require('../models/Subscription');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MAX_PER_USER = 20;

// GET /api/subscriptions - my alerts
router.get('/', async (req, res, next) => {
  try {
    res.json(await Subscription.find({ user: req.user._id }).populate('bus', 'busNumber').sort({ createdAt: -1 }));
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions { busId, stopName, minutesBefore? }
router.post('/', async (req, res, next) => {
  try {
    const { busId } = req.body;
    const stopName = String(req.body.stopName || '').trim();
    const minutesBefore = Math.min(60, Math.max(1, parseInt(req.body.minutesBefore, 10) || 5));
    if (!mongoose.isValidObjectId(busId) || !stopName) {
      return res.status(400).json({ message: 'busId and stopName are required' });
    }

    const bus = await Bus.findById(busId).populate('route');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    const stop = (bus.route?.stops || []).find((s) => s.name.toLowerCase() === stopName.toLowerCase());
    if (!stop) return res.status(400).json({ message: 'This bus does not stop there' });

    const filter = { user: req.user._id, bus: bus._id, stopName: stop.name };
    if (!(await Subscription.exists(filter)) && (await Subscription.countDocuments({ user: req.user._id })) >= MAX_PER_USER) {
      return res.status(400).json({ message: `You can have at most ${MAX_PER_USER} alerts` });
    }

    const sub = await Subscription.findOneAndUpdate(
      filter,
      { minutesBefore, lastNotifiedTrip: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    await Subscription.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Alert removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
