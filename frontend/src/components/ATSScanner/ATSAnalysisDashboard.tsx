import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Search,
  Briefcase,
  GraduationCap,
  Zap,
  TrendingUp,
} from "lucide-react";
import ScoreCard from "./ScoreCard";
import KeywordSuggestions from "./KeywordSuggestions";
import StrengthsWeaknesses from "./StrengthsWeaknesses";
import ProgressBar from "./ProgressBar";
import { getScoreLabel } from "../../services/atsAnalysis";
import type { ATSAnalysis } from "../../types/ats";

interface ATSAnalysisDashboardProps {
  analysis: ATSAnalysis;
  resumeName: string;
}

const ATSAnalysisDashboard: React.FC<ATSAnalysisDashboardProps> = ({
  analysis,
  resumeName,
}) => {
  const scores = analysis.scores;

  const scoreMetrics = useMemo(
    () => [
      {
        title: "ATS Score",
        description: "Overall resume compatibility",
        score: scores.overall,
        icon: <TrendingUp size={20} />,
        details: `Your resume is ${getScoreLabel(scores.overall).toLowerCase()}`,
      },
      {
        title: "Keyword Match",
        description: "Relevant keywords found",
        score: scores.keyword,
        icon: <Search size={20} />,
        details: `${analysis.matchedKeywords.length} matched, ${analysis.missingKeywords.length} missing`,
      },
      {
        title: "Skills Match",
        description: "Technical skills alignment",
        score: scores.skills,
        icon: <Zap size={20} />,
        details: `${analysis.detectedSkills.length} skills detected`,
      },
      {
        title: "Experience",
        description: "Years of relevant experience",
        score: scores.experience,
        icon: <Briefcase size={20} />,
        details: `${analysis.experienceLevel.years} years · ${analysis.experienceLevel.level}`,
      },
      {
        title: "Education",
        description: "Degree & field relevance",
        score: scores.education,
        icon: <GraduationCap size={20} />,
        details: analysis.educationDetails[0]?.degree || "Not detected",
      },
    ],
    [scores, analysis]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-white/10 bg-gradient-to-r from-cyan/10 to-blue-500/10 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-cyan mb-2">
              <Target size={16} /> ATS Analysis Report
            </div>
            <h2 className="text-2xl font-bold">{resumeName}</h2>
            <p className="mt-2 text-sm text-slate-400">
              Comprehensive resume compatibility analysis with actionable recommendations
            </p>
          </div>

          {/* Overall Score Circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative h-24 w-24">
              <svg
                className="h-24 w-24 -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  className="text-cyan"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={
                    2 * Math.PI * 42 -
                    (scores.overall / 100) * 2 * Math.PI * 42
                  }
                  initial={{
                    strokeDashoffset: 2 * Math.PI * 42,
                  }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 42 -
                      (scores.overall / 100) * 2 * Math.PI * 42,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-cyan">
                  {scores.overall}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  /100
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {getScoreLabel(scores.overall)}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Score Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {scoreMetrics.map((metric, index) => (
          <ScoreCard
            key={metric.title}
            {...metric}
            delay={0.1 + index * 0.05}
          />
        ))}
      </div>

      {/* Keywords & Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border border-white/10 bg-white/[0.03] p-6"
      >
        <h3 className="text-xl font-semibold mb-4">Keyword Analysis</h3>
        <KeywordSuggestions
          matched={analysis.matchedKeywords}
          missing={analysis.missingKeywords}
          suggested={analysis.suggestedKeywords}
        />
      </motion.div>

      {/* Strengths & Weaknesses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Resume Assessment</h3>
        <StrengthsWeaknesses
          strengths={analysis.strengths}
          weaknesses={analysis.weaknesses}
        />
      </motion.div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-6"
        >
          <h3 className="text-xl font-semibold text-yellow-100 mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <motion.li
                key={`${rec}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                <span>{rec}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ATSAnalysisDashboard;
