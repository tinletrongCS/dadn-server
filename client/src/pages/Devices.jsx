import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchDevices, fetchActiveDevices, checkActiveDevice,
  selectDevice, deselectDevice, updateThreshold,
  controlFan, controlPump, changeDeviceMode
} from '../api';
import {
  Cpu, RefreshCw, UserCheck, Sliders, CheckCircle2,
  ChevronDown, ChevronUp, Lock, Save
} from 'lucide-react';

// Threshold form component
function ThresholdForm({ device, token, activeMap, onSuccess, onNotify }) {
  const isActive = activeMap[device.device_id]?.is_active === true;
  const [form, setForm] = useState({
    temp_min: device.temp_min ?? '',
    temp_max: device.temp_max ?? '',
    humid_min: device.humid_min ?? '',
    humid_max: device.humid_max ?? '',
    soil_min: device.soil_min ?? '',
    soil_max: device.soil_max ?? '',
    light_min: device.light_min ?? '',
    light_max: device.light_max ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') payload[k] = Number(v);
      });
      await updateThreshold(token, device.device_id, payload);
      onNotify?.(`Cập nhật ngưỡng thành công cho ${device.name}`, 'success');
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      onNotify?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) {
    return (
      <div className="operator-info busy-warning" style={{ marginTop: '0.5rem' }}>
        <Lock size={14} />
        <span>Bạn cần <strong>chọn thiết bị</strong> trước khi cập nhật ngưỡng.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="threshold-form">
      <div className="threshold-grid">
        {[
          { key: 'temp_min', label: 'Nhiệt độ min (°C)' },
          { key: 'temp_max', label: 'Nhiệt độ max (°C)' },
          { key: 'humid_min', label: 'Độ ẩm KK min (%)' },
          { key: 'humid_max', label: 'Độ ẩm KK max (%)' },
          { key: 'soil_min', label: 'Độ ẩm đất min (%)' },
          { key: 'soil_max', label: 'Độ ẩm đất max (%)' },
          { key: 'light_min', label: 'Ánh sáng min (%)' },
          { key: 'light_max', label: 'Ánh sáng max (%)' },
        ].map(({ key, label }) => (
          <div key={key} className="filter-group">
            <label>{label}</label>
            <input
              type="number"
              name={key}
              value={form[key]}
              onChange={handleChange}
              placeholder="—"
              step="0.1"
            />
          </div>
        ))}
      </div>

      {error && <div className="auth-error" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</div>}

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary btn-sm" disabled={loading} style={{ gap: '0.5rem' }}>
          {loading ? 'Đang lưu...' : <><Save size={16} /> Lưu ngưỡng cài đặt</>}
        </button>
      </div>
    </form>
  );
}

