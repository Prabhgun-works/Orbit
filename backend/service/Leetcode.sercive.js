const axios = require("axios");
const CPCache = require("../models/mongo/CPCache.model");

const LC_URL = "https://leetcode.com/graphql";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── GraphQL Queries ──────────────────────────────────

const STATS_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      profile {
        ranking
      }
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
        advanced   { tagName problemsSolved }
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
        "Content-Type": "application/json",
        // Realistic User-Agent — LeetCode blocks default axios UA
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://leetcode.com",
      },
      timeout: 10000, // 10s timeout
    }
  );
  return response.data;
};

// ─── Shape raw API data into clean object ─────────────

const shapeData = (statsData, topicsData, calendarData) => {
  const user = statsData?.data?.matchedUser;
  if (!user) return null;

  // Difficulty breakdown
  const submissionNums = user.submitStats?.acSubmissionNum || [];
  const easy   = submissionNums.find((d) => d.difficulty === "Easy")?.count   || 0;
  const medium = submissionNums.find((d) => d.difficulty === "Medium")?.count || 0;
  const hard   = submissionNums.find((d) => d.difficulty === "Hard")?.count   || 0;
  const total  = submissionNums.find((d) => d.difficulty === "All")?.count    || 0;

  // Topics — merge all three tiers, sort by solved desc
  const topicUser = topicsData?.data?.matchedUser;
  const allTopics = [
    ...(topicUser?.tagProblemCounts?.fundamental   || []),
    ...(topicUser?.tagProblemCounts?.intermediate  || []),
    ...(topicUser?.tagProblemCounts?.advanced      || []),
  ]
    .filter((t) => t.problemsSolved > 0)
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 15); // Top 15 topics only

  // Calendar — submission heatmap
  const calUser = calendarData?.data?.matchedUser?.userCalendar;
  let calendarMap = {};
  if (calUser?.submissionCalendar) {
    try {
      calendarMap = JSON.parse(calUser.submissionCalendar);
    } catch {
      calendarMap = {};
    }
  }

  return {
    ranking:       user.profile?.ranking || 0,
    easy,
    medium,
    hard,
    total,
    streak:        calUser?.streak         || 0,
    totalActiveDays: calUser?.totalActiveDays || 0,
    topics: allTopics.map((t) => ({
      name:   t.tagName,
      solved: t.problemsSolved,
    })),
    // Convert Unix timestamp keys to ISO date strings for frontend
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

  // 1. Check cache first
  const cached = await CPCache.findOne({
    platform: "leetcode",
    username: normalizedUsername,
  });

  const now = Date.now();
  const cacheAge = cached ? now - new Date(cached.fetchedAt).getTime() : Infinity;

  if (cached && cacheAge < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true, cachedAt: cached.fetchedAt };
  }

  // 2. Fetch fresh data — all three queries in parallel
  let statsData, topicsData, calendarData;

  try {
    [statsData, topicsData, calendarData] = await Promise.all([
      queryLeetCode(STATS_QUERY,    { username: normalizedUsername }),
      queryLeetCode(TOPICS_QUERY,   { username: normalizedUsername }),
      queryLeetCode(CALENDAR_QUERY, { username: normalizedUsername }),
    ]);
  } catch (fetchError) {
    // LeetCode is down — serve stale cache if available
    if (cached) {
      return {
        ...cached.data,
        fromCache: true,
        stale: true,
        cachedAt: cached.fetchedAt,
      };
    }
    throw new Error("LeetCode API is unreachable. Please try again later.");
  }

  // 3. Check if username actually exists
  const shaped = shapeData(statsData, topicsData, calendarData);
  if (!shaped) {
    throw new Error(`LeetCode user "${username}" not found.`);
  }

  // 4. Upsert cache
  await CPCache.findOneAndUpdate(
    { platform: "leetcode", username: normalizedUsername },
    {
      platform:  "leetcode",
      username:  normalizedUsername,
      data:      shaped,
      fetchedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { ...shaped, fromCache: false };
};

module.exports = { fetchLeetCodeStats };