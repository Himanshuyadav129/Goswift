const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true }, lat: Number, lng: Number },
  { _id: false }
);

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    status: { type: String, enum: ['running', 'idle', 'maintenance'], default: 'idle' },
    stops: { type: [stopSchema], default: [] }, // legacy; prefer `route`
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    avgSpeedKmh: { type: Number, default: 25 }, // learned from GPS pings, used for ETA
    currentTrip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    location: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    }
  },
  { timestamps: true }
);

busSchema.index({ source: 1, destination: 1 });

module.exports = mongoose.model('Bus', busSchema);
