import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Play, UserRoundCheck } from "lucide-react";
import api from "../api/client";
import { interviewers } from "../data/interviewers";
import { roles, roleSignals } from "../data/roles";
import { useToast } from "../context/ToastContext";

export default function InterviewSetup() {
  const [role, setRole] = useState("Full Stack Developer");
  const [difficulty, setDifficulty] = useState("mid");
  const [interviewerStyle, setInterviewerStyle] = useState("friendly_hr");
  const [resumeId, setResumeId] = useState("");
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    api.get("/resumes").then(({ data }) => setResumes(data.resumes));
  }, []);

  const start = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/interviews", { role, difficulty, interviewerStyle, resumeId: resumeId || undefined });
      notify("Interview generated");
      navigate(`/interview/${data.interview._id}`);
    } catch (error) {
      notify(error.response?.data?.message || "Could not start interview", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Configure mock interview</h2>
            <p className="mt-2 text-slate-400">Choose a target role, difficulty, and optional resume context.</p>
          </div>
          <BrainCircuit className="hidden text-cyan sm:block" size={34} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {roles.map((item) => (
            <button
              key={item}
              onClick={() => setRole(item)}
              className={`rounded-lg border p-4 text-left transition ${role === item ? "border-cyan bg-cyan/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}
            >
              <span className="font-semibold">{item}</span>
              <span className="mt-2 block text-sm text-slate-400">{roleSignals[item]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><UserRoundCheck className="text-cyan" /> Choose interviewer personality</h2>
            <p className="mt-2 text-sm text-slate-400">Tone, pressure level, and follow-up style change the whole interview simulation.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {interviewers.map(({ id, name, icon: Icon, accent, description, style }) => (
            <button
              key={id}
              onClick={() => setInterviewerStyle(id)}
              className={`group rounded-lg border p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(92,225,230,0.12)] ${interviewerStyle === id ? "border-cyan bg-cyan/10" : "border-white/10 bg-white/[0.035] hover:border-white/25"}`}
            >
              <div className="flex items-center justify-between">
                <Icon className={accent} size={24} />
                <span className={`h-2.5 w-2.5 rounded-full ${interviewerStyle === id ? "bg-cyan" : "bg-white/20 group-hover:bg-white/40"}`} />
              </div>
              <h3 className="mt-5 font-semibold">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              <p className="mt-4 text-xs leading-5 text-slate-500">{style}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="panel block">
          <span className="text-sm text-slate-400">Difficulty</span>
          <select className="field mt-3" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
          </select>
        </label>
        <label className="panel block">
          <span className="text-sm text-slate-400">Resume context</span>
          <select className="field mt-3" value={resumeId} onChange={(event) => setResumeId(event.target.value)}>
            <option value="">No resume selected</option>
            {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.originalName}</option>)}
          </select>
        </label>
      </div>

      <button onClick={start} className="btn-primary w-full py-4" disabled={loading}>
        <Play size={18} /> {loading ? "Generating questions..." : "Start interview"}
      </button>
    </div>
  );
}
