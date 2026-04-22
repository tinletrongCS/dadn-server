import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchDevices, fetchActiveDevices, checkActiveDevice,
  selectDevice, deselectDevice, fetchDeviceStatus,
  changeDeviceMode, controlPump, controlFan, fetchLatestSensor, createDevice
} from '../api';
import {
  Cpu, Power, PowerOff, RefreshCw, Droplets, Wind,
  Thermometer, Sun, Eye, UserCheck, Lock, X,
  CheckCircle, Play, Settings, Plus, PlayCircle
} from 'lucide-react';

// ── Visual toggle switch component ──────────────────────────────────────────
function ToggleSwitch({ checked, onChange, loading, disabled, labelOn, labelOff }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && !loading && onChange(!checked)}
      disabled={disabled || loading}
      className={`toggle-switch ${checked ? 'toggle-on' : 'toggle-off'}`}
    >
      <span className="toggle-thumb" />
      <span className="toggle-label">{checked ? (labelOn || 'ON') : (labelOff || 'OFF')}</span>
    </button>
  );
}



// ── Device Detail Modal Component ───────────────────────────────────────────
function DeviceDetailModal({ isOpen, onClose, device, token, onAction, status, sensor, isSelected, actionLoading, error }) {
  if (!isOpen || !device) return null;

  const mode = status?.mode ?? device.mode ?? 'manual';
  const pumpOn = status?.pump_status ?? device.pump_status;
  const fanOn = status?.fan_status ?? device.fan_status;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu size={24} className="primary-green" />
            <div>
              <h3 style={{ margin: 0 }}>Điều khiển thiết bị: {device.name}</h3>
              <span className="device-id">ID: {device.device_id}</span>
            </div>
          </div>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="auth-error">{error}</div>}

          <div className="sensor-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {sensor ? (
              <>
                <div className="sensor-item">
                  <Thermometer size={18} />
                  <span className="sensor-label">Nhiệt độ</span>
                  <span className="sensor-value">{sensor.temperature}°C</span>
                </div>
                <div className="sensor-item">
                  <Droplets size={18} />
                  <span className="sensor-label">Độ ẩm KK</span>
                  <span className="sensor-value">{sensor.air_humidity}%</span>
                </div>
                <div className="sensor-item">
                  <Droplets size={18} />
                  <span className="sensor-label">Độ ẩm đất</span>
                  <span className="sensor-value">{sensor.soil_moisture}%</span>
                </div>
                <div className="sensor-item">
                  <Sun size={18} />
                  <span className="sensor-label">Ánh sáng</span>
                  <span className="sensor-value">{sensor.light_intensity}%</span>
                </div>
              </>
            ) : (
              <p className="empty-text">Chưa có dữ liệu cảm biến mới nhất.</p>
            )}
          </div>
          {sensor && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              Cập nhật lúc: {new Date(sensor.measured_at).toLocaleString('vi-VN')}
            </div>
          )}

          <div className="control-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Settings size={18} />
              <h4 style={{ margin: 0 }}>Bảng điều khiển</h4>
            </div>

            {!isSelected ? (
              <div className="operator-info busy-warning">
                <Lock size={14} />
                <span>Bạn cần <strong>Chọn thiết bị</strong> trước khi thao tác điều khiển.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="control-row">
                  <span style={{ minWidth: 100, fontWeight: 600 }}>Chế độ:</span>
                  <ToggleSwitch
                    checked={mode === 'auto'}
                    onChange={(isAuto) => onAction('mode', isAuto ? 'auto' : 'manual')}
                    loading={actionLoading[`mode-${device.device_id}`]}
                    labelOn="TỰ ĐỘNG"
                    labelOff="THỦ CÔNG"
                  />
                </div>

                {mode === 'manual' && (
                  <div className="manual-controls" style={{ background: '#f9fafb', padding: '1rem' }}>
                    <div className="control-row" style={{ marginBottom: '1rem' }}>
                      <span style={{ minWidth: 100 }}><Droplets size={14} /> Máy bơm:</span>
                      <ToggleSwitch
                        checked={pumpOn}
                        onChange={(isOn) => onAction('pump', isOn)}
                        loading={actionLoading[`pump-${device.device_id}`]}
                        labelOn="BẬT"
                        labelOff="TẮT"
                      />
                    </div>
                    <div className="control-row">
                      <span style={{ minWidth: 100 }}><Wind size={14} /> Quạt:</span>
                      <ToggleSwitch
                        checked={fanOn}
                        onChange={(isOn) => onAction('fan', isOn)}
                        loading={actionLoading[`fan-${device.device_id}`]}
                        labelOn="BẬT"
                        labelOff="TẮT"
                      />
                    </div>
                  </div>
                )}

                {mode === 'auto' && (
                  <div className="operator-info" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <CheckCircle size={14} />
                    <span>Hệ thống đang tự động điều chỉnh dựa trên ngưỡng cài đặt.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { token, user } = useAuth();
  const isAdmin = user?.role_id === 1;

  const [devices, setDevices] = useState([]);
  const [activeMap, setActiveMap] = useState({});
  const [operatorMap, setOperatorMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [deviceMap, setDeviceMap] = useState({});
  const [sensorMap, setSensorMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const [detailDevice, setDetailDevice] = useState(null);

  const isSelectedByMe = useCallback((deviceId) => activeMap[deviceId]?.is_active === true, [activeMap]);
  const isBusyByOthers = useCallback((deviceId) => activeMap[deviceId]?.is_busy_by_others === true, [activeMap]);

  const loadDevices = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    try {
      const deviceList = await fetchDevices(token);
      setDevices(deviceList || []);

      const dMap = {};
      deviceList.forEach(d => { dMap[d.device_id] = d; });
      setDeviceMap(dMap);

      const activeChecks = await Promise.allSettled(
        deviceList.map(d => checkActiveDevice(token, d.device_id))
      );
      const newActiveMap = {};
      activeChecks.forEach((result, i) => {
        if (result.status === 'fulfilled' && deviceList[i]) {
          newActiveMap[deviceList[i].device_id] = result.value;
        }
      });
      setActiveMap(newActiveMap);

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
      console.error('Load devices error:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const refreshDetailData = async (deviceId) => {
    try {
      const [statusRes, sensorRes] = await Promise.allSettled([
        fetchDeviceStatus(token, deviceId),
        fetchLatestSensor(token, deviceId),
      ]);
      if (statusRes.status === 'fulfilled') {
        setStatusMap(prev => ({ ...prev, [deviceId]: statusRes.value }));
      }
      if (sensorRes.status === 'fulfilled') {
        setSensorMap(prev => ({ ...prev, [deviceId]: sensorRes.value }));
      }
    } catch (err) {
      console.error('refreshDetailData error:', err);
    }
  };

  const handleSelect = async (deviceId) => {
    setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: true }));
    setErrorMap(prev => ({ ...prev, [deviceId]: null }));
    try {
      await selectDevice(token, deviceId);
      await loadDevices(true);
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [deviceId]: err.message }));
    } finally {
      setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: false }));
    }
  };

  const handleDeselect = async (deviceId) => {
    setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: true }));
    setErrorMap(prev => ({ ...prev, [deviceId]: null }));
    
    // Optimistic Update ngay lập tức - 0ms delay
    setDevices(prev => prev.map(d => 
      d.device_id === deviceId ? { ...d, fan_status: false, pump_status: false, mode: 'manual' } : d
    ));
    setActiveMap(prev => ({ ...prev, [deviceId]: { ...prev[deviceId], is_active: false, is_busy_by_others: false } }));
    setStatusMap(prev => ({ ...prev, [deviceId]: { ...prev[deviceId], fan_status: false, pump_status: false, mode: 'manual' } }));

    // Gọi API nền song song - không block UI
    try {
      await Promise.all([
        controlFan(token, deviceId, 'False'),
        controlPump(token, deviceId, 'False'),
        changeDeviceMode(token, deviceId, 'manual'),
        deselectDevice(token, deviceId)
      ]);
    } catch (err) {
      console.error("Lỗi khi bỏ chọn: ", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`sel-${deviceId}`]: false }));
    }
  };

  const handleOpenDetail = async (device) => {
    setDetailDevice(device);
    if (device) await refreshDetailData(device.device_id);
  };

  const handleModalAction = async (type, value) => {
    if (!detailDevice) return;
    const deviceId = detailDevice.device_id;
    
    if (type === 'mode') {
      setActionLoading(prev => ({ ...prev, [`mode-${deviceId}`]: true }));
      try {
        await changeDeviceMode(token, deviceId, value);
        await loadDevices(true);
        await refreshDetailData(deviceId);
      } catch (err) {
        setErrorMap(prev => ({ ...prev, [deviceId]: err.message }));
      } finally {
        setActionLoading(prev => ({ ...prev, [`mode-${deviceId}`]: false }));
      }
    } else {
      const actuator = type;
      const action = value ? 'True' : 'False';
      setActionLoading(prev => ({ ...prev, [`${actuator}-${deviceId}`]: true }));
      try {
        if (actuator === 'pump') await controlPump(token, deviceId, action);
        else await controlFan(token, deviceId, action);
        await loadDevices(true);
        await refreshDetailData(deviceId);
      } catch (err) {
        setErrorMap(prev => ({ ...prev, [deviceId]: err.message }));
      } finally {
        setActionLoading(prev => ({ ...prev, [`${actuator}-${deviceId}`]: false }));
      }
    }
  };

  const usedDevices = (devices || []).filter(d => isSelectedByMe(d.device_id) || isBusyByOthers(d.device_id));
  const availableDevices = (devices || []).filter(d => !isSelectedByMe(d.device_id) && !isBusyByOthers(d.device_id));

  const renderDeviceCard = (device) => {
    if (!device) return null;
    const deviceId = device.device_id;
    const selected = isSelectedByMe(deviceId);
    const busy = isBusyByOthers(deviceId);
    const operator = operatorMap[deviceId];
    const liveDev = deviceMap[deviceId] ?? device;
    const selLoading = actionLoading[`sel-${deviceId}`];
    const mode = statusMap[deviceId]?.mode ?? liveDev.mode ?? 'manual';
    const pumpOn = statusMap[deviceId]?.pump_status ?? liveDev.pump_status;
    const fanOn = statusMap[deviceId]?.fan_status ?? liveDev.fan_status;
    const errMsg = errorMap[deviceId];

    return (
      <div
        key={deviceId}
        className={`device-card${selected ? ' device-selected' : ''}${busy && !selected ? ' device-busy' : ''}`}
      >
        <div className="device-card-header">
          <div className="device-title">
            <Cpu size={20} />
            <div>
              <h3>{liveDev.name}</h3>
              <span className="device-id">ID: {deviceId}</span>
            </div>
          </div>
          <span className={`badge ${mode === 'auto' ? 'badge-auto' : 'badge-manual'}`}>
            {mode === 'auto' ? 'Tự động' : 'Thủ công'}
          </span>
        </div>

        <div className="device-status-row">
          <div className={`status-dot ${pumpOn ? 'on' : 'off'}`}>
            <Droplets size={14} /> Bơm: {pumpOn ? 'BẬT' : 'TẮT'}
          </div>
          <div className={`status-dot ${fanOn ? 'on' : 'off'}`}>
            <Wind size={14} /> Quạt: {fanOn ? 'BẬT' : 'TẮT'}
          </div>
        </div>

        {isAdmin && operator && (
          <div className="operator-info">
            <UserCheck size={14} />
            <span>Thao tác bởi: <strong>{operator.operated_by}</strong></span>
          </div>
        )}

        {!isAdmin && busy && !selected && (
          <div className="operator-info busy-warning">
            <Lock size={14} />
            <span>Thiết bị đang được sử dụng bởi một người dùng khác</span>
          </div>
        )}

        {errMsg && <div className="auth-error" style={{ fontSize: '0.75rem' }}>{errMsg}</div>}

        <div className="device-actions">
          {selected ? (
            <button className="btn-secondary btn-sm" onClick={() => handleDeselect(deviceId)} disabled={selLoading}>
              <PowerOff size={14} /> Bỏ chọn
            </button>
          ) : (
            <button
              className="btn-primary btn-sm"
              onClick={() => handleSelect(deviceId)}
              disabled={selLoading || busy}
            >
              <Power size={14} /> Chọn
            </button>
          )}

          <button className="btn-secondary btn-sm" onClick={() => handleOpenDetail(device)}>
            <Settings size={14} /> Thao tác
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Bảng điều khiển</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary btn-sm" onClick={() => loadDevices()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
          </button>
        </div>
      </div>

      {loading && <p style={{ marginTop: '1rem' }}>Đang tải dữ liệu...</p>}

      {!loading && devices && devices.length === 0 && (
        <div className="card"><p>Chưa có thiết bị nào trong hệ thống.</p></div>
      )}

      {!loading && devices && devices.length > 0 && (
        <>
          <div className="section-header">
            <PlayCircle size={18} />
            <h2>Thiết bị đang được sử dụng</h2>
          </div>
          <div className="device-grid">
            {usedDevices.length > 0 ? usedDevices.map(renderDeviceCard) : <p className="empty-text">Không có thiết bị nào đang bận.</p>}
          </div>

          <div className="section-header" style={{ marginTop: '2.5rem' }}>
            <CheckCircle size={18} />
            <h2>Thiết bị khả dụng</h2>
          </div>
          <div className="device-grid">
            {availableDevices.length > 0 ? availableDevices.map(renderDeviceCard) : <p className="empty-text">Hiện không có thiết bị khả dụng nào.</p>}
          </div>
        </>
      )}
      <DeviceDetailModal
        isOpen={!!detailDevice}
        onClose={() => setDetailDevice(null)}
        device={detailDevice}
        token={token}
        onAction={handleModalAction}
        status={detailDevice ? statusMap[detailDevice.device_id] : null}
        sensor={detailDevice ? sensorMap[detailDevice.device_id] : null}
        isSelected={detailDevice ? isSelectedByMe(detailDevice.device_id) : false}
        actionLoading={actionLoading}
        error={detailDevice ? errorMap[detailDevice.device_id] : null}
      />
    </div>
  );
}
