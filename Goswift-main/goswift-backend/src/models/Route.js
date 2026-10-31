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
    stops: { type: [stopSchema], default: [] } // ordered, first = start, last = end
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
