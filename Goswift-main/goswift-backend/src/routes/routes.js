const express = require('express');
const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { requireAuth, requireRole } = require('../middleware/auth');
const { normalizeStops } = require('../utils/stops');
const { cumulativeKm, fareFor, normalizeSchedule, buildTimetable } = require('../utils/fare');

// Validates the optional fare/schedule fields. Returns { patch } or { error }.
function parseExtras(body) {
  const patch = {};
  for (const [key, max] of [['baseFare', 100000], ['farePerKm', 10000]]) {
    if (body[key] === undefined || body[key] === '') continue;
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0 || n > max) return { error: `${key} must be a number between 0 and ${max}` };
    patch[key] = n;
  }
  if (body.scheduleSpeedKmh !== undefined && body.scheduleSpeedKmh !== '') {
    const n = Number(body.scheduleSpeedKmh);
    if (!Number.isFinite(n) || n < 5 || n > 100) return { error: 'scheduleSpeedKmh must be between 5 and 100' };
    patch.scheduleSpeedKmh = n;
  }
  if (body.schedule !== undefined) {
    const { schedule, error } = normalizeSchedule(body.schedule);
    if (error) return { error };
    patch.schedule = schedule;
  }
  return { patch };
}

const router = express.Router();
const isId = (id) => mongoose.isValidObjectId(id);

// GET /api/routes (public)
router.get('/', async (_req, res, next) => {
  try {
    res.json(await Route.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
});

// GET /api/routes/:id/timetable?from=<stop>&to=<stop>   (public)
router.get('/:id/timetable', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid route id' });
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const stops = route.stops;
    const cum = cumulativeKm(stops);
    const find = (name) => stops.findIndex((s) => s.name.toLowerCase() === String(name || '').trim().toLowerCase());
    const out = {
      routeName: route.name,
      totalKm: Math.round(cum[cum.length - 1] * 10) / 10,
      durationMin: Math.round((cum[cum.length - 1] / (route.scheduleSpeedKmh || 25)) * 60),
      baseFare: route.baseFare || 0,
      farePerKm: route.farePerKm || 0,
      fullFare: fareFor(cum[cum.length - 1], route.baseFare, route.farePerKm),
      departures: buildTimetable(stops, route.schedule, route.scheduleSpeedKmh),
      fare: null
    };

    if (req.query.from || req.query.to) {
      const i = find(req.query.from);
      const j = find(req.query.to);
      if (i < 0 || j < 0) return res.status(400).json({ message: 'Unknown stop in from/to' });
      if (i === j) return res.status(400).json({ message: 'From and To must be different stops' });
      const km = Math.abs(cum[j] - cum[i]);
      out.fare = { from: stops[i].name, to: stops[j].name, km: Math.round(km * 10) / 10, amount: fareFor(km, route.baseFare, route.farePerKm) };
    }
    res.json(out);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid route id' });
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

// POST /api/routes  { name, stops:[{name,lat,lng}], source?, destination? }   (admin)
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Route name is required' });
    const { stops, error } = normalizeStops(req.body.stops);
    if (error) return res.status(400).json({ message: error });

    const extras = parseExtras(req.body);
    if (extras.error) return res.status(400).json({ message: extras.error });

    const route = await Route.create({
      ...extras.patch,
      name,
      stops,
      source: String(req.body.source || '').trim() || stops[0].name,
      destination: String(req.body.destination || '').trim() || stops[stops.length - 1].name
    });
    res.status(201).json(route);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A route with this name already exists' });
    next(err);
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid route id' });
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Route name cannot be empty' });
      route.name = name;
    }
    if (req.body.stops !== undefined) {
      const { stops, error } = normalizeStops(req.body.stops);
      if (error) return res.status(400).json({ message: error });
      route.stops = stops;
      route.source = String(req.body.source || '').trim() || stops[0].name;
      route.destination = String(req.body.destination || '').trim() || stops[stops.length - 1].name;
    }
    const extras = parseExtras(req.body);
    if (extras.error) return res.status(400).json({ message: extras.error });
    Object.assign(route, extras.patch);
    await route.save();
    res.json(route);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A route with this name already exists' });
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid route id' });
    const used = await Bus.countDocuments({ route: req.params.id });
    if (used) return res.status(409).json({ message: `Route is used by ${used} bus(es). Reassign them first.` });
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json({ message: 'Route deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
