import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/documents", { params: { t: Date.now() } });
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load().catch(() => setLoading(false)); }, []);
  return { documents, loading, reload: load };
}
