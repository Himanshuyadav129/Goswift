import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBus,
  FaBars,
  FaUserCircle,
  FaMapMarkerAlt,
  FaClock,
  FaRoute,
  FaPowerOff,
  FaUsers
} from "react-icons/fa";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [active, setActive] = useState(true);

  const [location,setLocation] = useState(null);

  // ⚡ busId (temporary)
  const busId = "69ac61a6bcee94d96ae2c856";

  // GPS tracking
  useEffect(()=>{

    if(!active) return;

    const interval = setInterval(()=>{

      navigator.geolocation.getCurrentPosition((pos)=>{

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({
          lat,
          lng
        });

        // send to backend
        socket.emit("busLocation",{
          busId:busId,
          latitude:lat,
          longitude:lng
        });

        console.log("Location sent:",lat,lng);

      });

    },5000);

    return ()=>clearInterval(interval);

  },[active]);

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
        <div className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-10 flex justify-between items-center">
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

            <FaUserCircle className="text-3xl text-sky-400 cursor-pointer" />
          </div>
        </div>

        {/* Content */}
        <div className="p-10 space-y-12 overflow-y-auto">

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
              <p className="mt-2 text-xl font-bold"><Counter end={8}/></p>
            </motion.div>

            <motion.div className="bg-gradient-to-br from-emerald-600 to-green-600 p-8 rounded-3xl shadow-2xl">
              <div className="text-4xl mb-4"><FaUsers/></div>
              <h3 className="text-lg font-semibold">Passengers</h3>
              <p className="mt-2 text-xl font-bold"><Counter end={32}/></p>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DriverPanel;