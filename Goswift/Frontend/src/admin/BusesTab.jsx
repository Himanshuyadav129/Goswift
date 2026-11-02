import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { Button, Card, Field, Notice, Td, Th, inputCls } from "./ui";

const EMPTY = { busNumber: "", route: "", status: "idle", source: "", destination: "" };
const STATUS_COLOR = { running: "text-green-400", maintenance: "text-yellow-400", idle: "text-slate-400" };

const BusesTab = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([apiFetch("/api/buses"), apiFetch("/api/routes")]);
      setBuses(b);
      setRoutes(r);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const save = async () => {
    setError("");
    setOk("");
    try {
      const body = { ...form, route: form.route || null };
      if (!body.source) delete body.source; // server fills source/destination from the route
      if (!body.destination) delete body.destination;
      if (editingId) await apiFetch(`/api/buses/${editingId}`, { method: "PUT", body });
      else await apiFetch("/api/buses", { method: "POST", body });
      setOk(editingId ? "Bus updated" : "Bus added");
      reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (b) => {
    setEditingId(b._id);
    setForm({
      busNumber: b.busNumber,
      route: b.route?._id || "",
      status: b.status,
      source: b.source,
      destination: b.destination
    });
    setOk("");
    setError("");
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete bus ${b.busNumber}?`)) return;
    try {
      await apiFetch(`/api/buses/${b._id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="grid xl:grid-cols-3 gap-6">
      <Card title="Buses" className="xl:col-span-2 overflow-x-auto">
        <Notice error={!editingId && error} ok={ok} />
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <Th>Bus</Th>
              <Th>Route</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b._id} className="border-b border-white/5">
                <Td className="font-medium">{b.busNumber}</Td>
                <Td>
                  {b.route?.name || <span className="text-slate-500">{b.source} → {b.destination}</span>}
                </Td>
                <Td className={`font-semibold capitalize ${STATUS_COLOR[b.status]}`}>{b.status}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => edit(b)}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(b)}>Delete</Button>
                  </div>
                </Td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-slate-500">No buses yet. Add one using the form.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title={editingId ? "Edit bus" : "Add bus"}>
        {editingId && <Notice error={error} />}
        <Field label="Bus number">
          <input className={inputCls} value={form.busNumber} onChange={set("busNumber")} placeholder="e.g. UP14-AB-1234" />
        </Field>
        <Field label="Route">
          <select className={inputCls} value={form.route} onChange={set("route")}>
            <option value="">No route</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={set("status")}>
            <option value="idle">Idle</option>
            <option value="running">Running</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From (optional)">
            <input className={inputCls} value={form.source} onChange={set("source")} placeholder="from route" />
          </Field>
          <Field label="To (optional)">
            <input className={inputCls} value={form.destination} onChange={set("destination")} placeholder="from route" />
          </Field>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Without a route, From and To are required. With a route they are filled in automatically.
        </p>
        <div className="flex gap-2">
          <Button onClick={save}>{editingId ? "Save changes" : "Add bus"}</Button>
          {editingId && <Button variant="ghost" onClick={reset}>Cancel</Button>}
        </div>
      </Card>
    </div>
  );
};

export default BusesTab;
