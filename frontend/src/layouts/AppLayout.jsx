import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, FileText, LayoutDashboard, LogOut, MessageSquareText, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resumes", label: "Resume", icon: FileText },
  { to: "/interview/new", label: "Interview", icon: MessageSquareText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const exit = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-night text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-night/80 p-5 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan text-night">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="font-semibold">HireSense AI</p>
            <p className="text-xs text-slate-500">Interview intelligence</p>
          </div>
        </div>
        <nav className="mt-10 space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={exit} className="btn-secondary absolute bottom-5 left-5 right-5">
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-night/80 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Welcome back</p>
              <h1 className="text-xl font-semibold">{user?.name || "Candidate"}</h1>
            </div>
            <div className="hidden rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 sm:block">{user?.targetRole || " "}</div>
          </div>
          <nav className="mt-4 grid grid-cols-4 gap-2 lg:hidden">
            {links.map(({ to, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex justify-center rounded-md border border-white/10 py-2 ${isActive ? "bg-white/10 text-cyan" : "text-slate-400"}`}>
                <Icon size={18} />
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
