const User          = require("../models/mongo/User.model");
const jwt           = require("jsonwebtoken");
const asyncHandler  = require("../utils/asyncHandler");

// ─── Helper: sign token + send response ──────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:        user._id,
      name:      user.name,
      email:     user.email,
      avatar:    user.avatar,
      role:      user.role,
      cpHandles: user.cpHandles,
    },
  });
};

// ─── POST /api/auth/register ──────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide name, email and password.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Email is already registered.",
    });
  }

  const user = await User.create({
    name:         name.trim(),
    email:        email.toLowerCase().trim(),
    password,
    authProvider: "local",
  });

  sendTokenResponse(user, 201, res);
});

// ─── POST /api/auth/login ─────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password.",
    });
  }

  // Explicitly select password — it's excluded by default in User model
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials.",
    });
  }

  if (user.authProvider === "google" && !user.password) {
    return res.status(400).json({
      success: false,
      message: "This account was created with Google. Please sign in with Google.",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials.",
    });
  }

  sendTokenResponse(user, 200, res);
});

// ─── GET /api/auth/google/callback ───────────────────
// Called by Passport after Google approves
const googleCallback = asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { id: req.user._id, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );

  // Redirect to frontend — token picked up by GoogleSuccess.jsx
  res.redirect(
    `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/google/success?token=${token}`
  );
});

// ─── GET /api/auth/me ─────────────────────────────────
// Returns logged-in user profile — requires JWT
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id:        req.user._id,
      name:      req.user.name,
      email:     req.user.email,
      avatar:    req.user.avatar,
      role:      req.user.role,
      bio:       req.user.bio,
      cpHandles: req.user.cpHandles,
      createdAt: req.user.createdAt,
    },
  });
});

// ─── PUT /api/auth/update-profile ────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name || req.user.name, bio: bio || req.user.bio },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      bio:   user.bio,
    },
  });
});

module.exports = { register, login, googleCallback, getMe, updateProfile };
