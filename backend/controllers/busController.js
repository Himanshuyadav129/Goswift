const Bus = require("../models/Bus");

// ADMIN → ADD BUS
exports.addBus = async (req, res) => {
  try {
    const { busNumber, source, destination, driverId } = req.body;

    const newBus = new Bus({
      busNumber,
      source,
      destination,
      driver: driverId
    });

    await newBus.save();

    res.json({ message: "Bus added successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error adding bus" });
  }
};

// GET ALL BUSES
exports.getAllBus = async (req, res) => {
  const buses = await Bus.find().populate("driver");
  res.json(buses);
};

// DRIVER → GET HIS BUS
exports.getDriverBus = async (req, res) => {
  const bus = await Bus.findOne({
    driver: req.params.driverId
  }).populate("driver");

  res.json(bus);
};

// USER → SEARCH BUS
exports.searchBus = async (req, res) => {
  const { source, destination } = req.body;

  const buses = await Bus.find({
    source,
    destination
  });

  res.json(buses);
};