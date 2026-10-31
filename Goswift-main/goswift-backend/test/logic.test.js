// Run with: npm test   (no database or extra packages needed)
const assert = require('assert');
const { haversineKm, nearestOnRoute, etaToStops, updateAvgSpeed } = require('../src/utils/geo');
const { matchesJourney } = require('../src/utils/journey');
const { normalizeStops } = require('../src/utils/stops');
const { toCsv, cell } = require('../src/utils/csv');
const { buildReport, startOfDay } = require('../src/utils/report');

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log('  ok -', name);
};

const stops = [
  { name: 'A', lat: 28.0, lng: 77.0 },
  { name: 'B', lat: 28.1, lng: 77.0 },
  { name: 'C', lat: 28.2, lng: 77.0 },
  { name: 'D', lat: 28.3, lng: 77.0 }
];

test('haversine: 0.1 deg latitude is about 11.1 km', () => {
  const d = haversineKm(stops[0], stops[1]);
  assert(d > 11 && d < 11.2, d);
});

test('nearestOnRoute: point beside the middle of segment B-C', () => {
  const r = nearestOnRoute(stops, { lat: 28.15, lng: 77.001 });
  assert.strictEqual(r.segment, 1);
  assert(Math.abs(r.t - 0.5) < 0.01);
  assert(r.distKm < 0.2);
});

test('ETA: bus halfway between B and C', () => {
  const e = etaToStops(stops, { lat: 28.15, lng: 77.0 }, 30);
  assert.deepStrictEqual(e.map((s) => s.status), ['passed', 'passed', 'next', 'upcoming']);
  // to C: half of 11.1km = ~5.55km at 30km/h = ~11.1 min -> 12
  assert.strictEqual(e[2].etaMinutes, 12);
  // to D: 5.55 + 11.1 = 16.65km -> 33.3 min -> 34
  assert.strictEqual(e[3].etaMinutes, 34);
  assert.strictEqual(e[2].offRoute, false);
});

test('ETA: bus standing at stop A is "arrived", B is next', () => {
  const e = etaToStops(stops, { lat: 28.0, lng: 77.0 }, 30);
  assert.strictEqual(e[0].status, 'arrived');
  assert.strictEqual(e[1].status, 'next');
});

test('ETA: bus at the last stop arrives there', () => {
  const e = etaToStops(stops, { lat: 28.3, lng: 77.0 }, 30);
  assert.strictEqual(e[3].status, 'arrived');
  assert.strictEqual(e[1].status, 'passed');
});

test('ETA: far away from route is flagged offRoute', () => {
  const e = etaToStops(stops, { lat: 28.15, lng: 77.2 }, 30);
  assert.strictEqual(e[0].offRoute, true);
});

test('ETA: speed is clamped (0 or garbage -> default 25)', () => {
  const a = etaToStops(stops, { lat: 28.0, lng: 77.0 }, 0)[3].etaMinutes;
  const b = etaToStops(stops, { lat: 28.0, lng: 77.0 }, 25)[3].etaMinutes;
  assert.strictEqual(a, b);
});

test('updateAvgSpeed: smooths valid pings, ignores jumps and standing still', () => {
  assert.strictEqual(updateAvgSpeed(25, 0.1, 10000), 28.3); // 0.1km in 10s = 36km/h -> 25*0.7+36*0.3
  assert.strictEqual(updateAvgSpeed(25, 0, 10000), 25); // standing
  assert.strictEqual(updateAvgSpeed(25, 5, 10000), 25); // 1800 km/h GPS jump
  assert.strictEqual(updateAvgSpeed(25, 0.1, 500), 25); // ping too close together
});

