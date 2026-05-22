import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BrainCircuit, Camera, FileText, MessageSquareText, Mic, ShieldCheck, Sparkles, TrendingUp, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: FileText, title: "Resume intelligence", text: "Extracts skills, project signals, risk areas, and personalized interview focus." },
  { icon: UserRoundCheck, title: "Recruiter personalities", text: "Friendly HR, FAANG technical, startup founder, and strict senior engineer modes." },
  { icon: Camera, title: "Video interview room", text: "Camera, AI voice, live transcript, waveform states, and adaptive follow-up questions." },
  { icon: BarChart3, title: "Recruiter analytics", text: "Live communication, technical depth, confidence, and problem-solving signals." }
];

const testimonials = [
  "Feels like a real recruiter is pushing me on the weak parts.",
  "The report made my next practice plan obvious.",
  "The video room is what sells the demo immediately."
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
          <Link className="btn-primary" to="/register">Launch interview <ArrowRight size={18} /></Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-cyan">
            <ShieldCheck size={16} /> AI recruiter simulation for serious candidates
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">HireSense AI</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A resume-aware AI recruiter that speaks, listens, challenges weak answers, adapts difficulty, and produces a premium hiring-readiness report.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/register">Start recruiter simulation <ArrowRight size={18} /></Link>
            <Link className="btn-secondary" to="/login">Open dashboard</Link>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {["Voice AI", "Webcam", "Adaptive scoring"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-sm text-slate-300">{item}</div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.55 }} className="rounded-lg border border-white/10 bg-[#070B16] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative min-h-72 rounded-lg border border-cyan/20 bg-[radial-gradient(circle_at_50%_30%,rgba(92,225,230,0.2),transparent_34%),#0A0F1D] p-5">
              <span className="absolute right-4 top-4 rounded-full bg-cyan/10 px-3 py-1 text-xs text-cyan">Speaking</span>
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-cyan text-night shadow-[0_0_70px_rgba(92,225,230,0.35)]">
                  <BrainCircuit size={48} />
                </div>
                <h2 className="mt-5 text-xl font-semibold">FAANG Technical</h2>
                <p className="mt-2 text-sm text-slate-400">"That works for small systems. How would you redesign it for millions of users?"</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Live recruiter signals</p>
                <Mic className="text-cyan" size={20} />
              </div>
              {[
                ["Communication", 82],
                ["Technical depth", 74],
                ["Confidence", 68],
                ["Problem solving", 79]
              ].map(([label, value]) => (
                <div key={label} className="mt-5">
                  <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-cyan">{value}%</span></div>
                  <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan" style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm text-slate-500">Recruiter report preview</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Score", "84%"],
                ["Recommendation", "Next round"],
                ["Level", "Advanced"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-night/60 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02] px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold">Built for demo impact</h2>
              <p className="mt-3 max-w-2xl text-slate-400">Everything is designed to feel like a real recruiter product: resume context, video presence, live scoring, and polished reports.</p>
            </div>
            <TrendingUp className="text-cyan" size={34} />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="panel">
                <Icon className="text-cyan" size={24} />
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
              <MessageSquareText className="text-cyan" size={22} />
              <p className="mt-5 text-sm leading-7 text-slate-300">"{item}"</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold">Practice like the interview is already real.</h2>
          <Link className="btn-primary mt-6" to="/register">Try HireSense AI <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
