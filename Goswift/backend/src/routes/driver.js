const express = require('express');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const { requireAuth, requireRole, requireApproved } = require('../middleware/auth');
const { getOffsetMin, startOfDay } = require('../utils/report');

const router = express.Router();
router.use(requireAuth, requireRole('driver', 'admin'), requireApproved);

const getBus = (user) => (user.bus ? Bus.findById(user.bus) : Bus.findOne({ driver: user._id }));

// POST /api/driver/trips/start
router.post('/trips/start', async (req, res, next) => {
  try {
    const bus = await getBus(req.user);
    if (!bus) return res.status(404).json({ message: 'No bus assigned to you' });

    if (bus.currentTrip) {
      const existing = await Trip.findById(bus.currentTrip);
      if (existing && existing.status === 'ongoing') return res.json({ trip: existing, already: true });
    }

    const trip = await Trip.create({
      bus: bus._id,
      driver: req.user._id,
      route: bus.route || null,
      busNumber: bus.busNumber
    });
    bus.currentTrip = trip._id;
    bus.status = 'running';
    await bus.save();

    req.app.get('io').emit('busStatusUpdate', { busId: String(bus._id), status: 'running' });
    res.status(201).json({ trip });
  } catch (err) {
    next(err);
  }
});

// POST /api/driver/trips/end
router.post('/trips/end', async (req, res, next) => {
  try {
    const bus = await getBus(req.user);
    if (!bus) return res.status(404).json({ message: 'No bus assigned to you' });

    const trip = bus.currentTrip
      ? await Trip.findById(bus.currentTrip)
      : await Trip.findOne({ bus: bus._id, status: 'ongoing' });
    if (!trip || trip.status !== 'ongoing') return res.status(404).json({ message: 'No ongoing trip' });

    trip.status = 'completed';
    trip.endedAt = new Date();
    await trip.save();
    bus.currentTrip = null;
    bus.status = 'idle';
    await bus.save();

    req.app.get('io').emit('busStatusUpdate', { busId: String(bus._id), status: 'idle' });
    res.json({ trip });
  } catch (err) {
    next(err);
  }
});

// GET /api/driver/summary -> { bus, currentTrip, tripsToday, distanceTodayKm }
router.get('/summary', async (req, res, next) => {
  try {
    const bus = await getBus(req.user);
    if (!bus) return res.status(404).json({ message: 'No bus assigned to you' });

    const since = new Date(startOfDay(Date.now(), getOffsetMin()));
    const [currentTrip, today] = await Promise.all([
      bus.currentTrip ? Trip.findOne({ _id: bus.currentTrip, status: 'ongoing' }) : null,
      Trip.find({ bus: bus._id, startedAt: { $gte: since } })
    ]);
    res.json({
      bus: { _id: bus._id, busNumber: bus.busNumber },
      currentTrip,
      tripsToday: today.length,
      distanceTodayKm: Math.round(today.reduce((s, t) => s + (t.distanceKm || 0), 0) * 10) / 10
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
