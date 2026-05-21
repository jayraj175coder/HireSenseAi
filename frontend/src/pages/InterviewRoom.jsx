import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock3, Send } from "lucide-react";
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
      await api.post(`/interviews/${id}/questions/${question._id}/answer`, { answer });
      setAnswer("");
      if (index + 1 >= session.questions.length) {
        await api.post(`/interviews/${id}/complete`);
        navigate(`/interview/${id}/complete`);
        return;
      }
      setIndex((value) => value + 1);
      notify("Answer evaluated");
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

        <motion.div key={question._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-lg bg-white/[0.04] p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{question.category}</p>
          <p className="mt-3 text-xl leading-8 text-slate-100">{question.prompt}</p>
        </motion.div>

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
