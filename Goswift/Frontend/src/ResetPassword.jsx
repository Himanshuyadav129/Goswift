import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaBus, FaLock } from "react-icons/fa";
import { apiFetch } from "./api";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      await apiFetch("/api/reset-password", { method: "POST", auth: false, body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full pl-12 p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500";

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex justify-center items-center gap-2 text-sky-400 text-2xl font-bold mb-6">
          <FaBus /> GoSwift
        </div>
        <h2 className="text-2xl font-semibold text-center mb-6">Choose a new password</h2>

        {!token ? (
          <p className="text-red-400 text-sm text-center">This reset link is incomplete. Request a new one.</p>
        ) : done ? (
          <p className="text-emerald-300 text-sm text-center">Password changed. You can log in now.</p>
        ) : (
          <form onSubmit={submit}>
            <div className="relative mb-4">
              <FaLock className="absolute left-4 top-4 text-slate-400" />
              <input type="password" placeholder="New password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <div className="relative mb-5">
              <FaLock className="absolute left-4 top-4 text-slate-400" />
              <input type="password" placeholder="Confirm new password" value={confirm} autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} className={input} />
            </div>
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
            <button disabled={loading} className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60">
              {loading ? "Saving..." : "Change password"}
            </button>
          </form>
        )}

        <p className="text-center text-slate-400 mt-6 text-sm">
          {!token ? (
            <Link to="/forgot-password" className="text-sky-400 hover:underline">Request a new link</Link>
          ) : (
            <Link to="/login" className="text-sky-400 hover:underline">{done ? "Go to login" : "Back to login"}</Link>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
