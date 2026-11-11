import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { API_URL, apiFetch, getToken } from "./api";
import NotificationBell from "./NotificationBell";
import AnnouncementBanner from "./AnnouncementBanner";
import Timetable from "./Timetable";
import BusMarker from "./BusMarker";

const STATUS_COLOR = { running: "text-green-400", maintenance: "text-yellow-400", idle: "text-slate-400" };
const STOP_LABEL = { passed: "Passed", arrived: "At stop", next: "Next stop", upcoming: "Upcoming", unknown: "-" };
const DELHI = [28.6139, 77.209];

// Keeps the map centred on the selected bus while "Follow bus" is on
const FollowBus = ({ pos, on }) => {
  const map = useMap();
  const lat = pos ? pos[0] : null;
  const lng = pos ? pos[1] : null;
  useEffect(() => {
    if (on && lat != null) map.panTo([lat, lng], { animate: true, duration: 1 });
  }, [lat, lng, on, map]);
  return null;
};

const UserTracking = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [eta, setEta] = useState(null);
  const [subs, setSubs] = useState([]);
  const [notice, setNotice] = useState("");
  const [follow, setFollow] = useState(true);
  const lastEtaFetch = useRef(0);
  const selectedIdRef = useRef(null);

  const loggedIn = !!getToken();

  // re-render every 30 s so "Live" turns into "Last seen" when a bus goes quiet
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const isLive = (b) => b.location?.updatedAt && Date.now() - new Date(b.location.updatedAt).getTime() < 2 * 60 * 1000;

  const searchBus = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setBuses(await apiFetch("/api/search", { method: "POST", body: { source, destination } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show all buses when the page opens
  useEffect(() => {
    searchBus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEta = useCallback(async (id) => {
    if (!id) return;
    lastEtaFetch.current = Date.now();
    try {
      setEta(await apiFetch(`/api/buses/${id}/eta`));
    } catch {
      setEta(null);
    }
  }, []);

  const loadSubs = useCallback(async () => {
    if (!getToken()) return;
    try {
      setSubs(await apiFetch("/api/subscriptions"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  useEffect(() => {
    setEta(null);
    loadEta(selectedId);
    if (!selectedId) return;
    const t = setInterval(() => loadEta(selectedId), 15000);
    return () => clearInterval(t);
  }, [selectedId, loadEta]);

  // Live updates pushed by the server whenever a driver sends a new position
  useEffect(() => {
    const socket = io(API_URL);
    socket.on("busLocationUpdate", (u) => {
      setBuses((prev) =>
        prev.map((b) =>
          b._id === u.busId
            ? {
                ...b,
                status: b.status === "idle" ? "running" : b.status,
                location: { lat: u.latitude, lng: u.longitude, updatedAt: u.updatedAt }
              }
            : b
        )
      );
      // refresh the ETA table of the selected bus at most every 4 seconds
      if (u.busId === selectedIdRef.current && Date.now() - lastEtaFetch.current > 4000) loadEta(u.busId);
    });
    socket.on("busStatusUpdate", (u) =>
      setBuses((prev) => prev.map((b) => (b._id === u.busId ? { ...b, status: u.status } : b)))
    );
    return () => socket.disconnect();
  }, [loadEta]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const subFor = (stopName) => subs.find((s) => s.bus?._id === selectedId && s.stopName === stopName);

  const toggleAlert = async (stopName) => {
    setNotice("");
    if (!loggedIn) {
      setNotice("Please log in to get alerts.");
      return;
    }
    try {
      const existing = subFor(stopName);
      if (existing) {
        await apiFetch(`/api/subscriptions/${existing._id}`, { method: "DELETE" });
        setNotice(`Alert removed for ${stopName}.`);
      } else {
        await apiFetch("/api/subscriptions", { method: "POST", body: { busId: selectedId, stopName, minutesBefore: 5 } });
        setNotice(`We will notify you 5 minutes before the bus reaches ${stopName}.`);
      }
      loadSubs();
    } catch (err) {
      setNotice(err.message);
    }
  };

  const selected = buses.find((b) => b._id === selectedId);
  const withLocation = buses.filter((b) => b.location?.lat != null);
  const routeLine = (eta?.stops || []).map((s) => [s.lat, s.lng]);
  const center = selected?.location?.lat != null
    ? [selected.location.lat, selected.location.lng]
    : routeLine[0] || (withLocation[0] ? [withLocation[0].location.lat, withLocation[0].location.lng] : DELHI);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-sky-400">Track Bus</h2>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link to="/" className="text-slate-300 hover:text-sky-400">← Home</Link>
        </div>
      </div>

      <AnnouncementBanner busId={selectedId} routeId={selected?.route?._id} className="mb-6" />

      <form onSubmit={searchBus} className="flex flex-wrap gap-3 mb-6">
        <input
          placeholder="From (e.g. Delhi, ITO)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <input
          placeholder="To (e.g. Noida)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="p-3 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button type="submit" className="px-6 py-3 bg-sky-600 rounded-xl hover:bg-sky-700 transition">
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {!loading && !error && buses.length === 0 && <p className="text-slate-400 mb-4">No buses found.</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ul className="space-y-3">
            {buses.map((bus) => (
              <li key={bus._id}>
                <button
                  onClick={() => setSelectedId(bus._id === selectedId ? null : bus._id)}
                  className={`w-full text-left rounded-2xl p-4 border transition ${
                    bus._id === selectedId ? "bg-sky-600/20 border-sky-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">{bus.busNumber}</span>
                    <span className={`text-sm font-semibold capitalize ${STATUS_COLOR[bus.status] || ""}`}>{bus.status}</span>
                  </div>
                  <p className="text-slate-300">
                    {bus.source} → {bus.destination}
                    {bus.route?.name ? <span className="text-slate-500"> · {bus.route.name}</span> : null}
                  </p>
                  <p className="text-sm mt-1">
                    {bus.location?.lat != null ? (
                      isLive(bus) ? (
                        <span className="text-green-400">● Live · updated {new Date(bus.location.updatedAt).toLocaleTimeString()}</span>
                      ) : (
                        <span className="text-slate-500">○ Offline · last seen {new Date(bus.location.updatedAt).toLocaleString()}</span>
                      )
                    ) : (
                      <span className="text-slate-500">Location not available yet</span>
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-xl font-semibold text-sky-400 mb-1">{selected.busNumber} · stops and ETA</h3>
              {eta?.routeName && <p className="text-sm text-slate-400 mb-3">{eta.routeName}</p>}
              {eta?.bus?.stale && eta?.stops?.length > 0 && (
                <p className="text-sm text-yellow-400 mb-3">
                  This bus has not sent its location recently, so times may be out of date.
                </p>
              )}
              {notice && <p className="text-sm text-sky-300 mb-3">{notice}</p>}

              {!eta && <p className="text-slate-400">Loading...</p>}
              {eta && eta.stops.length === 0 && <p className="text-slate-400">This bus has no route with stops yet.</p>}

              <ol className="space-y-2">
                {(eta?.stops || []).map((s) => {
                  const active = subFor(s.name);
                  return (
                    <li key={s.index} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                      s.status === "next" ? "bg-sky-600/20" : "bg-white/5"
                    } ${s.status === "passed" ? "opacity-50" : ""}`}>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.index + 1}. {s.name}</p>
                        <p className="text-xs text-slate-400">
                          {STOP_LABEL[s.status]}
                          {s.etaMinutes ? ` · ${s.etaMinutes} min · ${s.distanceKm} km` : ""}
                        </p>
                      </div>
                      {s.status !== "passed" && s.status !== "arrived" && (
                        <button
                          onClick={() => toggleAlert(s.name)}
                          className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium ${
                            active ? "bg-green-600/80 hover:bg-green-600" : "bg-white/10 hover:bg-white/20"
                          }`}
                        >
                          {active ? "Alert on ✓" : "Notify me"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
              {!loggedIn && eta?.stops?.length > 0 && (
                <p className="text-xs text-slate-500 mt-3">
                  <Link to="/login" className="text-sky-400 underline">Log in</Link> to get an alert before the bus reaches your stop.
                </p>
              )}
            </div>
          )}

          {selected?.route?._id && <Timetable routeId={selected.route._id} stops={(eta?.stops || []).map((s) => s.name)} />}
        </div>

        <div className="relative h-[28rem] lg:h-[40rem] rounded-2xl overflow-hidden border border-white/10 lg:sticky lg:top-6">
          <label className="absolute top-3 right-3 z-[1000] flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-white shadow cursor-pointer">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow bus
          </label>
          <MapContainer key={selectedId || "all"} center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: "#3987e5", weight: 3, opacity: 0.8 }} />}
            {(eta?.stops || []).map((s) => (
              <CircleMarker
                key={s.index}
                center={[s.lat, s.lng]}
                radius={6}
                pathOptions={{ color: "#0f172a", weight: 2, fillColor: s.status === "passed" ? "#64748b" : "#e2e8f0", fillOpacity: 1 }}
              >
                <Tooltip>{s.name}</Tooltip>
              </CircleMarker>
            ))}
            <FollowBus pos={selected?.location?.lat != null ? [selected.location.lat, selected.location.lng] : null} on={follow} />
            {withLocation.map((b) => (
              <BusMarker
                key={b._id}
                pos={[b.location.lat, b.location.lng]}
                line={b._id === selectedId ? routeLine : null}
                big={b._id === selectedId}
                label={`${b.busNumber}: ${b.source} → ${b.destination}`}
              />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default UserTracking;