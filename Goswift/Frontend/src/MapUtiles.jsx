// Small map helpers for the Uber/Rapido-style bus marker.
const toRad = (d) => (d * Math.PI) / 180;

/** Distance in metres between two [lat, lng] points. */
export function distM(a, b) {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Compass bearing in degrees (0 = north, 90 = east) from a to b. */
export function bearing(a, b) {
  const p1 = toRad(a[0]);
  const p2 = toRad(b[0]);
  const dl = toRad(b[1] - a[1]);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

/** Turn the short way round: returns an angle equal to `to` (mod 360) that is within 180 deg of `from`. */
export function nearestAngle(from, to) {
  let d = ((to - from + 540) % 360) - 180;
  return from + d;
}

/**
 * Snap a point onto the route line if it is within maxM metres of it (removes GPS jitter, keeps the
 * bus "on the road"). Returns { pos, dist } or null when the line is missing or the bus is too far away.
 */
export function snapToLine(pt, line, maxM = 60) {
  if (!line || line.length < 2) return null;
  const k = Math.cos(toRad(pt[0]));
  const mLat = 111320;
  const mLng = 111320 * k;
  let best = null;
  for (let i = 0; i < line.length - 1; i++) {
    const ax = (line[i][1] - pt[1]) * mLng;
    const ay = (line[i][0] - pt[0]) * mLat;
    const bx = (line[i + 1][1] - pt[1]) * mLng;
    const by = (line[i + 1][0] - pt[0]) * mLat;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const px = ax + t * dx;
    const py = ay + t * dy;
    const d = Math.hypot(px, py);
    if (!best || d < best.dist) best = { dist: d, pos: [pt[0] + py / mLat, pt[1] + px / mLng] };
  }
  return best && best.dist <= maxM ? best : null;
}