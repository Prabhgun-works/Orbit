const express = require("express");
const router  = express.Router();

const {
  getLeetCodeStats,
  saveHandle,
  getMyStats,
} = require("../controllers/cp.controller");

// TODO: uncomment before deploying — auth bypass for dev only
// const { protect } = require("../middleware/auth.middleware");
// router.use(protect);

router.get("/leetcode/:username", getLeetCodeStats);
router.get("/my-stats", getMyStats);
router.post("/save-handle", saveHandle);

module.exports = router;