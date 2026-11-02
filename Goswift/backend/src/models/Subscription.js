const mongoose = require('mongoose');

// "Tell me when bus X is <minutesBefore> minutes away from stop Y"
const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    stopName: { type: String, required: true, trim: true },
    minutesBefore: { type: Number, default: 5, min: 1, max: 60 },
    lastNotifiedTrip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null }
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, bus: 1, stopName: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
