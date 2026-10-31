const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { etaToStops } = require('../utils/geo');
const { sendEmail } = require('./email');

/**
 * Called after every GPS ping of a bus that is on a trip.
 * For each subscriber whose stop is close enough (ETA <= their minutesBefore, or bus arrived),
 * create ONE notification per trip, push it live over the socket and optionally e-mail it.
 */
async function checkAlerts({ io, bus, trip, route, pos }) {
  if (!route || !route.stops || route.stops.length < 2) return;

  const subs = await Subscription.find({ bus: bus._id, lastNotifiedTrip: { $ne: trip._id } }).populate(
    'user',
    'name email'
  );
  if (!subs.length) return;

  const etas = etaToStops(route.stops, pos, bus.avgSpeedKmh);

  for (const sub of subs) {
    if (!sub.user) continue;
    const e = etas.find((x) => x.name.toLowerCase() === sub.stopName.toLowerCase());
    if (!e || e.status === 'passed') continue;

    const arrived = e.status === 'arrived';
    if (!arrived && e.etaMinutes > sub.minutesBefore) continue;

    const title = arrived ? `Bus ${bus.busNumber} has arrived` : `Bus ${bus.busNumber} is approaching`;
    const message = arrived
      ? `Bus ${bus.busNumber} is at ${e.name} now.`
      : `Bus ${bus.busNumber} will reach ${e.name} in about ${e.etaMinutes} min (${e.distanceKm} km away).`;

    const note = await Notification.create({
      user: sub.user._id,
      bus: bus._id,
      type: arrived ? 'arrived' : 'approaching',
      title,
      message
    });
    sub.lastNotifiedTrip = trip._id;
    await sub.save();

    io.to(`user:${sub.user._id}`).emit('notification', note);
    sendEmail(sub.user.email, `GoSwift: ${title}`, `Hi ${sub.user.name},\n\n${message}\n\n- GoSwift`);
  }
}

module.exports = { checkAlerts };
