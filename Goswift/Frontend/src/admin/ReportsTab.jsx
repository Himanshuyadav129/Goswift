import { useCallback, useEffect, useState } from "react";
import { apiDownload, apiFetch } from "../api";
import { BarList, ColumnChart } from "./BarChart";
import { Button, Card, Field, Notice, Td, Th, inputCls } from "./ui";

const Stat = ({ title, value, hint }) => (
  <div className="bg-gradient-to-br from-white/5 to-white/10 p-5 rounded-3xl border border-white/10">
    <h3 className="text-slate-400 text-sm">{title}</h3>
    <p className="text-3xl font-extrabold mt-3 text-sky-400">{value}</p>
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

const ReportsTab = () => {
  const [days, setDays] = useState(14);
  const [report, setReport] = useState(null);
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", busId: "" });
  const [error, setError] = useState("");

  const query = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  };

  const loadReport = useCallback(async () => {
    try {
      setReport(await apiFetch(`/api/admin/reports/summary?days=${days}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [days]);

  const loadTrips = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && p.set(k, v));
      setTrips(await apiFetch(`/api/admin/reports/trips?${p.toString()}`));
    } catch (e) {
      setError(e.message);
    }
  }, [filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    apiFetch("/api/buses").then(setBuses).catch(() => {});
  }, []);

  const exportCsv = async () => {
    try {
      await apiDownload(`/api/admin/reports/trips.csv?${query()}`, "goswift-trips.csv");
    } catch (e) {
      setError(e.message);
    }
  };

  const s = report?.summary;
  const perDay = (report?.perDay || []).map((d) => ({ label: d.date, value: d.trips }));
  const perBus = (report?.perBus || []).map((b) => ({ label: b.busNumber, value: b.distanceKm }));
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <Notice error={error} />

      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm">Period</span>
        {[7, 14, 30].map((d) => (
          <Button key={d} variant={days === d ? "primary" : "ghost"} onClick={() => setDays(d)}>
            Last {d} days
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Stat title="Total trips" value={s ? s.totalTrips : "-"} hint={s ? `${s.completedTrips} completed` : ""} />
        <Stat title="Distance (km)" value={s ? s.totalDistanceKm : "-"} />
        <Stat title="Avg trip (min)" value={s ? s.avgTripMinutes : "-"} />
        <Stat title="On the road now" value={s ? s.ongoingTrips : "-"} />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card title={`Trips per day (last ${days} days)`}>
          {perDay.length ? (
            <ColumnChart data={perDay} unit="trips" labelHead="Day" tickEvery={days > 14 ? 3 : 1} />
          ) : (
            <p className="text-slate-500">No data</p>
          )}
        </Card>
        <Card title="Distance per bus (km)">
          {perBus.length ? <BarList data={perBus} unit="km" /> : <p className="text-slate-500">No trips in this period.</p>}
        </Card>
      </div>

      <Card
        title="Trip history"
        action={<Button onClick={exportCsv}>Export CSV</Button>}
        className="overflow-x-auto"
      >
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Field label="From date">
            <input className={inputCls} type="date" value={filters.from} onChange={setF("from")} />
          </Field>
          <Field label="To date">
            <input className={inputCls} type="date" value={filters.to} onChange={setF("to")} />
          </Field>
          <Field label="Bus">
            <select className={inputCls} value={filters.busId} onChange={setF("busId")}>
              <option value="">All buses</option>
              {buses.map((b) => (
                <option key={b._id} value={b._id}>{b.busNumber}</option>
              ))}
            </select>
          </Field>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <Th>Bus</Th>
              <Th>Route</Th>
              <Th>Driver</Th>
              <Th>Started</Th>
              <Th>Duration</Th>
              <Th>Distance</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t._id} className="border-b border-white/5">
                <Td className="font-medium">{t.busNumber}</Td>
                <Td>{t.route || "-"}</Td>
                <Td>{t.driver || "-"}</Td>
                <Td>{fmt(t.startedAt)}</Td>
                <Td>{t.durationMin != null ? `${t.durationMin} min` : "-"}</Td>
                <Td>{t.distanceKm} km</Td>
                <Td className={t.status === "ongoing" ? "text-green-400" : "text-slate-300"}>{t.status}</Td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-slate-500">No trips found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ReportsTab;
