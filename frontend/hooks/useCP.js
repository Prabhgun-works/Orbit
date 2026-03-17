import { useState, useCallback } from "react";
import { fetchLeetCodeStats, fetchMyStats, saveHandle } from "../api/cp.api";

const useCP = () => {
  const [data,     setData]     = useState(null);
  const [username, setUsername] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [stale,    setStale]    = useState(false);
  const [cachedAt, setCachedAt] = useState(null);

  // Fetch stats for any username
  const fetchStats = useCallback(async (handle) => {
    if (!handle?.trim()) return;
    setLoading(true);
    setError(null);
    setStale(false);

    try {
      const res = await fetchLeetCodeStats(handle.trim());
      setData(res.data.data);
      setUsername(res.data.username);
      setStale(res.data.stale || false);
      setCachedAt(res.data.cachedAt);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Could not fetch LeetCode stats. Check the username and try again.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the logged-in user's saved handle automatically
  const fetchMyStatsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchMyStats();
      setData(res.data.data);
      setUsername(res.data.username);
      setStale(res.data.stale || false);
      setCachedAt(res.data.cachedAt);
    } catch (err) {
      // 404 = no handle saved yet — not a real error
      if (err.response?.status !== 404) {
        setError("Could not load your stats. Try entering your username.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Save handle and immediately fetch
  const saveAndFetch = useCallback(async (handle) => {
    setLoading(true);
    setError(null);

    try {
      await saveHandle(handle.trim());
      await fetchStats(handle.trim());
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save handle.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  return {
    data,
    username,
    loading,
    error,
    stale,
    cachedAt,
    fetchStats,
    fetchMyStatsData,
    saveAndFetch,
  };
};

export default useCP;