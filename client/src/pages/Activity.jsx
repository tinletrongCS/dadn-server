import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchLogs, fetchDevices } from '../api';
import { Filter, RefreshCw, AlertTriangle, List } from 'lucide-react';

const ALERT_TYPES = [
  'ALERT_TEMPERATURE',
  'ALERT_SOIL_MOISTURE',
  'ALERT_AIR_HUMIDITY',
  'ALERT_LIGHT_INTENSITY',
];

export default function Activity() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  // Filters
  const [showAlerts, setShowAlerts] = useState(false);
  const [filterDeviceId, setFilterDeviceId] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Load device list for filter dropdown
  useEffect(() => {
    if (!token) return;
    fetchDevices(token)
      .then(data => setDevices(data))
      .catch(() => {});
  }, [token]);

  const loadLogs = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchLogs(token, {
        page,
        limit,
        device_id: filterDeviceId || undefined,
        action_type: filterActionType || undefined,
        from_time: filterFrom || undefined,
        to_time: filterTo || undefined,
      });

      let items = data.items || [];
      const totalCount = data.total || 0;

      // Client-side filter: hide ALERT logs unless showAlerts is checked
      if (!showAlerts) {
        items = items.filter(log => !ALERT_TYPES.some(a => log.action_type.startsWith(a)));
      }

      setLogs(items);
      setTotal(totalCount);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token, page, filterDeviceId, filterActionType, filterFrom, filterTo, showAlerts]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleReset = () => {
    setFilterDeviceId('');
    setFilterActionType('');
    setFilterFrom('');
    setFilterTo('');
    setShowAlerts(false);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Lịch sử hoạt động</h1>
        <button className="btn-secondary btn-sm" onClick={() => loadLogs()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
        </button>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-header">
          <Filter size={18} />
          <h3>Bộ lọc nâng cao</h3>
        </div>
        <form onSubmit={handleFilter} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label>Thiết bị</label>
              <select value={filterDeviceId} onChange={e => setFilterDeviceId(e.target.value)}>
                <option value="">Tất cả thiết bị</option>
                {devices.map(d => (
                  <option key={d.device_id} value={d.device_id}>{d.name} (ID: {d.device_id})</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Loại hành động</label>
              <select value={filterActionType} onChange={e => setFilterActionType(e.target.value)}>
                <option value="">Tất cả hành động</option>
                <option value="MANUAL_CONTROL_PUMP">Điều khiển bơm (thủ công)</option>
                <option value="MANUAL_CONTROL_FAN">Điều khiển quạt (thủ công)</option>
                <option value="AUTO_CONTROL_PUMP">Điều khiển bơm (tự động)</option>
                <option value="AUTO_CONTROL_FAN">Điều khiển quạt (tự động)</option>
                <option value="MODE_CHANGE">Đổi chế độ</option>
                <option value="DEVICE_SELECTED">Chọn thiết bị</option>
                <option value="DEVICE_DESELECTED">Bỏ chọn thiết bị</option>
                <option value="THRESHOLD_UPDATE">Cập nhật ngưỡng</option>
                <option value="DEVICE_CREATED">Thêm thiết bị</option>
                <option value="DEVICE_DELETED">Xóa thiết bị</option>
                <option value="CONTROL_ERROR">Lỗi điều khiển</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Từ ngày</label>
              <input type="datetime-local" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Đến ngày</label>
              <input type="datetime-local" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </div>
          </div>

          <div className="filter-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showAlerts}
                onChange={e => setShowAlerts(e.target.checked)}
              />
              Hiện các log cảnh báo (ALERT_*) 
            </label>
            <div className="filter-buttons">
              <button type="submit" className="btn-primary btn-sm">
                <Filter size={14} /> Lọc kết quả
              </button>
              <button type="button" className="btn-secondary btn-sm" onClick={handleReset}>
                Xóa lọc
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Log Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <List size={20} /> Lịch sử hoạt động của {user?.role_id === 1 ? 'toàn hệ thống' : 'tôi'}
          </h3>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-green)', background: 'var(--success-bg)', padding: '0.2rem 0.75rem' }}>
            Tổng số: {total} hàng
          </span>
        </div>

        {loading && <p>Đang truy vấn dữ liệu...</p>}
        {error && <div className="auth-error">{error}</div>}

        {!loading && !error && logs.length === 0 && (
          <p className="empty-text">Không tìm thấy bản ghi nào phù hợp.</p>
        )}

        {!loading && !error && logs.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  {user?.role_id === 1 && <th>Người thực hiện</th>}
                  <th>Thiết bị</th>
                  <th>Mô tả chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="nowrap">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={`action-badge ${log.action_type.startsWith('ALERT') ? 'action-alert' : ''}`}>
                        {log.action_type}
                      </span>
                    </td>
                    {user?.role_id === 1 && (
                      <td style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                        {log.user_id ? log.user_id.substring(0, 8) : 'Hệ thống'}
                      </td>
                    )}
                    <td>{log.device_id || 'N/A'}</td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Trước
            </button>
            <span style={{ fontWeight: 600 }}>Trang {page} / {totalPages}</span>
            <button className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
