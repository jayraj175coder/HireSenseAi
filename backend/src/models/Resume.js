import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    extractedText: { type: String, default: "" },
    analysis: {
      summary: String,
      candidateHeadline: String,
      roleFitScore: Number,
      topSkills: [String],
      missingSkills: [String],
      senioritySignal: String,
      improvementTips: [String],
      technicalSkills: [String],
      domainSignals: [String],
      tools: [String],
      projectHighlights: [String],
      riskFlags: [String],
      suggestedRoles: [String],
      interviewFocusAreas: [String],
      personalizationContext: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
