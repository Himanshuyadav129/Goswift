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

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {

      const API_URL = import.meta.env.VITE_API_URL;

      if (!API_URL) {
        alert("API URL not configured");
        return;
      }

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created successfully");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }

    } catch (error) {
      console.error(error);
      alert("Server error");
    }

  };

  return (
    // 🔽 UI same (no change)
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden text-white">
      <div className="absolute w-[400px] h-[400px] bg-pink-600 opacity-20 blur-3xl rounded-full -top-20 -left-20 animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-indigo-600 opacity-20 blur-3xl rounded-full -bottom-20 -right-20 animate-pulse"></div>

      <motion.div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-96 shadow-2xl">
        <div className="flex justify-center items-center gap-2 text-sky-400 text-2xl font-bold mb-8">
          <FaBus /> GoSwift
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">
          Create Account 🚀
        </h2>

        <input onChange={(e)=>setName(e.target.value)} placeholder="Full Name" className="w-full mb-3 p-3 rounded-xl bg-slate-800"/>
        <input onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 p-3 rounded-xl bg-slate-800"/>
        <input type="password" onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full mb-6 p-3 rounded-xl bg-slate-800"/>

        <button onClick={handleRegister} className="w-full py-3 bg-pink-600 rounded-xl">
          Sign Up
        </button>

        <p className="text-center mt-4">
          <Link to="/login">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;