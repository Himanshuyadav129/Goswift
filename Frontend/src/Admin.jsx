import { useState } from "react";
import {
  FaBus,
  FaUsers,
  FaRoute,
  FaExclamationTriangle,
  FaBell,
  FaCog
} from "react-icons/fa";

const Admin = () => {
  const [fleet] = useState([
    { id: "GS-101", status: "Running" },
    { id: "GS-202", status: "Running" },
    { id: "GS-303", status: "Maintenance" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between">

        <div>
          <h2 className="text-sky-400 text-2xl font-extrabold mb-12 tracking-wide">
            🚍 GoSwift Admin
          </h2>

          <nav className="space-y-6">
            <SidebarItem icon={<FaBus />} text="Fleet Overview" />
            <SidebarItem icon={<FaUsers />} text="Drivers" />
            <SidebarItem icon={<FaRoute />} text="Routes" />
            <SidebarItem icon={<FaExclamationTriangle />} text="Alerts" />
          </nav>
        </div>

        <div className="space-y-4 text-slate-400">
          <SidebarItem icon={<FaCog />} text="Settings" />
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-sky-400 tracking-wide">
            Fleet Control Center
          </h1>

          <div className="flex items-center gap-6">
            <FaBell className="text-xl cursor-pointer hover:text-sky-400 transition" />
            <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Buses" value="18" color="text-sky-400" />
          <StatCard title="Active" value="14" color="text-green-400" />
          <StatCard title="Maintenance" value="4" color="text-yellow-400" />
          <StatCard title="Alerts" value="2" color="text-red-400" />
        </div>

        {/* Fleet Table */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">

          <h2 className="text-xl font-semibold mb-6 text-slate-300">
            Fleet Status
          </h2>

          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="pb-4">Bus ID</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {fleet.map((bus) => (
                <tr
                  key={bus.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-5 font-medium">{bus.id}</td>
                  <td
                    className={`py-5 font-semibold ${
                      bus.status === "Running"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {bus.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </main>
    </div>
  );
};

const SidebarItem = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-slate-400 hover:text-sky-400 hover:translate-x-1 cursor-pointer transition duration-300">
    <span className="text-lg">{icon}</span>
    <span className="font-medium">{text}</span>
  </div>
);

const StatCard = ({ title, value, color }) => (
  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg hover:scale-105 transition duration-300">
    <h3 className="text-slate-400 text-sm tracking-wide">{title}</h3>
    <p className={`text-3xl font-extrabold mt-4 ${color}`}>
      {value}
    </p>
  </div>
);

export default Admin;