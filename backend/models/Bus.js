const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: String,
  source: String,
  destination: String,

  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Bus", busSchema);