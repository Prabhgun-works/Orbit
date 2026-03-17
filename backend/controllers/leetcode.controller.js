const { fetchLeetCodeStats } = require("../services/leetcode.service");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/mongo/User.model");

// ─── GET /api/cp/leetcode/:username ──────────────────
// @access  Private (requires JWT)
const getLeetCodeStats = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username || username.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide a LeetCode username.",
    });
  }

  const data = await fetchLeetCodeStats(username.trim());

  res.status(200).json({
    success: true,
    username: username.trim().toLowerCase(),
    fromCache: data.fromCache,
    stale:     data.stale || false,
    cachedAt:  data.cachedAt || null,
    data: {
      ranking:         data.ranking,
      easy:            data.easy,
      medium:          data.medium,
      hard:            data.hard,
      total:           data.total,
      streak:          data.streak,
      totalActiveDays: data.totalActiveDays,
      topics:          data.topics,
      calendar:        data.calendar,
    },
  });
});

// ─── POST /api/cp/save-handle ────────────────────────
// Saves LeetCode handle to the logged-in user's profile
// @access  Private
const saveHandle = asyncHandler(async (req, res) => {
  const { leetcode } = req.body;

  if (!leetcode) {
    return res.status(400).json({
      success: false,
      message: "Please provide a leetcode handle.",
    });
  }

  // Verify username exists on LeetCode before saving
  try {
    await fetchLeetCodeStats(leetcode.trim());
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { "cpHandles.leetcode": leetcode.trim().toLowerCase() },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "LeetCode handle saved.",
    cpHandles: user.cpHandles,
  });
});

// ─── GET /api/cp/my-stats ────────────────────────────
// Fetches stats for the logged-in user's saved handle
// @access  Private
const getMyStats = asyncHandler(async (req, res) => {
  const handle = req.user.cpHandles?.leetcode;

  if (!handle) {
    return res.status(404).json({
      success: false,
      message: "No LeetCode handle saved. Use /api/cp/save-handle first.",
    });
  }

  const data = await fetchLeetCodeStats(handle);

  res.status(200).json({
    success: true,
    username: handle,
    fromCache: data.fromCache,
    stale:     data.stale || false,
    cachedAt:  data.cachedAt || null,
    data: {
      ranking:         data.ranking,
      easy:            data.easy,
      medium:          data.medium,
      hard:            data.hard,
      total:           data.total,
      streak:          data.streak,
      totalActiveDays: data.totalActiveDays,
      topics:          data.topics,
      calendar:        data.calendar,
    },
  });
});

module.exports = { getLeetCodeStats, saveHandle, getMyStats };