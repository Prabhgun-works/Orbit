const express  = require("express");
const passport = require("passport");
const router   = express.Router();

const { register, login, googleCallback, getMe } = require("../controllers/auth.controller");
const { protect }     = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

// Local auth
router.post("/register", authLimiter, register);
router.post("/login",    authLimiter, login);

// Google OAuth — Step 1: redirect to Google
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Google OAuth — Step 2: Google redirects here after approval
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
    session: false,
  }),
  googleCallback
);

// Protected
router.get("/me", protect, getMe);

module.exports = router;
