export const inputCls =
  "w-full p-3 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500";

export const Card = ({ title, action, children, className = "" }) => (
  <div className={`bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-300">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </div>
);

export const Field = ({ label, children }) => (
  <label className="block mb-3">
    <span className="block text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</span>
    {children}
  </label>
);

const VARIANTS = {
  primary: "bg-sky-600 hover:bg-sky-700 text-white",
  ghost: "bg-white/10 hover:bg-white/20 text-slate-200",
  danger: "bg-red-600/80 hover:bg-red-600 text-white"
};

export const Button = ({ variant = "primary", className = "", ...props }) => (
  <button
    type="button"
    {...props}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
  />
);

export const Notice = ({ error, ok }) =>
  error ? (
    <p className="mb-4 text-red-400 text-sm">{error}</p>
  ) : ok ? (
    <p className="mb-4 text-green-400 text-sm">{ok}</p>
  ) : null;

export const Th = ({ children }) => <th className="pb-3 pr-4 font-medium">{children}</th>;
export const Td = ({ children, className = "" }) => <td className={`py-3 pr-4 ${className}`}>{children}</td>;
