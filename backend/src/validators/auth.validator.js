import { body, validationResult } from "express-validator";

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const error = new Error(errors.array()[0].msg);
  error.statusCode = 422;
  next(error);
};

export const registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
];

export const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];
