import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { FaBullhorn, FaExclamationTriangle, FaClock, FaTimes } from "react-icons/fa";
import { API_URL, apiFetch } from "./api";

const STYLE = {
  info: { box: "bg-sky-50 border-sky-200 text-sky-900", icon: <FaBullhorn /> },
  delay: { box: "bg-amber-50 border-amber-300 text-amber-900", icon: <FaClock /> },
  alert: { box: "bg-red-50 border-red-300 text-red-900", icon: <FaExclamationTriangle /> }
};

// Shows active admin announcements (everyone + this bus / route). Updates live over the socket.
// Passengers can dismiss one; it stays hidden in this browser.
const AnnouncementBanner = ({ busId, routeId, className = "" }) => {
  const [items, setItems] = useState([]);
  const [hidden, setHidden] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hiddenAnnouncements") || "[]");
    } catch {
      return [];
    }
  });

  const load = useCallback(() => {
    const q = new URLSearchParams();
    if (busId) q.set("busId", busId);
    if (routeId) q.set("routeId", routeId);
    apiFetch(`/api/announcements?${q}`, { auth: false }).then(setItems).catch(() => {});
  }, [busId, routeId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    const socket = io(API_URL);
    socket.on("announcement", load);
    socket.on("announcementRemoved", load);
    return () => {
      clearInterval(t);
      socket.disconnect();
    };
  }, [load]);

  const hide = (id) => {
    const next = [...hidden, id].slice(-50);
    setHidden(next);
    try {
      localStorage.setItem("hiddenAnnouncements", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const shown = items.filter((a) => !hidden.includes(a._id));
  if (!shown.length) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {shown.map((a) => {
        const st = STYLE[a.severity] || STYLE.info;
        return (
          <div key={a._id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${st.box}`}>
            <span className="mt-0.5">{st.icon}</span>
            <p className="flex-1">{a.message}</p>
            <button onClick={() => hide(a._id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
              <FaTimes />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
