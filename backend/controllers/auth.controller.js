const User               = require("../models/mongo/User.model");
const { sendTokenResponse, generateToken } = require("../utils/jwt.utils");
const asyncHandler       = require("../utils/asyncHandler");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide name, email and password." });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: "Email already registered." });
  }

  const user = await User.create({ name, email, password, authProvider: "local" });
  sendTokenResponse(user, 201, res);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password." });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  if (user.authProvider === "google" && !user.password) {
    return res.status(400).json({ success: false, message: "This account uses Google login." });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  sendTokenResponse(user, 200, res);
});

// GET /api/auth/google/callback  — called by Passport after Google approves
const googleCallback = asyncHandler(async (req, res) => {
  const token = generateToken(req.user._id, req.user.role);
  // Frontend catches the token from the query param, stores it, redirects to dashboard
  res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
});

// GET /api/auth/me  — protected
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.publicProfile });
});

module.exports = { register, login, googleCallback, getMe };
