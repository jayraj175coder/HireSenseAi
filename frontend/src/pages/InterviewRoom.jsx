import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BrainCircuit, CheckCircle2, Clock3, MessageSquareMore, Send, Target } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/client";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [seconds, setSeconds] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState(null);

  useEffect(() => {
    api.get(`/interviews/${id}`).then(({ data }) => {
      setSession(data);
      setIndex(Math.min(data.interview.currentQuestionIndex || 0, data.questions.length - 1));
    });
  }, [id]);

  const question = useMemo(() => session?.questions?.[index], [session, index]);

  useEffect(() => {
    if (!question) return;
    setSeconds(question.timeLimitSeconds || 120);
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [question?._id]);

  if (!session || !question) return <Spinner />;

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/interviews/${id}/questions/${question._id}/answer`, { answer });
      setLatestFeedback(data.feedback);
      setAnswer("");
      if (index + 1 >= session.questions.length) {
        await api.post(`/interviews/${id}/complete`);
        navigate(`/interview/${id}/complete`);
        return;
      }
      setIndex((value) => value + 1);
      notify("Answer evaluated with adaptive feedback");
    } catch (error) {
      notify(error.response?.data?.message || "Could not evaluate answer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  const progress = Math.round(((index + 1) / session.questions.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.76fr_0.24fr]">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm text-cyan">{session.interview.role}</p>
            <h2 className="mt-1 text-2xl font-semibold">Question {index + 1} of {session.questions.length}</h2>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm">
            <Clock3 size={16} className={seconds < 20 ? "text-coral" : "text-cyan"} /> {minutes}:{rest}
          </div>
        </div>

        {session.interview.interviewPlan?.openingMessage && index === 0 && !latestFeedback && (
          <div className="mt-6 flex gap-3 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-slate-200">
            <BrainCircuit className="mt-1 shrink-0 text-cyan" size={20} />
            <span>{session.interview.interviewPlan.openingMessage}</span>
          </div>
        )}

        <motion.div key={question._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-lg bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{question.category}</p>
            <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400">{question.source === "resume" ? "resume-aware" : "role-based"}</span>
          </div>
          <p className="mt-3 text-xl leading-8 text-slate-100">{question.prompt}</p>
          {question.difficultyReason && <p className="mt-3 text-sm text-slate-500">{question.difficultyReason}</p>}
          {question.evaluationRubric?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {question.evaluationRubric.map((item) => (
                <span key={item.criterion} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{item.criterion} · {item.weight}%</span>
              ))}
            </div>
          )}
        </motion.div>

        {latestFeedback && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-lg border border-lime/20 bg-lime/10 p-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 font-semibold"><MessageSquareMore size={18} className="text-lime" /> AI interviewer</h3>
              <span className="rounded-md bg-night/60 px-3 py-1 text-sm text-lime">{latestFeedback.score}%</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{latestFeedback.interviewerReply}</p>
            {latestFeedback.followUpQuestion && (
              <div className="mt-4 rounded-md bg-night/50 p-4 text-sm text-slate-300">
                <span className="text-lime">Adaptive follow-up:</span> {latestFeedback.followUpQuestion}
              </div>
            )}
            {latestFeedback.nextQuestionAdjustment && <p className="mt-3 text-xs text-slate-500">{latestFeedback.nextQuestionAdjustment}</p>}
          </motion.div>
        )}

        <label className="mt-6 block">
          <span className="text-sm text-slate-400">Your answer</span>
          <textarea
            className="field mt-3 min-h-56 resize-y leading-7"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Structure your answer with context, decision, tradeoffs, and outcome..."
          />
        </label>
        <button onClick={submit} className="btn-primary mt-5 w-full" disabled={submitting || answer.trim().length < 8}>
          <Send size={18} /> {submitting ? "Evaluating..." : index + 1 === session.questions.length ? "Submit and finish" : "Submit answer"}
        </button>
      </section>

      <aside className="panel h-fit">
        <h3 className="flex items-center gap-2 font-semibold"><Target size={17} className="text-cyan" /> Interview focus</h3>
        <div className="mt-4 space-y-2">
          {(session.interview.interviewPlan?.competencies || []).map((item) => (
            <div key={item.name} className="rounded-md bg-white/[0.04] p-3">
              <div className="flex justify-between gap-2 text-sm"><span>{item.name}</span><span className="text-cyan">{item.weight}%</span></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.whyItMatters}</p>
            </div>
          ))}
        </div>
        <div className="my-6 border-t border-white/10" />
        <h3 className="font-semibold">Progress</h3>
        <div className="mt-4 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-cyan" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-sm text-slate-400">{progress}% complete</p>
        <div className="mt-6 space-y-2">
          {session.questions.map((item, itemIndex) => (
            <div key={item._id} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${itemIndex === index ? "bg-white/10" : "bg-white/[0.03] text-slate-400"}`}>
              <CheckCircle2 size={16} className={itemIndex < index ? "text-lime" : "text-slate-600"} /> Question {itemIndex + 1}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
