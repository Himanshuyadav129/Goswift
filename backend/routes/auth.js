import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ IMPORTANT FIX
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  // dummy response (check ke liye)
  res.json({
    message: "Register success",
    user: { name, email }
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // dummy response
  res.json({
    message: "Login success",
    token: "123456"
  });
});

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(5000, () => {
  console.log("Server running");
});