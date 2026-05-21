import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BrainCircuit, FileText, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: FileText, title: "Resume-aware prep", text: "Parse your resume and turn it into role-specific interview signals." },
  { icon: MessageSquareText, title: "Adaptive interviews", text: "Timed chat rounds for frontend, backend, full stack, AI, and data roles." },
  { icon: BarChart3, title: "Performance analytics", text: "Track score trends, recurring weak spots, and readiness progress." }
];

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-night text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan text-night">
            <Sparkles size={21} />
          </span>
          <span className="font-semibold">HireSense AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link className="btn-secondary hidden sm:inline-flex" to="/login">Login</Link>
          <Link className="btn-primary" to="/register">Start free <ArrowRight size={18} /></Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1fr_0.82fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            <ShieldCheck size={16} className="text-lime" /> Production-grade AI interview practice
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">HireSense AI</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A polished mock interview workspace that reads your resume, generates role-specific questions, evaluates answers, and turns feedback into a measurable career roadmap.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/register">Create account <ArrowRight size={18} /></Link>
            <Link className="btn-secondary" to="/login">Open dashboard</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.55 }} className="glass rounded-lg p-4 shadow-glow">
          <div className="rounded-md border border-white/10 bg-[#0A0F1D] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-500">Live mock round</p>
                <h2 className="mt-1 text-xl font-semibold">Full Stack Developer</h2>
              </div>
              <BrainCircuit className="text-cyan" size={28} />
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-lg bg-white/[0.04] p-4">
                <p className="text-sm text-cyan">Question 3 of 6</p>
                <p className="mt-2 text-slate-200">How would you keep frontend and backend contracts reliable as a product grows?</p>
              </div>
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-slate-400">Evaluation preview</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["Score 86", "Confidence 78", "Trend +12"].map((item) => (
                    <div key={item} className="rounded-md bg-white/[0.04] px-3 py-4 text-center text-sm text-slate-200">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02] px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="panel">
              <Icon className="text-cyan" size={24} />
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
