import { useState } from "react";

// One series, one colour (blue step chosen for dark surfaces). Thin bars (max 24px),
// 4px rounded data end, square at the baseline, hover tooltip, and a table view for screen readers.
const SERIES = "#3987e5";

const Tooltip = ({ children, style }) => (
  <div
    style={style}
    className="absolute z-10 -translate-x-1/2 left-1/2 whitespace-nowrap rounded-lg bg-slate-900 border border-white/20 px-2 py-1 text-xs text-slate-100 shadow-lg pointer-events-none"
  >
    {children}
  </div>
);

const TableView = ({ data, unit, labelHead }) => (
  <details className="mt-3 text-sm text-slate-400">
    <summary className="cursor-pointer hover:text-slate-200">View as table</summary>
    <table className="mt-2 w-full text-left">
      <thead>
        <tr className="text-slate-500">
          <th className="py-1 font-medium">{labelHead}</th>
          <th className="py-1 font-medium">{unit || "Value"}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.label} className="border-t border-white/5">
            <td className="py-1">{d.label}</td>
            <td className="py-1">{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
);

// Vertical columns (e.g. trips per day). data: [{ label, value }]
export const ColumnChart = ({ data, unit = "", labelHead = "Day", height = 180, tickEvery = 1 }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-[10px] text-slate-500 pb-px" style={{ height }}>
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1 border-b border-white/20" style={{ height }}>
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/10" />
          <div className="absolute inset-0 flex items-end gap-1">
            {data.map((d, i) => {
              const pct = (d.value / max) * 100;
              return (
                <div
                  key={d.label}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.label}: ${d.value} ${unit}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="relative flex-1 h-full flex items-end justify-center outline-none"
                >
                  <div
                    className="w-full rounded-t-[4px]"
                    style={{
                      height: d.value > 0 ? `max(${pct}%, 2px)` : 0,
                      maxWidth: 24,
                      backgroundColor: SERIES,
                      opacity: hover === null || hover === i ? 1 : 0.55
                    }}
                  />
                  {hover === i && (
                    <Tooltip style={{ bottom: `calc(${pct}% + 6px)` }}>
                      {d.label}: <b>{d.value}</b> {unit}
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-1 mt-1 ml-7 text-[10px] text-slate-500">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center truncate">
            {i % tickEvery === 0 ? d.label.slice(5) : ""}
          </span>
        ))}
      </div>
      <TableView data={data} unit={unit} labelHead={labelHead} />
    </div>
  );
};

// Horizontal bars with the value at the bar tip (e.g. distance per bus)
export const BarList = ({ data, unit = "", labelHead = "Bus" }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3" title={`${d.label}: ${d.value} ${unit}`}>
            <span className="w-20 text-sm text-slate-300 truncate">{d.label}</span>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="h-3 rounded-r-[4px]"
                style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 1 : 0)}%`, backgroundColor: SERIES }}
              />
              <span className="text-sm text-slate-200 tabular-nums">{d.value}</span>
            </div>
          </div>
        ))}
      </div>
      <TableView data={data} unit={unit} labelHead={labelHead} />
    </div>
  );
};
