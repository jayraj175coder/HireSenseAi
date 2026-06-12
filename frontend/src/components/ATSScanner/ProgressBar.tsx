import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  score: number;
  animated?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  score,
  animated = true,
  className = "",
  size = "md",
}) => {
  const getColor = (value: number): string => {
    if (value >= 80) return "bg-lime";
    if (value >= 60) return "bg-cyan";
    if (value >= 40) return "bg-amber-400";
    return "bg-coral";
  };

  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3",
  }[size];

  const containerHeightClass = {
    sm: "h-2",
    md: "h-3.5",
    lg: "h-4",
  }[size];

  return (
    <div
      className={`w-full rounded-full bg-white/10 overflow-hidden ${containerHeightClass} ${className}`}
    >
      <motion.div
        className={`${heightClass} ${getColor(score)} rounded-full`}
        initial={animated ? { width: 0 } : { width: `${score}%` }}
        animate={{ width: `${score}%` }}
        transition={animated ? { duration: 1.2, ease: "easeOut" } : {}}
      />
    </div>
  );
};

export default ProgressBar;
