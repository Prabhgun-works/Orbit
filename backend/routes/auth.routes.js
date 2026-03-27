const express  = require("express");
const passport = require("passport");
const router   = express.Router();
const {
  register,
  login,
  googleCallback,
  getMe,
  updateProfile,
} = require("../controllers/auth.controller");
const { protect }     = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");
// ─── Public routes ────────────────────────────────────
router.post("/register", authLimiter, register);
router.post("/login",    authLimiter, login);
// ─── Google OAuth ─────────────────────────────────────
// Step 1: redirect user to Google consent screen
router.get("/google",
  passport.authenticate("google", {
    scope:   ["profile", "email"],
    session: false,
  })
);
// Step 2: Google redirects back here after user approves
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_failed`,
    session: false,
  }),
  googleCallback
);
// ─── Protected routes ─────────────────────────────────
router.get("/me",             protect, getMe);
router.put("/update-profile", protect, updateProfile);

module.exports = router;
