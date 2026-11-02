const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    busNumber: { type: String, required: true }, // kept on the trip so reports survive bus deletion
    status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    distanceKm: { type: Number, default: 0 },
    stopEvents: [{ _id: false, stopName: String, arrivedAt: Date }]
  },
  { timestamps: true }
);

tripSchema.index({ startedAt: -1 });
tripSchema.index({ bus: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);
