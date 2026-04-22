import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createDevice } from '../api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Cpu, ArrowLeft } from 'lucide-react';

export default function AddDevice() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', mode: 'manual' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If somehow a non-admin gets here, they shouldn't, but just in case
  if (user?.role_id !== 1) {
    return <div className="card"><p>Bạn không có quyền truy cập trang này.</p></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createDevice(token, formData);
      alert(`Đã thêm thiết bị "${formData.name}" thành công!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <PlusCircle size={28} /> Thêm thiết bị mới
        </h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ background: '#f0fdf4', color: 'var(--primary-green)', padding: '1rem', borderRadius: '50%' }}>
            <Cpu size={32} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Đăng ký thiết bị</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>Thêm một trạm cảm biến hoặc bộ điều khiển mới vào hệ thống.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1.5rem' }}>
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label>Tên thiết bị (Mã định danh)</label>
            <input 
              type="text" 
              placeholder="VD: SmartFarm-KhuA-01"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{ fontSize: '1rem', padding: '0.875rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
              Tên thiết bị nên đặt dễ nhớ để dễ quản lý sau này.
            </span>
          </div>
          
          <div className="form-group">
            <label>Chế độ mặc định</label>
            <select 
              value={formData.mode}
              onChange={(e) => setFormData({...formData, mode: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '0.875rem', 
                border: '1px solid var(--border-color)', 
                borderRadius: '0px', 
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              <option value="manual">Thủ công (Manual)</option>
              <option value="auto">Tự động (Auto)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')} disabled={loading}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '150px' }}>
              {loading ? 'Đang thêm...' : 'Xác nhận thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
