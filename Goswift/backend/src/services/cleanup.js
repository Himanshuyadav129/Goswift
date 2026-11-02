const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const { activeSince, isTripStale } = require('../utils/trips');

const MAX_MS = Number(process.env.STALE_TRIP_MINUTES || 20) * 60000;

/**
 * If a driver forgets to press "End trip" (phone died, closed the app), the trip would stay open forever
 * and the bus would look "running". Every minute: end trips with no GPS ping for STALE_TRIP_MINUTES.
 */
async function endStaleTrips(io) {
  const buses = await Bus.find({ currentTrip: { $ne: null } });
  for (const bus of buses) {
    const trip = await Trip.findById(bus.currentTrip);

    if (!trip || trip.status !== 'ongoing') {
      bus.currentTrip = null; // dangling pointer
      if (bus.status === 'running') bus.status = 'idle';
      await bus.save();
      continue;
    }

    const lastSeen = bus.location?.updatedAt;
    if (isTripStale({ lastSeen, startedAt: trip.startedAt, maxMs: MAX_MS })) {
      trip.status = 'completed';
      trip.endedAt = new Date(activeSince(lastSeen, trip.startedAt));
      await trip.save();
      bus.currentTrip = null;
      bus.status = 'idle';
      await bus.save();
      io.emit('busStatusUpdate', { busId: String(bus._id), status: 'idle' });
      console.log(`Auto-ended stale trip of ${bus.busNumber}`);
    }
  }
}

function startCleanup(io) {
  setInterval(() => endStaleTrips(io).catch((e) => console.error('cleanup error:', e.message)), 60000);
}

module.exports = { startCleanup, endStaleTrips };
