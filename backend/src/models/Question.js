import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
    prompt: { type: String, required: true },
    category: { type: String, default: "technical" },
    source: { type: String, enum: ["resume", "role", "adaptive"], default: "role" },
    difficultyReason: String,
    expectedSignals: [String],
    evaluationRubric: [
      {
        criterion: String,
        weight: Number
      }
    ],
    timeLimitSeconds: { type: Number, default: 120 },
    order: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
