import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, BrainCircuit, CheckCircle2, Compass, Download, Lightbulb, Radar, Target, TrendingUp } from "lucide-react";
import api from "../api/client";
import Spinner from "../components/Spinner";

function scoreTone(score) {
  if (score >= 80) return "text-lime";
  if (score >= 65) return "text-cyan";
  if (score >= 50) return "text-amber-300";
  return "text-coral";
}

function ScoreCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon className="text-cyan" size={19} />
      </div>
      <p className={`mt-5 text-3xl font-semibold ${scoreTone(value)}`}>{value}%</p>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-cyan" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default function Completion() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => setData(data));
  }, [id]);

  const report = useMemo(() => {
    if (!data) return null;
    const feedback = data.feedback || [];
    const avg = (selector, fallback = 0) => {
      if (!feedback.length) return fallback;
      return Math.round(feedback.reduce((sum, item) => sum + selector(item), 0) / feedback.length);
    };
    return {
      communication: avg((item) => item.communicationSignals?.clarity || item.score, 65),
      confidence: avg((item) => item.confidence || item.score, 62),
      technical: avg((item) => item.rubricScores?.[0]?.score || item.score, 64),
      problemSolving: avg((item) => item.rubricScores?.[1]?.score || item.score, 63),
      strengths: [...new Set(feedback.flatMap((item) => item.strengths || []))].slice(0, 5),
      weaknesses: [...new Set(feedback.flatMap((item) => item.weaknesses || []))].slice(0, 5),
      missing: [...new Set(feedback.flatMap((item) => item.suggestions || []))].slice(0, 5)
    };
  }, [data]);

  if (!data || !report) return <Spinner />;

  const recommendation = data.interview.hiringRecommendation || (data.interview.aggregateScore >= 78 ? "Recommended for next round" : data.interview.aggregateScore >= 62 ? "Needs targeted practice" : "Not ready yet");
  const timeline = data.interview.insightTimeline?.length
    ? data.interview.insightTimeline
    : [
        { label: "Strongest answer", value: report.strengths[0] || "Candidate showed some relevant project direction.", severity: "positive" },
        { label: "Weakest answer", value: report.weaknesses[0] || "Answers need stronger evidence and measurable outcomes.", severity: "warning" },
        { label: "Communication trend", value: `Communication averaged ${report.communication}%.`, severity: "neutral" }
      ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_30%_0%,rgba(92,225,230,0.16),transparent_34rem),#080C18] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-sm text-cyan">
              <BrainCircuit size={16} /> AI recruiter report
            </div>
            <h2 className="mt-5 text-4xl font-semibold">Interview intelligence report</h2>
            <p className="mt-3 text-slate-400">{data.interview.role} - {data.interview.difficultyStage || "Adaptive"} level assessment</p>
            {data.interview.readinessSummary && <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300">{data.interview.readinessSummary}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-md border border-lime/30 bg-lime/10 px-4 py-2 text-sm text-lime">{recommendation}</span>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">Next level: {data.interview.aggregateScore >= 78 ? "Advanced technical round" : "Intermediate practice round"}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10 p-6">
            <Award className="text-cyan" size={34} />
            <p className="mt-4 text-sm text-slate-400">Overall score</p>
            <p className={`mt-2 text-6xl font-semibold ${scoreTone(data.interview.aggregateScore)}`}>{data.interview.aggregateScore}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <ScoreCard label="Technical depth" value={report.technical} icon={Target} />
        <ScoreCard label="Communication" value={report.communication} icon={TrendingUp} />
        <ScoreCard label="Confidence" value={report.confidence} icon={Radar} />
        <ScoreCard label="Problem solving" value={report.problemSolving} icon={Compass} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.65fr_0.35fr]">
        <div className="panel">
          <h3 className="text-xl font-semibold">Interview insights timeline</h3>
          <div className="mt-6 space-y-4">
            {timeline.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid grid-cols-[auto_1fr] gap-4">
                <div className={`mt-1 h-4 w-4 rounded-full ${item.severity === "positive" ? "bg-lime" : item.severity === "warning" ? "bg-coral" : "bg-cyan"}`} />
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="text-xl font-semibold">Competency map</h3>
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

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="panel">
          <h3 className="text-xl font-semibold">Technical strengths</h3>
          <div className="mt-5 space-y-3">
            {report.strengths.map((item) => <p key={item} className="rounded-md bg-lime/10 p-3 text-sm text-slate-300">{item}</p>)}
          </div>
        </div>
        <div className="panel">
          <h3 className="text-xl font-semibold">Weaknesses</h3>
          <div className="mt-5 space-y-3">
            {report.weaknesses.map((item) => <p key={item} className="rounded-md bg-coral/10 p-3 text-sm text-slate-300">{item}</p>)}
          </div>
        </div>
        <div className="panel">
          <h3 className="text-xl font-semibold">Missing concepts</h3>
          <div className="mt-5 space-y-3">
            {report.missing.map((item) => <p key={item} className="rounded-md bg-white/[0.04] p-3 text-sm text-slate-300">{item}</p>)}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="panel">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Lightbulb className="text-lime" /> Improvement roadmap</h3>
          <div className="mt-5 space-y-3">
            {(data.interview.roadmap || []).map((step) => (
              <div key={step} className="flex gap-3 rounded-md bg-white/[0.04] p-4 text-sm text-slate-300">
                <CheckCircle2 className="shrink-0 text-lime" size={18} /> {step}
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link className="btn-primary" to="/interview/new">Practice again</Link>
            <button className="btn-secondary" onClick={() => window.print()}><Download size={18} /> Export report</button>
          </div>
        </div>
        <div className="panel">
          <h3 className="text-xl font-semibold">Recommended learning topics</h3>
          <div className="mt-5 space-y-3">
            {(data.interview.recommendedResources || []).map((resource) => (
              <div key={resource} className="rounded-md border border-white/10 p-4 text-sm text-slate-300">{resource}</div>
            ))}
          </div>
          <h3 className="mt-8 text-xl font-semibold">Practice plan</h3>
          <div className="mt-5 space-y-3">
            {(data.interview.practicePlan || []).map((step) => (
              <div key={step} className="rounded-md bg-white/[0.04] p-4 text-sm text-slate-300">{step}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
