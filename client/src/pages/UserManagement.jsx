import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchUsers, adminUpdateUser, adminToggleUserStatus, adminDeleteUser
} from '../api';
import {
  Users, Shield, Search, RefreshCw,
  CheckCircle, XCircle, Edit2, Trash2,
  Save, X, AlertTriangle, UserCheck, UserX
} from 'lucide-react';

function getRoleName(roleId) {
  return roleId === 1 ? 'Admin' : 'User';
}

function BadgeRole({ roleId }) {
  return (
    <span className={roleId === 1 ? 'badge badge-admin' : 'badge badge-user'}>
      {getRoleName(roleId)}
    </span>
  );
}

function BadgeStatus({ isActive }) {
  return (
    <span className={isActive ? 'badge badge-active' : 'badge badge-inactive'}>
      {isActive ? 'Hoạt động' : 'Bị khóa'}
    </span>
  );
}

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSave }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [roleId, setRoleId] = useState(user.role_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Họ và tên không được để trống'); return; }
    setSaving(true); setError(null);
    try {
      await onSave(user.user_id, { full_name: fullName.trim(), role_id: Number(roleId) });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Edit2 size={20} className="primary-green" />
            <h3 style={{ margin: 0 }}>Chỉnh sửa người dùng</h3>
          </div>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {error && <div className="auth-error">{error}</div>}

          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tên đăng nhập: <strong style={{ color: 'var(--text-main)' }}>{user.username}</strong>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Nhập họ và tên"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Vai trò (Role)</label>
            <select
              value={roleId}
              onChange={e => setRoleId(Number(e.target.value))}
              style={{
                width: '100%', padding: '0.65rem 0.9rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                background: 'white',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            >
              <option value={1}>Admin (Quản trị viên)</option>
              <option value={2}>User (Người dùng thường)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Save size={15} />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(user.user_id); onClose(); }
    catch { setDeleting(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h3 style={{ margin: 0 }}>Xác nhận xóa</h3>
          </div>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Bạn có chắc chắn muốn xóa người dùng{' '}
            <strong style={{ color: 'var(--text-main)' }}>{user.full_name}</strong>{' '}
            (<code>{user.username}</code>)?
            <br /><span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Hành động này không thể hoàn tác.</span>
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose} disabled={deleting}>Hủy</button>
            <button
              onClick={handleConfirm}
              disabled={deleting}
              style={{
                background: '#ef4444', color: 'white', border: 'none',
                padding: '0.55rem 1.2rem', borderRadius: '0.5rem',
                cursor: 'pointer', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <Trash2 size={15} />
              {deleting ? 'Đang xóa...' : 'Xóa người dùng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const showToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(token);
      setUsers(data || []);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (userId, data) => {
    const updated = await adminUpdateUser(token, userId, data);
    setUsers(prev => prev.map(u => u.user_id === userId ? updated : u));
    showToast('Cập nhật thành công');
  };

  const handleToggle = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const updated = await adminToggleUserStatus(token, userId);
      setUsers(prev => prev.map(u => u.user_id === userId ? updated : u));
      showToast(`Đã ${updated.is_active ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
    } catch (err) {
      showToast(err.message || 'Lỗi thao tác', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async (userId) => {
    await adminDeleteUser(token, userId);
    setUsers(prev => prev.filter(u => u.user_id !== userId));
    showToast('Đã xóa người dùng');
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Danh sách người dùng</h1>
        <button className="btn-secondary btn-sm" onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Tải lại
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toastMsg.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '0.75rem 1.25rem',
          borderRadius: '0rem', fontWeight: 600, fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {toastMsg.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toastMsg.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng người dùng', value: users.length, icon: Users, color: '#6366f1' },
          { label: 'Đang hoạt động', value: users.filter(u => u.is_active).length, icon: UserCheck, color: '#10b981' },
          { label: 'Bị khóa', value: users.filter(u => !u.is_active).length, icon: UserX, color: '#ef4444' },
          { label: 'Admin', value: users.filter(u => u.role_id === 1).length, icon: Shield, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{
            flex: '1 1 160px', display: 'flex', alignItems: 'center',
            gap: '1rem', padding: '1rem 1.25rem'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '0.6rem',
              background: `${stat.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên đăng nhập, họ tên, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải danh sách người dùng...</p>
      ) : filtered.length === 0 ? (
        <div className="card"><p className="empty-text">Không tìm thấy người dùng nào.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                  {['Người dùng', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                    <th key={h} style={{
                      padding: '0.85rem 1rem', textAlign: 'left',
                      fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const isMe = u.user_id === me?.user_id;
                  const busy = actionLoading[u.user_id];
                  return (
                    <tr key={u.user_id} style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: isMe ? 'rgba(16,185,129,0.05)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = isMe ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = isMe ? 'rgba(16,185,129,0.05)' : 'transparent'}
                    >
                      {/* User info */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, color: 'white', fontSize: '0.85rem', flexShrink: 0
                          }}>
                            {(u.full_name || u.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {u.full_name}
                              {isMe && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#10b981', fontWeight: 500 }}>(Bạn)</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '0.85rem 1rem' }}><BadgeRole roleId={u.role_id} /></td>
                      <td style={{ padding: '0.85rem 1rem' }}><BadgeStatus isActive={u.is_active} /></td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {/* Edit */}
                          <button
                            onClick={() => setEditUser(u)}
                            title="Chỉnh sửa"
                            style={{
                              background: 'rgba(99,102,241,0.12)', border: 'none',
                              borderRadius: '0rem', padding: '0.4rem 0.6rem',
                              cursor: 'pointer', color: '#6366f1',
                              display: 'flex', alignItems: 'center', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Toggle status */}
                          {!isMe && (
                            <button
                              onClick={() => handleToggle(u.user_id)}
                              disabled={busy}
                              title={u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              style={{
                                background: u.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                border: 'none', borderRadius: '0rem',
                                padding: '0.4rem 0.6rem', cursor: busy ? 'not-allowed' : 'pointer',
                                color: u.is_active ? '#ef4444' : '#10b981',
                                display: 'flex', alignItems: 'center', transition: 'background 0.15s',
                                opacity: busy ? 0.6 : 1
                              }}
                              onMouseEnter={e => { if (!busy) e.currentTarget.style.background = u.is_active ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'; }}
                              onMouseLeave={e => e.currentTarget.style.background = u.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'}
                            >
                              {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          )}

                          {/* Delete */}
                          {!isMe && (
                            <button
                              onClick={() => setDeleteUser(u)}
                              title="Xóa người dùng"
                              style={{
                                background: 'rgba(239,68,68,0.1)', border: 'none',
                                borderRadius: '0rem', padding: '0.4rem 0.6rem',
                                cursor: 'pointer', color: '#ef4444',
                                display: 'flex', alignItems: 'center', transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {isMe && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.65rem 1rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Hiển thị {filtered.length} / {users.length} người dùng
          </div>
        </div>
      )}

      {/* Modals */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleSave}
        />
      )}
      {deleteUser && (
        <DeleteConfirm
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
