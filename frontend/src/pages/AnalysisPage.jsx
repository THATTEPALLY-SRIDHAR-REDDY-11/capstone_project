import { Brain, ChevronDown, ChevronUp, Download, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { DocumentSelector } from "../components/DocumentSelector.jsx";

export function AnalysisPage() {
  const [documentId, setDocumentId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    if (!documentId) {
      setAnalysis(null);
      return;
    }
    setLoading(true);
    api.get(`/api/analysis/${documentId}`)
      .then((response) => setAnalysis(response.data))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [documentId]);

  async function run() {
    if (!documentId) return toast.error("Select a document");
    setLoading(true);
    try {
      const { data } = await api.post(`/api/analysis/${documentId}/run`);
      setAnalysis(data);
      toast.success("Analysis completed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to run analysis");
    } finally {
      setLoading(false);
    }
  }

  function exportData() {
    if (!analysis) return toast.error("No analysis to export");
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_${documentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analysis exported");
  }

  function toggle(section) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  const isOpen = (section) => openSections[section] !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Financial Analysis</h2>
          <p className="text-sm text-slate-400">Deep-dive into financials, risks, and management commentary</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DocumentSelector value={documentId} onChange={setDocumentId} />
          <button className="btn-primary" onClick={run} disabled={loading}>
            <Brain className="h-4 w-4" /> {loading ? "Analyzing..." : "Run Agent"}
          </button>
          <button className="btn-muted" onClick={exportData} disabled={!analysis}>
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse lg:col-span-1">
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-4/5 rounded bg-white/5" />
                <div className="h-3 w-2/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No analysis state */}
      {!loading && !analysis && documentId && (
        <div className="card text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="font-semibold text-lg">No analysis found</h3>
          <p className="text-sm text-slate-400 mt-2">Click "Run Agent" to generate a comprehensive financial analysis</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <CollapsibleSection title="Executive Summary" isOpen={isOpen("exec")} onToggle={() => toggle("exec")} accent="mint">
            <p className="text-sm leading-7 text-slate-300 whitespace-pre-wrap">{analysis.executiveSummary || "No summary available."}</p>
            {analysis.healthScore != null && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-mint/10 px-4 py-1.5">
                <span className="text-xs font-medium text-slate-400">Health Score</span>
                <span className="text-lg font-bold text-mint">{analysis.healthScore}/100</span>
              </div>
            )}
          </CollapsibleSection>

          {/* Financial Metrics */}
          {analysis.metrics?.length > 0 && (
            <CollapsibleSection title={`Financial Metrics (${analysis.metrics.length})`} isOpen={isOpen("metrics")} onToggle={() => toggle("metrics")} accent="sky">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-4">Metric</th>
                      <th className="pb-2 pr-4">Value</th>
                      <th className="pb-2 pr-4">Unit</th>
                      <th className="pb-2 pr-4">Year</th>
                      <th className="pb-2">Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.metrics.map((m, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-2 pr-4 font-medium">{m.label}</td>
                        <td className="py-2 pr-4 text-mint">{m.value ?? m.numericValue ?? "—"}</td>
                        <td className="py-2 pr-4 text-slate-400">{m.unit || "—"}</td>
                        <td className="py-2 pr-4 text-slate-400">{m.year || "—"}</td>
                        <td className="py-2 text-slate-500">{m.sourcePage ? `p.${m.sourcePage}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}

          {/* Management Discussion */}
          {analysis.managementDiscussion && (
            <CollapsibleSection title="Management Discussion & Analysis" isOpen={isOpen("mda")} onToggle={() => toggle("mda")} accent="violet">
              <div className="grid gap-4 md:grid-cols-2">
                <MdaBlock label="Strategy" content={analysis.managementDiscussion.strategy} />
                <MdaBlock label="Growth Plans" content={analysis.managementDiscussion.growthPlans} />
                <MdaBlock label="Challenges" content={analysis.managementDiscussion.challenges} />
                <MdaBlock label="Future Outlook" content={analysis.managementDiscussion.futureOutlook} />
              </div>
              {analysis.managementDiscussion.sentiment && (
                <div className="mt-4">
                  <SentimentBadge sentiment={analysis.managementDiscussion.sentiment} />
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Year-over-Year Comparison */}
          {analysis.yearOverYear?.length > 0 && (
            <CollapsibleSection title={`Year-over-Year Comparison (${analysis.yearOverYear.length} metrics)`} isOpen={isOpen("yoy")} onToggle={() => toggle("yoy")} accent="amber">
              <div className="space-y-4">
                {analysis.yearOverYear.map((yoy, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.03] p-4">
                    <h4 className="font-semibold text-amber">{yoy.metric}</h4>
                    {yoy.years?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {yoy.years.map((y, j) => (
                          <div key={j} className="rounded bg-white/5 px-3 py-1.5 text-sm">
                            <span className="text-slate-400">{y.year || "—"}: </span>
                            <span className="font-medium text-white">{y.value ?? y.numericValue ?? "—"}</span>
                            {y.unit && <span className="text-slate-500 ml-1">{y.unit}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {yoy.insight && <p className="mt-2 text-sm text-slate-400 italic">💡 {yoy.insight}</p>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Investor Summary */}
          <CollapsibleSection title="Investor Summary" isOpen={isOpen("investor")} onToggle={() => toggle("investor")} accent="emerald">
            <div className="grid gap-4 md:grid-cols-2">
              <SignalList title="Bullish Signals" items={analysis.investorSummary?.bullishSignals} icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} color="emerald" />
              <SignalList title="Bearish Signals" items={analysis.investorSummary?.bearishSignals} icon={<TrendingDown className="h-4 w-4 text-red-400" />} color="red" />
              <SignalList title="Opportunities" items={analysis.investorSummary?.opportunities} icon={<TrendingUp className="h-4 w-4 text-sky-400" />} color="sky" />
              <SignalList title="Risks" items={analysis.investorSummary?.risks} icon={<TrendingDown className="h-4 w-4 text-amber-400" />} color="amber" />
            </div>
            {analysis.investorSummary?.keyTakeaways?.length > 0 && (
              <div className="mt-4 rounded-lg bg-mint/5 border border-mint/20 p-4">
                <h4 className="font-semibold text-mint mb-2">Key Takeaways</h4>
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {analysis.investorSummary.keyTakeaways.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-mint mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleSection>

          {/* Risk Factors */}
          {analysis.risks?.length > 0 && (
            <CollapsibleSection title={`Risk Factors (${analysis.risks.length})`} isOpen={isOpen("risks")} onToggle={() => toggle("risks")} accent="red">
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.risks.map((risk, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{risk.category || "General"}</span>
                      <SeverityBadge severity={risk.severity} />
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{risk.summary}</p>
                    {risk.sourcePage && <p className="mt-1 text-xs text-slate-500">Source: p.{risk.sourcePage}</p>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function CollapsibleSection({ title, isOpen, onToggle, accent = "mint", children }) {
  const borderColor = {
    mint: "border-l-mint", sky: "border-l-sky-400", violet: "border-l-violet-400",
    amber: "border-l-amber", emerald: "border-l-emerald-400", red: "border-l-red-400"
  }[accent] || "border-l-mint";

  return (
    <section className={`card border-l-2 ${borderColor}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <h3 className="font-semibold text-base">{title}</h3>
        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </section>
  );
}

function MdaBlock({ label, content }) {
  if (!content) return null;
  return (
    <div className="rounded-lg bg-white/[0.03] p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-1">{label}</h4>
      <p className="text-sm leading-6 text-slate-300">{content}</p>
    </div>
  );
}

function SentimentBadge({ sentiment }) {
  const normalized = (sentiment || "").toLowerCase();
  const config = {
    positive: { bg: "bg-emerald-500/15", text: "text-emerald-300", label: "Positive" },
    negative: { bg: "bg-red-500/15", text: "text-red-300", label: "Negative" },
    neutral: { bg: "bg-slate-500/15", text: "text-slate-300", label: "Neutral" },
    mixed: { bg: "bg-amber-500/15", text: "text-amber-300", label: "Mixed" },
    cautionary: { bg: "bg-amber-500/15", text: "text-amber-300", label: "Cautionary" }
  };
  const c = config[normalized] || config.neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${c.bg} ${c.text}`}>
      Management Sentiment: {c.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const s = (severity || "").toLowerCase();
  const cls = s === "high" ? "bg-red-500/15 text-red-300"
    : s === "medium" ? "bg-amber-500/15 text-amber-300"
    : "bg-slate-500/15 text-slate-300";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{severity || "Unknown"}</span>;
}

function SignalList({ title, items = [], icon, color = "mint" }) {
  if (!items.length) return null;
  const headerColor = { emerald: "text-emerald-400", red: "text-red-400", sky: "text-sky-400", amber: "text-amber-400" }[color] || "text-mint";
  return (
    <div className="rounded-lg bg-white/[0.03] p-3">
      <h4 className={`flex items-center gap-2 font-semibold text-sm ${headerColor} mb-2`}>{icon} {title}</h4>
      <ul className="space-y-1.5 text-sm text-slate-300">
        {items.map((item, i) => <li key={i}>• {item}</li>)}
      </ul>
    </div>
  );
}
