import Feedback from "../models/Feedback.js";
import Interview from "../models/Interview.js";
import Question from "../models/Question.js";
import Resume from "../models/Resume.js";
import { evaluateAnswer, generateQuestions, generateRoadmap } from "../services/ai.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createInterview = asyncHandler(async (req, res) => {
  const { role, difficulty = "mid", resumeId } = req.body;
  const resume = resumeId ? await Resume.findOne({ _id: resumeId, user: req.user._id }) : null;
  const interview = await Interview.create({ user: req.user._id, role, difficulty, resume: resume?._id, status: "in_progress" });
  const generated = await generateQuestions({ role, difficulty, resumeText: resume?.extractedText });

  const questions = await Question.insertMany(
    generated.questions.slice(0, 6).map((item, index) => ({
      interview: interview._id,
      prompt: item.prompt,
      category: item.category,
      expectedSignals: item.expectedSignals,
      timeLimitSeconds: item.timeLimitSeconds || 120,
      order: index
    }))
  );

  res.status(201).json({ interview, questions });
});

export const listInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("resume", "originalName");
  res.json({ interviews });
});

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id }).populate("resume", "originalName analysis");
  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }
  const questions = await Question.find({ interview: interview._id }).sort({ order: 1 });
  const feedback = await Feedback.find({ interview: interview._id });
  res.json({ interview, questions, feedback });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  const question = await Question.findOne({ _id: req.params.questionId, interview: req.params.id });
  if (!interview || !question) {
    const error = new Error("Interview question not found");
    error.statusCode = 404;
    throw error;
  }

  const evaluation = await evaluateAnswer({ role: interview.role, question: question.prompt, answer: req.body.answer || "" });
  const feedback = await Feedback.findOneAndUpdate(
    { interview: interview._id, question: question._id },
    { ...evaluation, answer: req.body.answer || "" },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const allFeedback = await Feedback.find({ interview: interview._id });
  interview.aggregateScore = Math.round(allFeedback.reduce((sum, item) => sum + item.score, 0) / allFeedback.length);
  interview.currentQuestionIndex = Math.min(interview.currentQuestionIndex + 1, 6);
  await interview.save();

  res.json({ feedback, interview });
});

export const completeInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const feedback = await Feedback.find({ interview: interview._id });
  const roadmap = await generateRoadmap({ role: interview.role, feedback });
  interview.status = "completed";
  interview.completedAt = new Date();
  interview.roadmap = roadmap.roadmap || [];
  if (feedback.length) {
    interview.aggregateScore = Math.round(feedback.reduce((sum, item) => sum + item.score, 0) / feedback.length);
  }
  await interview.save();

  res.json({ interview, roadmap: interview.roadmap });
});
