import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { Button, Card, Field, Notice, Td, Th, inputCls } from "./ui";

const SEV = {
  info: { label: "Info", cls: "text-sky-400" },
  delay: { label: "Delay", cls: "text-yellow-400" },
  alert: { label: "Alert", cls: "text-red-400" }
};
const EXPIRY = [
  { v: 60, t: "1 hour" },
  { v: 360, t: "6 hours" },
  { v: 1440, t: "1 day" },
  { v: 4320, t: "3 days" },
  { v: 10080, t: "7 days" }
];
const QUICK = ["Bus 20 minute late hai.", "Bus aaj nahi chalegi.", "Route badal diya gaya hai.", "Bus ab time par chal rahi hai."];

const AnnouncementsTab = () => {
  const [list, setList] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("delay");
  const [scope, setScope] = useState("all");
  const [busId, setBusId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [expires, setExpires] = useState(360);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const [a, b, r] = await Promise.all([apiFetch("/api/announcements/admin"), apiFetch("/api/buses"), apiFetch("/api/routes")]);
      setList(a);
      setBuses(b);
      setRoutes(r);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    setError("");
    setOk("");
    if (!message.trim()) return setError("Write a message first");
    if (scope === "bus" && !busId) return setError("Choose a bus");
    if (scope === "route" && !routeId) return setError("Choose a route");
    if (!window.confirm("Send this message to the passengers now?")) return;
    setSending(true);
    try {
      const a = await apiFetch("/api/announcements", {
        method: "POST",
        body: { message, severity, scope, busId: scope === "bus" ? busId : undefined, routeId: scope === "route" ? routeId : undefined, expiresInMinutes: expires }
      });
      setOk(`Sent. ${a.sentTo} passenger${a.sentTo === 1 ? "" : "s"} got a notification; everyone sees it on the website.`);
      setMessage("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm("Remove this announcement from the website banners?")) return;
    try {
      await apiFetch(`/api/announcements/${a._id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const target = (a) => (a.scope === "bus" ? `Bus ${a.bus?.busNumber || "?"}` : a.scope === "route" ? `Route ${a.route?.name || "?"}` : "Everyone");

  return (
    <div className="grid xl:grid-cols-5 gap-6">
      <Card title="New announcement" className="xl:col-span-2">
        <Notice error={error} ok={ok} />
        <Field label="Message">
          <textarea className={inputCls} rows={3} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Bus GS-101 20 minute late hai" />
        </Field>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => setMessage(q)} className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">
              {q}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select className={inputCls} value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {Object.entries(SEV).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Show for">
            <select className={inputCls} value={expires} onChange={(e) => setExpires(Number(e.target.value))}>
              {EXPIRY.map((x) => (
                <option key={x.v} value={x.v}>{x.t}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Send to">
          <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">All passengers</option>
            <option value="bus">Passengers following one bus</option>
            <option value="route">Passengers following a route</option>
          </select>
        </Field>
        {scope === "bus" && (
          <Field label="Bus">
            <select className={inputCls} value={busId} onChange={(e) => setBusId(e.target.value)}>
              <option value="">Select…</option>
              {buses.map((b) => (
                <option key={b._id} value={b._id}>{b.busNumber}</option>
              ))}
            </select>
          </Field>
        )}
        {scope === "route" && (
          <Field label="Route">
            <select className={inputCls} value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">Select…</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </Field>
        )}
        <p className="text-xs text-slate-500 mb-4">
          Everyone visiting the site sees the banner. "Bus / route" messages also go as a notification only to passengers who set an alert on that bus.
        </p>
        <Button onClick={send} disabled={sending}>{sending ? "Sending..." : "Send announcement"}</Button>
      </Card>

      <Card title="Recent announcements" className="xl:col-span-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <Th>Message</Th>
                <Th>To</Th>
                <Th>Sent</Th>
                <Th>Status</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const active = new Date(a.expiresAt) > new Date();
                return (
                  <tr key={a._id} className="border-b border-white/5">
                    <Td className="max-w-xs">
                      <span className={`font-semibold mr-2 ${SEV[a.severity]?.cls || ""}`}>{SEV[a.severity]?.label}</span>
                      {a.message}
                    </Td>
                    <Td>{target(a)}<span className="block text-xs text-slate-500">{a.sentTo} notified</span></Td>
                    <Td>{new Date(a.createdAt).toLocaleString()}</Td>
                    <Td className={active ? "text-green-400" : "text-slate-500"}>{active ? "Showing" : "Expired"}</Td>
                    <Td><Button variant="danger" onClick={() => remove(a)}>Remove</Button></Td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-slate-500">No announcements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AnnouncementsTab;
