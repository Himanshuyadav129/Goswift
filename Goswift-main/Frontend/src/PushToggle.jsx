import { useEffect, useState } from "react";
import { apiFetch } from "./api";

const urlBase64ToUint8Array = (b64) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

// "Alerts even when the site is closed" switch (browser push). Lives inside the notification bell.
const PushToggle = () => {
  // unsupported | insecure | denied | off | on | unavailable (server has no keys) | busy
  const [state, setState] = useState("busy");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return alive && setState("unsupported");
      if (!window.isSecureContext) return alive && setState("insecure");
      try {
        const cfg = await apiFetch("/api/push/public-key", { auth: false });
        if (!cfg.enabled) return alive && setState("unavailable");
        if (Notification.permission === "denied") return alive && setState("denied");
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          // re-attach this device to the currently logged-in account
          await apiFetch("/api/push/subscribe", { method: "POST", body: sub.toJSON() }).catch(() => {});
          return alive && setState("on");
        }
        alive && setState("off");
      } catch {
        alive && setState("unsupported");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const enable = async () => {
    setMsg("");
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const cfg = await apiFetch("/api/push/public-key", { auth: false });
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) }));
      await apiFetch("/api/push/subscribe", { method: "POST", body: sub.toJSON() });
      setState("on");
    } catch (err) {
      setMsg(err.message || "Could not turn on alerts");
      setState("off");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        await apiFetch("/api/push/unsubscribe", { method: "POST", body: { endpoint: sub.endpoint } }).catch(() => {});
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  };

  const note = {
    unsupported: "This browser does not support background alerts. On iPhone, add GoSwift to the Home Screen first.",
    insecure: "Background alerts need https:// (localhost is fine).",
    denied: "Notifications are blocked. Allow them in your browser's site settings, then reload.",
    unavailable: "Background alerts are not set up on the server yet."
  }[state];

  return (
    <div className="px-4 py-3 border-b border-white/10 text-sm">
      {note ? (
        <p className="text-slate-400 text-xs">{note}</p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Alerts when site is closed</p>
            <p className="text-xs text-slate-400">{state === "on" ? "On for this device" : "Off"}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state === "on"}
            disabled={state === "busy"}
            onClick={state === "on" ? disable : enable}
            className={`relative w-11 h-6 rounded-full transition disabled:opacity-50 ${state === "on" ? "bg-sky-500" : "bg-slate-600"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${state === "on" ? "translate-x-5" : ""}`} />
          </button>
        </div>
      )}
      {msg && <p className="text-xs text-red-400 mt-1">{msg}</p>}
    </div>
  );
};

export default PushToggle;
