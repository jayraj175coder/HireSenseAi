import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    answer: { type: String, default: "" },
    score: { type: Number, min: 0, max: 100, default: 0 },
    rubricScores: [
      {
        criterion: String,
        score: Number,
        note: String
      }
    ],
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    evidence: [String],
    communicationSignals: {
      clarity: Number,
      structure: Number,
      specificity: Number,
      concision: Number
    },
    interviewerReply: String,
    followUpQuestion: String,
    nextQuestionAdjustment: String,
    hireSignal: { type: String, enum: ["strong_no", "lean_no", "mixed", "lean_yes", "strong_yes"], default: "mixed" },
    confidence: { type: Number, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
