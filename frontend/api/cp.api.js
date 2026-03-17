import api from "./axios";

// Fetch stats for any LeetCode username
export const fetchLeetCodeStats = (username) =>
  api.get(`/cp/leetcode/${username}`);

// Fetch stats for the logged-in user's saved handle
export const fetchMyStats = () =>
  api.get("/cp/my-stats");

// Save a LeetCode handle to the user's profile
export const saveHandle = (leetcode) =>
  api.post("/cp/save-handle", { leetcode });