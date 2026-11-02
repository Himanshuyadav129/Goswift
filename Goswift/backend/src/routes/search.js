const express = require('express');
const Bus = require('../models/Bus');
const { matchesJourney } = require('../utils/journey');

const router = express.Router();

// Direction-aware search: "ITO" -> "Noida" finds buses whose route visits ITO before Noida.
// Matching runs in JS (see utils/journey.js) - fine for a fleet of a few hundred buses.
async function search(source, destination) {
  const s = String(source || '').slice(0, 100);
  const d = String(destination || '').slice(0, 100);
  const buses = await Bus.find().populate('route').sort({ busNumber: 1 }).limit(500).lean();
  return buses.filter((b) => matchesJourney(b, s, d)).slice(0, 100);
}

// POST /api/search  { source, destination }
router.post('/', async (req, res, next) => {
  try {
    res.json(await search(req.body.source, req.body.destination));
  } catch (err) {
    next(err);
  }
});

// GET /api/search?source=&destination=
router.get('/', async (req, res, next) => {
  try {
    res.json(await search(req.query.source, req.query.destination));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
