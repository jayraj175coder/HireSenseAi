import { Router } from "express";
import { body } from "express-validator";
import { completeInterview, createInterview, getInterview, listInterviews, submitAnswer, submitLiveAnswer } from "../controllers/interview.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../validators/auth.validator.js";

const router = Router();
const roles = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "AI Engineer", "Data Analyst"];

router.use(protect);
router.get("/", listInterviews);
router.post("/", [body("role").isIn(roles).withMessage("Unsupported interview role")], validate, createInterview);
router.get("/:id", getInterview);
router.post("/:id/live-answer", [body("answer").trim().isLength({ min: 8 }).withMessage("Answer is too short")], validate, submitLiveAnswer);
router.post("/:id/questions/:questionId/answer", [body("answer").trim().isLength({ min: 8 }).withMessage("Answer is too short")], validate, submitAnswer);
router.post("/:id/complete", completeInterview);

export default router;
