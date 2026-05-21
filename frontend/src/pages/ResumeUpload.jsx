import { useEffect, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

export default function ResumeUpload() {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const load = () => api.get("/resumes").then(({ data }) => setResumes(data.resumes));
  useEffect(() => { load(); }, []);

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("resume", file);
    setLoading(true);
    try {
      await api.post("/resumes", formData, { headers: { "Content-Type": "multipart/form-data" } });
      notify("Resume analyzed");
      setFile(null);
      load();
    } catch (error) {
      notify(error.response?.data?.message || "Resume upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={upload} className="panel">
        <h2 className="text-2xl font-semibold">Upload resume</h2>
        <p className="mt-2 text-sm text-slate-400">PDF, DOC, and DOCX files are parsed for role-specific question generation.</p>
        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-6 py-12 text-center transition hover:border-cyan/70">
          <UploadCloud className="text-cyan" size={36} />
          <span className="mt-4 font-medium">{file ? file.name : "Choose resume file"}</span>
          <span className="mt-2 text-sm text-slate-500">Maximum size follows backend env config</span>
          <input className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setFile(event.target.files[0])} />
        </label>
        <button className="btn-primary mt-6 w-full" disabled={!file || loading}>{loading ? "Analyzing..." : "Upload and analyze"}</button>
      </form>

      <section className="panel">
        <h2 className="text-2xl font-semibold">Resume library</h2>
        <div className="mt-6 space-y-4">
          {resumes.length ? resumes.map((resume) => (
            <article key={resume._id} className="rounded-lg border border-white/10 p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 text-cyan" />
                <div>
                  <h3 className="font-medium">{resume.originalName}</h3>
                  <p className="text-sm text-slate-500">{Math.round(resume.size / 1024)} KB · {new Date(resume.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {resume.analysis && (
                <div className="mt-4 rounded-md bg-white/[0.04] p-4 text-sm text-slate-300">
                  <p>{resume.analysis.summary}</p>
                  <p className="mt-3 text-slate-500">Top skills: {resume.analysis.topSkills?.join(", ")}</p>
                </div>
              )}
            </article>
          )) : <EmptyState title="No resumes uploaded" description="Upload a resume to unlock personalized interview questions." />}
        </div>
      </section>
    </div>
  );
}
