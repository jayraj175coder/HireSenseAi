import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
import api from "../api/client";
import Spinner from "../components/Spinner";

export default function Completion() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => setData(data));
  }, [id]);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <section className="panel text-center">
        <Award className="mx-auto text-lime" size={42} />
        <h2 className="mt-4 text-3xl font-semibold">Interview complete</h2>
        <p className="mt-2 text-slate-400">{data.interview.role} readiness report</p>
        <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10 text-4xl font-semibold text-cyan">
          {data.interview.aggregateScore}%
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="panel">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><TrendingUp className="text-cyan" /> Question feedback</h3>
          <div className="mt-5 space-y-4">
            {data.feedback.map((item) => (
              <article key={item._id} className="rounded-lg border border-white/10 p-4">
                <div className="flex justify-between"><span className="font-medium">Score</span><span className="text-cyan">{item.score}%</span></div>
                <p className="mt-3 text-sm text-slate-400">Strengths: {item.strengths?.join(", ")}</p>
                <p className="mt-2 text-sm text-slate-400">Improve: {item.suggestions?.join(", ")}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Lightbulb className="text-lime" /> Career roadmap</h3>
          <div className="mt-5 space-y-3">
            {(data.interview.roadmap || []).map((step) => (
              <div key={step} className="flex gap-3 rounded-md bg-white/[0.04] p-4 text-sm text-slate-300">
                <CheckCircle2 className="shrink-0 text-lime" size={18} /> {step}
              </div>
            ))}
          </div>
          <Link className="btn-primary mt-6 w-full" to="/interview/new">Practice again</Link>
        </div>
      </section>
    </div>
  );
}
