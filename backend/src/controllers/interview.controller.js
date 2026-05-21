import Feedback from "../models/Feedback.js";
import Interview from "../models/Interview.js";
import Question from "../models/Question.js";
import Resume from "../models/Resume.js";
import { conductLiveInterviewTurn, evaluateAnswer, generateInterviewPlan, generateQuestions, generateRoadmap } from "../services/ai.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createInterview = asyncHandler(async (req, res) => {
  const { role, difficulty = "mid", resumeId } = req.body;
  const resume = resumeId ? await Resume.findOne({ _id: resumeId, user: req.user._id }) : null;
  const interviewPlan = await generateInterviewPlan({ role, difficulty, resumeAnalysis: resume?.analysis });
  const interview = await Interview.create({
    user: req.user._id,
    role,
    difficulty,
    resume: resume?._id,
    status: "in_progress",
    interviewPlan,
    transcript: [
      {
        speaker: "interviewer",
        text: interviewPlan.openingMessage || `I will run this like a realistic ${role} interview with adaptive follow-ups.`
      }
    ]
  });
  const generated = await generateQuestions({ role, difficulty, resumeText: resume?.extractedText });

  const questions = await Question.insertMany(
    generated.questions.slice(0, 6).map((item, index) => ({
      interview: interview._id,
      prompt: item.prompt,
      category: item.category,
      source: item.source || "role",
      difficultyReason: item.difficultyReason,
      expectedSignals: item.expectedSignals,
      evaluationRubric: item.evaluationRubric || [],
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
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id }).populate("resume", "originalName analysis extractedText");
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
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id }).populate("resume", "analysis");
  const question = await Question.findOne({ _id: req.params.questionId, interview: req.params.id });
  if (!interview || !question) {
    const error = new Error("Interview question not found");
    error.statusCode = 404;
    throw error;
  }

  const previousFeedback = await Feedback.find({ interview: interview._id }).sort({ createdAt: -1 }).limit(3);
  const evaluation = await evaluateAnswer({
    role: interview.role,
    question: question.prompt,
    answer: req.body.answer || "",
    resumeAnalysis: interview.resume?.analysis,
    previousFeedback
  });
  const feedback = await Feedback.findOneAndUpdate(
    { interview: interview._id, question: question._id },
    { ...evaluation, answer: req.body.answer || "" },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const allFeedback = await Feedback.find({ interview: interview._id });
  interview.aggregateScore = Math.round(allFeedback.reduce((sum, item) => sum + item.score, 0) / allFeedback.length);
  interview.currentQuestionIndex = Math.min(interview.currentQuestionIndex + 1, 6);
  interview.transcript.push(
    { speaker: "candidate", text: req.body.answer || "", question: question._id },
    { speaker: "interviewer", text: evaluation.interviewerReply || evaluation.followUpQuestion || "Thank you. I will use that to calibrate the next question.", question: question._id }
  );
  await interview.save();

  res.json({ feedback, interview });
});

export const submitLiveAnswer = asyncHandler(async (req, res) => {
  const maxTurns = 6;
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id }).populate("resume", "analysis");
  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const previousFeedback = await Feedback.find({ interview: interview._id }).sort({ createdAt: 1 });
  const turnNumber = previousFeedback.length + 1;
  const currentQuestion = req.body.currentQuestion || "Tell me about your background and why this role fits you.";
  const answer = req.body.answer || "";
  const liveTurn = await conductLiveInterviewTurn({
    role: interview.role,
    difficulty: interview.difficulty,
    resumeAnalysis: interview.resume?.analysis,
    interviewPlan: interview.interviewPlan,
    transcript: interview.transcript,
    currentQuestion,
    answer,
    turnNumber,
    maxTurns
  });

  const feedback = await Feedback.create({
    interview: interview._id,
    answer,
    score: liveTurn.score,
    rubricScores: liveTurn.rubricScores || [],
    strengths: liveTurn.strengths || [],
    weaknesses: liveTurn.weaknesses || [],
    suggestions: liveTurn.suggestions || [],
    evidence: liveTurn.evidence || [],
    communicationSignals: liveTurn.communicationSignals,
    interviewerReply: liveTurn.interviewerReply,
    followUpQuestion: liveTurn.nextQuestion,
    nextQuestionAdjustment: liveTurn.nextQuestionReason,
    hireSignal: liveTurn.hireSignal || "mixed",
    confidence: liveTurn.confidence || 0
  });

  const completed = turnNumber >= maxTurns;
  interview.transcript.push(
    { speaker: "candidate", text: answer },
    { speaker: "interviewer", text: liveTurn.interviewerReply || "Thank you, that helps me understand your approach." }
  );

  if (completed) {
    const allFeedback = [...previousFeedback, feedback];
    const roadmap = await generateRoadmap({ role: interview.role, feedback: allFeedback });
    interview.status = "completed";
    interview.completedAt = new Date();
    interview.aggregateScore = Math.round(allFeedback.reduce((sum, item) => sum + item.score, 0) / allFeedback.length);
    interview.readinessSummary = roadmap.readinessSummary;
    interview.roadmap = roadmap.roadmap || [];
    interview.practicePlan = roadmap.practicePlan || [];
    interview.recommendedResources = roadmap.recommendedResources || [];
    interview.competencyScores = roadmap.competencyScores || [];
  } else {
    interview.currentQuestionIndex = turnNumber;
    interview.aggregateScore = Math.round([...previousFeedback, feedback].reduce((sum, item) => sum + item.score, 0) / turnNumber);
    interview.transcript.push({ speaker: "interviewer", text: liveTurn.nextQuestion || "Let us go a level deeper. Can you explain your reasoning with a concrete example?" });
  }

  await interview.save();

  res.json({
    feedback,
    interviewerReply: liveTurn.interviewerReply,
    nextQuestion: completed ? null : liveTurn.nextQuestion,
    nextQuestionCategory: liveTurn.nextQuestionCategory,
    nextQuestionReason: liveTurn.nextQuestionReason,
    completed,
    interview
  });
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
  interview.readinessSummary = roadmap.readinessSummary;
  interview.roadmap = roadmap.roadmap || [];
  interview.practicePlan = roadmap.practicePlan || [];
  interview.recommendedResources = roadmap.recommendedResources || [];
  interview.competencyScores = roadmap.competencyScores || [];
  if (feedback.length) {
    interview.aggregateScore = Math.round(feedback.reduce((sum, item) => sum + item.score, 0) / feedback.length);
  }
  await interview.save();

  res.json({ interview, roadmap: interview.roadmap });
});
