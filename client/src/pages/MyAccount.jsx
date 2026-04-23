import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../api';
import {
  Shield, User as UserIcon, Calendar, CheckCircle,
  Mail, Edit2, Save, X
} from 'lucide-react';

function getRoleName(roleId) {
  if (roleId === 1) return 'Quản trị viên (Admin)';
  return 'Người dùng';
}

export default function MyAccount() {
  const { user, token, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateMyProfile(token, { full_name: fullName.trim() });
      setSuccess('Cập nhật họ và tên thành công! Vui lòng đăng nhập lại để thấy thay đổi.');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.full_name || '');
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tài khoản của tôi</h1>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Thông tin cá nhân</h3>
          {!editing && (
            <button
              className="btn-secondary btn-sm"
              onClick={() => { setEditing(true); setSuccess(null); setError(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Edit2 size={14} />
              Chỉnh sửa
            </button>
          )}
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: '#10b981',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 700, color: 'white',
            boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
          }}>
            {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
          </div>
        </div>

        <div className="account-info">
          {/* Username — not editable */}
          <div className="info-row">
            <UserIcon size={16} />
            <span className="info-label">Tên đăng nhập:</span>
            <span style={{ fontWeight: 600 }}>{user?.username}</span>
          </div>

          {/* Email — not editable */}
          <div className="info-row">
            <Mail size={16} />
            <span className="info-label">Email:</span>
            <span>{user?.email}</span>
          </div>

          {/* Full name — editable */}
          <div className="info-row" style={{ alignItems: editing ? 'flex-start' : 'center' }}>
            <UserIcon size={16} style={{ marginTop: editing ? 4 : 0 }} />
            <span className="info-label">Họ và tên:</span>
            {editing ? (
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{
                    flex: 1, padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                />
                <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Save size={14} />
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button className="btn-secondary btn-sm" onClick={handleCancel} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span style={{ fontWeight: 500 }}>{user?.full_name}</span>
            )}
          </div>

          {/* Role */}
          <div className="info-row">
            <Shield size={16} />
            <span className="info-label">Vai trò:</span>
            <span className={user?.role_id === 1 ? 'badge badge-admin' : 'badge badge-user'}>
              {getRoleName(user?.role_id)}
            </span>
          </div>

          {/* Status */}
          <div className="info-row">
            <CheckCircle size={16} />
            <span className="info-label">Trạng thái:</span>
            <span className={user?.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
              {user?.is_active ? 'Đang hoạt động' : 'Bị khóa'}
            </span>
          </div>

          {/* Created at */}
          <div className="info-row">
            <Calendar size={16} />
            <span className="info-label">Ngày tạo:</span>
            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
