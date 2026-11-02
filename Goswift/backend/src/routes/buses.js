const express = require('express');
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { requireAuth, requireRole, requireApproved } = require('../middleware/auth');
const { etaToStops } = require('../utils/geo');

const router = express.Router();
const isId = (id) => mongoose.isValidObjectId(id);
const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const EDITABLE = ['busNumber', 'source', 'destination', 'status', 'route'];
const STALE_MS = 10 * 60 * 1000;

// Validates body.route and, if source/destination were not sent, copies them from the route.
async function applyRoute(data) {
  if (data.route === '' || data.route === null) {
    data.route = null;
    return null;
  }
  if (data.route === undefined) return null;
  if (!isId(data.route)) return 'Invalid route id';
  const route = await Route.findById(data.route);
  if (!route) return 'Route not found';
  if (!data.source) data.source = route.source;
  if (!data.destination) data.destination = route.destination;
  return null;
}

// GET /api/buses  (public)
router.get('/', async (_req, res, next) => {
  try {
    res.json(await Bus.find().populate('route', 'name source destination').sort({ busNumber: 1 }));
  } catch (err) {
    next(err);
  }
});

// GET /api/buses/mine  (driver: the bus assigned to me)
router.get('/mine', requireAuth, requireRole('driver', 'admin'), requireApproved, async (req, res, next) => {
  try {
    const bus = req.user.bus
      ? await Bus.findById(req.user.bus).populate('route')
      : await Bus.findOne({ driver: req.user._id }).populate('route');
    if (!bus) return res.status(404).json({ message: 'No bus assigned to you' });
    res.json(bus);
  } catch (err) {
    next(err);
  }
});

// GET /api/buses/:id/eta  (public) - every stop of the bus's route with status + minutes away
router.get('/:id/eta', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid bus id' });
    const bus = await Bus.findById(req.params.id).populate('route');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const info = {
      busNumber: bus.busNumber,
      status: bus.status,
      onTrip: !!bus.currentTrip,
      avgSpeedKmh: bus.avgSpeedKmh,
      location: bus.location && bus.location.lat != null ? bus.location : null,
      stale: !bus.location?.updatedAt || Date.now() - bus.location.updatedAt.getTime() > STALE_MS
    };
    const stops = (bus.route?.stops || []).map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }));

    if (stops.length < 2) return res.json({ bus: info, routeName: bus.route?.name || null, stops: [] });
    if (!info.location) {
      return res.json({
        bus: info,
        routeName: bus.route.name,
        stops: stops.map((s, index) => ({ ...s, index, status: 'unknown', etaMinutes: null, distanceKm: null }))
      });
    }
    res.json({
      bus: info,
      routeName: bus.route.name,
      stops: etaToStops(stops, { lat: info.location.lat, lng: info.location.lng }, bus.avgSpeedKmh)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/buses/:id  (public)
router.get('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid bus id' });
    const bus = await Bus.findById(req.params.id).populate('route');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    next(err);
  }
});

// ---- admin only ----
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const data = pick(req.body, EDITABLE);
    const problem = await applyRoute(data);
    if (problem) return res.status(400).json({ message: problem });
    const bus = await Bus.create(data);
    res.status(201).json(bus);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Bus number already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    next(err);
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid bus id' });
    const data = pick(req.body, EDITABLE);
    const problem = await applyRoute(data);
    if (problem) return res.status(400).json({ message: problem });
    const bus = await Bus.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Bus number already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid bus id' });
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    await Promise.all([
      User.updateMany({ bus: bus._id }, { bus: null }),
      Subscription.deleteMany({ bus: bus._id })
    ]);
    res.json({ message: 'Bus deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
