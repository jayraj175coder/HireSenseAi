import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(isRegister ? form : { email: form.email, password: form.password }, mode);
      notify(isRegister ? "Account created" : "Welcome back");
      navigate("/dashboard");
    } catch (error) {
      notify(error.response?.data?.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-night p-5 text-white">
      <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="glass w-full max-w-md rounded-lg p-6 shadow-glow">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan text-night"><BrainCircuit size={21} /></span>
          <span className="font-semibold">HireSense AI</span>
        </Link>
        <h1 className="text-3xl font-semibold">{isRegister ? "Create your workspace" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-400">{isRegister ? "Start practicing with resume-aware AI interviews." : "Continue improving your interview readiness."}</p>
        <div className="mt-8 space-y-4">
          {isRegister && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300"><User size={16} /> Name</span>
              <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
          )}
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300"><Mail size={16} /> Email</span>
            <input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300"><Lock size={16} /> Password</span>
            <input className="field" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required />
          </label>
        </div>
        <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Working..." : isRegister ? "Create account" : "Login"}</button>
        <p className="mt-5 text-center text-sm text-slate-400">
          {isRegister ? "Already registered?" : "New to HireSense?"} <Link className="text-cyan" to={isRegister ? "/login" : "/register"}>{isRegister ? "Login" : "Create account"}</Link>
        </p>
      </motion.form>
    </main>
  );
}
