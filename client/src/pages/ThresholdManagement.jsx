import React, { useState, useEffect } from 'react';
import { fetchUserThresholds } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Settings2, 
  Search,
  User,
  Cpu,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function ThresholdManagement() {
  const { token, user } = useAuth();
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = user?.role_id === 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchUserThresholds(token);
      setThresholds(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching thresholds:', err);
      setError('Không thể tải dữ liệu cấu hình ngưỡng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const filteredThresholds = thresholds.filter(t => 
    t.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.device_id.toString().includes(searchTerm) || 
    (isAdmin && t.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Quản lý cấu hình ngưỡng
          </h1>
        </div>
        <button 
          onClick={loadData} 
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
          Làm mới
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder={isAdmin ? "Tìm kiếm theo mã hoặc tên thiết bị hoặc tên người dùng" : "Tìm kiếm theo mã hoặc tên thiết bị"}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Cpu size={16} /> Thiết bị</div></th>
                {isAdmin && <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Người dùng</div></th>}
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Thermometer size={16} color="#ef4444" /> Nhiệt độ (°C)</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Droplets size={16} color="#3b82f6" /> Độ ẩm không khí (%)</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Droplets size={16} color="#10b981" /> Độ ẩm đất (%)</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sun size={16} color="#f59e0b" /> Ánh sáng (lx)</div></th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredThresholds.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Không tìm thấy dữ liệu cấu hình ngưỡng nào.
                  </td>
                </tr>
              ) : (
                filteredThresholds.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{t.device_name || `Thiết bị ${t.device_id}`}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>ID: {t.device_id}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{t.username || 'Không xác định'}</span>
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="threshold-range">
                        <span className="min">{t.temp_min ?? '--'}</span>
                        <span className="separator">-</span>
                        <span className="max">{t.temp_max ?? '--'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="threshold-range">
                        <span className="min">{t.humid_min ?? '--'}</span>
                        <span className="separator">-</span>
                        <span className="max">{t.humid_max ?? '--'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="threshold-range">
                        <span className="min">{t.soil_min ?? '--'}</span>
                        <span className="separator">-</span>
                        <span className="max">{t.soil_max ?? '--'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="threshold-range">
                        <span className="min">{t.light_min ?? '--'}</span>
                        <span className="separator">-</span>
                        <span className="max">{t.light_max ?? '--'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${t.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {t.is_active ? 'Đang điều khiển' : 'Chờ'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .threshold-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'JetBrains Mono', monospace;
        }
        .threshold-range .min {
          color: #0f172a;
          font-weight: 500;
        }
        .threshold-range .max {
          color: #0f172a;
          font-weight: 600;
        }
        .threshold-range .separator {
          color: #475569;
        }
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .badge-secondary {
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .search-container {
          position: relative;
          margin-bottom: 2rem;
          max-width: 450px;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.2s ease;
        }
        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          font-size: 0.95rem;
          color: #1e293b;
          transition: all 0.3s ease;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          background-color: white;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);
        }
        .search-container:focus-within .search-icon {
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
