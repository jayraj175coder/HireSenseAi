import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    answer: { type: String, default: "" },
    score: { type: Number, min: 0, max: 100, default: 0 },
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    confidence: { type: Number, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
