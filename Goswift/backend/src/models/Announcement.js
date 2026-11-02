const mongoose = require('mongoose');

// A message from an admin to passengers: everyone, one bus's subscribers, or one route's subscribers.
const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 300 },
    severity: { type: String, enum: ['info', 'delay', 'alert'], default: 'info' },
    scope: { type: String, enum: ['all', 'bus', 'route'], default: 'all' },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    expiresAt: { type: Date, required: true, index: true },
    sentTo: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
