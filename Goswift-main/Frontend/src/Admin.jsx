import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBus,
  FaUsers,
  FaRoute,
  FaExclamationTriangle,
  FaChartBar,
  FaTachometerAlt,
  FaSignOutAlt,
  FaHome,
  FaBullhorn,
  FaMapMarkedAlt
} from "react-icons/fa";
import { apiFetch, clearAuth, getUser } from "./api";
import BusesTab from "./admin/BusesTab";
import DriversTab from "./admin/DriversTab";
import RoutesTab from "./admin/RoutesTab";
import ReportsTab from "./admin/ReportsTab";
import AnnouncementsTab from "./admin/AnnouncementsTab";
import LiveMapTab from "./admin/LiveMapTab";

const TABS = [
  { id: "overview", text: "Overview", icon: <FaTachometerAlt /> },
  { id: "map", text: "Live Map", icon: <FaMapMarkedAlt /> },
  { id: "buses", text: "Buses", icon: <FaBus /> },
  { id: "routes", text: "Routes", icon: <FaRoute /> },
  { id: "drivers", text: "Drivers", icon: <FaUsers /> },
  { id: "announce", text: "Announcements", icon: <FaBullhorn /> },
  { id: "reports", text: "Reports", icon: <FaChartBar /> }
];

const Overview = ({ navigate }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () =>
      apiFetch("/api/admin/stats")
        .then((d) => {
          if (alive) {
            setStats(d);
            setError("");
          }
        })
        .catch((e) => {
          if (e.status === 401) {
            clearAuth();
            navigate("/login");
          } else if (alive) setError(e.message);
        });
    load();
    const t = setInterval(load, 10000); // refresh every 10s
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [navigate]);

  const label = { running: "Running", maintenance: "Maintenance", idle: "Idle" };
  const color = { running: "text-green-400", maintenance: "text-yellow-400", idle: "text-slate-400" };
  const v = (x) => (stats ? stats[x] : "-");

  return (
    <>
      {error && <p className="mb-6 text-red-400">{error}</p>}

      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Buses" value={v("totalBuses")} color="text-sky-400" />
        <StatCard title="Active" value={v("running")} color="text-green-400" />
        <StatCard title="Maintenance" value={v("maintenance")} color="text-yellow-400" />
        <StatCard title="Alerts" value={v("alerts")} color="text-red-400" hint="Running, but no GPS for 5+ min" />
      </div>
      <div className="grid md:grid-cols-5 gap-6 mb-10">
        <StatCard title="Routes" value={v("totalRoutes")} color="text-sky-400" />
        <StatCard title="Drivers" value={v("totalDrivers")} color="text-sky-400" />
        <StatCard title="Pending drivers" value={v("pendingDrivers")} color="text-yellow-400" hint="Waiting for approval (Drivers tab)" />
        <StatCard title="Registered users" value={v("totalUsers")} color="text-sky-400" />
        <StatCard title="Trips on the road" value={v("ongoingTrips")} color="text-green-400" />
      </div>

      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <h2 className="text-xl font-semibold mb-6 text-slate-300">Fleet Status</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="pb-4">Bus ID</th>
              <th className="pb-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.fleet || []).map((bus) => (
              <tr key={bus._id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="py-5 font-medium">{bus.id}</td>
                <td className={`py-5 font-semibold ${color[bus.status] || ""}`}>{label[bus.status] || bus.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const user = getUser();

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 overflow-y-auto bg-slate-900/80 backdrop-blur-xl border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          <h2 className="text-sky-400 text-xl font-extrabold mb-10 tracking-wide">🚍 GoSwift Admin</h2>
          <nav className="space-y-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition ${
                  tab === t.id ? "bg-sky-600/20 text-sky-400" : "text-slate-400 hover:text-sky-400 hover:bg-white/5"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="font-medium">{t.text}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-2 text-slate-400">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:text-sky-400 hover:bg-white/5">
            <FaHome /> Home
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:text-red-400 hover:bg-white/5">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-6 md:p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-sky-400 tracking-wide">
            {TABS.find((t) => t.id === tab).text}
          </h1>
          <div className="flex items-center gap-3 text-slate-300">
            <FaExclamationTriangle className="text-slate-500" title="Alerts are shown on the Overview" />
            <span className="hidden sm:inline">{user?.name}</span>
            <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center font-bold">
              {(user?.name || "A")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {tab === "overview" && <Overview navigate={navigate} />}
        {tab === "map" && <LiveMapTab />}
        {tab === "buses" && <BusesTab />}
        {tab === "routes" && <RoutesTab />}
        {tab === "drivers" && <DriversTab />}
        {tab === "announce" && <AnnouncementsTab />}
        {tab === "reports" && <ReportsTab />}
      </main>
    </div>
  );
};

const StatCard = ({ title, value, color, hint }) => (
  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
    <h3 className="text-slate-400 text-sm tracking-wide">{title}</h3>
    <p className={`text-3xl font-extrabold mt-4 ${color}`}>{value}</p>
    {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
  </div>
);

export default Admin;
