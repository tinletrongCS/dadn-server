import React from 'react';
import { Sprout, LayoutDashboard, Cpu, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Overview() {
  const navigate = useNavigate();
  return (
    <div className="overview-container">
      <div className="overview-header" style={{ position: 'relative', overflow: 'hidden', borderRadius: '0px', marginBottom: '2rem' }}>
        <img
          src="/farm-banner.jpeg"
          alt="Smart Farm Banner"
          style={{ width: '100%', height: '490px', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.2))', display: 'flex', alignItems: 'center', padding: '3rem' }}>
          <div style={{ color: 'white', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Sprout size={99} color="var(--primary-green)" />
              Hệ thống nông trại thông minh Smart Farm Yolo:Bit
            </h1>
            <p style={{ fontSize: '1.0rem', lineHeight: '1.6', color: '#cbd5e1' }}>
            Hệ thống IoT giúp theo dõi và điều chỉnh ngưỡng cảnh báo đối với các thiết bị, từ đó tăng khả năng giám sát và cải thiện năng suất trong nông nghiệp.
            </p>
          </div>
        </div>
      </div>

      <div className="overview-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary-green)' }}>
            <LayoutDashboard size={26} />
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Giám sát thời gian thực</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', flex: 1 }}>
            Theo dõi liên tục các chỉ số môi trường như nhiệt độ, độ ẩm, ánh sáng từ các cảm biến. Giao diện trực quan giúp bạn nắm bắt tình trạng nông trại ngay lập tức.
          </p>
          <button className="btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/sensor-history')}>
            Đi tới Lịch sử gửi dữ liệu <ArrowRight size={16} />
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#3b82f6' }}>
            <Cpu size={26 } />
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Điều khiển tự động</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', flex: 1 }}>
            Thiết lập các ngưỡng cảnh báo và điều kiện để hệ thống tự động bật/tắt thiết bị (máy bơm, quạt) dựa trên dữ liệu thu thập được mà không cần can thiệp thủ công.
          </p>
          <button className="btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/devices')}>
            Cài đặt ngưỡng <ArrowRight size={16} />
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#8b5cf6' }}>
            <Activity size={26} />
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Phân tích & Thống kê</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', flex: 1 }}>
            Lưu trữ toàn bộ lịch sử hoạt động và dữ liệu cảm biến. Biểu đồ phân tích chuyên sâu giúp bạn đưa ra những quyết định canh tác chính xác hơn.
          </p>
          <button className="btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/statistics')}>
            Xem thống kê hoạt động <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
