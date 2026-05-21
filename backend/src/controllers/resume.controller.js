import Resume from "../models/Resume.js";
import { analyzeResume } from "../services/ai.service.js";
import { extractResumeText } from "../services/resumeParser.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("Resume file is required");
    error.statusCode = 422;
    throw error;
  }

  const extractedText = await extractResumeText(req.file);
  const analysis = await analyzeResume(extractedText);
  const resume = await Resume.create({
    user: req.user._id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    extractedText,
    analysis
  });

  res.status(201).json({ resume });
});

export const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 }).select("-extractedText");
  res.json({ resumes });
});

export const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    const error = new Error("Resume not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ resume });
});
