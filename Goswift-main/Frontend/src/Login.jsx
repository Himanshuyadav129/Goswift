import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaBus, FaUserTie, FaUser } from "react-icons/fa";
import { apiFetch } from "./api";
import { homeFor } from "./ProtectedRoute";

const Login = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user"); // "user" = passenger, "driver"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDriver = mode === "driver";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/login", {
        method: "POST",
        auth: false,
        body: { email, password, loginAs: mode }
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(homeFor(data.user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden text-white p-4">

      <div className={`absolute w-[400px] h-[400px] ${isDriver ? "bg-emerald-600" : "bg-sky-600"} opacity-20 blur-3xl rounded-full -top-20 -left-20 animate-pulse`}></div>
      <div className="absolute w-[400px] h-[400px] bg-purple-600 opacity-20 blur-3xl rounded-full -bottom-20 -right-20 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl"
      >

        <div className="flex justify-center items-center gap-2 text-sky-400 text-2xl font-bold mb-6">
          <FaBus />
          GoSwift
        </div>

        {/* Passenger / Driver switch */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-2xl bg-slate-800">
          {[
            { id: "user", label: "Passenger", icon: <FaUser /> },
            { id: "driver", label: "Driver", icon: <FaUserTie /> }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMode(t.id);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition ${
                mode === t.id ? (t.id === "driver" ? "bg-emerald-600" : "bg-sky-600") : "text-slate-400 hover:text-white"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">
          {isDriver ? "Driver Login 🚌" : "Welcome Back 👋"}
        </h2>

        <form onSubmit={handleLogin}>
          <div className="relative mb-5">
            <FaEnvelope className="absolute left-4 top-4 text-slate-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              autoComplete="email"
              className="w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative mb-2">
            <FaLock className="absolute left-4 top-4 text-slate-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              className="w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-4 text-right">
            <Link to="/forgot-password" className="text-sm text-sky-400 hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl shadow-lg transition disabled:opacity-60 ${
              isDriver ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30" : "bg-sky-600 hover:bg-sky-700 shadow-sky-500/30"
            }`}
          >
            {loading ? "Signing in..." : isDriver ? "Sign In as Driver" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-sky-400 hover:underline">
            Sign Up
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Login;
