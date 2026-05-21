import { useEffect, useState } from "react";
import { BarChart3, LineChart } from "lucide-react";
import api from "../api/client";
import Spinner from "../components/Spinner";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Spinner />;

  const maxScore = Math.max(100, ...data.trends.map((item) => item.score || 0));

  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><LineChart className="text-cyan" /> Performance trends</h2>
        <div className="mt-8 flex h-72 items-end gap-3 border-b border-l border-white/10 px-4 pb-4">
          {data.trends.length ? data.trends.map((item, index) => (
            <div key={`${item.date}-${index}`} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-md bg-cyan/80 transition hover:bg-cyan" style={{ height: `${Math.max(8, (item.score / maxScore) * 220)}px` }} />
              <span className="text-xs text-slate-500">{item.score}%</span>
            </div>
          )) : <p className="self-center text-sm text-slate-400">Complete interviews to build your trend line.</p>}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="panel">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><BarChart3 className="text-coral" /> Skill weakness analysis</h3>
          <div className="mt-6 space-y-4">
            {data.weaknesses.length ? data.weaknesses.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm"><span>{item.name}</span><span className="text-slate-500">{item.count}</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-coral" style={{ width: `${Math.min(100, item.count * 20)}%` }} /></div>
              </div>
            )) : <p className="text-sm text-slate-400">Weakness data appears after AI evaluations.</p>}
          </div>
        </div>
        <div className="panel">
          <h3 className="text-xl font-semibold">Recent history</h3>
          <div className="mt-6 space-y-3">
            {data.recent.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-md bg-white/[0.04] p-4">
                <div>
                  <p className="font-medium">{item.role}</p>
                  <p className="text-sm text-slate-500">{item.status}</p>
                </div>
                <span className="text-cyan">{item.aggregateScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
