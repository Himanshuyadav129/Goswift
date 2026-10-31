import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaBus, FaUserTie, FaUser } from "react-icons/fa";
import { apiFetch } from "./api";
import { homeFor } from "./ProtectedRoute";

const inputCls = "w-full mb-3 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500";

const Register = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user"); // "user" = passenger, "driver"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDriver = mode === "driver";

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || (isDriver && !phone)) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // The server logs you in straight away, so there is no separate login step after signing up.
      const data = await apiFetch("/api/register", {
        method: "POST",
        auth: false,
        body: { name, email, password, role: mode, phone }
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
      <div className="absolute w-[400px] h-[400px] bg-pink-600 opacity-20 blur-3xl rounded-full -top-20 -left-20 animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-indigo-600 opacity-20 blur-3xl rounded-full -bottom-20 -right-20 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-center items-center gap-2 text-sky-400 text-2xl font-bold mb-6">
          <FaBus /> GoSwift
        </div>

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
                mode === t.id ? (t.id === "driver" ? "bg-emerald-600" : "bg-pink-600") : "text-slate-400 hover:text-white"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">
          {isDriver ? "Driver Sign Up 🚌" : "Create Account 🚀"}
        </h2>

        <form onSubmit={handleRegister}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" autoComplete="name" className={inputCls} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" className={inputCls} />
          {isDriver && (
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" autoComplete="tel" className={inputCls} />
          )}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" autoComplete="new-password" className={inputCls} />

          {isDriver && (
            <p className="text-xs text-amber-300 mb-4">
              An admin must approve your driver account and assign a bus before you can start trips.
            </p>
          )}
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl disabled:opacity-60 ${isDriver ? "bg-emerald-600 hover:bg-emerald-700" : "bg-pink-600 hover:bg-pink-700"}`}
          >
            {loading ? "Creating account..." : isDriver ? "Sign Up as Driver" : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 text-slate-400 text-sm">
          Already have an account? <Link to="/login" className="text-sky-400 hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
