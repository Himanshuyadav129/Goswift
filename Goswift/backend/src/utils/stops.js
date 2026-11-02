// Validate + clean the stops array sent by the admin panel.
// Returns { stops } or { error }.
function normalizeStops(input) {
  if (!Array.isArray(input) || input.length < 2) {
    return { error: 'A route needs at least 2 stops' };
  }
  if (input.length > 60) return { error: 'A route can have at most 60 stops' };
  const stops = [];
  for (const [i, s] of input.entries()) {
    const name = String((s && s.name) || '').trim().slice(0, 80);
    const lat = Number(s && s.lat);
    const lng = Number(s && s.lng);
    if (!name) return { error: `Stop ${i + 1} needs a name` };
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      return { error: `Stop "${name}" has invalid coordinates` };
    }
    stops.push({ name, lat, lng });
  }
  return { stops };
}

module.exports = { normalizeStops };
