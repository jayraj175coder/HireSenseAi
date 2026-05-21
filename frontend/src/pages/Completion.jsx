import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, CheckCircle2, Lightbulb, Radar, TrendingUp } from "lucide-react";
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
        {data.interview.readinessSummary && <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">{data.interview.readinessSummary}</p>}
        <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full border border-cyan/40 bg-cyan/10 text-4xl font-semibold text-cyan">
          {data.interview.aggregateScore}%
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="panel">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><TrendingUp className="text-cyan" /> Question feedback</h3>
          <div className="mt-5 space-y-4">
            {data.feedback.map((item) => (
              <article key={item._id} className="rounded-lg border border-white/10 p-4">
                <div className="flex justify-between"><span className="font-medium">Score</span><span className="text-cyan">{item.score}% · {item.hireSignal?.replace("_", " ")}</span></div>
                <p className="mt-3 text-sm text-slate-400">Strengths: {item.strengths?.join(", ")}</p>
                <p className="mt-2 text-sm text-slate-400">Weaknesses: {item.weaknesses?.join(", ")}</p>
                <p className="mt-2 text-sm text-slate-400">Improve: {item.suggestions?.join(", ")}</p>
                {item.rubricScores?.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {item.rubricScores.map((rubric) => (
                      <div key={rubric.criterion} className="rounded-md bg-white/[0.04] p-3 text-xs text-slate-400">
                        <div className="flex justify-between gap-2 text-slate-200"><span>{rubric.criterion}</span><span>{rubric.score}%</span></div>
                        <p className="mt-1 leading-5">{rubric.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Radar className="text-cyan" /> Competency map</h3>
          <div className="mt-5 space-y-4">
            {(data.interview.competencyScores || []).map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm"><span>{item.name}</span><span className="text-cyan">{item.score}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan" style={{ width: `${item.score}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
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
        <div className="panel">
          <h3 className="text-xl font-semibold">Practice plan</h3>
          <div className="mt-5 space-y-3">
            {(data.interview.practicePlan || []).map((step) => (
              <div key={step} className="rounded-md bg-white/[0.04] p-4 text-sm text-slate-300">{step}</div>
            ))}
          </div>
          <h3 className="mt-8 text-xl font-semibold">Recommended resources</h3>
          <div className="mt-5 space-y-3">
            {(data.interview.recommendedResources || []).map((resource) => (
              <div key={resource} className="rounded-md border border-white/10 p-4 text-sm text-slate-300">{resource}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
