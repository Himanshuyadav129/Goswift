const express = require("express");
const router = express.Router();

const {
addBus,
getAllBus,
updateLocation,
getNearestBus
} = require("../controllers/busController");

router.post("/add", addBus);

router.get("/all", getAllBus);

router.post("/update-location", updateLocation);

router.get("/nearest", getNearestBus);

module.exports = router;