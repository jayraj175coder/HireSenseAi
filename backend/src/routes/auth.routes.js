import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { loginRules, registerRules, validate } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", protect, me);

export default router;
