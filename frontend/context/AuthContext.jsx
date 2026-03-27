import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true on first load

  // ─── Load user from token on app start ─────────────
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("orbit_token");
    if (!token) { setLoading(false); return; }

    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setUser(json.user);
      } else {
        // Token is invalid or expired — clear it
        localStorage.removeItem("orbit_token");
        setUser(null);
      }
    } catch {
      localStorage.removeItem("orbit_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ─── Register ──────────────────────────────────────
  const register = async (name, email, password) => {
    const res  = await fetch(`${API}/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password }),
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Registration failed.");

    localStorage.setItem("orbit_token", json.token);
    setUser(json.user);
    return json.user;
  };

  // ─── Login ─────────────────────────────────────────
  const login = async (email, password) => {
    const res  = await fetch(`${API}/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Login failed.");

    localStorage.setItem("orbit_token", json.token);
    setUser(json.user);
    return json.user;
  };

  // ─── Google OAuth login (called after redirect) ────
  const loginWithGoogle = (token) => {
    localStorage.setItem("orbit_token", token);
    loadUser(); // fetches full user profile
  };

  // ─── Logout ────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("orbit_token");
    setUser(null);
  };

  // ─── Get current token ─────────────────────────────
  const getToken = () => localStorage.getItem("orbit_token");

  return (
    <AuthContext.Provider value={{ user, loading, register, login, loginWithGoogle, logout, getToken, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this in every component that needs auth
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
