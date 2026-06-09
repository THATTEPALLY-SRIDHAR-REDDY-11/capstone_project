export function MetricCard({ label, value, tone = "mint", icon }) {
  const color = tone === "amber" ? "text-amber" : "text-mint";
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value ?? "N/A"}</p>
    </div>
  );
}
