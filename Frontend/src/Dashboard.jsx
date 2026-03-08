import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBus,
  FaHome,
  FaMapMarkedAlt,
  FaUserTie,
  FaInfoCircle,
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaUserPlus,
  FaClock,
  FaRoute,
  FaShieldAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaSignOutAlt
} from "react-icons/fa";

const Dashboard = () => {

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">

      {/* 🔵 Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">

            <div className="flex items-center gap-2 text-sky-600 font-bold text-xl cursor-pointer"
            onClick={() => navigate("/")}>
              <FaBus className="text-2xl" />
              GoSwift
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-8 font-medium text-slate-700">

              <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:text-sky-600">
                <FaHome /> Home
              </button>

              <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 hover:text-sky-600">
                <FaUserTie /> Admin
              </button>

              <button
              onClick={() => navigate("/track")}
              className="flex items-center gap-2 hover:text-sky-600">
                <FaMapMarkedAlt /> Track
              </button>

              <button
              onClick={() => navigate("/driver")}
              className="flex items-center gap-2 hover:text-sky-600">
                <FaUserTie /> Driver
              </button>

              <button
              onClick={() => navigate("/about")}
              className="flex items-center gap-2 hover:text-sky-600">
                <FaInfoCircle /> About
              </button>

            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">

              {!token ? (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl border border-sky-600 text-sky-600 font-medium hover:bg-sky-50 transition">
                    <FaSignInAlt />
                    Sign In
                  </button>

                  <button
                    onClick={() => navigate("/signup")}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 text-white font-semibold shadow-md hover:bg-sky-700 transition">
                    <FaUserPlus />
                    Sign Up
                  </button>
                </>
              ) : (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">
                  <FaSignOutAlt />
                  Logout
                </button>
              )}

            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-2xl text-slate-700"
              onClick={() => setOpen(!open)}
            >
              {open ? <FaTimes /> : <FaBars />}
            </button>

          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden bg-white shadow-lg px-6 py-6 space-y-4">

            <button onClick={() => navigate("/")} className="flex items-center gap-3">
              <FaHome /> Home
            </button>

            <button onClick={() => navigate("/admin")} className="flex items-center gap-3">
              <FaUserTie /> Admin
            </button>

            <button onClick={() => navigate("/track")} className="flex items-center gap-3">
              <FaMapMarkedAlt /> Track
            </button>

            <button onClick={() => navigate("/driver")} className="flex items-center gap-3">
              <FaUserTie /> Driver
            </button>

            <button onClick={() => navigate("/about")} className="flex items-center gap-3">
              <FaInfoCircle /> About
            </button>

            <div className="border-t pt-4 flex flex-col gap-3">

              {!token ? (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-sky-600 text-sky-600 rounded-lg">
                    <FaSignInAlt />
                    Sign In
                  </button>

                  <button
                    onClick={() => navigate("/signup")}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg">
                    <FaUserPlus />
                    Sign Up
                  </button>
                </>
              ) : (
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
                  <FaSignOutAlt />
                  Logout
                </button>
              )}

            </div>

          </div>
        )}

      </header>

      {/* 🔥 Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">

        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-sky-600 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-600 opacity-20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 items-center gap-12">

          <div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Smart & Reliable <br />
              <span className="text-sky-400">Bus Tracking System</span>
            </h1>

            <p className="mt-6 text-lg text-slate-300 max-w-xl">
              Monitor buses in real-time, manage routes efficiently and ensure
              passenger safety with advanced GPS integration.
            </p>

            <div className="mt-8 flex gap-4">

              <button
              onClick={() => navigate("/track")}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-700 rounded-xl font-semibold shadow-lg">
                Track Bus
              </button>

              <button
              onClick={() => navigate("/about")}
              className="px-8 py-3 border border-slate-500 hover:border-sky-400 rounded-xl">
                Learn More
              </button>

            </div>

          </div>

          <div>
            <img
              src="bus1.jpg"
              alt="Bus"
              className="w-full h-108 object-cover rounded-2xl shadow-lg"
            />
          </div>

        </div>
      </section>

      {/* ⭐ Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">

          <div className="p-8 shadow-lg rounded-2xl text-center">
            <FaClock className="text-4xl text-sky-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Live Tracking</h3>
            <p className="text-slate-600">Real-time GPS tracking.</p>
          </div>

          <div className="p-8 shadow-lg rounded-2xl text-center">
            <FaRoute className="text-4xl text-indigo-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Route Management</h3>
            <p className="text-slate-600">Smart route monitoring.</p>
          </div>

          <div className="p-8 shadow-lg rounded-2xl text-center">
            <FaShieldAlt className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Secure System</h3>
            <p className="text-slate-600">JWT authentication security.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-10 text-center">

          <h3 className="text-white text-xl font-bold mb-2">GoSwift</h3>
          <p>Smart Bus Tracking System</p>

          <div className="flex justify-center gap-6 mt-6 text-xl">
            <FaFacebook />
            <FaTwitter />
            <FaInstagram />
          </div>

          <p className="mt-6 text-sm">
            © {year} GoSwift. Built by Himanshu
          </p>

        </div>
      </footer>

    </div>
  );
};

export default Dashboard;