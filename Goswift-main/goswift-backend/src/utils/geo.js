// Pure geo / ETA helpers (no database), unit-tested in test/logic.test.js

const R = 6371; // km
const toRad = (d) => (d * Math.PI) / 180;

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Local flat projection (km) around `ref` - accurate enough for city-scale routes
function toXY(p, ref) {
  return {
    x: (p.lng - ref.lng) * Math.cos(toRad(ref.lat)) * 111.32,
    y: (p.lat - ref.lat) * 110.574
  };
}

/** Closest point of the route polyline to `pos`: { segment, t (0..1 along segment), distKm } */
function nearestOnRoute(stops, pos) {
  let best = null;
  for (let i = 0; i < stops.length - 1; i++) {
    const A = stops[i];
    const ab = toXY(stops[i + 1], A);
    const ap = toXY(pos, A);
    const len2 = ab.x * ab.x + ab.y * ab.y;
    let t = len2 === 0 ? 0 : (ap.x * ab.x + ap.y * ab.y) / len2;
    t = Math.max(0, Math.min(1, t));
    const dx = ap.x - t * ab.x;
    const dy = ap.y - t * ab.y;
    const distKm = Math.sqrt(dx * dx + dy * dy);
    if (!best || distKm < best.distKm) best = { segment: i, t, distKm };
  }
  return best;
}

const ARRIVED_KM = 0.1; // within 100 m of a stop = "arrived"
const DEFAULT_SPEED = 25;

const clampSpeed = (v) => Math.max(8, Math.min(60, Number(v) || DEFAULT_SPEED));

/**
 * For every stop of a route: is it passed / arrived / next / upcoming, how far (km along the
 * route) and how many minutes away at `speedKmh`.
 */
function etaToStops(stops, pos, speedKmh) {
  if (!stops || stops.length < 2 || !pos) return [];
  const speed = clampSpeed(speedKmh);
  const seg = stops.slice(0, -1).map((s, i) => haversineKm(s, stops[i + 1]));
  const near = nearestOnRoute(stops, pos);
  const i = near.segment;

  let nextAssigned = false;
  return stops.map((stop, k) => {
    let status;
    let distanceKm = 0;

    if (k <= i) {
      // behind the bus (or the segment's start stop)
      const sinceStop = k === i ? near.t * seg[i] : Infinity;
      status = k === i && sinceStop < ARRIVED_KM ? 'arrived' : 'passed';
      if (status === 'passed') distanceKm = 0;
    } else {
      distanceKm = (1 - near.t) * seg[i];
      for (let j = i + 1; j < k; j++) distanceKm += seg[j];
      if (distanceKm < ARRIVED_KM) status = 'arrived';
      else if (!nextAssigned) {
        status = 'next';
        nextAssigned = true;
      } else status = 'upcoming';
    }

    return {
      index: k,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      status,
      distanceKm: Math.round(distanceKm * 100) / 100,
      etaMinutes: status === 'passed' || status === 'arrived' ? 0 : Math.max(1, Math.ceil((distanceKm / speed) * 60)),
      offRoute: near.distKm > 1
    };
  });
}

/** Smooth the bus speed from consecutive GPS pings. Returns the new average (km/h). */
function updateAvgSpeed(prevAvg, distKm, dtMs) {
  const base = clampSpeed(prevAvg);
  const hours = dtMs / 3600000;
  if (!(dtMs >= 1500 && dtMs <= 120000)) return base; // too fast / too stale to trust
  const v = distKm / hours;
  if (v < 3 || v > 90) return base; // standing still or GPS jump
  return Math.round((base * 0.7 + v * 0.3) * 10) / 10;
}

module.exports = { haversineKm, nearestOnRoute, etaToStops, updateAvgSpeed, clampSpeed, DEFAULT_SPEED, ARRIVED_KM };
