import type { ATSScoreBreakdown } from "../types/ats";

export const calculateKeywordScore = (matched: number, total: number): number => {
  if (total === 0) return 100;
  return Math.round((matched / total) * 100);
};

export const calculateSkillsScore = (
  detectedSkills: number,
  requiredSkills: number
): number => {
  if (requiredSkills === 0) return 100;
  return Math.min(100, Math.round((detectedSkills / requiredSkills) * 100));
};

export const calculateExperienceScore = (
  yearsExperience: number,
  yearsRequired: number
): number => {
  const ratio = yearsExperience / yearsRequired;
  if (ratio >= 1) return 100;
  if (ratio >= 0.8) return 90;
  if (ratio >= 0.6) return 75;
  if (ratio >= 0.4) return 60;
  return Math.max(30, Math.round(ratio * 50));
};

export const calculateEducationScore = (
  hasRelevantDegree: boolean,
  degreeLevel: "HighSchool" | "BS" | "MS" | "PhD" = "BS"
): number => {
  const baseScore = hasRelevantDegree ? 85 : 40;
  const degreeBonus = {
    HighSchool: 0,
    BS: 0,
    MS: 10,
    PhD: 15,
  };
  return Math.min(100, baseScore + degreeBonus[degreeLevel]);
};

export const calculateOverallScore = (scores: ATSScoreBreakdown): number => {
  const weights = {
    keyword: 0.25,
    skills: 0.25,
    experience: 0.25,
    education: 0.15,
  };

  const weighted =
    scores.keyword * weights.keyword +
    scores.skills * weights.skills +
    scores.experience * weights.experience +
    scores.education * weights.education;

  return Math.round(weighted);
};

export const getScoreColor = (
  score: number
): "text-lime" | "text-cyan" | "text-amber-400" | "text-coral" => {
  if (score >= 80) return "text-lime";
  if (score >= 60) return "text-cyan";
  if (score >= 40) return "text-amber-400";
  return "text-coral";
};

export const getScoreLabel = (
  score: number
): "Excellent" | "Good" | "Fair" | "Poor" => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
};
