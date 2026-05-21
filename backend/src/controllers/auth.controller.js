import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/token.js";

function authPayload(user) {
  return {
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, targetRole: user.targetRole }
  };
}

export const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    targetRole: req.body.targetRole
  });
  res.status(201).json(authPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !(await user.comparePassword(req.body.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  res.json(authPayload(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
