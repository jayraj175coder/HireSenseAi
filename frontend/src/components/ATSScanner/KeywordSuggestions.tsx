import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

interface KeywordSuggestionsProps {
  matched: string[];
  missing: string[];
  suggested: string[];
}

const KeywordSuggestions: React.FC<KeywordSuggestionsProps> = ({
  matched,
  missing,
  suggested,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="space-y-5">
      {matched.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-lime/20 bg-lime/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-lime" />
            <h4 className="font-semibold text-lime">Matched Keywords</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {matched.map((keyword) => (
              <motion.span
                key={keyword}
                variants={itemVariants}
                className="rounded-full bg-lime/20 px-3 py-1 text-xs text-lime font-medium"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {matched.length} keywords found in your resume
          </p>
        </motion.div>
      )}

      {missing.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-coral/20 bg-coral/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-coral" />
            <h4 className="font-semibold text-coral">Missing Keywords</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((keyword) => (
              <motion.span
                key={keyword}
                variants={itemVariants}
                className="rounded-full bg-coral/20 px-3 py-1 text-xs text-coral/80 font-medium line-through"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Add these to improve your ATS score
          </p>
        </motion.div>
      )}

      {suggested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-cyan/20 bg-cyan/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-cyan" />
            <h4 className="font-semibold text-cyan">Suggested Keywords</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggested.map((keyword) => (
              <motion.span
                key={keyword}
                variants={itemVariants}
                className="rounded-full bg-cyan/20 px-3 py-1 text-xs text-cyan font-medium cursor-pointer hover:bg-cyan/30 transition"
              >
                + <span className="font-semibold">{keyword}</span>
              </motion.span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Consider adding these high-impact keywords
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default KeywordSuggestions;
