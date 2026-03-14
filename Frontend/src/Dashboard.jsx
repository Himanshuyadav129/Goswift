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
              src="data:image/jpeg;base64,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"
              alt="Bus"
              className="w-full h-108 object-cover rounded-2xl shadow-lg"
            />
          </div>

        </div>
      </section>
        
{/* 🚍 Bus Showcase Section */}
<section className="bg-slate-100 py-20">

  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-800 mb-12">
      Explore Our Smart Transport Network
    </h2>

    <div className="grid md:grid-cols-3 gap-8">

      {/* Card 1 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition">
        <img
          src="data:image/jpeg;base64,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"
          alt="City Bus"
          className="h-56 w-full object-cover"
        />
        <div className="p-6">
          <h3 className="font-semibold text-xl mb-2">City Transport</h3>
          <p className="text-slate-600 text-sm">
            Reliable buses covering all major city routes with real-time GPS tracking.
          </p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition">
        <img
          src="data:image/jpeg;base64,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"
          alt="Intercity Bus"
          className="h-56 w-full object-cover"
        />
        <div className="p-6">
          <h3 className="font-semibold text-xl mb-2">Intercity Routes</h3>
          <p className="text-slate-600 text-sm">
            Efficient transport connecting nearby cities with smart route monitoring.
          </p>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition">
        <img
          src="data:image/jpeg;base64,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"
          alt="Smart Bus"
          className="h-56 w-full object-cover"
        />
        <div className="p-6">
          <h3 className="font-semibold text-xl mb-2">Smart Tracking</h3>
          <p className="text-slate-600 text-sm">
            Track buses live and monitor routes using our advanced system.
          </p>
        </div>
      </div>

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