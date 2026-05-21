import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
    prompt: { type: String, required: true },
    category: { type: String, default: "technical" },
    expectedSignals: [String],
    timeLimitSeconds: { type: Number, default: 120 },
    order: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
