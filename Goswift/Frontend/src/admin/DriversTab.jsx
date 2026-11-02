import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { Button, Card, Field, Notice, Td, Th, inputCls } from "./ui";

const EMPTY = { name: "", email: "", password: "", busId: "" };

const DriversTab = () => {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const [d, b] = await Promise.all([apiFetch("/api/admin/drivers"), apiFetch("/api/buses")]);
      setDrivers(d);
      setBuses(b);
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
      const body = { name: form.name, email: form.email, busId: form.busId || null };
      if (form.password) body.password = form.password;
      if (editingId) await apiFetch(`/api/admin/drivers/${editingId}`, { method: "PUT", body });
      else await apiFetch("/api/admin/drivers", { method: "POST", body: { ...body, password: form.password } });
      setOk(editingId ? "Driver updated" : "Driver added");
      reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (d) => {
    setEditingId(d._id);
    setForm({ name: d.name, email: d.email, password: "", busId: d.bus?._id || "" });
    setOk("");
    setError("");
  };

  const approve = async (d) => {
    setError("");
    try {
      await apiFetch(`/api/admin/drivers/${d._id}`, { method: "PUT", body: { approved: true } });
      setOk(`${d.name} approved. Assign a bus with Edit so they can start trips.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete driver ${d.name}?`)) return;
    try {
      await apiFetch(`/api/admin/drivers/${d._id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="grid xl:grid-cols-3 gap-6">
      <Card title="Drivers" className="xl:col-span-2 overflow-x-auto">
        <Notice error={!editingId && error} ok={ok} />
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <Th>Name</Th>
              <Th>Email / phone</Th>
              <Th>Bus</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d._id} className="border-b border-white/5">
                <Td className="font-medium">{d.name}</Td>
                <Td>
                  {d.email}
                  {d.phone && <span className="block text-xs text-slate-500">{d.phone}</span>}
                </Td>
                <Td>{d.bus?.busNumber || <span className="text-slate-500">Unassigned</span>}</Td>
                <Td>
                  {d.approved === false ? (
                    <span className="text-yellow-400 font-medium">Pending</span>
                  ) : (
                    <span className="text-green-400">Approved</span>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    {d.approved === false && <Button onClick={() => approve(d)}>Approve</Button>}
                    <Button variant="ghost" onClick={() => edit(d)}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(d)}>Delete</Button>
                  </div>
                </Td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-slate-500">No drivers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title={editingId ? "Edit driver" : "Add driver"}>
        {editingId && <Notice error={error} />}
        <Field label="Full name">
          <input className={inputCls} value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label={editingId ? "New password (leave empty to keep)" : "Password (6+ characters)"}>
          <input className={inputCls} type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
        </Field>
        <Field label="Bus">
          <select className={inputCls} value={form.busId} onChange={set("busId")}>
            <option value="">Unassigned</option>
            {buses.map((b) => (
              <option key={b._id} value={b._id}>{b.busNumber}</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2">
          <Button onClick={save}>{editingId ? "Save changes" : "Add driver"}</Button>
          {editingId && <Button variant="ghost" onClick={reset}>Cancel</Button>}
        </div>
      </Card>
    </div>
  );
};

export default DriversTab;
