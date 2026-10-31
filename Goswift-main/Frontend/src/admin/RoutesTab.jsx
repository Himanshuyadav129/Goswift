import { useCallback, useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api";
import { Button, Card, Field, Notice, inputCls } from "./ui";

const DELHI = [28.6139, 77.209];

const ClickToAdd = ({ onAdd }) => {
  useMapEvents({ click: (e) => onAdd(e.latlng.lat, e.latlng.lng) });
  return null;
};

const RoutesTab = () => {
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [stops, setStops] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      setRoutes(await apiFetch("/api/routes"));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditingId(null);
    setName("");
    setStops([]);
  };

  const addStop = (lat, lng) =>
    setStops((s) => [...s, { name: `Stop ${s.length + 1}`, lat: +lat.toFixed(5), lng: +lng.toFixed(5) }]);

  const updateStop = (i, patch) => setStops((s) => s.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const removeStop = (i) => setStops((s) => s.filter((_, k) => k !== i));
  const move = (i, d) =>
    setStops((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const c = [...s];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const save = async () => {
    setError("");
    setOk("");
    try {
      const body = {
        name,
        stops: stops.map((s) => ({ name: s.name, lat: Number(s.lat), lng: Number(s.lng) }))
      };
      if (editingId) await apiFetch(`/api/routes/${editingId}`, { method: "PUT", body });
      else await apiFetch("/api/routes", { method: "POST", body });
      setOk(editingId ? "Route updated" : "Route created");
      reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (r) => {
    setEditingId(r._id);
    setName(r.name);
    setStops(r.stops.map((s) => ({ ...s })));
    setOk("");
    setError("");
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete route "${r.name}"?`)) return;
    try {
      await apiFetch(`/api/routes/${r._id}`, { method: "DELETE" });
      if (editingId === r._id) reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const line = stops.map((s) => [Number(s.lat), Number(s.lng)]);
  const center = stops.length ? [Number(stops[0].lat), Number(stops[0].lng)] : DELHI;

  return (
    <div className="grid xl:grid-cols-3 gap-6">
      <Card title="Routes">
        <Notice error={error} ok={ok} />
        <ul className="space-y-2">
          {routes.map((r) => (
            <li key={r._id} className="flex items-center justify-between gap-2 bg-white/5 rounded-xl p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.name}</p>
                <p className="text-xs text-slate-400">{r.stops.length} stops</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" onClick={() => edit(r)}>Edit</Button>
                <Button variant="danger" onClick={() => remove(r)}>Delete</Button>
              </div>
            </li>
          ))}
          {routes.length === 0 && <li className="text-slate-500">No routes yet.</li>}
        </ul>
      </Card>

      <Card title={editingId ? "Edit route" : "New route"} className="xl:col-span-2">
        <Field label="Route name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Delhi - Noida Express" />
        </Field>

        <p className="text-sm text-slate-400 mb-2">Click on the map to add stops in order. Rename or reorder them below.</p>
        <div className="h-80 rounded-2xl overflow-hidden border border-white/10 mb-4">
          <MapContainer key={editingId || "new"} center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToAdd onAdd={addStop} />
            {line.length > 1 && <Polyline positions={line} pathOptions={{ color: "#3987e5", weight: 3 }} />}
            {stops.map((s, i) => (
              <CircleMarker
                key={i}
                center={[Number(s.lat), Number(s.lng)]}
                radius={8}
                pathOptions={{ color: "#fff", weight: 2, fillColor: "#3987e5", fillOpacity: 1 }}
              >
                <Tooltip permanent direction="top">{i + 1}. {s.name}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="space-y-2 mb-4">
          {stops.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-slate-400 text-sm">{i + 1}</span>
              <input className={`${inputCls} col-span-4 !p-2`} value={s.name} onChange={(e) => updateStop(i, { name: e.target.value })} />
              <input className={`${inputCls} col-span-2 !p-2`} type="number" step="any" value={s.lat} onChange={(e) => updateStop(i, { lat: e.target.value })} />
              <input className={`${inputCls} col-span-2 !p-2`} type="number" step="any" value={s.lng} onChange={(e) => updateStop(i, { lng: e.target.value })} />
              <div className="col-span-3 flex gap-1 justify-end">
                <Button variant="ghost" onClick={() => move(i, -1)} aria-label="Move up">↑</Button>
                <Button variant="ghost" onClick={() => move(i, 1)} aria-label="Move down">↓</Button>
                <Button variant="danger" onClick={() => removeStop(i)} aria-label="Remove stop">✕</Button>
              </div>
            </div>
          ))}
          {stops.length === 0 && <p className="text-slate-500 text-sm">No stops yet.</p>}
        </div>

        <div className="flex gap-2">
          <Button onClick={save}>{editingId ? "Save route" : "Create route"}</Button>
          {(editingId || stops.length > 0 || name) && <Button variant="ghost" onClick={reset}>Clear</Button>}
        </div>
      </Card>
    </div>
  );
};

export default RoutesTab;
