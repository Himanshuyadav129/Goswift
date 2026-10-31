require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const Subscription = require('../src/models/Subscription');
const { haversineKm } = require('../src/utils/geo');

const env = (k, d) => process.env[k] || d;

async function ensureUser({ email, name, role, password, bus }) {
  email = email.toLowerCase();
  let u = await User.findOne({ email });
  if (!u) u = await User.create({ name, email, role, password: await bcrypt.hash(password, 10), bus: bus || null });
  return u;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // ---------------- routes (stops are real places around Delhi NCR)
  const routeDefs = [
    {
      name: 'Delhi - Noida Express', source: 'Delhi', destination: 'Noida',
      stops: [
        { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
        { name: 'ITO', lat: 28.6286, lng: 77.241 },
        { name: 'Akshardham', lat: 28.6127, lng: 77.2773 },
        { name: 'Noida Sector 18', lat: 28.5708, lng: 77.326 },
        { name: 'Noida City Centre', lat: 28.5747, lng: 77.356 }
      ]
    },
    {
      name: 'Noida - Gurgaon Link', source: 'Noida', destination: 'Gurgaon',
      stops: [
        { name: 'Noida Sector 18', lat: 28.5708, lng: 77.326 },
        { name: 'Nehru Place', lat: 28.5494, lng: 77.253 },
        { name: 'Saket', lat: 28.5245, lng: 77.2066 },
        { name: 'Gurgaon Cyber Hub', lat: 28.495, lng: 77.089 }
      ]
    },
    {
      name: 'Delhi - Gurgaon Metro Feeder', source: 'Delhi', destination: 'Gurgaon',
      stops: [
        { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
        { name: 'AIIMS', lat: 28.5672, lng: 77.21 },
        { name: 'Saket', lat: 28.5245, lng: 77.2066 },
        { name: 'Gurgaon Cyber Hub', lat: 28.495, lng: 77.089 }
      ]
    }
  ];
  const routes = {};
  for (const r of routeDefs) {
    await Route.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true });
    routes[r.name] = await Route.findOne({ name: r.name });
  }

  // ---------------- buses (attach a route to buses created by an older seed too)
  const busDefs = [
    { busNumber: 'GS-101', source: 'Delhi', destination: 'Noida', status: 'idle', route: 'Delhi - Noida Express' },
    { busNumber: 'GS-202', source: 'Noida', destination: 'Gurgaon', status: 'idle', route: 'Noida - Gurgaon Link' },
    { busNumber: 'GS-303', source: 'Delhi', destination: 'Gurgaon', status: 'maintenance', route: 'Delhi - Gurgaon Metro Feeder' },
    { busNumber: 'GS-404', source: 'Delhi', destination: 'Noida', status: 'idle', route: 'Delhi - Noida Express' }
  ];
  const buses = {};
  for (const b of busDefs) {
    const { route, ...rest } = b;
    await Bus.updateOne({ busNumber: b.busNumber }, { $setOnInsert: rest }, { upsert: true });
    await Bus.updateOne({ busNumber: b.busNumber, route: null }, { route: routes[route]._id });
    buses[b.busNumber] = await Bus.findOne({ busNumber: b.busNumber });
  }

  // ---------------- users
  const adminEmail = env('SEED_ADMIN_EMAIL', 'admin@goswift.local');
  await ensureUser({ email: adminEmail, name: 'GoSwift Admin', role: 'admin', password: env('SEED_ADMIN_PASSWORD', 'Admin@12345') });

  const dEmail = env('SEED_DRIVER_EMAIL', 'driver@goswift.local');
  const d1 = await ensureUser({ email: dEmail, name: 'Demo Driver', role: 'driver', password: env('SEED_DRIVER_PASSWORD', 'Driver@12345'), bus: buses['GS-101']._id });
  const d2 = await ensureUser({ email: 'driver2@goswift.local', name: 'Second Driver', role: 'driver', password: 'Driver@12345', bus: buses['GS-202']._id });
  await Bus.updateOne({ _id: buses['GS-101']._id }, { driver: d1._id });
  await Bus.updateOne({ _id: buses['GS-202']._id }, { driver: d2._id });

  const student = await ensureUser({ email: 'student@goswift.local', name: 'Demo Student', role: 'user', password: 'Student@123' });
  // demo alert: "tell me 5 minutes before GS-101 reaches Akshardham" - fires when you run `npm run simulate`
  await Subscription.updateOne(
    { user: student._id, bus: buses['GS-101']._id, stopName: 'Akshardham' },
    { $setOnInsert: { minutesBefore: 5 } },
    { upsert: true }
  );

  // ---------------- sample trip history so the Reports page has something to show (only if there is none)
  let sample = 0;
  if ((await Trip.countDocuments()) === 0) {
    let seedNum = 42; // tiny deterministic generator -> same sample data every time
    const rand = () => (seedNum = (seedNum * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const lengthKm = (stops) => stops.slice(1).reduce((s, p, i) => s + haversineKm(stops[i], p), 0);
    const active = ['GS-101', 'GS-202', 'GS-404'];
    const docs = [];
    for (let day = 13; day >= 0; day--) {
      for (const num of active) {
        const bus = buses[num];
        const route = routes[busDefs.find((b) => b.busNumber === num).route];
        const trips = 1 + Math.floor(rand() * 3); // 1-3 trips a day
        for (let t = 0; t < trips; t++) {
          const start = new Date();
          start.setHours(6 + t * 4 + Math.floor(rand() * 2), Math.floor(rand() * 60), 0, 0);
          start.setDate(start.getDate() - day);
          if (start > new Date()) continue;
          const km = lengthKm(route.stops) * (0.95 + rand() * 0.15);
          const minutes = Math.round((km / (22 + rand() * 12)) * 60);
          docs.push({
            bus: bus._id, driver: num === 'GS-202' ? d2._id : d1._id, route: route._id, busNumber: num,
            status: 'completed', startedAt: start, endedAt: new Date(start.getTime() + minutes * 60000),
            distanceKm: Math.round(km * 10) / 10
          });
        }
      }
    }
    await Trip.insertMany(docs);
    sample = docs.length;
  }

  console.log('Seeded.');
  console.log(`  Admin   : ${adminEmail}  / ${env('SEED_ADMIN_PASSWORD', 'Admin@12345')}`);
  console.log(`  Driver  : ${dEmail} / ${env('SEED_DRIVER_PASSWORD', 'Driver@12345')}  (bus GS-101)`);
  console.log('  Student : student@goswift.local / Student@123  (has an alert on GS-101 -> Akshardham)');
  console.log(`  ${routeDefs.length} routes, ${busDefs.length} buses${sample ? `, ${sample} sample trips` : ''}. Change these passwords before real use.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
