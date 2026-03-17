import express from "express";
const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  res.json({
    message: "Login success",
    token: "123456"
  });
});

router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  res.json({
    message: "Register success"
  });
});

export default router;