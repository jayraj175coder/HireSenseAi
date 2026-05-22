import { BadgeCheck, Building2, Flame, ShieldCheck } from "lucide-react";

export const interviewers = [
  {
    id: "friendly_hr",
    name: "Friendly HR",
    icon: BadgeCheck,
    accent: "text-lime",
    description: "Warm, conversational, motivation-focused, and ideal for confidence building.",
    style: "Encouraging follow-ups, communication checks, culture-fit signals."
  },
  {
    id: "faang_technical",
    name: "FAANG Technical",
    icon: Building2,
    accent: "text-cyan",
    description: "Structured technical interviewer who pushes on scale, correctness, and edge cases.",
    style: "System design pressure, complexity probes, objective rubrics."
  },
  {
    id: "startup_founder",
    name: "Startup Founder",
    icon: Flame,
    accent: "text-coral",
    description: "Fast, practical, product-minded interviewer focused on ownership and shipping.",
    style: "Ambiguity, customer impact, speed, and decision quality."
  },
  {
    id: "strict_senior",
    name: "Strict Senior Engineer",
    icon: ShieldCheck,
    accent: "text-slate-100",
    description: "Rigorous senior engineer who challenges weak logic and vague claims.",
    style: "Production readiness, debugging depth, tradeoff defense."
  }
];
