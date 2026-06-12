export interface ATSScoreBreakdown {
  overall: number;
  keyword: number;
  skills: number;
  experience: number;
  education: number;
}

export interface ATSAnalysis {
  scores: ATSScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestedKeywords: string[];
  detectedSkills: {
    name: string;
    category: string;
    proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  }[];
  experienceLevel: {
    years: number;
    level: "Entry-level" | "Mid-level" | "Senior" | "Lead";
  };
  educationDetails: {
    degree: string;
    field: string;
    relevance: "Highly Relevant" | "Relevant" | "Somewhat Relevant";
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedRoles?: string[];
  roleFitScore?: number;
}

export interface ATSResumeData {
  _id: string;
  originalName: string;
  analysis: ATSAnalysis;
  createdAt: string;
}
