const express = require("express")

const router = express.Router()

const {
registerAdmin,
loginAdmin,
getDrivers,
getBuses
} = require("../controllers/adminController")

router.post("/register",registerAdmin)
router.post("/login",loginAdmin)

router.get("/drivers",getDrivers)
router.get("/buses",getBuses)

module.exports = router