import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaBus,
  FaBars,
  FaUserCircle,
  FaMapMarkerAlt,
  FaClock,
  FaRoute,
  FaPowerOff,
  FaUsers,
  FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_URL, apiFetch, clearAuth, getToken } from "./api";

const Counter = ({ end }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return <span>{count}</span>;
};

const DriverPanel = () => {

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" && window.innerWidth >= 768);
  const [trip, setTrip] = useState(null); // the trip I am driving right now (null = off duty)
  const [summary, setSummary] = useState({ tripsToday: 0, distanceTodayKm: 0 });
  const [busy, setBusy] = useState(false);
  const active = !!trip;

  const [location,setLocation] = useState(null);
  const [bus, setBus] = useState(null);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const lastPosRef = useRef(null); // last GPS fix {latitude, longitude}
  const lastSentRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [sentAt, setSentAt] = useState(null);

  const pending = error.includes("waiting for admin approval");

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  // Which bus am I driving? (assigned by the admin)
  useEffect(() => {
    apiFetch("/api/buses/mine")
      .then(setBus)
      .catch((e) => setError(e.message));
  }, []);

  const refreshSummary = async () => {
    try {
      const s = await apiFetch("/api/driver/summary");
      setSummary({ tripsToday: s.tripsToday, distanceTodayKm: s.distanceTodayKm });
      setTrip(s.currentTrip);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTrip = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await apiFetch("/api/driver/trips/start", { method: "POST" });
      setTrip(r.trip);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      refreshSummary();
    }
  };

  const endTrip = async () => {
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/driver/trips/end", { method: "POST" });
      setTrip(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      refreshSummary();
    }
  };

  // Live connection, authenticated with my login token
  useEffect(() => {
    const socket = io(API_URL, { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (e) => {
      setConnected(false);
      setError(`Live connection failed: ${e.message}`);
    });
    return () => socket.disconnect();
  }, []);

  // Real GPS from THIS device (phone): watchPosition gives a new fix whenever the phone moves.
  // We send at most one update every 3 s, plus a heartbeat every 10 s so the bus does not look
  // "offline" while standing still at a signal or a stop.
  useEffect(() => {
    if (!active || !bus) return;

    if (!window.isSecureContext) {
      setError("Phone GPS only works on a secure (https) page. Open the deployed https link of this site.");
      return;
    }
    if (!navigator.geolocation) {
      setError("This browser does not support GPS.");
      return;
    }

    const send = (minGapMs) => {
      const pos = lastPosRef.current;
      const socket = socketRef.current;
      if (!pos || !socket?.connected) return;
      const now = Date.now();
      if (now - lastSentRef.current < minGapMs) return;
      lastSentRef.current = now;
      socket.emit("busLocation", { busId: bus._id, latitude: pos.latitude, longitude: pos.longitude }, (res) => {
        if (res?.ok) {
          setSentAt(new Date());
          setError("");
        } else if (res && res.error !== "Too many updates") {
          setError(res.error);
        }
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        lastPosRef.current = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        setLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
        setAccuracy(Math.round(p.coords.accuracy));
        send(3000);
      },
      (err) =>
        setError(
          err.code === 1
            ? "Location permission denied. Allow location for this site in your browser settings, then reload."
            : err.code === 2
            ? "GPS signal unavailable. Move to an open area."
            : "GPS timed out, trying again..."
        ),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    const heartbeat = setInterval(() => send(9000), 10000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(heartbeat);
    };
  }, [active, bus]);

  // Keep the phone screen on during a trip (browsers pause GPS when the screen turns off)
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    const grab = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* not allowed right now - ignore */
      }
    };
    const onVisible = () => document.visibilityState === "visible" && grab();
    grab();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, [active]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex overflow-hidden relative">

      {/* Glow Background */}
      <div className="absolute w-96 h-96 bg-sky-500 opacity-20 blur-3xl rounded-full top-10 left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-purple-600 opacity-20 blur-3xl rounded-full bottom-10 right-10 animate-pulse"></div>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-300 p-5 flex flex-col flex-shrink-0 z-10`}
      >
        <div className="flex items-center justify-between mb-10">
          {sidebarOpen && (
            <h2 className="text-xl font-bold text-sky-400 tracking-wide">
              GoSwift
            </h2>
          )}
          <FaBars
            className="cursor-pointer text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        <div className="space-y-6 mt-6">
          {[FaBus, FaRoute, FaClock].map((Icon, i) => (
            <motion.div
              key={i}
              whileHover={{ x: 5 }}
              className="flex items-center gap-3 hover:text-sky-400 cursor-pointer transition"
            >
              <Icon />
              {sidebarOpen && (
                <span>
                  {i === 0
                    ? "Dashboard"
                    : i === 1
                    ? "My Route"
                    : "Trip History"}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col relative z-10">

        {/* Navbar */}
        <div className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 sm:px-10 flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-wide text-sky-400">
            Driver Dashboard
          </h1>

          <div className="flex items-center gap-6">
            <span
              className={`px-4 py-1 rounded-full text-sm font-semibold ${
                active
                  ? "bg-green-600 shadow-lg shadow-green-500/30"
                  : "bg-red-600 shadow-lg shadow-red-500/30"
              }`}
            >
              {active ? "Active" : "Offline"}
            </span>

            <FaUserCircle className="text-3xl text-sky-400" />
            <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-300 hover:text-red-400">
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-10 space-y-8 sm:space-y-12 overflow-y-auto">

          {bus && (
            <p className="text-slate-300">
              Your bus: <span className="font-bold text-sky-400">{bus.busNumber}</span> ({bus.source} → {bus.destination})
            </p>
          )}
          {pending && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-200">
              Your driver account is waiting for admin approval. Once an admin approves it and assigns you a bus,
              reload this page and you can start trips.
            </div>
          )}
          {error && !pending && <p className="text-red-400">{error}</p>}

          <div className="flex items-center gap-4">
            {!active ? (
              <button
                onClick={startTrip}
                disabled={busy || !bus || pending}
                className="px-8 py-3 rounded-2xl bg-green-600 hover:bg-green-700 font-semibold shadow-lg disabled:opacity-50"
              >
                Start trip
              </button>
            ) : (
              <button
                onClick={endTrip}
                disabled={busy}
                className="px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-semibold shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                <FaPowerOff /> End trip
              </button>
            )}
            <span className="text-slate-400 text-sm">
              {active
                ? "Trip in progress: your live location is being shared."
                : "Start a trip to share your live location with passengers."}
            </span>
          </div>

          {active && (
            <div className="text-sm text-slate-300 space-y-1">
              <p>
                Live connection:{" "}
                <span className={connected ? "text-green-400" : "text-red-400"}>{connected ? "connected" : "disconnected"}</span>
              </p>
              <p>GPS accuracy: {accuracy !== null ? `±${accuracy} m` : "waiting for GPS..."}</p>
              <p>Last location sent: {sentAt ? sentAt.toLocaleTimeString() : "-"}</p>
              <p className="text-slate-500">Keep this page open and the screen on while driving.</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8">

            <motion.div className="bg-gradient-to-br from-sky-600 to-indigo-600 p-8 rounded-3xl shadow-2xl">
              <div className="text-4xl mb-4"><FaMapMarkerAlt/></div>
              <h3 className="text-lg font-semibold">Current Location</h3>
              <p className="mt-2 text-xl font-bold">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Fetching..."}
              </p>
            </motion.div>

            <motion.div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-3xl shadow-2xl">
              <div className="text-4xl mb-4"><FaClock/></div>
              <h3 className="text-lg font-semibold">Trips Today</h3>
              <p className="mt-2 text-xl font-bold"><Counter end={summary.tripsToday}/></p>
            </motion.div>

            <motion.div className="bg-gradient-to-br from-emerald-600 to-green-600 p-8 rounded-3xl shadow-2xl">
              <div className="text-4xl mb-4"><FaUsers/></div>
              <h3 className="text-lg font-semibold">Distance Today</h3>
              <p className="mt-2 text-xl font-bold">{summary.distanceTodayKm} km</p>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DriverPanel;