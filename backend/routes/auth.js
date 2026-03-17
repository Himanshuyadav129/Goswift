const express = require("express");
const router = express.Router();

// ✅ REGISTER
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  res.json({
    message: "Register success",
    user: { name, email }
  });
});

// ✅ LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  res.json({
    message: "Login success",
    token: "123456"
  });
});

module.exports = router;   // ✅ VERY IMPORTANT