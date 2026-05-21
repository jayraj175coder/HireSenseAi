import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
    role: {
      type: String,
      enum: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "AI Engineer", "Data Analyst"],
      required: true
    },
    status: { type: String, enum: ["draft", "in_progress", "completed"], default: "draft" },
    difficulty: { type: String, enum: ["junior", "mid", "senior"], default: "mid" },
    interviewPlan: {
      openingMessage: String,
      strategy: String,
      competencies: [
        {
          name: String,
          weight: Number,
          whyItMatters: String
        }
      ],
      resumeBasedProbes: [String],
      riskAreasToValidate: [String]
    },
    transcript: [
      {
        speaker: { type: String, enum: ["interviewer", "candidate", "system"], default: "system" },
        text: String,
        question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    currentQuestionIndex: { type: Number, default: 0 },
    aggregateScore: { type: Number, default: 0 },
    competencyScores: [
      {
        name: String,
        score: Number
      }
    ],
    readinessSummary: String,
    roadmap: [String],
    practicePlan: [String],
    recommendedResources: [String],
    completedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
