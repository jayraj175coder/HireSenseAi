import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Play } from "lucide-react";
import api from "../api/client";
import { roles, roleSignals } from "../data/roles";
import { useToast } from "../context/ToastContext";

export default function InterviewSetup() {
  const [role, setRole] = useState("Full Stack Developer");
  const [difficulty, setDifficulty] = useState("mid");
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
      const { data } = await api.post("/interviews", { role, difficulty, resumeId: resumeId || undefined });
      notify("Interview generated");
      navigate(`/interview/${data.interview._id}`);
    } catch (error) {
      notify(error.response?.data?.message || "Could not start interview", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
