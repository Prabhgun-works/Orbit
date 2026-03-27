import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Auth pages
import Login        from "../pages/auth/Login";
import Register     from "../pages/auth/Register";
import GoogleSuccess from "../pages/auth/GoogleSuccess";

// App pages — import your existing components
import CPTracker from "../pages/cp/CPTracker";

// ─── Placeholder pages (replace with real ones later) ─
const Dashboard = () => (
  <div style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
    <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Dashboard</h1>
    <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
      Welcome back! Use the nav to explore your features.
    </p>
  </div>
);

// ─── Protected route wrapper ──────────────────────────
// Redirects to /login if user is not authenticated
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show nothing while checking token on first load
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontSize: 14,
        color: "var(--color-text-secondary)",
      }}>
        Loading…
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// ─── Public route wrapper ─────────────────────────────
// Redirects to /dashboard if user IS already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

// ─── App Router ───────────────────────────────────────
const AppRouter = () => (
  <BrowserRouter>
    <Routes>

      {/* Public routes — redirect to dashboard if already logged in */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Google OAuth callback — handles token from redirect */}
      <Route path="/auth/google/success" element={<GoogleSuccess />} />

      {/* Protected routes — redirect to login if not authenticated */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/cp"        element={<PrivateRoute><CPTracker /></PrivateRoute>} />

      {/* Default redirect */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />

    </Routes>
  </BrowserRouter>
);

export default AppRouter;
