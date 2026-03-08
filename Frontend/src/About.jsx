import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaBus,
  FaUsers,
  FaRoute,
  FaShieldAlt,
  FaLinkedin,
  FaTwitter,
  FaRocket
} from "react-icons/fa";

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

const About = () => {
  return (
    <div className="bg-[#0f172a] text-white overflow-hidden">

      {/* 🔥 HERO */}
      <section className="relative py-40 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] overflow-hidden">

        {/* Glow Effects */}
        <div className="absolute w-96 h-96 bg-sky-500 opacity-20 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-600 opacity-20 rounded-full blur-3xl bottom-10 right-10 animate-pulse"></div>

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative max-w-7xl mx-auto px-6 text-center"
        >
          <div className="flex justify-center mb-6 text-sky-400 text-5xl">
            <FaRocket />
          </div>

          <h1 className="text-6xl font-extrabold mb-8 leading-tight">
            Powering The Future of <br />
            <span className="text-sky-400">Urban Mobility</span>
          </h1>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            GoSwift is redefining intelligent transport infrastructure
            with AI-driven insights, real-time data and secure architecture.
          </p>

          <button className="bg-sky-500 hover:bg-sky-600 px-12 py-4 rounded-2xl font-semibold shadow-lg shadow-sky-500/30 transition">
            Discover More
          </button>
        </motion.div>
      </section>

      {/* 🔥 FEATURES */}
      <section className="py-32 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">

          {[
            { icon: <FaBus />, title: "Live Tracking", color: "text-sky-400" },
            { icon: <FaUsers />, title: "Passenger Safety", color: "text-purple-400" },
            { icon: <FaRoute />, title: "Smart Routing", color: "text-emerald-400" },
            { icon: <FaShieldAlt />, title: "Enterprise Security", color: "text-pink-400" }
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-xl"
            >
              <div className={`text-4xl mb-6 ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">
                {item.title}
              </h3>
              <p className="text-slate-400">
                Advanced infrastructure built for scalability and precision.
              </p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* 🔥 STATS */}
      <section className="py-32 bg-gradient-to-r from-sky-600 to-purple-700 text-white text-center">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-16">

          <div>
            <h2 className="text-5xl font-bold">
              <Counter end={150} />+
            </h2>
            <p className="mt-4 opacity-90">Active Drivers</p>
          </div>

          <div>
            <h2 className="text-5xl font-bold">
              <Counter end={50000} />+
            </h2>
            <p className="mt-4 opacity-90">Daily Riders</p>
          </div>

          <div>
            <h2 className="text-5xl font-bold">
              <Counter end={120} />+
            </h2>
            <p className="mt-4 opacity-90">Smart Routes</p>
          </div>

          <div>
            <h2 className="text-5xl font-bold">
              <Counter end={99} />%
            </h2>
            <p className="mt-4 opacity-90">On-Time Rate</p>
          </div>

        </div>
      </section>

      {/* 🔥 TEAM */}
      <section className="py-32 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-sky-400">
            Leadership Team
          </h2>
          <p className="text-slate-400 text-lg">
            Experts driving next-generation transport solutions.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">

          {["CEO", "CTO", "Operations Head"].map((role, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl text-center shadow-lg"
            >
              <img
                src={`https://randomuser.me/api/portraits/men/${index + 30}.jpg`}
                alt="team"
                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-sky-500"
              />
              <h3 className="text-xl font-semibold mb-2">John Doe</h3>
              <p className="text-slate-400 mb-4">{role}</p>

              <div className="flex justify-center gap-4 text-sky-400 text-lg">
                <FaLinkedin />
                <FaTwitter />
              </div>
            </motion.div>
          ))}

        </div>
      </section>

      {/* 🔥 FINAL CTA */}
      <section className="py-32 bg-gradient-to-br from-purple-800 to-sky-700 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Transform Your City’s Mobility
        </h2>
        <p className="text-slate-200 max-w-2xl mx-auto mb-10 text-lg">
          Experience secure, intelligent and seamless transport systems with GoSwift.
        </p>

        <button className="bg-white text-sky-700 px-12 py-4 rounded-2xl font-semibold hover:bg-slate-200 transition shadow-xl">
          Get Started Today
        </button>
      </section>

    </div>
  );
};

export default About;