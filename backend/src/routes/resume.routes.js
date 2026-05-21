import { Router } from "express";
import { getResume, listResumes, uploadResume } from "../controllers/resume.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { resumeUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.use(protect);
router.get("/", listResumes);
router.get("/:id", getResume);
router.post("/", resumeUpload.single("resume"), uploadResume);

export default router;
