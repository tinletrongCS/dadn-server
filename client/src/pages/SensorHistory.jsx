import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDevices, fetchSensorHistory } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { History, Filter, RefreshCw, Thermometer, Droplets, Sun } from 'lucide-react';

export default function SensorHistory() {
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default dates
  const currentYear = new Date().getFullYear();
  // We use local time for the input
  const pad = (n) => n.toString().padStart(2, '0');
  const formatDateTimeLocal = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const defaultFromDate = new Date(currentYear, 0, 1, 0, 0); // Jan 1st of current year
  const defaultToDate = new Date();

  const [fromTime, setFromTime] = useState(formatDateTimeLocal(defaultFromDate));
  const [toTime, setToTime] = useState(formatDateTimeLocal(defaultToDate));
  const [activeTab, setActiveTab] = useState('temperature');

  useEffect(() => {
    if (token) {
      fetchDevices(token).then(data => {
        setDevices(data);
        if (data.length > 0) setSelectedDevice(data[0].device_id);
      }).catch(console.error);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token || !selectedDevice) return;
    setLoading(true);
    setError(null);
    try {
      // Convert to ISO for backend
      const fromISO = new Date(fromTime).toISOString();
      const toISO = new Date(toTime).toISOString();
      const data = await fetchSensorHistory(token, selectedDevice, fromISO, toISO);
      
      // Format dates for display
      const formatted = data.map(d => ({
        ...d,
        displayTime: new Date(d.measured_at).toLocaleString('vi-VN', {
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        })
      }));
      setHistoryData(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDevice, fromTime, toTime]);

  useEffect(() => {
    if (selectedDevice) {
      loadData();
    }
  }, [selectedDevice]);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const tabs = [
    { id: 'temperature', label: 'Nhiệt độ', icon: Thermometer, color: '#ef4444', key: 'temperature', unit: '°C' },
    { id: 'air_humidity', label: 'Độ ẩm KK', icon: Droplets, color: '#3b82f6', key: 'air_humidity', unit: '%' },
    { id: 'soil_moisture', label: 'Độ ẩm đất', icon: Droplets, color: '#8b5cf6', key: 'soil_moisture', unit: '%' },
    { id: 'light_intensity', label: 'Ánh sáng', icon: Sun, color: '#eab308', key: 'light_intensity', unit: '%' }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History size={28} /> Lịch sử gửi dữ liệu
        </h1>
        <button className="btn-secondary btn-sm" onClick={() => loadData()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleFilter} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label>Thiết bị</label>
              <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} required>
                <option value="" disabled>Chọn thiết bị</option>
                {devices.map(d => (
                  <option key={d.device_id} value={d.device_id}>{d.name} (ID: {d.device_id})</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Từ thời gian</label>
              <input type="datetime-local" value={fromTime} onChange={e => setFromTime(e.target.value)} required />
            </div>
            <div className="filter-group">
              <label>Đến thời gian</label>
              <input type="datetime-local" value={toTime} onChange={e => setToTime(e.target.value)} required />
            </div>
            <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ height: '42px', width: '100%', justifyContent: 'center' }}>
                <Filter size={16} style={{ marginRight: '0.5rem' }} /> Xem dữ liệu
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="tabs-header">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content" style={{ marginTop: '1.5rem', height: '400px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p>Đang tải biểu đồ...</p>
            </div>
          ) : error ? (
            <div className="auth-error">{error}</div>
          ) : historyData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p className="empty-text">Không có dữ liệu trong khoảng thời gian này.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="displayTime" tick={{ fontSize: 12, fill: '#6b7280' }} minTickGap={30} />
                <YAxis 
                  unit={activeTabData.unit} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  domain={['auto', 'auto']}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey={activeTabData.key} 
                  name={activeTabData.label} 
                  stroke={activeTabData.color} 
                  strokeWidth={3}
                  dot={{ r: 3, fill: activeTabData.color }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
