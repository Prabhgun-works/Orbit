const axios = require("axios");
const CPCache = require("../models/mongo/CPCache.model");

const LC_URL      = "https://leetcode.com/graphql";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── GraphQL Queries ──────────────────────────────────

const STATS_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      profile { ranking }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const TOPICS_QUERY = `
  query skillStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced     { tagName problemsSolved }
        intermediate { tagName problemsSolved }
        fundamental  { tagName problemsSolved }
      }
    }
  }
`;

const CALENDAR_QUERY = `
  query userProfileCalendar($username: String!) {
    matchedUser(username: $username) {
      userCalendar {
        submissionCalendar
        streak
        totalActiveDays
      }
    }
  }
`;

// ─── Raw fetcher ──────────────────────────────────────

const queryLeetCode = async (query, variables) => {
  const response = await axios.post(
    LC_URL,
    { query, variables },
    {
      headers: {
        "Content-Type":   "application/json",
        "User-Agent":     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept":         "application/json",
        "Accept-Language":"en-US,en;q=0.9",
        "Origin":         "https://leetcode.com",
        "Referer":        "https://leetcode.com/",
        "x-csrftoken":    "abc123",
      },
      timeout: 15000,
    }
  );

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data;
};

// ─── Shape raw API data into clean object ─────────────

const shapeData = (statsData, topicsData, calendarData) => {
  const user = statsData?.data?.matchedUser;
  if (!user) return null;

  const submissionNums = user.submitStats?.acSubmissionNum || [];
  const easy   = submissionNums.find((d) => d.difficulty === "Easy")?.count   || 0;
  const medium = submissionNums.find((d) => d.difficulty === "Medium")?.count || 0;
  const hard   = submissionNums.find((d) => d.difficulty === "Hard")?.count   || 0;
  const total  = submissionNums.find((d) => d.difficulty === "All")?.count    || 0;

  const topicUser = topicsData?.data?.matchedUser;
  const allTopics = [
    ...(topicUser?.tagProblemCounts?.fundamental   || []),
    ...(topicUser?.tagProblemCounts?.intermediate  || []),
    ...(topicUser?.tagProblemCounts?.advanced      || []),
  ]
    .filter((t) => t.problemsSolved > 0)
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 15);

  const calUser = calendarData?.data?.matchedUser?.userCalendar;
  let calendarMap = {};
  if (calUser?.submissionCalendar) {
    try { calendarMap = JSON.parse(calUser.submissionCalendar); }
    catch { calendarMap = {}; }
  }

  return {
    ranking:         user.profile?.ranking || 0,
    easy, medium, hard, total,
    streak:          calUser?.streak          || 0,
    totalActiveDays: calUser?.totalActiveDays || 0,
    topics: allTopics.map((t) => ({ name: t.tagName, solved: t.problemsSolved })),
    calendar: Object.entries(calendarMap).reduce((acc, [ts, count]) => {
      const date = new Date(parseInt(ts) * 1000).toISOString().split("T")[0];
      acc[date] = count;
      return acc;
    }, {}),
  };
};

// ─── Main exported function ───────────────────────────

const fetchLeetCodeStats = async (username) => {
  const normalizedUsername = username.trim().toLowerCase();

  // 1. Check cache
  const cached = await CPCache.findOne({ platform: "leetcode", username: normalizedUsername });
  const cacheAge = cached ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;

  if (cached && cacheAge < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true, cachedAt: cached.fetchedAt };
  }

  // 2. Fetch from LeetCode
  let statsData, topicsData, calendarData;

  try {
    [statsData, topicsData, calendarData] = await Promise.all([
      queryLeetCode(STATS_QUERY,    { username: normalizedUsername }),
      queryLeetCode(TOPICS_QUERY,   { username: normalizedUsername }),
      queryLeetCode(CALENDAR_QUERY, { username: normalizedUsername }),
    ]);
  } catch (fetchError) {
    // Log real error for debugging
    console.error("LeetCode fetch error:", fetchError.message, fetchError.response?.status);

    // Serve stale cache if available
    if (cached) {
      return { ...cached.data, fromCache: true, stale: true, cachedAt: cached.fetchedAt };
    }
    throw new Error(`LeetCode API error: ${fetchError.message}`);
  }

  // 3. Check user exists
  const shaped = shapeData(statsData, topicsData, calendarData);
  if (!shaped) {
    throw new Error(`LeetCode user "${username}" not found.`);
  }

  // 4. Upsert cache
  await CPCache.findOneAndUpdate(
    { platform: "leetcode", username: normalizedUsername },
    { platform: "leetcode", username: normalizedUsername, data: shaped, fetchedAt: new Date() },
    { upsert: true, new: true }
  );

  return { ...shaped, fromCache: false };
};

module.exports = { fetchLeetCodeStats };