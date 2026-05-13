import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { Leaf, User, Lock, LogIn, RefreshCw } from "lucide-react";
import loginImg from "../assets/loginimg.jpg"; 
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    setMounted(true);
  }, []);

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
    <>
      <style>{skeletonStyles}</style>
      <div
        style={{
          display: "flex",
          minHeight: "117.7vh",
          margin: 0,
          padding: 0,
          overflow: "hidden", 
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        {/* Left Side - Form */}
        <div
          className="auth-layout"
          style={{
            flex: "1",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "2rem",
          }}
        >
          <div className="auth-card" style={{ boxShadow: "none" }}>
         <div className="auth-header" style={{ marginBottom: "2rem" }}>     <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <Leaf size={32} className="primary-green" />
                <h1 style={{ margin: 0 }}>Yolo Farm</h1>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 500 }}>
                Hệ thống nông trại thông minh
              </span>
              </div>


            <div className="auth-body">
              <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Xin chào trở lại</h2>
              <p className="subtitle" style={{ marginBottom: "2rem" }}>
                Đăng nhập để quản lý hệ thống nông trại thông minh của bạn.
              </p>

              {error && <div className="auth-error" style={errorStyle}>{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                  <label htmlFor="username" style={labelStyle}>
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
                    style={inputStyle}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "2rem" }}>
                  <label htmlFor="password" style={labelStyle}>
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
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={buttonStyle}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} /> 
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> Đăng nhập
                    </>
                  )}
                </button>
              </form>

              <div className="auth-footer" style={{ marginTop: "2rem", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>
                  Chưa có tài khoản? <Link to="/register" style={{ fontWeight: 600 }}>Đăng ký ngay</Link>
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="hide-on-mobile" style={{ flex: "1.2", position: "relative", overflow: "hidden" }}>
          {!imgLoaded && <div className="skeleton-bg" style={{ width: "100%", height: "100%", position: "absolute" }}></div>}
          
          <img
            src={loginImg}
            alt="Smart Farm"
            onLoad={() => setImgLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.8s ease-in-out, transform 10s ease-out",
              transform: imgLoaded ? "scale(1)" : "scale(1.05)",
            }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 20%, rgba(0,0,0,0.3) 100%)",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.8s ease-in-out"
          }}></div>
        </div>
      </div>
    </>
  );
}

const labelStyle = { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontWeight: 600 };
const inputStyle = { width: "100%", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", transition: "all 0.2s" };
const buttonStyle = { width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.85rem", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", transition: "all 0.2s" };
const errorStyle = { padding: "0.8rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem" };

const skeletonStyles = `
  @keyframes pulse {
    0% { background-color: #f1f5f9; }
    50% { background-color: #e2e8f0; }
    100% { background-color: #f1f5f9; }
  }
  .skeleton-bg { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  @media (max-width: 900px) { .hide-on-mobile { display: none !important; } }
`;