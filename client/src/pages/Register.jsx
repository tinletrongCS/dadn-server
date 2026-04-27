import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import {
  Leaf,
  User,
  Mail,
  Lock,
  UserPlus,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirm_password) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Đăng ký tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card register-card">
        <div
          className="auth-header"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Leaf size={32} className="primary-green" />
            <h1 style={{ margin: 0 }}>Yolo Farm</h1>
          </div>
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
          <h2 style={{ marginBottom: "0.5rem" }}>Tạo tài khoản</h2>
          <p
            className="subtitle"
            style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}
          >
            Tham gia Yolo Farm và quản lý thiết bị dễ dàng.
          </p>

          {error && (
            <div
              className="auth-error"
              style={{
                padding: "0.75rem",
                background: "#fee2e2",
                color: "#b91c1c",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="auth-success"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "#dcfce3",
                color: "#166534",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              <CheckCircle size={18} /> Đăng ký thành công! Đang chuyển hướng...
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="full_name"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                <User size={16} /> Họ và tên
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                placeholder="Nhập họ và tên đầy đủ"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
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
                name="username"
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="email"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div
              className="form-row"
              style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}
            >
              <div className="form-group" style={{ flex: 1 }}>
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
                  name="password"
                  placeholder="Tạo mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label
                  htmlFor="confirm_password"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  <Lock size={16} /> Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  placeholder="Xác nhận mật khẩu"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>
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
                  <UserPlus size={18} /> Đăng ký
                </>
              )}
            </button>
          </form>

          <div
            className="auth-footer"
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            <p>
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
