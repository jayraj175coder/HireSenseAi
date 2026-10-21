import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, FileText, LayoutDashboard, LogOut, MessageSquareText, Search, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resumes", label: "Resume", icon: FileText },
  { to: "/interview/new", label: "Interview", icon: MessageSquareText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

const jobSources = [
  {
    id: "linkedin",
    label: "LinkedIn",
    buildUrl: (query) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`
  },
  {
    id: "indeed",
    label: "Indeed",
    buildUrl: (query) => `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}`
  },
  {
    id: "google",
    label: "Google Jobs",
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(`${query} jobs`)}&ibp=htl;jobs`
  },
  {
    id: "glassdoor",
    label: "Glassdoor",
    buildUrl: (query) => `https://www.glassdoor.com/Job/jobs.htm?suggestCount=0&suggestChosen=false&clickSource=searchBtn&typedKeyword=${encodeURIComponent(query)}`
  },
  {
    id: "wellfound",
    label: "Wellfound",
    buildUrl: (query) => `https://wellfound.com/jobs?query=${encodeURIComponent(query)}`
  },
  {
    id: "naukri",
    label: "Naukri",
    buildUrl: (query) => `https://www.naukri.com/job-search-${encodeURIComponent(query).replace(/%20/g, "-")}-jobs`
  }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobQuery, setJobQuery] = useState(user?.targetRole || "software engineer");

  useEffect(() => {
    if (user?.targetRole) {
      setJobQuery(user.targetRole);
    }
  }, [user?.targetRole]);

  const exit = () => {
    logout();
    navigate("/");
  };

  const openJobSearch = (source) => {
    const query = jobQuery.trim() || user?.targetRole || "software engineer";
    const url = source.buildUrl(query);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const searchAllJobs = () => {
    const query = jobQuery.trim() || user?.targetRole || "software engineer";
    jobSources.forEach((source) => {
      window.open(source.buildUrl(query), "_blank", "noopener,noreferrer");
    });
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

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            <BriefcaseBusiness size={14} />
            Job search
          </div>

          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={jobQuery}
              onChange={(event) => setJobQuery(event.target.value)}
              placeholder="Role or keyword"
              className="field w-full pl-9"
            />
          </label>

          <button onClick={searchAllJobs} className="btn-primary mt-3 w-full">
            Search all sources
          </button>

          <div className="mt-3 space-y-2">
            {jobSources.map((source) => (
              <button
                key={source.id}
                onClick={() => openJobSearch(source)}
                className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm text-slate-200 transition hover:border-cyan/60 hover:bg-white/5"
              >
                <span>{source.label}</span>
                <span className="text-xs text-slate-500">Open</span>
              </button>
            ))}
          </div>
        </div>

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

          <div className="mt-4 flex gap-2 lg:hidden">
            <label className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={jobQuery}
                onChange={(event) => setJobQuery(event.target.value)}
                placeholder="Search jobs"
                className="field w-full pl-9"
              />
            </label>
            <button onClick={searchAllJobs} className="btn-primary whitespace-nowrap">
              Search
            </button>
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
