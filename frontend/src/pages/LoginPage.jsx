import { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ ...form, role: "Analyst" });
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.[0]?.msg;
      toast.error(validationMessage || error.response?.data?.message || "Authentication failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#0f1724] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-md border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-bold">FinRAG Analyst</h1>
        <p className="mt-1 text-sm text-slate-400">Secure financial document intelligence workspace</p>
        <div className="mt-6 grid grid-cols-2 rounded-md bg-white/5 p-1 text-sm">
          <button type="button" className={`rounded px-3 py-2 ${mode === "login" ? "bg-mint text-ink" : ""}`} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={`rounded px-3 py-2 ${mode === "register" ? "bg-mint text-ink" : ""}`} onClick={() => setMode("register")}>Register</button>
        </div>
        <div className="mt-5 space-y-3">
          {mode === "register" && <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn-primary w-full" type="submit">{mode === "login" ? "Sign in" : "Create account"}</button>
        </div>
      </form>
    </div>
  );
}
