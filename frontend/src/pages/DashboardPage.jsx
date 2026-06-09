import { Activity, AlertTriangle, BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client.js";
import { DocumentSelector } from "../components/DocumentSelector.jsx";
import { MetricCard } from "../components/MetricCard.jsx";

const SEVERITY_COLORS = { high: "#ef767a", medium: "#f5b84b", low: "#39d59f" };

export function DashboardPage() {
  const [documentId, setDocumentId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) { setData(null); return; }
    setLoading(true);
    api.get(`/api/dashboard/${documentId}`)
      .then((response) => setData(response.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [documentId]);

  const chartData = normalizeTrendData(data?.trends);
  const risksBySeverity = groupRisksBySeverity(data?.risks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Investor Dashboard</h2>
          <p className="text-sm text-slate-400">KPIs, trend lines, risks, and financial health scoring</p>
        </div>
        <DocumentSelector value={documentId} onChange={setDocumentId} />
      </div>

      {/* Empty state */}
      {!loading && !data && documentId && (
        <div className="card text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="font-semibold text-lg">No dashboard data</h3>
          <p className="text-sm text-slate-400 mt-2">Run an analysis on this document first to populate the dashboard</p>
        </div>
      )}

      {!documentId && (
        <div className="card text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="font-semibold text-lg">Select a document</h3>
          <p className="text-sm text-slate-400 mt-2">Choose a financial report to view its analysis dashboard</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-3 w-1/2 rounded bg-white/10 mb-3" />
              <div className="h-6 w-1/3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Metric Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Financial Health" value={`${data.healthScore || 0}/100`} icon={<HealthGauge score={data.healthScore || 0} />} />
            <MetricCard label="Risk Items" value={data.risks?.length || 0} tone="amber" icon={<AlertTriangle className="h-5 w-5 text-amber" />} />
            <MetricCard label="Extracted KPIs" value={data.kpis?.length || 0} icon={<TrendingUp className="h-5 w-5 text-mint" />} />
            <MetricCard label="Trend Sets" value={data.trends?.length || 0} icon={<BarChart3 className="h-5 w-5 text-sky-400" />} />
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="card">
              <h3 className="mb-3 font-semibold">Revenue and Profit Trends</h3>
              {chartData.length ? (
                <div className="h-64 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                      <Line type="monotone" dataKey="Revenue" stroke="#39d59f" strokeWidth={2} dot={{ fill: "#39d59f" }} />
                      <Line type="monotone" dataKey="Net Profit" stroke="#f5b84b" strokeWidth={2} dot={{ fill: "#f5b84b" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No trend data available" />
              )}
            </section>
            <section className="card">
              <h3 className="mb-3 font-semibold">Debt and Cash Flow</h3>
              {chartData.length ? (
                <div className="h-64 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                      <Bar dataKey="Debt" fill="#ef767a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cash Flow" fill="#6aa8ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No debt/cash flow data available" />
              )}
            </section>
          </div>

          {/* Risk Distribution + KPI Table Row */}
          <div className="grid gap-4 xl:grid-cols-2">
            {/* Risk Pie Chart */}
            <section className="card">
              <h3 className="mb-3 font-semibold">Risk Distribution</h3>
              {risksBySeverity.length ? (
                <div className="h-48 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={risksBySeverity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={70} label={({ severity, count }) => `${severity}: ${count}`}>
                        {risksBySeverity.map((entry, i) => (
                          <Cell key={i} fill={SEVERITY_COLORS[entry.severity.toLowerCase()] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No risk data" />
              )}
            </section>

            {/* KPI Table */}
            <section className="card">
              <h3 className="mb-3 font-semibold">Key Performance Indicators</h3>
              {data.kpis?.length ? (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="sticky top-0 border-b border-white/10 bg-[#0f1724] text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2 pr-4">Metric</th>
                        <th className="pb-2 pr-4">Value</th>
                        <th className="pb-2 pr-4">Unit</th>
                        <th className="pb-2">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.kpis.map((kpi, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-2 pr-4 font-medium">{kpi.label}</td>
                          <td className="py-2 pr-4 text-mint">{kpi.value ?? kpi.numericValue ?? "—"}</td>
                          <td className="py-2 pr-4 text-slate-400">{kpi.unit || "—"}</td>
                          <td className="py-2 text-slate-400">{kpi.year || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyChart message="No KPIs extracted" />
              )}
            </section>
          </div>

          {/* Risk Register */}
          <section className="card">
            <h3 className="font-semibold">Risk Register</h3>
            {data.risks?.length ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {data.risks.map((risk, index) => {
                  const s = (risk.severity || "").toLowerCase();
                  const borderCls = s === "high" ? "border-l-red-400" : s === "medium" ? "border-l-amber" : "border-l-emerald-400";
                  return (
                    <div className={`rounded-md border-l-2 ${borderCls} bg-white/5 p-3`} key={index}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{risk.category}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s === "high" ? "bg-red-500/15 text-red-300" : s === "medium" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                          {risk.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{risk.summary}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No risks identified.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function HealthGauge({ score }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#39d59f" : score >= 40 ? "#f5b84b" : "#ef767a";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="24" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function normalizeTrendData(trends = []) {
  const byYear = {};
  trends.forEach((trend) => {
    trend.years?.forEach((item) => {
      // Prefer numericValue; fall back to stripping currency/unit chars from value string
      const numeric = item.numericValue ?? parseFormattedNumber(item.value) ?? 0;
      byYear[item.year] ||= { year: item.year };
      byYear[item.year][trend.metric] = numeric;
    });
  });
  return Object.values(byYear).sort((a, b) => a.year - b.year);
}

function parseFormattedNumber(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  // Strip currency symbols, commas, spaces; handle B/M/K suffixes
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const match = cleaned.match(/^([\d.]+)([BMKTbmkt]?)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === "T") return num * 1e12;
  if (suffix === "B") return num * 1e9;
  if (suffix === "M") return num * 1e6;
  if (suffix === "K") return num * 1e3;
  return num;
}

function groupRisksBySeverity(risks = []) {
  const counts = {};
  risks.forEach((r) => {
    const s = r.severity || "Unknown";
    counts[s] = (counts[s] || 0) + 1;
  });
  return Object.entries(counts).map(([severity, count]) => ({ severity, count }));
}