const bus = {
  source: 'Delhi',
  destination: 'Noida',
  route: { stops: [{ name: 'Connaught Place' }, { name: 'ITO' }, { name: 'Akshardham' }] }
};
test('journey: source before destination matches', () => {
  assert(matchesJourney(bus, 'delhi', 'noida'));
  assert(matchesJourney(bus, 'ito', 'noida'));
  assert(matchesJourney(bus, 'connaught', 'akshardham'));
});
test('journey: reverse direction does not match', () => {
  assert(!matchesJourney(bus, 'noida', 'delhi'));
  assert(!matchesJourney(bus, 'akshardham', 'ito'));
});
test('journey: one or no field given', () => {
  assert(matchesJourney(bus, '', ''));
  assert(matchesJourney(bus, 'ito', ''));
  assert(matchesJourney(bus, '', 'noida'));
  assert(!matchesJourney(bus, 'mumbai', ''));
});
test('journey: bus without route still works on source/destination', () => {
  assert(matchesJourney({ source: 'A', destination: 'B' }, 'a', 'b'));
  assert(!matchesJourney({ source: 'A', destination: 'B' }, 'b', 'a'));
});

test('normalizeStops validates input', () => {
  assert(normalizeStops([{ name: 'x', lat: 1, lng: 1 }]).error);
  assert(normalizeStops([{ name: '', lat: 1, lng: 1 }, { name: 'y', lat: 1, lng: 1 }]).error);
  assert(normalizeStops([{ name: 'x', lat: 95, lng: 1 }, { name: 'y', lat: 1, lng: 1 }]).error);
  assert(normalizeStops('nope').error);
  const ok = normalizeStops([{ name: ' x ', lat: '28.5', lng: 77, extra: 1 }, { name: 'y', lat: 1, lng: 1 }]);
  assert.deepStrictEqual(ok.stops[0], { name: 'x', lat: 28.5, lng: 77 });
});

test('csv: quoting and formula-injection guard', () => {
  assert.strictEqual(cell('a,b'), '"a,b"');
  assert.strictEqual(cell('say "hi"'), '"say ""hi"""');
  assert.strictEqual(cell('=SUM(A1)'), "'=SUM(A1)");
  assert.strictEqual(cell(null), '');
  const csv = toCsv([{ label: 'Bus', value: (r) => r.b }, { label: 'Km', value: (r) => r.k }], [{ b: 'GS-1', k: 2.5 }]);
  assert.strictEqual(csv, 'Bus,Km\nGS-1,2.5');
});

test('report: per-day series is zero filled and totals add up', () => {
  const now = Date.parse('2026-10-30T10:00:00Z');
  const trips = [
    { busNumber: 'GS-1', status: 'completed', startedAt: '2026-10-30T04:00:00Z', endedAt: '2026-10-30T05:00:00Z', distanceKm: 10 },
    { busNumber: 'GS-1', status: 'completed', startedAt: '2026-10-29T04:00:00Z', endedAt: '2026-10-29T04:30:00Z', distanceKm: 5 },
    { busNumber: 'GS-2', status: 'ongoing', startedAt: '2026-10-30T09:00:00Z', distanceKm: 1 }
  ];
  const r = buildReport(trips, { days: 3, now });
  assert.deepStrictEqual(r.perDay.map((d) => d.date), ['2026-10-28', '2026-10-29', '2026-10-30']);
  assert.deepStrictEqual(r.perDay.map((d) => d.trips), [0, 1, 2]);
  assert.strictEqual(r.summary.totalTrips, 3);
  assert.strictEqual(r.summary.completedTrips, 2);
  assert.strictEqual(r.summary.ongoingTrips, 1);
  assert.strictEqual(r.summary.totalDistanceKm, 16);
  assert.strictEqual(r.summary.avgTripMinutes, 45);
  assert.strictEqual(r.perBus[0].busNumber, 'GS-1');
  assert.strictEqual(r.perBus[0].avgMinutes, 45);
});

test('startOfDay: local midnight in IST', () => {
  // 2026-10-30 10:00 UTC = 15:30 IST -> IST midnight = 2026-10-29 18:30 UTC
  assert.strictEqual(new Date(startOfDay(Date.parse('2026-10-30T10:00:00Z'), 330)).toISOString(), '2026-10-29T18:30:00.000Z');
});

console.log(`\n${n} tests passed`);
