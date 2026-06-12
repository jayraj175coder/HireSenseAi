import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

const StrengthsWeaknesses: React.FC<StrengthsWeaknessesProps> = ({
  strengths,
  weaknesses,
}) => {
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-lime/20 bg-lime/5 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-lime" />
          <h3 className="font-semibold text-lime">Strengths</h3>
        </div>

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {strengths.map((strength, index) => (
            <motion.li
              key={`${strength}-${index}`}
              variants={itemVariants}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-lime flex-shrink-0" />
              <span>{strength}</span>
            </motion.li>
          ))}
        </motion.ul>

        {strengths.length === 0 && (
          <p className="text-sm text-slate-400">No strengths detected yet</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-coral/20 bg-coral/5 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-coral" />
          <h3 className="font-semibold text-coral">Areas to Improve</h3>
        </div>

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {weaknesses.map((weakness, index) => (
            <motion.li
              key={`${weakness}-${index}`}
              variants={itemVariants}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-coral flex-shrink-0" />
              <span>{weakness}</span>
            </motion.li>
          ))}
        </motion.ul>

        {weaknesses.length === 0 && (
          <p className="text-sm text-slate-400">No weaknesses detected</p>
        )}
      </motion.div>
    </div>
  );
};

export default StrengthsWeaknesses;
