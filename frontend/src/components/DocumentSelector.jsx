import { useDocuments } from "../hooks/useDocuments.js";

export function DocumentSelector({ value, onChange }) {
  const { documents, loading } = useDocuments();
  return (
    <select className="input max-w-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{loading ? "Loading documents..." : "Select document"}</option>
      {documents.map((doc) => <option key={doc._id} value={doc._id}>{doc.title}</option>)}
    </select>
  );
}
