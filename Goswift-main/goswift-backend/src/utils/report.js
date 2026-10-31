// Builds the numbers for the admin Reports page from a list of trips. Pure + unit-tested.
// trip: { startedAt, endedAt, status, distanceKm, busNumber }

const DAY = 86400000;

function dayKey(date, offsetMin) {
  return new Date(new Date(date).getTime() + offsetMin * 60000).toISOString().slice(0, 10);
}

function getOffsetMin() {
  const v = Number(process.env.REPORT_TZ_OFFSET_MIN);
  return Number.isFinite(v) && process.env.REPORT_TZ_OFFSET_MIN !== undefined && process.env.REPORT_TZ_OFFSET_MIN !== '' ? v : 330; // IST
}

// UTC timestamp of local midnight (in the report timezone) for the day containing `now`
function startOfDay(now, offsetMin) {
  const off = offsetMin * 60000;
  return Math.floor((now + off) / DAY) * DAY - off;
}

function buildReport(trips, { days = 14, now = Date.now(), offsetMin = 330 } = {}) {
  const completed = trips.filter((t) => t.status === 'completed' && t.endedAt);
  const minutes = (t) => (new Date(t.endedAt) - new Date(t.startedAt)) / 60000;

  // zero-filled series, oldest first
  const perDay = [];
  const index = {};
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(now - i * DAY, offsetMin);
    index[key] = { date: key, trips: 0, distanceKm: 0 };
    perDay.push(index[key]);
  }
  for (const t of trips) {
    const row = index[dayKey(t.startedAt, offsetMin)];
    if (row) {
      row.trips += 1;
      row.distanceKm += t.distanceKm || 0;
    }
  }
  perDay.forEach((r) => (r.distanceKm = Math.round(r.distanceKm * 10) / 10));

  const byBus = {};
  for (const t of trips) {
    const b = (byBus[t.busNumber] = byBus[t.busNumber] || { busNumber: t.busNumber, trips: 0, distanceKm: 0, totalMin: 0, done: 0 });
    b.trips += 1;
    b.distanceKm += t.distanceKm || 0;
    if (t.status === 'completed' && t.endedAt) {
      b.totalMin += minutes(t);
      b.done += 1;
    }
  }
  const perBus = Object.values(byBus)
    .map((b) => ({
      busNumber: b.busNumber,
      trips: b.trips,
      distanceKm: Math.round(b.distanceKm * 10) / 10,
      avgMinutes: b.done ? Math.round(b.totalMin / b.done) : 0
    }))
    .sort((a, b) => b.trips - a.trips || b.distanceKm - a.distanceKm);

  const totalDistance = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);
  const totalMin = completed.reduce((s, t) => s + minutes(t), 0);

  return {
    summary: {
      totalTrips: trips.length,
      completedTrips: completed.length,
      ongoingTrips: trips.filter((t) => t.status === 'ongoing').length,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
      avgTripMinutes: completed.length ? Math.round(totalMin / completed.length) : 0
    },
    perDay,
    perBus
  };
}

module.exports = { buildReport, dayKey, getOffsetMin, startOfDay, DAY };
