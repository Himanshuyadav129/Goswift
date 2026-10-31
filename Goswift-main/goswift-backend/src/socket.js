const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');
const User = require('./models/User');
const { verifyToken } = require('./middleware/auth');
const { haversineKm, updateAvgSpeed, etaToStops } = require('./utils/geo');
const { checkAlerts } = require('./services/alerts');

const MIN_INTERVAL_MS = 1000; // per-socket throttle so a client cannot flood the database
const MAX_JUMP_KM = 2; // ignore GPS jumps bigger than this between two pings when adding up distance

/**
 * Realtime bus tracking.
 *
 *  client -> server   "busLocation"        { busId, latitude, longitude }   (DriverPanel.jsx)
 *  server -> everyone "busLocationUpdate"  { busId, latitude, longitude, updatedAt }
 *  server -> one user "notification"       (room "user:<id>", only for sockets connected with a token)
 *  client -> server   "trackBus"  busId    (optional: join room "bus:<id>")
 *
 * Only the assigned, approved driver (or an admin) can move a bus. Set REQUIRE_SOCKET_AUTH=false to disable (testing only).
 */
module.exports = function registerSocket(io) {
  const requireAuth = process.env.REQUIRE_SOCKET_AUTH !== 'false'; // secure by default

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = verifyToken(token);
        socket.user = await User.findById(payload.id);
      } catch {
        return next(new Error('Invalid token'));
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    let lastSent = 0;

    if (socket.user) socket.join(`user:${socket.user._id}`);

    socket.on('trackBus', (busId) => {
      if (mongoose.isValidObjectId(busId)) socket.join(`bus:${busId}`);
    });

    socket.on('busLocation', async (data, ack) => {
      const reply = (r) => typeof ack === 'function' && ack(r);
      try {
        const { busId } = data || {};
        const lat = Number(data?.latitude);
        const lng = Number(data?.longitude);

        if (!mongoose.isValidObjectId(busId)) return reply({ ok: false, error: 'Invalid busId' });
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          return reply({ ok: false, error: 'Invalid coordinates' });
        }

        if (requireAuth) {
          const u = socket.user;
          if (!u || !['driver', 'admin'].includes(u.role)) {
            return reply({ ok: false, error: 'Not authorised' });
          }
          if (u.role === 'driver' && u.approved === false) {
            return reply({ ok: false, error: 'Driver account not approved yet' });
          }
          if (u.role === 'driver' && String(u.bus) !== String(busId)) {
            return reply({ ok: false, error: 'This is not your bus' });
          }
        }

        const now = Date.now();
        if (now - lastSent < MIN_INTERVAL_MS) return reply({ ok: false, error: 'Too many updates' });
        lastSent = now;

        const bus = await Bus.findById(busId).populate('route');
        if (!bus) return reply({ ok: false, error: 'Bus not found' });

        // learn the bus speed + add up trip distance from the previous ping
        const prev = bus.location && bus.location.lat != null && bus.location.updatedAt ? bus.location : null;
        let stepKm = 0;
        if (prev) {
          stepKm = haversineKm({ lat: prev.lat, lng: prev.lng }, { lat, lng });
          bus.avgSpeedKmh = updateAvgSpeed(bus.avgSpeedKmh, stepKm, now - prev.updatedAt.getTime());
        }

        const updatedAt = new Date(now);
        bus.location = { lat, lng, updatedAt };
        // An idle bus that starts reporting GPS is now running; maintenance is never overridden.
        if (bus.status === 'idle') bus.status = 'running';
        await bus.save();

        io.emit('busLocationUpdate', { busId, latitude: lat, longitude: lng, updatedAt });
        reply({ ok: true });

        // ---- trip bookkeeping + alerts (after replying, so the driver is never slowed down)
        if (bus.currentTrip) {
          const trip = await Trip.findById(bus.currentTrip);
          if (trip && trip.status === 'ongoing') {
            if (stepKm > 0 && stepKm <= MAX_JUMP_KM) trip.distanceKm += stepKm;

            const stops = bus.route?.stops || [];
            if (stops.length >= 2) {
              const etas = etaToStops(stops, { lat, lng }, bus.avgSpeedKmh);
              for (const e of etas) {
                if (e.status === 'arrived' && !trip.stopEvents.some((x) => x.stopName === e.name)) {
                  trip.stopEvents.push({ stopName: e.name, arrivedAt: updatedAt });
                }
              }
            }
            await trip.save();
            await checkAlerts({ io, bus, trip, route: bus.route, pos: { lat, lng } });
          }
        }
      } catch (err) {
        console.error('busLocation error:', err.message);
        reply({ ok: false, error: 'Server error' });
      }
    });
  });
};
