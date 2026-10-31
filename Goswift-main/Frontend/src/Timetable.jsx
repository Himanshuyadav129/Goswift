import { useEffect, useState } from "react";
import { apiFetch } from "./api";

const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

// Fare calculator + departure times for one route. `stops` = names of the stops of the selected bus's route.
const Timetable = ({ routeId, stops }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const names = stops || [];
  useEffect(() => {
    setFrom(names[0] || "");
    setTo(names[names.length - 1] || "");
    setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, names.join("|")]);

  useEffect(() => {
    if (!routeId) return;
    let alive = true;
    const q = from && to && from !== to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : "";
    apiFetch(`/api/routes/${routeId}/timetable${q}`, { auth: false })
      .then((d) => alive && (setData(d), setError("")))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [routeId, from, to]);

  if (!routeId) return null;
  const sel = "p-2 rounded-lg bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-0";
  const fi = names.indexOf(from);
  const ti = names.indexOf(to);
  const hasFare = data && (data.baseFare > 0 || data.farePerKm > 0);
  const upcoming = data ? data.departures.findIndex((d) => toMin(d.departure) >= nowMin()) : -1;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="text-xl font-semibold text-sky-400 mb-3">Timetable and fare</h3>
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="text-xs text-slate-400">
          From
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${sel} w-full mt-1`}>
            {names.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          To
          <select value={to} onChange={(e) => setTo(e.target.value)} className={`${sel} w-full mt-1`}>
            {names.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {data?.fare ? (
        <p className="mb-4 text-lg">
          {hasFare ? <span className="font-bold text-green-400">₹{data.fare.amount}</span> : <span className="text-slate-400">Fare not set</span>}
          <span className="text-sm text-slate-400"> · {data.fare.km} km</span>
        </p>
      ) : (
        from === to && <p className="mb-4 text-sm text-slate-400">Choose two different stops to see the fare.</p>
      )}

      {data && data.departures.length === 0 && <p className="text-sm text-slate-400">The timetable for this route has not been added yet.</p>}

      {data && data.departures.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="py-2 pr-4 font-medium">Starts</th>
                <th className="py-2 pr-4 font-medium">At {from || "From"}</th>
                <th className="py-2 font-medium">At {to || "To"}</th>
              </tr>
            </thead>
            <tbody>
              {data.departures.map((d, i) => (
                <tr key={d.departure} className={`border-b border-white/5 ${i === upcoming ? "bg-sky-600/20" : ""}`}>
                  <td className="py-2 pr-4">{d.departure}{i === upcoming && <span className="ml-2 text-xs text-sky-300">next</span>}</td>
                  <td className="py-2 pr-4">{fi >= 0 ? d.stops[fi].time : "-"}</td>
                  <td className="py-2">{ti >= 0 ? d.stops[ti].time : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-2">
            Estimated times at about {data.durationMin ? Math.round(data.totalKm / (data.durationMin / 60)) : 25} km/h. Traffic can change them; use live ETA above for the real time.
          </p>
        </div>
      )}
    </div>
  );
};

export default Timetable;
