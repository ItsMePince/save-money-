import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

interface LoginProps {
  onLoginSuccess?: (user: { username: string; role: string }) => void;
}


const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:8081";

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as
      | { from?: { pathname?: string; search?: string; hash?: string } }
      | undefined;

    const qs = new URLSearchParams(location.search);
    const next =
      qs.get("next") ||
      qs.get("redirect") ||
      (state?.from?.pathname
        ? `${state.from.pathname}${state.from.search ?? ""}${state.from.hash ?? ""}`
        : null);

    if (next && !next.startsWith("/login")) {
      sessionStorage.setItem("postLoginRedirect", next);
    }
  }, [location]);

  useEffect(() => {
    const authed = localStorage.getItem("isAuthenticated") === "true";
    if (authed) {
      const last = localStorage.getItem("lastVisitedPath") || "/home";
      navigate(last, { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json", // ขอ JSON กลับมา
        },
        credentials: "include", // ให้ cookie JSESSIONID ติดไป-กลับ
        body: JSON.stringify({ username, password }),
      });

      const ct = res.headers.get("content-type") || "";
      const payload: any = ct.includes("application/json")
        ? await res.json()
        : await res.text(); // กันกรณี server ส่ง HTML error page

      if (!res.ok) {
        const msg =
          typeof payload === "string"
            ? (payload.slice(0, 200) || `${res.status} ${res.statusText}`)
            : (payload?.message || `${res.status} ${res.statusText}`);
        throw new Error(msg);
      }


      const userObj =
        (payload && payload.user) ||
        (payload && payload.username
          ? { username: payload.username, role: payload.role ?? "USER" }
          : null);

      if (!userObj?.username) throw new Error("Invalid response from server");

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(userObj));
      window.dispatchEvent(new Event("auth-changed"));
      onLoginSuccess?.(userObj);


      const state = location.state as
        | { from?: { pathname?: string; search?: string; hash?: string } }
        | undefined;

      const fromState = state?.from?.pathname
        ? `${state.from.pathname}${state.from.search ?? ""}${state.from.hash ?? ""}`
        : null;

      const redirect =
        sessionStorage.getItem("postLoginRedirect") ||
        fromState ||
        localStorage.getItem("lastVisitedPath") ||
        "/home";

      sessionStorage.removeItem("postLoginRedirect");
      navigate(redirect, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const goToSignUp = () => navigate("/signup");

  return (
    <div className="login-page">
      <div className="card">
        <div className="avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="42" height="42" role="img" aria-label="user">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20a8 8 0 0116 0" />
          </svg>
        </div>

        <h1 className="title">login</h1>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Username
            <input
              type="text"
              className="input"
              placeholder="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </label>

          <label className="label">
            Password
            <input
              type="password"
              className="input"
              placeholder="password "
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </label>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center", margin: "8px 0" }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "login"}
          </button>
        </form>

        <p className="footnote">
          Don't have an account?
          <button
            className="link"
            onClick={goToSignUp}
            style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            {" "}Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
