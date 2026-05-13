import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { Leaf, User, Lock, LogIn, RefreshCcw } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      login(data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <Leaf className="logo-icon" />
          <h1>Yolo Farm</h1>
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Hệ thống nông trại thông minh
          </span>
        </div>

        <div className="auth-body">
          <h2>Xin chào</h2>
          <p className="subtitle">
            Đăng nhập để quản lý hệ thống nông trại thông minh.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
            autoComplete="off"
          >
            <div className="form-group">
              <label
                htmlFor="username"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                <User size={16} /> Tên đăng nhập
              </label>
              <input
                type="text"
                id="username"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label
                htmlFor="password"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                <Lock size={16} /> Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <LogIn size={18} /> Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
