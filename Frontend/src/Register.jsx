import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaUser, FaBus } from "react-icons/fa";

const Register = () => {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {

    try {

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created successfully");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }

    } catch (error) {
      alert("Server error");
    }

  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden text-white">

      <div className="absolute w-[400px] h-[400px] bg-pink-600 opacity-20 blur-3xl rounded-full -top-20 -left-20 animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-indigo-600 opacity-20 blur-3xl rounded-full -bottom-20 -right-20 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-96 shadow-2xl"
      >

        <div className="flex justify-center items-center gap-2 text-sky-400 text-2xl font-bold mb-8">
          <FaBus />
          GoSwift
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">
          Create Account 🚀
        </h2>

        <div className="relative mb-5">
          <FaUser className="absolute left-4 top-4 text-slate-400" />
          <input
            type="text"
            placeholder="Full Name"
            className="w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="relative mb-5">
          <FaEnvelope className="absolute left-4 top-4 text-slate-400" />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative mb-6">
          <FaLock className="absolute left-4 top-4 text-slate-400" />
          <input
            type="password"
            placeholder="Password"
            className="w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleRegister}
          className="w-full py-3 bg-pink-600 rounded-xl shadow-lg shadow-pink-500/30 hover:bg-pink-700 transition"
        >
          Sign Up
        </button>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-pink-400 hover:underline">
            Sign In
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Register;