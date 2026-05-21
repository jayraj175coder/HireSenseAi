import Feedback from "../models/Feedback.js";
import Interview from "../models/Interview.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAnalytics = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: 1 });
  const feedback = await Feedback.find({ interview: { $in: interviews.map((item) => item._id) } }).populate("question", "category");

  const completed = interviews.filter((item) => item.status === "completed");
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + item.aggregateScore, 0) / completed.length)
    : 0;
  const weaknessMap = feedback.reduce((acc, item) => {
    item.weaknesses.forEach((weakness) => {
      acc[weakness] = (acc[weakness] || 0) + 1;
    });
    return acc;
  }, {});

  res.json({
    stats: {
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      averageScore,
      bestScore: Math.max(0, ...completed.map((item) => item.aggregateScore))
    },
    trends: interviews.map((item) => ({
      date: item.createdAt,
      score: item.aggregateScore,
      role: item.role
    })),
    weaknesses: Object.entries(weaknessMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    recent: interviews.slice(-5).reverse()
  });
});
