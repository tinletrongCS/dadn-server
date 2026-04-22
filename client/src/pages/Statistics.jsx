import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchLogStats } from '../api';
import { BarChart3, AlertCircle, Activity, Users, RefreshCw } from 'lucide-react';

export default function Statistics() {
  const { token, user } = useAuth();
  const isAdmin = user?.role_id === 1;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userIdFilter, setUserIdFilter] = useState('');

  const loadStats = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchLogStats(token, userIdFilter || undefined);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token, userIdFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleFilter = (e) => {
    e.preventDefault();
    loadStats();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={28} /> Thống kê hoạt động
        </h1>
        <button className="btn-secondary btn-sm" onClick={() => loadStats()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
        </button>
      </div>

      {isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>Lọc theo User ID (Admin)</label>
              <input 
                type="text" 
                placeholder="Nhập User ID để xem thống kê riêng" 
                value={userIdFilter}
                onChange={e => setUserIdFilter(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '42px' }}>
              Xem thống kê
            </button>
            <button type="button" className="btn-secondary" style={{ height: '42px' }} onClick={() => {setUserIdFilter(''); loadStats();}}>
              Xóa lọc
            </button>
          </form>
        </div>
      )}

      {loading && <p>Đang tổng hợp dữ liệu thống kê...</p>}
      {error && <div className="auth-error">{error}</div>}

      {stats && (
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Tổng hoạt động</span>
                <span className="stat-value">{stats.total_logs}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <AlertCircle size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Số lượng cảnh báo</span>
                <span className="stat-value">{stats.alert_count}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Vai trò hiện tại</span>
                <span className="stat-value">{isAdmin ? 'Quản trị viên' : 'Người dùng'}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>Thống kê chi tiết theo loại hành động</h3>
            <div style={{ marginTop: '1.5rem' }}>
              <div className="stats-bars">
                {Object.entries(stats.type_counts).sort((a,b) => b[1] - a[1]).map(([type, count]) => {
                  const percentage = stats.total_logs > 0 ? (count / stats.total_logs * 100).toFixed(1) : 0;
                  return (
                    <div key={type} className="stat-bar-row">
                      <div className="stat-bar-label">
                        <span className="type-name">{type}</span>
                        <span className="type-count">{count} ({percentage}%)</span>
                      </div>
                      <div className="stat-bar-bg">
                        <div 
                          className="stat-bar-fill" 
                          style={{ 
                            width: `${percentage}%`, 
                            background: type.startsWith('ALERT') ? '#ef4444' : 'var(--primary-green)' 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
