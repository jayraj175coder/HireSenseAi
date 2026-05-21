import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Award, Clock3, MessageSquareText } from "lucide-react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics").then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return <div className="grid gap-4 md:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard icon={MessageSquareText} label="Interviews" value={data.stats.totalInterviews} />
        <StatCard icon={Award} label="Best score" value={data.stats.bestScore} accent="text-lime" />
        <StatCard icon={Activity} label="Average" value={`${data.stats.averageScore}%`} />
        <StatCard icon={Clock3} label="Completed" value={data.stats.completedInterviews} accent="text-coral" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent interview history</h2>
            <Link className="btn-secondary" to="/interview/new">New interview</Link>
          </div>
          <div className="mt-5 space-y-3">
            {data.recent.length ? data.recent.map((item) => (
              <Link key={item._id} to={`/interview/${item._id}/complete`} className="flex items-center justify-between rounded-md border border-white/10 p-4 transition hover:bg-white/[0.04]">
                <div>
                  <p className="font-medium">{item.role}</p>
                  <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="rounded-md bg-white/10 px-3 py-1 text-sm">{item.aggregateScore}%</span>
              </Link>
            )) : <EmptyState title="No interviews yet" description="Start a role-based mock interview to generate your first readiness report." action={<Link className="btn-primary" to="/interview/new">Start interview</Link>} />}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-xl font-semibold">Weakness signals</h2>
          <div className="mt-5 space-y-3">
            {data.weaknesses.length ? data.weaknesses.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm"><span>{item.name}</span><span className="text-slate-500">{item.count}</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-coral" style={{ width: `${Math.min(100, item.count * 18)}%` }} /></div>
              </div>
            )) : <p className="text-sm text-slate-400">Weakness analysis appears after evaluated answers.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
