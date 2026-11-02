/**
 * Drives a bus along its route so you can demo live tracking, ETA and alerts without a phone.
 *
 *   npm run simulate                     (GS-101 driver: driver@goswift.local)
 *   npm run simulate -- --speed 80       (km/h, default 60; keep under 85)
 *   npm run simulate -- --email driver2@goswift.local --password Driver@12345
 *
 * Needs the backend running and `npm install` done (uses socket.io-client).
 */
const { io } = require('socket.io-client');
const { haversineKm } = require('../src/utils/geo');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const API = arg('api', process.env.API_URL || 'http://localhost:5000');
const email = arg('email', 'driver@goswift.local');
const password = arg('password', 'Driver@12345');
const speed = Math.min(85, Math.max(10, Number(arg('speed', '60'))));
const TICK_MS = 2000;

async function call(path, token, method = 'GET') {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === 'POST' ? '{}' : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${data.message || ''}`);
  return data;
}

(async () => {
  const login = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await login.json();
  if (!login.ok) throw new Error(`Login failed: ${loginData.message}`);
  const token = loginData.token;

  const bus = await call('/api/buses/mine', token);
  const stops = bus.route?.stops || [];
  if (stops.length < 2) throw new Error('This bus has no route with stops. Run `npm run seed` first.');

  await call('/api/driver/trips/start', token, 'POST');
  console.log(`Trip started: ${bus.busNumber} on "${bus.route.name}" at ${speed} km/h. Press Ctrl+C to stop.`);

  const socket = io(API, { auth: { token } });
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', (e) => reject(new Error(`Socket: ${e.message}`)));
  });

  // cumulative distance along the route
  const cum = [0];
  stops.forEach((s, i) => i && cum.push(cum[i - 1] + haversineKm(stops[i - 1], s)));
  const total = cum[cum.length - 1];
  const at = (d) => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return { lat: stops[i - 1].lat + (stops[i].lat - stops[i - 1].lat) * f, lng: stops[i - 1].lng + (stops[i].lng - stops[i - 1].lng) * f };
  };

  let travelled = 0;
  let ending = false;
  const finish = async () => {
    if (ending) return;
    ending = true;
    clearInterval(timer);
    try {
      await call('/api/driver/trips/end', token, 'POST');
      console.log('Trip ended.');
    } catch (e) {
      console.error(e.message);
    }
    socket.disconnect();
    process.exit(0);
  };

  const timer = setInterval(() => {
    travelled = Math.min(total, travelled + (speed * TICK_MS) / 3600000);
    const p = at(travelled);
    socket.emit('busLocation', { busId: bus._id, latitude: p.lat, longitude: p.lng }, (r) => {
      if (r && !r.ok) console.log('server said:', r.error);
    });
    console.log(`  ${((travelled / total) * 100).toFixed(0).padStart(3)}%  ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
    if (travelled >= total) setTimeout(finish, 1500);
  }, TICK_MS);

  process.on('SIGINT', finish);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