export default function Devices() {
  const { token, user } = useAuth();
  const isAdmin = user?.role_id === 1;

  const [devices, setDevices] = useState([]);
  const [activeMap, setActiveMap] = useState({});
  const [operatorMap, setOperatorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadDevices = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    try {
      const deviceList = await fetchDevices(token);
      setDevices(deviceList);

      const checks = await Promise.allSettled(
        deviceList.map(d => checkActiveDevice(token, d.device_id))
      );
      const aMap = {};
      checks.forEach((r, i) => {
        if (r.status === 'fulfilled') aMap[deviceList[i].device_id] = r.value;
      });
      setActiveMap(aMap);

      if (isAdmin) {
        try {
          const activeDevices = await fetchActiveDevices(token);
          const opMap = {};
          activeDevices.forEach(d => {
            opMap[d.device_id] = {
              operated_by: d.operated_by,
              operated_by_username: d.operated_by_username,
            };
          });
          setOperatorMap(opMap);
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleSelect = async (deviceId) => {
    setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: true }));
    try {
      await selectDevice(token, deviceId);
      const res = await checkActiveDevice(token, deviceId);
      setActiveMap(prev => ({ ...prev, [deviceId]: res }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: false }));
    }
  };

  const handleDeselect = async (deviceId) => {
    setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: true }));
    try {
      // Gọi API tắt quạt, bơm, mode manual trước khi bỏ chọn
      try {
        await controlFan(token, deviceId, 'False');
        await controlPump(token, deviceId, 'False');
        await changeDeviceMode(token, deviceId, 'manual');
      } catch (autoErr) {
        console.error("Lỗi tự động tắt thiết bị: ", autoErr);
      }
      
      await deselectDevice(token, deviceId);
      const res = await checkActiveDevice(token, deviceId);
      setActiveMap(prev => ({ ...prev, [deviceId]: res }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: false }));
    }
  };

  const toggleExpand = (deviceId) => {
    setExpandedDevice(prev => (prev === deviceId ? null : deviceId));
  };

  return (
    <div style={{ position: 'relative' }}>
      {notification && (
        <div className={`toast-notification ${notification.type}`} style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '1.5rem 2.5rem',
          borderRadius: '0px',
          border: 'none',
          color: 'white',
          background: notification.type === 'success' ? '#23c552' : 'rgba(153, 27, 27, 0.95)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease-out',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <CheckCircle2 size={48} />
          <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>{notification.message}</span>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Cài đặt ngưỡng & Quản lý</h1>
        <button className="btn-secondary btn-sm" onClick={() => loadDevices()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
        </button>
      </div>

      {loading && <p style={{ marginTop: '1rem' }}>Đang tải dữ liệu...</p>}

      <div className="device-grid">
        {devices.map(device => {
          const deviceId = device.device_id;
          const isActive = activeMap[deviceId]?.is_active === true;
          const isBusy = activeMap[deviceId]?.is_busy_by_others === true;
          const operator = operatorMap[deviceId];
          const isExpanded = expandedDevice === deviceId;
          const selLoading = actionLoading[`sel-${deviceId}`];

          return (
            <div
              key={deviceId}
              className={`device-card${isActive ? ' device-selected' : ''}${isBusy && !isActive ? ' device-busy' : ''}`}
            >
              <div className="device-card-header">
                <div className="device-title">
                  <Cpu size={20} />
                  <div>
                    <h3>{device.name}</h3>
                    <span className="device-id">ID: {deviceId}</span>
                  </div>
                </div>
                <span className={`badge ${device.mode === 'auto' ? 'badge-auto' : 'badge-manual'}`}>
                  {device.mode === 'auto' ? 'Tự động' : 'Thủ công'}
                </span>
              </div>

              {isAdmin && operator && (
                <div className="operator-info">
                  <UserCheck size={14} />
                  <span>
                    Đang được thao tác bởi: <strong>{operator.operated_by_username === user.username ? "Bạn" : operator.operated_by}</strong>
                  </span>
                </div>
              )}

              {!isAdmin && isBusy && !isActive && (
                <div className="operator-info busy-warning">
                  <Lock size={14} />
                  <span>Thiết bị đang được sử dụng bởi một người dùng khác</span>
                </div>
              )}

              <div className="device-actions">
                {isActive ? (
                  <button className="btn-secondary btn-sm" onClick={() => handleDeselect(deviceId)} disabled={selLoading} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
                    Bỏ chọn
                  </button>
                ) : (
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleSelect(deviceId)}
                    disabled={selLoading || isBusy}
                  >
                    Chọn thiết bị
                  </button>
                )}

                <button className="btn-secondary btn-sm" onClick={() => toggleExpand(deviceId)} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none' }}>
                  {isExpanded ? <><ChevronUp size={14} /> Đóng</> : <><ChevronDown size={14} /> Cài đặt ngưỡng</>}
                </button>
              </div>

              {isExpanded && (
                <div className="device-detail-panel" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sliders size={16} /> Cấu hình ngưỡng cảnh báo
                  </h4>
                  <ThresholdForm
                    device={device}
                    token={token}
                    activeMap={activeMap}
                    onSuccess={() => loadDevices()}
                    onNotify={showNotification}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
