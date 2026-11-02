import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaBus, FaEnvelope } from "react-icons/fa";
import { apiFetch } from "./api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const d = await apiFetch("/api/forgot-password", { method: "POST", auth: false, body: { email } });
      setDone(d.message);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex justify-center items-center gap-2 text-sky-400 text-2xl font-bold mb-6">
          <FaBus /> GoSwift
        </div>
        <h2 className="text-2xl font-semibold text-center mb-2">Forgot password?</h2>
        <p className="text-center text-slate-400 text-sm mb-6">Enter your email and we will send you a link to choose a new password.</p>

        {done ? (
          <p className="text-emerald-300 text-sm text-center">{done} Check your inbox (and spam folder). The link works for 30 minutes.</p>
        ) : (
          <form onSubmit={submit}>
            <div className="relative mb-5">
              <FaEnvelope className="absolute left-4 top-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
            <button disabled={loading} className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-slate-400 mt-6 text-sm">
          <Link to="/login" className="text-sky-400 hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
