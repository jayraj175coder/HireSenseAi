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
    currentQuestionIndex: { type: Number, default: 0 },
    aggregateScore: { type: Number, default: 0 },
    roadmap: [String],
    completedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
