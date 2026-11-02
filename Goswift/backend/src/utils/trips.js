// Pure helpers for "driver forgot to end the trip". Unit-tested.

// Moment from which inactivity is measured: the last GPS ping of THIS trip, else the trip start.
function activeSince(lastSeen, startedAt) {
  const seen = lastSeen ? new Date(lastSeen).getTime() : 0;
  const start = new Date(startedAt).getTime();
  return seen >= start ? seen : start;
}

function isTripStale({ lastSeen, startedAt, now = Date.now(), maxMs }) {
  return now - activeSince(lastSeen, startedAt) > maxMs;
}

module.exports = { activeSince, isTripStale };
