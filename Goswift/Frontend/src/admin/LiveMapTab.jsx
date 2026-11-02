import { useCallback, useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { API_URL, apiFetch } from "../api";
import { Card } from "./ui";

const DELHI = [28.6139, 77.209];
const COLORS = { live: "#22c55e", offline: "#94a3b8", maintenance: "#eab308" };
const isLive = (b) => b.location?.updatedAt && Date.now() - new Date(b.location.updatedAt).getTime() < 2 * 60 * 1000;
const stateOf = (b) => (b.status === "maintenance" ? "maintenance" : isLive(b) ? "live" : "offline");

// Fits the map to all buses once, then leaves the zoom to the admin. Also flies to a bus picked in the list.
const Camera = ({ points, focus }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length === 0) return;
    fitted.current = true;
    map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  useEffect(() => {
    if (focus) map.flyTo(focus, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [focus, map]);
  return null;
};

const LiveMapTab = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([apiFetch("/api/buses"), apiFetch("/api/routes")]);
      setBuses(b);
      setRoutes(r);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, 60000);
    const tick = setInterval(() => setTick((x) => x + 1), 15000); // "Live" -> "Offline" without a reload
    const socket = io(API_URL);
    socket.on("busLocationUpdate", (u) =>
      setBuses((prev) =>
        prev.map((b) =>
          b._id === u.busId
            ? { ...b, status: b.status === "idle" ? "running" : b.status, location: { lat: u.latitude, lng: u.longitude, updatedAt: u.updatedAt } }
            : b
        )
      )
    );
    socket.on("busStatusUpdate", (u) => setBuses((prev) => prev.map((b) => (b._id === u.busId ? { ...b, status: u.status } : b))));
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
      socket.disconnect();
    };
  }, [load]);

  const placed = buses.filter((b) => b.location?.lat != null);
  const points = placed.map((b) => [b.location.lat, b.location.lng]);
  const counts = { live: 0, offline: 0, maintenance: 0 };
  buses.forEach((b) => counts[stateOf(b)]++);

  return (
    <div className="grid xl:grid-cols-4 gap-6">
      <Card title={`Buses (${buses.length})`} className="xl:col-span-1 max-h-[40rem] overflow-y-auto">
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-4">
          {Object.entries(counts).map(([k, n]) => (
            <span key={k} className="flex items-center gap-1 capitalize">
              <i className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[k] }} /> {k} {n}
            </span>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 mb-4">
          <input type="checkbox" checked={showRoutes} onChange={(e) => setShowRoutes(e.target.checked)} /> Show route lines
        </label>
        <ul className="space-y-2">
          {buses.map((b) => {
            const st = stateOf(b);
            const has = b.location?.lat != null;
            return (
              <li key={b._id}>
                <button
                  disabled={!has}
                  onClick={() => setFocus([b.location.lat, b.location.lng])}
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 p-3"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-medium">{b.busNumber}</span>
                    <span className="flex items-center gap-1 text-xs capitalize text-slate-300">
                      <i className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[st] }} /> {st}
                    </span>
                  </span>
                  <span className="block text-xs text-slate-400">
                    {has ? `Updated ${new Date(b.location.updatedAt).toLocaleTimeString()}` : "No location yet"}
                  </span>
                </button>
              </li>
            );
          })}
          {buses.length === 0 && <li className="text-slate-500 text-sm">No buses yet.</li>}
        </ul>
      </Card>

      <Card title="Live map" className="xl:col-span-3">
        <div className="h-[34rem] rounded-2xl overflow-hidden border border-white/10">
          <MapContainer center={DELHI} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Camera points={points} focus={focus} />
            {showRoutes &&
              routes.map((r) =>
                r.stops.length > 1 ? (
                  <Polyline key={r._id} positions={r.stops.map((s) => [s.lat, s.lng])} pathOptions={{ color: "#3987e5", weight: 3, opacity: 0.5 }} />
                ) : null
              )}
            {placed.map((b) => (
              <CircleMarker
                key={b._id}
                center={[b.location.lat, b.location.lng]}
                radius={10}
                pathOptions={{ color: "#fff", weight: 2, fillColor: COLORS[stateOf(b)], fillOpacity: 1 }}
              >
                <Tooltip permanent direction="top" offset={[0, -8]}>{b.busNumber}</Tooltip>
                <Popup>
                  <strong>{b.busNumber}</strong>
                  <br />
                  {b.source} → {b.destination}
                  <br />
                  {stateOf(b)} · {new Date(b.location.updatedAt).toLocaleString()}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        {placed.length === 0 && <p className="text-slate-500 text-sm mt-3">No bus has sent a location yet. Start a trip from the Driver panel (or run npm run simulate).</p>}
      </Card>
    </div>
  );
};

export default LiveMapTab;
