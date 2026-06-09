import { BarChart3, FileText, LogOut, MessageSquare, ShieldCheck, UploadCloud } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/analysis", label: "Analysis", icon: ShieldCheck }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#0f1724]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[#121b2d] p-4 md:block">
        <div className="mb-8 flex items-center gap-2 font-bold">
          <UploadCloud className="h-5 w-5 text-mint" /> FinRAG Analyst
        </div>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? "bg-mint text-ink" : "text-slate-300 hover:bg-white/10"}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-[#0f1724]/90 px-4 backdrop-blur md:px-8">
          <div>
            <p className="text-sm text-slate-400">AI Financial Report Analyzer</p>
            <h1 className="text-lg font-semibold">{user?.name}</h1>
          </div>
          <button className="btn-muted" onClick={logout}><LogOut className="h-4 w-4" /> Logout</button>
        </header>
        <div className="p-4 md:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
