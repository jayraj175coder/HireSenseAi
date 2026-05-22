import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Lightbulb,
  Play,
  Search,
  Sparkles,
  Target,
  UploadCloud,
  Wrench
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

const uploadSteps = ["Upload file", "Extract text", "AI resume scan", "Build interview plan"];

function FitRing({ score = 0 }) {
  const value = Math.min(100, Math.max(0, score));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          className="text-cyan"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-cyan">{value}%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Role fit</span>
      </div>
    </div>
  );
}

function AnalysisPanel({ resume }) {
  const analysis = resume.analysis || {};
  const navigate = useNavigate();
  const suggestedRole = analysis.suggestedRoles?.[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/10 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 text-cyan" size={22} />
          <div>
            <h3 className="font-semibold">{resume.originalName}</h3>
            <p className="text-sm text-slate-500">
              {Math.round(resume.size / 1024)} KB · {new Date(resume.createdAt).toLocaleDateString()}
              {analysis.senioritySignal && ` · ${analysis.senioritySignal} signal`}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => navigate(`/interview/new?resumeId=${resume._id}${suggestedRole ? `&role=${encodeURIComponent(suggestedRole)}` : ""}`)}
        >
          <Play size={16} /> Start mock interview
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.32fr_1fr]">
        <div className="rounded-lg border border-cyan/20 bg-cyan/5 p-4 text-center">
          <FitRing score={analysis.roleFitScore || 0} />
          {analysis.candidateHeadline && (
            <p className="mt-4 text-sm font-medium leading-6 text-slate-200">{analysis.candidateHeadline}</p>
          )}
        </div>

        <div className="space-y-4">
          {analysis.summary && <p className="text-sm leading-6 text-slate-300">{analysis.summary}</p>}

          {analysis.suggestedRoles?.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Best-fit roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.suggestedRoles.map((role) => (
                  <span key={role} className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs text-cyan">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.topSkills?.length > 0 && (
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Sparkles size={14} className="text-cyan" /> Detected skills
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.topSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.tools?.length > 0 && (
            <p className="text-sm text-slate-400">
              <Wrench size={14} className="mr-1 inline text-slate-500" />
              Tools: {analysis.tools.join(", ")}
            </p>
          )}
        </div>
      </div>

      {analysis.projectHighlights?.length > 0 && (
        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Target size={16} className="text-cyan" /> Project signals for interview probes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            {analysis.projectHighlights.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-md bg-white/[0.03] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {analysis.missingSkills?.length > 0 && (
          <div className="rounded-md border border-coral/20 bg-coral/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-coral">
              <AlertTriangle size={16} /> Gaps to strengthen
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              {analysis.missingSkills.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.riskFlags?.length > 0 && (
          <div className="rounded-md border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm font-medium text-amber-200">Interviewer will validate</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              {analysis.riskFlags.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {analysis.improvementTips?.length > 0 && (
        <div className="mt-4 rounded-md border border-lime/20 bg-lime/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-lime">
            <Lightbulb size={16} /> Coach tips before your next interview
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {analysis.improvementTips.map((tip) => (
              <li key={tip}>· {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.interviewFocusAreas?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Personalized interview focus</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.interviewFocusAreas.map((area) => (
              <span key={area} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {resume.textPreview && (
        <details className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-200">
            <Search size={16} className="text-cyan" /> Parsed resume text
          </summary>
          <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-400">{resume.textPreview}</p>
        </details>
      )}
    </motion.article>
  );
}

export default function ResumeUpload() {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [latestUploadId, setLatestUploadId] = useState(null);
  const { notify } = useToast();

  const load = () => api.get("/resumes").then(({ data }) => setResumes(data.resumes));

  useEffect(() => {
    load();
  }, []);

  const latestResume = useMemo(
    () => resumes.find((item) => item._id === latestUploadId) || resumes[0],
    [resumes, latestUploadId]
  );

  const setSelectedFile = (nextFile) => {
    if (!nextFile) return;
    const allowed = [".pdf", ".doc", ".docx"];
    const lower = nextFile.name.toLowerCase();
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      notify("Use PDF, DOC, or DOCX only", "error");
      return;
    }
    setFile(nextFile);
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);
    setLoading(true);
    setUploadStep(0);

    const stepTimer = window.setInterval(() => {
      setUploadStep((value) => Math.min(value + 1, uploadSteps.length - 1));
    }, 900);

    try {
      const { data } = await api.post("/resumes", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadStep(uploadSteps.length - 1);
      setLatestUploadId(data.resume._id);
      notify("Resume intelligence ready — start your personalized interview");
      setFile(null);
      await load();
    } catch (error) {
      notify(error.response?.data?.message || "Resume upload failed", "error");
    } finally {
      window.clearInterval(stepTimer);
      setLoading(false);
      window.setTimeout(() => setUploadStep(0), 1200);
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-cyan">Resume intelligence</p>
            <h2 className="mt-1 text-3xl font-semibold">Turn your resume into interview ammo</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Upload once. HireSense extracts skills, project signals, risk areas, and role fit — then generates stack-specific mock interview questions.
            </p>
          </div>
          <Link to="/interview/new" className="btn-secondary shrink-0">
            Skip to interview <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={upload} className="panel">
          <h3 className="text-xl font-semibold">Upload resume</h3>
          <p className="mt-2 text-sm text-slate-400">PDF, DOC, DOCX — parsed in seconds for personalized interviews.</p>

          <label
            className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center transition ${
              dragActive ? "border-cyan bg-cyan/10" : "border-white/20 bg-white/[0.03] hover:border-cyan/70"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              setSelectedFile(event.dataTransfer.files?.[0]);
            }}
          >
            <UploadCloud className="text-cyan" size={36} />
            <span className="mt-4 font-medium">{file ? file.name : "Drag & drop or click to choose"}</span>
            <span className="mt-2 text-sm text-slate-500">PDF, DOC, or DOCX up to your backend size limit</span>
            <input className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setSelectedFile(event.target.files?.[0])} />
          </label>

          {loading && (
            <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              {uploadSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {index < uploadStep ? (
                    <CheckCircle2 size={18} className="text-lime" />
                  ) : index === uploadStep ? (
                    <span className="h-4 w-4 animate-pulse rounded-full bg-cyan" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-white/20" />
                  )}
                  <span className={index <= uploadStep ? "text-slate-200" : "text-slate-500"}>{step}</span>
                </div>
              ))}
            </div>
          )}

          <button className="btn-primary mt-6 w-full" disabled={!file || loading}>
            {loading ? "Building your interview profile..." : "Upload and analyze"}
          </button>
        </form>

        <section className="panel">
          <h3 className="text-xl font-semibold">Analysis dashboard</h3>
          <p className="mt-2 text-sm text-slate-400">
            {latestResume ? "Latest intelligence report — start a mock interview when you are ready." : "Upload a resume to unlock the full report."}
          </p>

          <div className="mt-6 space-y-4">
            {latestResume ? (
              <AnalysisPanel resume={latestResume} />
            ) : (
              <EmptyState
                title="No resume analyzed yet"
                description="Upload a resume with your tech stack and projects. HireSense will surface skills, gaps, and interview focus areas."
              />
            )}

            {resumes.length > 1 && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-slate-500">Previous uploads</p>
                <div className="mt-3 space-y-3">
                  {resumes.slice(1).map((resume) => (
                    <button
                      key={resume._id}
                      type="button"
                      onClick={() => setLatestUploadId(resume._id)}
                      className="w-full rounded-md border border-white/10 p-3 text-left text-sm transition hover:border-cyan/40 hover:bg-white/[0.04]"
                    >
                      <span className="font-medium text-slate-200">{resume.originalName}</span>
                      <span className="mt-1 block text-slate-500">
                        {resume.analysis?.roleFitScore ? `${resume.analysis.roleFitScore}% fit` : "Analyzed"} · click to view
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
