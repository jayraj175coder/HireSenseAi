import Feedback from "../models/Feedback.js";
import Interview from "../models/Interview.js";
import Question from "../models/Question.js";
import Resume from "../models/Resume.js";
import { conductLiveInterviewTurn, evaluateAnswer, generateInterviewPlan, generateQuestions, generateRoadmap } from "../services/ai.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const liveQuestionSequence = {
  "Frontend Developer": [
    "Pick one UI project from your resume. What user problem did it solve, and what was your personal contribution?",
    "If that page became slow on mobile, how would you diagnose and improve it?",
    "How would you structure reusable components and state for that product as it grows?",
    "Tell me about an accessibility or UX tradeoff you would consider before shipping.",
    "Imagine an API response changes unexpectedly. How would you make the frontend resilient?"
  ],
  "Backend Developer": [
    "Pick one backend project from your resume. What problem did the API or service solve, and what was your personal contribution?",
    "How would you design the database schema and indexes if traffic increased?",
    "A production endpoint is timing out. How would you debug it step by step?",
    "What security and validation checks would you add before launch?",
    "Tell me about a backend tradeoff between speed, reliability, and maintainability."
  ],
  "Full Stack Developer": [
    "Pick one full-stack project from your resume. What did you build on the frontend, what did you build on the backend, and how did they connect?",
    "If real users started using it tomorrow, what architecture or data-flow change would you make first?",
    "A user reports that data is saved but not shown correctly in the UI. How would you debug across the stack?",
    "How do you keep frontend and backend contracts stable when requirements change?",
    "Tell me one tradeoff you made between user experience, performance, and implementation time."
  ],
  "AI Engineer": [
    "Pick one AI or automation project from your resume. What model or workflow did you use, and what was your contribution?",
    "How would you evaluate whether the AI output is actually good enough for users?",
    "If the model gives a wrong or hallucinated answer, how would you reduce that risk?",
    "How would you design logging, retries, and fallback behavior for this AI feature?",
    "Tell me a tradeoff between accuracy, latency, cost, and user trust."
  ],
  "Data Analyst": [
    "Pick one data project from your resume. What business question did it answer, and what was your contribution?",
    "How would you clean and validate the dataset before trusting the result?",
    "A metric suddenly drops by 30 percent. How would you investigate it?",
    "How would you present uncertain or incomplete findings to a stakeholder?",
    "Tell me one tradeoff between speed of analysis and confidence in the result."
  ]
};

function normalizeQuestion(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function replacementLiveQuestion(role, turnNumber, transcript) {
  const sequence = liveQuestionSequence[role] || liveQuestionSequence["Full Stack Developer"];
  const asked = new Set((transcript || []).filter((item) => item.speaker === "interviewer").map((item) => normalizeQuestion(item.text)));
  return sequence.find((question) => !asked.has(normalizeQuestion(question))) || sequence[Math.min(Math.max(turnNumber - 1, 0), sequence.length - 1)];
}

export const createInterview = asyncHandler(async (req, res) => {
  const { role, difficulty = "mid", resumeId, interviewerStyle = "friendly_hr" } = req.body;
  const resume = resumeId ? await Resume.findOne({ _id: resumeId, user: req.user._id }) : null;
  const interviewPlan = await generateInterviewPlan({ role, difficulty, resumeAnalysis: resume?.analysis, interviewerStyle });
  const interview = await Interview.create({
    user: req.user._id,
    role,
    difficulty,
    interviewerStyle,
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

  if (questions[0]) {
    interview.transcript.push({
      speaker: "interviewer",
      text: questions[0].prompt,
      question: questions[0]._id
    });
    await interview.save();
  }

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

  const questionBank = await Question.find({ interview: interview._id }).sort({ order: 1 });
  const previousFeedback = await Feedback.find({ interview: interview._id }).sort({ createdAt: 1 });
  const turnNumber = previousFeedback.length + 1;
  const answeredIndex = turnNumber - 1;
  const answeredQuestion = req.body.questionId
    ? await Question.findOne({ _id: req.body.questionId, interview: interview._id })
    : questionBank[answeredIndex];
  const currentQuestion = answeredQuestion?.prompt || req.body.currentQuestion || "Tell me about your background and why this role fits you.";
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
    maxTurns,
    interviewerStyle: interview.interviewerStyle
  });

  const nextBankQuestion = questionBank[turnNumber];
  if (nextBankQuestion) {
    liveTurn.nextQuestion = nextBankQuestion.prompt;
    liveTurn.nextQuestionCategory = nextBankQuestion.category;
    liveTurn.nextQuestionReason = `Generated ${nextBankQuestion.category} question (${nextBankQuestion.source || "role"}).`;
  } else {
    const repeatedQuestion = (interview.transcript || []).some(
      (item) => item.speaker === "interviewer" && normalizeQuestion(item.text) === normalizeQuestion(liveTurn.nextQuestion)
    );
    if (!liveTurn.nextQuestion || repeatedQuestion) {
      liveTurn.nextQuestion = replacementLiveQuestion(interview.role, turnNumber, interview.transcript);
      liveTurn.nextQuestionCategory = turnNumber === 1 ? "resume_deep_dive" : turnNumber === 2 ? "system_design" : "technical";
      liveTurn.nextQuestionReason = "Selected to avoid repeating the previous interviewer question.";
    }
  }

  const feedback = await Feedback.create({
    interview: interview._id,
    question: answeredQuestion?._id,
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
    interview.difficultyStage = liveTurn.difficultyStage || interview.difficultyStage;
    interview.readinessSummary = roadmap.readinessSummary;
    interview.hiringRecommendation = roadmap.hiringRecommendation;
    interview.roadmap = roadmap.roadmap || [];
    interview.practicePlan = roadmap.practicePlan || [];
    interview.recommendedResources = roadmap.recommendedResources || [];
    interview.competencyScores = roadmap.competencyScores || [];
    interview.insightTimeline = roadmap.insightTimeline || [];
  } else {
    interview.currentQuestionIndex = turnNumber;
    interview.aggregateScore = Math.round([...previousFeedback, feedback].reduce((sum, item) => sum + item.score, 0) / turnNumber);
    interview.difficultyStage = liveTurn.difficultyStage || interview.difficultyStage;
    interview.transcript.push({
      speaker: "interviewer",
      text: liveTurn.nextQuestion || "Let us go a level deeper. Can you explain your reasoning with a concrete example?",
      question: nextBankQuestion?._id
    });
  }

  await interview.save();

  res.json({
    feedback,
    interviewerReply: liveTurn.interviewerReply,
    nextQuestion: completed ? null : liveTurn.nextQuestion,
    nextQuestionCategory: liveTurn.nextQuestionCategory,
    nextQuestionReason: liveTurn.nextQuestionReason,
    nextQuestionId: nextBankQuestion?._id || null,
    difficultyStage: interview.difficultyStage,
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
  interview.hiringRecommendation = roadmap.hiringRecommendation;
  interview.roadmap = roadmap.roadmap || [];
  interview.practicePlan = roadmap.practicePlan || [];
  interview.recommendedResources = roadmap.recommendedResources || [];
  interview.competencyScores = roadmap.competencyScores || [];
  interview.insightTimeline = roadmap.insightTimeline || [];
  if (feedback.length) {
    interview.aggregateScore = Math.round(feedback.reduce((sum, item) => sum + item.score, 0) / feedback.length);
  }
  await interview.save();

  res.json({ interview, roadmap: interview.roadmap });
});
