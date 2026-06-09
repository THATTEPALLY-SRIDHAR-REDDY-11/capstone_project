import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { DocumentSelector } from "../components/DocumentSelector.jsx";

export function ChatPage() {
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef(null);

  // Load chat history whenever the selected document changes
  useEffect(() => {
    if (!documentId) {
      setMessages([]);
      return;
    }
    setHistoryLoading(true);
    api.get(`/api/chat/${documentId}/history`)
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setHistoryLoading(false));
  }, [documentId]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(event) {
    event.preventDefault();
    if (!documentId) return toast.error("Select a document");
    if (!question.trim()) return toast.error("Enter a question");
    setLoading(true);
    const currentQuestion = question.trim();
    setMessages((items) => [...items, { role: "user", content: currentQuestion }]);
    setQuestion("");
    try {
      const { data } = await api.post(`/api/chat/${documentId}`, { question: currentQuestion });
      setMessages((items) => [...items, { role: "assistant", content: data.answer, citations: data.citations }]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not answer from this document");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <DocumentSelector value={documentId} onChange={setDocumentId} />

      <div className="min-h-[460px] max-h-[520px] overflow-y-auto space-y-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        {historyLoading && (
          <p className="text-center text-sm text-slate-500 py-4">Loading conversation history...</p>
        )}
        {!historyLoading && messages.length === 0 && documentId && (
          <p className="text-center text-sm text-slate-500 py-4">No messages yet. Ask a question about this document.</p>
        )}
        {!historyLoading && !documentId && (
          <p className="text-center text-sm text-slate-500 py-4">Select a document to start chatting.</p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`max-w-3xl rounded-md p-3 ${message.role === "user" ? "ml-auto bg-mint text-ink" : "bg-white/10"}`}>
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            {message.citations?.length > 0 && (
              <p className="mt-2 text-xs text-slate-300">Sources: {message.citations.map((c) => `p.${c.page}`).join(", ")}</p>
            )}
          </div>
        ))}
        {loading && (
          <div className="max-w-3xl rounded-md p-3 bg-white/10">
            <p className="text-sm text-slate-400 animate-pulse">Thinking...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={ask} className="flex gap-2">
        <input
          className="input"
          placeholder="Ask about revenue, debt, risks, outlook..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!documentId || loading}
        />
        <button className="btn-primary" disabled={loading || !documentId}>
          <Send className="h-4 w-4" /> Ask
        </button>
      </form>
    </div>
  );
}
