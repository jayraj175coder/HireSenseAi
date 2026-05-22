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
    interviewerStyle: {
      type: String,
      enum: ["friendly_hr", "faang_technical", "startup_founder", "strict_senior"],
      default: "friendly_hr"
    },
    difficultyStage: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner"
    },
    interviewPlan: {
      openingMessage: String,
      greetingTransition: String,
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
    hiringRecommendation: String,
    insightTimeline: [
      {
        label: String,
        value: String,
        severity: { type: String, enum: ["positive", "neutral", "warning"], default: "neutral" }
      }
    ],
    roadmap: [String],
    practicePlan: [String],
    recommendedResources: [String],
    completedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
