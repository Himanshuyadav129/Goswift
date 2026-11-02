import { useCallback, useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import { API_URL, apiFetch, getToken } from "./api";
import PushToggle from "./PushToggle";

// Bell with unread badge + live pop-up when the server pushes a "notification" (bus approaching / arrived).
// Renders nothing for logged-out visitors. `light` = for use on a white navbar.
const NotificationBell = ({ light = false }) => {
  const token = getToken();
  const [data, setData] = useState({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const boxRef = useRef(null);

  // Close the list when you click anywhere outside it, or press Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const load = useCallback(() => apiFetch("/api/notifications").then(setData).catch(() => {}), []);

  useEffect(() => {
    if (!token) return;
    load();
    const socket = io(API_URL, { auth: { token } });
    let timer;
    socket.on("notification", (n) => {
      setData((d) => ({ unreadCount: d.unreadCount + 1, items: [n, ...d.items].slice(0, 50) }));
      setToast(n);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 8000);
    });
    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, [token, load]);

  if (!token) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && data.unreadCount > 0) {
      try {
        await apiFetch("/api/notifications/read-all", { method: "PUT" });
        setData((d) => ({ ...d, unreadCount: 0 }));
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className={`relative p-2 rounded-full text-xl ${light ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-white/10"}`}
      >
        <FaBell />
        {data.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center">
            {data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-slate-900 text-slate-100 border border-white/10 shadow-2xl z-50">
          <p className="px-4 py-3 border-b border-white/10 font-semibold">Notifications</p>
          <PushToggle />
          {data.items.length === 0 && <p className="px-4 py-6 text-slate-400 text-sm">No notifications yet.</p>}
          {data.items.map((n) => (
            <div key={n._id} className="px-4 py-3 border-b border-white/5 last:border-0">
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-slate-300">{n.message}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div onClick={() => setToast(null)} className="fixed top-4 right-4 z-[100] w-80 rounded-2xl bg-sky-600 text-white p-4 shadow-2xl cursor-pointer">
          <p className="font-semibold">{toast.title}</p>
          <p className="text-sm text-sky-50">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
