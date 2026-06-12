import React from "react";
import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";

interface ScoreCardProps {
  title: string;
  description: string;
  score: number;
  icon: React.ReactNode;
  details?: string;
  delay?: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  description,
  score,
  icon,
  details,
  delay = 0,
}) => {
  const getStatus = (value: number): string => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Good";
    if (value >= 40) return "Fair";
    return "Needs Improvement";
  };

  const getStatusColor = (value: number): string => {
    if (value >= 80) return "text-lime bg-lime/10";
    if (value >= 60) return "text-cyan bg-cyan/10";
    if (value >= 40) return "text-amber-400 bg-amber-400/10";
    return "text-coral bg-coral/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-lg border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1 text-cyan">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-200">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(score)}`}
        >
          {getStatus(score)}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Score
          </span>
          <span className="text-2xl font-bold text-cyan">{score}%</span>
        </div>
        <ProgressBar score={score} animated size="md" />
      </div>

      {details && (
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">{details}</p>
      )}
    </motion.div>
  );
};

export default ScoreCard;
