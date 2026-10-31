// Does a bus serve "source -> destination"?  Pure function, unit-tested.

const norm = (s) => String(s || '').trim().toLowerCase();

function placeSequence(bus) {
  const stops = (bus.route && bus.route.stops ? bus.route.stops : bus.stops || []).map((s) => s.name);
  return [bus.source, ...stops, bus.destination].map(norm).filter(Boolean);
}

/** Direction aware: the source must come before the destination on the bus's route. */
function matchesJourney(bus, source, destination) {
  const s = norm(source);
  const d = norm(destination);
  if (!s && !d) return true;
  const seq = placeSequence(bus);
  const idx = (q) => seq.map((name, i) => (name.includes(q) ? i : -1)).filter((i) => i >= 0);
  if (s && !d) return idx(s).length > 0;
  if (d && !s) return idx(d).length > 0;
  const from = idx(s);
  const to = idx(d);
  return from.some((i) => to.some((j) => i < j));
}

module.exports = { matchesJourney, placeSequence };
