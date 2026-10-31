const express = require('express');
const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { requireAuth, requireRole } = require('../middleware/auth');
const { normalizeStops } = require('../utils/stops');

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

    const route = await Route.create({
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
