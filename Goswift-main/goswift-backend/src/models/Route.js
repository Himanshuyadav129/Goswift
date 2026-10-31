const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    stops: { type: [stopSchema], default: [] }, // ordered, first = start, last = end
    // Fare = max(baseFare, round(km * farePerKm))
    baseFare: { type: Number, default: 0, min: 0, max: 100000 },
    farePerKm: { type: Number, default: 0, min: 0, max: 10000 },
    // Departure times from the first stop, "HH:MM" 24h
    schedule: { type: [String], default: [] },
    scheduleSpeedKmh: { type: Number, default: 25, min: 5, max: 100 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
