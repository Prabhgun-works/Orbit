import { useState, useEffect, useCallback } from "react";
import "../../styles/CpDash.css";

// ─── Constants ────────────────────────────────────────
const COLORS = {
  easy:   "#1D9E75",
  medium: "#BA7517",
  hard:   "#A32D2D",
  total:  "#534AB7",
};

const HEAT_COLORS = ["#E1F5EE","#9FE1CB","#5DCAA5","#1D9E75","#085041"];
const TOTAL_AVAIL = { easy: 867, medium: 1818, hard: 795 };

// ─── API helpers (no axios needed — plain fetch) ──────
const getToken = () => localStorage.getItem("orbit_token");

const apiFetch = async (url) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}${url}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
};

const apiPost = async (url, body) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
};

// ─── Donut chart — pure SVG ───────────────────────────
const DonutChart = ({ easy, medium, hard, total }) => {
  const R = 54;
  const C = 2 * Math.PI * R; // circumference ≈ 339

  const segments = [
    { label: "Easy",   value: easy,   color: COLORS.easy   },
    { label: "Medium", value: medium, color: COLORS.medium },
    { label: "Hard",   value: hard,   color: COLORS.hard   },
  ];

  const safeTotal = total || 1;
  let offset = 0;

  return (
    <div className="cp-donut-wrap">
      <p className="cp-section-label">Difficulty split</p>
      <div className="cp-donut-inner">
        <svg width="148" height="148" viewBox="0 0 148 148">
          {/* Track */}
          <circle cx="74" cy="74" r={R} fill="none"
            stroke="var(--color-border-tertiary)" strokeWidth="16"/>
          {/* Segments */}
          {segments.map((seg) => {
            const dash = (seg.value / safeTotal) * C;
            const gap  = C - dash;
            const el = (
              <circle key={seg.label} cx="74" cy="74" r={R} fill="none"
                stroke={seg.color} strokeWidth="16"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 74 74)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            );
            offset += dash;
            return el;
          })}
          {/* Centre text */}
          <text x="74" y="69" textAnchor="middle"
            fontSize="20" fontWeight="500" fill="var(--color-text-primary)">
            {total}
          </text>
          <text x="74" y="85" textAnchor="middle"
            fontSize="11" fill="var(--color-text-secondary)">
            solved
          </text>
        </svg>
      </div>
      <div className="cp-donut-legend">
        {segments.map((s) => (
          <div key={s.label} className="cp-legend-row">
            <span className="cp-legend-dot" style={{ background: s.color }}/>
            <span className="cp-legend-name">{s.label}</span>
            <span className="cp-legend-count">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Topic bars — pure CSS ────────────────────────────
const TopicChart = ({ topics }) => {
  if (!topics?.length) return null;
  const max = topics[0]?.solved || 1;

  return (
    <div className="cp-topics-wrap">
      <p className="cp-section-label">Topic breakdown</p>
      <div className="cp-topic-list">
        {topics.map((t) => (
          <div key={t.name} className="cp-topic-row">
            <span className="cp-topic-name">{t.name}</span>
            <div className="cp-topic-track">
              <div
                className="cp-topic-fill"
                style={{ width: `${Math.round((t.solved / max) * 100)}%` }}
              />
            </div>
            <span className="cp-topic-count">{t.solved}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Heatmap ──────────────────────────────────────────
const HeatMap = ({ calendar, streak, totalActiveDays }) => {
  const today = new Date();
  const cells = [];
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const count = calendar?.[key] || 0;
    const lvl = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
    cells.push({ date: key, count, lvl });
  }

  return (
    <div className="cp-heat-wrap">
      <div className="cp-heat-header">
        <p className="cp-section-label" style={{ margin: 0 }}>Submission activity</p>
        <div className="cp-heat-meta">
          <span>{streak} day streak</span>
          <span>{totalActiveDays} active days</span>
        </div>
      </div>
      <div className="cp-heat-grid">
        {cells.map((c) => (
          <div
            key={c.date}
            className="cp-heat-cell"
            style={{ background: HEAT_COLORS[c.lvl] }}
            title={`${c.date}: ${c.count} submission${c.count !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <div className="cp-heat-footer">
        <span>Less</span>
        {HEAT_COLORS.map((col, i) => (
          <div key={i} className="cp-heat-cell" style={{ background: col }}/>
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────
const StatCard = ({ label, value, color, total, sublabel }) => {
  const pct = total ? Math.min(Math.round((value / total) * 100), 100) : 0;
  return (
    <div className="cp-stat-card">
      <p className="cp-stat-label">{label}</p>
      <p className="cp-stat-value" style={{ color }}>{value}</p>
      <div className="cp-stat-bar">
        <div className="cp-stat-bar-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <p className="cp-stat-sub">{sublabel}</p>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────
const Skeleton = () => (
  <div className="cp-stat-card cp-skeleton">
    <div className="sk sk-s"/>
    <div className="sk sk-l"/>
    <div className="sk sk-f"/>
    <div className="sk sk-s"/>
  </div>
);

// ─── Main page ────────────────────────────────────────
const CPTracker = () => {
  const [data,      setData]      = useState(null);
  const [username,  setUsername]  = useState("");
  const [inputVal,  setInputVal]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [stale,     setStale]     = useState(false);
  const [cachedAt,  setCachedAt]  = useState(null);
  const [saveCheck, setSaveCheck] = useState(false);

  // Try loading saved handle on mount
  const loadMyStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/cp/my-stats");
      setData(res.data);
      setUsername(res.username);
      setInputVal(res.username);
      setStale(res.stale || false);
      setCachedAt(res.cachedAt);
    } catch (e) {
      // 404 = no handle saved yet — silent, show empty state
      if (!e.message?.includes("No LeetCode")) setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMyStats(); }, [loadMyStats]);

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if (saveCheck) {
        await apiPost("/cp/save-handle", { leetcode: inputVal.trim() });
      }
      const res = await apiFetch(`/cp/leetcode/${inputVal.trim()}`);
      setData(res.data);
      setUsername(res.username);
      setStale(res.stale || false);
      setCachedAt(res.cachedAt);
    } catch (e) {
      setError(e.message || "Could not fetch stats. Check the username.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = () => {
    if (!cachedAt) return "";
    const m = Math.round((Date.now() - new Date(cachedAt).getTime()) / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m} min ago`;
    return `${Math.round(m / 60)} hr ago`;
  };

  return (
    <div className="cp-page">

      {/* Header */}
      <div className="cp-header">
        <div>
          <h1 className="cp-title">CP Tracker</h1>
          <p className="cp-subtitle">LeetCode performance dashboard</p>
        </div>
        {data && !loading && (
          <div className="cp-sync-row">
            {stale && <span className="cp-badge-stale">Stale — LeetCode unreachable</span>}
            {cachedAt && !stale && <span className="cp-cache-txt">Synced {timeAgo()}</span>}
          </div>
        )}
      </div>

      {/* Form */}
      <form className="cp-form" onSubmit={handleFetch}>
        <input
          className="cp-input"
          type="text"
          placeholder="Enter LeetCode username"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
        />
        <button className="cp-btn" type="submit" disabled={loading}>
          {loading ? "Loading…" : "Fetch stats"}
        </button>
        <label className="cp-check-label">
          <input
            type="checkbox"
            checked={saveCheck}
            onChange={(e) => setSaveCheck(e.target.checked)}
          />
          Save to my profile
        </label>
      </form>

      {/* Error */}
      {error && (
        <div className="cp-error">
          <span className="cp-error-dot"/>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <>
          <div className="cp-cards-row">
            {[1,2,3,4].map((i) => <Skeleton key={i}/>)}
          </div>
          <div className="cp-skel-block"/>
          <div className="cp-skel-block cp-skel-tall"/>
        </>
      )}

      {/* Data */}
      {data && !loading && (
        <>
          <div className="cp-rank-bar">
            <span className="cp-rank-label">LeetCode ranking</span>
            <span className="cp-rank-val">#{data.ranking?.toLocaleString() || "—"}</span>
          </div>

          <div className="cp-cards-row">
            <StatCard label="Easy"   value={data.easy}   color={COLORS.easy}
              total={TOTAL_AVAIL.easy}
              sublabel={`of ${TOTAL_AVAIL.easy.toLocaleString()} available`}/>
            <StatCard label="Medium" value={data.medium} color={COLORS.medium}
              total={TOTAL_AVAIL.medium}
              sublabel={`of ${TOTAL_AVAIL.medium.toLocaleString()} available`}/>
            <StatCard label="Hard"   value={data.hard}   color={COLORS.hard}
              total={TOTAL_AVAIL.hard}
              sublabel={`of ${TOTAL_AVAIL.hard.toLocaleString()} available`}/>
            <StatCard label="Total"  value={data.total}  color={COLORS.total}
              total={TOTAL_AVAIL.easy + TOTAL_AVAIL.medium + TOTAL_AVAIL.hard}
              sublabel={`${data.streak} day streak`}/>
          </div>

          <div className="cp-mid-row">
            <DonutChart easy={data.easy} medium={data.medium}
              hard={data.hard} total={data.total}/>
            <TopicChart topics={data.topics}/>
          </div>

          <HeatMap
            calendar={data.calendar}
            streak={data.streak}
            totalActiveDays={data.totalActiveDays}
          />
        </>
      )}

      {/* Empty */}
      {!data && !loading && !error && (
        <div className="cp-empty">
          <div className="cp-empty-box"/>
          <p className="cp-empty-title">No stats loaded yet</p>
          <p className="cp-empty-sub">Enter your LeetCode username above and click Fetch stats</p>
        </div>
      )}

    </div>
  );
};

export default CPTracker;
