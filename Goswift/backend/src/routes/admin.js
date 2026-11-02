const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { buildReport, getOffsetMin, startOfDay, DAY } = require('../utils/report');
const { toCsv } = require('../utils/csv');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

const STALE_MS = 5 * 60 * 1000;
const isId = (id) => mongoose.isValidObjectId(id);
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// ---------------------------------------------------------------- overview
// "alerts" = buses marked running that have not sent a GPS update in the last 5 minutes
router.get('/stats', async (_req, res, next) => {
  try {
    const [buses, totalRoutes, totalDrivers, totalUsers, ongoingTrips, pendingDrivers] = await Promise.all([
      Bus.find().sort({ busNumber: 1 }),
      Route.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'user' }),
      Trip.countDocuments({ status: 'ongoing' }),
      User.countDocuments({ role: 'driver', approved: false })
    ]);
    const cutoff = Date.now() - STALE_MS;
    const alerts = buses.filter(
      (b) => b.status === 'running' && (!b.location?.updatedAt || b.location.updatedAt.getTime() < cutoff)
    );
    res.json({
      totalBuses: buses.length,
      running: buses.filter((b) => b.status === 'running').length,
      maintenance: buses.filter((b) => b.status === 'maintenance').length,
      alerts: alerts.length,
      totalRoutes,
      totalDrivers,
      totalUsers,
      ongoingTrips,
      pendingDrivers,
      fleet: buses.map((b) => ({ id: b.busNumber, _id: b._id, status: b.status }))
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------- drivers
// Keeps Bus.driver and User.bus consistent (one driver per bus, one bus per driver)
async function setDriverBus(driver, busId) {
  await Bus.updateMany({ driver: driver._id }, { driver: null });
  if (busId) {
    await User.updateMany({ bus: busId, _id: { $ne: driver._id } }, { bus: null });
    await Bus.findByIdAndUpdate(busId, { driver: driver._id });
  }
  driver.bus = busId || null;
  await driver.save();
}

async function validateBusId(busId) {
  if (!busId) return null;
  if (!isId(busId)) return { status: 400, message: 'Invalid bus id' };
  if (!(await Bus.exists({ _id: busId }))) return { status: 404, message: 'Bus not found' };
  return null;
}

router.get('/drivers', async (_req, res, next) => {
  try {
    res.json(await User.find({ role: 'driver' }).populate('bus', 'busNumber').sort({ approved: 1, name: 1 }));
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/drivers  { name, email, password, busId? }
router.post('/drivers', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const busId = req.body.busId || null;
    if (!name || !EMAIL_RE.test(email) || password.length < 6) {
      return res.status(400).json({ message: 'Name, a valid email and a password of 6+ characters are required' });
    }
    const bad = await validateBusId(busId);
    if (bad) return res.status(bad.status).json({ message: bad.message });
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const driver = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'driver' });
    await setDriverBus(driver, busId);
    res.status(201).json(driver.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/drivers/:id  { name?, email?, password?, busId? (null = unassign) }
router.put('/drivers/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid driver id' });
    const driver = await User.findOne({ _id: req.params.id, role: 'driver' });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name cannot be empty' });
      driver.name = name;
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Invalid email address' });
      if (await User.exists({ email, _id: { $ne: driver._id } })) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      driver.email = email;
    }
    if (req.body.approved !== undefined) driver.approved = !!req.body.approved;
    if (req.body.phone !== undefined) driver.phone = String(req.body.phone).trim().slice(0, 20);
    if (req.body.password) {
      if (String(req.body.password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      driver.password = await bcrypt.hash(String(req.body.password), 10);
    }
    if (req.body.busId !== undefined) {
      const busId = req.body.busId || null;
      const bad = await validateBusId(busId);
      if (bad) return res.status(bad.status).json({ message: bad.message });
      await setDriverBus(driver, busId); // saves the driver
    } else {
      await driver.save();
    }
    res.json(driver.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

router.delete('/drivers/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid driver id' });
    const driver = await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    await Bus.updateMany({ driver: driver._id }, { driver: null });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------- users
router.get('/users', async (req, res, next) => {
  try {
    const filter = ['user', 'driver', 'admin'].includes(req.query.role) ? { role: req.query.role } : {};
    res.json(await User.find(filter).sort({ createdAt: -1 }).limit(200));
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/role  { role }
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'driver', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    if (String(req.params.id) === String(req.user._id) && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------- reports
// Dates are YYYY-MM-DD in the report timezone (REPORT_TZ_OFFSET_MIN, default IST)
function tripFilter(q) {
  const filter = {};
  if (q.busId && isId(q.busId)) filter.bus = q.busId;
  const off = getOffsetMin() * 60000;
  const parse = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? Date.parse(`${s}T00:00:00Z`) - off : null);
  const from = parse(q.from);
  const to = parse(q.to);
  if (from !== null || to !== null) {
    filter.startedAt = {};
    if (from !== null) filter.startedAt.$gte = new Date(from);
    if (to !== null) filter.startedAt.$lte = new Date(to + DAY - 1);
  }
  return filter;
}

const tripRow = (t) => ({
  _id: t._id,
  busNumber: t.busNumber,
  route: t.route?.name || '',
  driver: t.driver?.name || '',
  status: t.status,
  startedAt: t.startedAt,
  endedAt: t.endedAt || null,
  durationMin: t.endedAt ? Math.round((t.endedAt - t.startedAt) / 60000) : null,
  distanceKm: Math.round((t.distanceKm || 0) * 10) / 10
});

// GET /api/admin/reports/summary?days=14
router.get('/reports/summary', async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 14));
    const offsetMin = getOffsetMin();
    const since = new Date(startOfDay(Date.now(), offsetMin) - (days - 1) * DAY);
    const trips = await Trip.find({ startedAt: { $gte: since } }).limit(10000).lean();
    res.json({ days, ...buildReport(trips, { days, offsetMin }) });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/trips?from=&to=&busId=&limit=
router.get('/reports/trips', async (req, res, next) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const trips = await Trip.find(tripFilter(req.query))
      .sort({ startedAt: -1 })
      .limit(limit)
      .populate('route', 'name')
      .populate('driver', 'name');
    res.json(trips.map(tripRow));
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/trips.csv  - same filters, downloads a CSV file
router.get('/reports/trips.csv', async (req, res, next) => {
  try {
    const trips = await Trip.find(tripFilter(req.query))
      .sort({ startedAt: -1 })
      .limit(5000)
      .populate('route', 'name')
      .populate('driver', 'name');
    const csv = toCsv(
      [
        { label: 'Bus', value: (r) => r.busNumber },
        { label: 'Route', value: (r) => r.route },
        { label: 'Driver', value: (r) => r.driver },
        { label: 'Status', value: (r) => r.status },
        { label: 'Started', value: (r) => r.startedAt },
        { label: 'Ended', value: (r) => r.endedAt },
        { label: 'Duration (min)', value: (r) => r.durationMin },
        { label: 'Distance (km)', value: (r) => r.distanceKm }
      ],
      trips.map(tripRow)
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="goswift-trips.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
