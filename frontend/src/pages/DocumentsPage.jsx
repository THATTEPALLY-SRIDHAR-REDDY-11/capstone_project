import { AlertCircle, CheckCircle2, Clock, Trash2, UploadCloud, XCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useDocuments } from "../hooks/useDocuments.js";

export function DocumentsPage() {
  const { documents, loading, reload } = useDocuments();
  const [form, setForm] = useState({ title: "", companyName: "", fiscalYear: "", reportType: "Annual Report" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function upload(event) {
    event.preventDefault();
    if (!file) return toast.error("Select a PDF report");
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/api/documents", payload, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(data.processingError ? "Document uploaded. Local fallback is ready." : "Document uploaded and indexed");
      setFile(null);
      event.target.reset();
      await reload().catch(() => toast.error("Could not refresh documents"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Document processing failed");
      await reload().catch(() => null);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id) {
    if (!window.confirm("Delete this document and all its analysis data? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/documents/${id}`);
      toast.success("Document deleted");
      await reload().catch(() => null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete document");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={upload} className="card space-y-3">
        <h2 className="text-lg font-semibold">Upload Report</h2>
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder="Company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <input className="input" placeholder="Fiscal year" value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} />
        <select className="input" value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
          {["Annual Report", "Balance Sheet", "Investor Presentation", "Earnings Report", "Financial Statement", "Other"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="input" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button className="btn-primary w-full" type="submit" disabled={uploading}>
          <UploadCloud className="h-4 w-4" /> {uploading ? "Processing..." : "Upload and Index"}
        </button>
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your Documents</h2>
        {loading && <div className="card">Loading documents...</div>}
        {documents.map((doc) => (
          <article className="card" key={doc._id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{doc.title}</h3>
                <p className="text-sm text-slate-400">{doc.companyName || "Unknown company"} | {doc.reportType} | FY {doc.fiscalYear || "N/A"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={doc.status} hasWarning={Boolean(doc.processingError)} />
                <button
                  onClick={() => deleteDocument(doc._id)}
                  disabled={deletingId === doc._id}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {doc.status === "failed" && doc.processingError && (
              <p className="mt-3 text-sm text-red-300">{doc.processingError}</p>
            )}
            {doc.status !== "failed" && doc.processingError && (
              <p className="mt-3 text-sm text-amber-200">{doc.processingError}</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function StatusBadge({ status, hasWarning }) {
  const isFailed = status === "failed";
  const Icon = isFailed ? XCircle : hasWarning ? AlertCircle : status === "processing" ? Clock : CheckCircle2;
  const label = isFailed ? "failed" : hasWarning ? "local fallback" : status;
  const color = isFailed ? "bg-red-500/15 text-red-300" : hasWarning ? "bg-amber-500/15 text-amber-200" : "bg-white/10 text-mint";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
