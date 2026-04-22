import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Activity,
  Users,
  Cpu,
  LogOut,
  Sprout,
  BarChart3,
  LineChart,
  ChevronDown,
  ChevronRight,
  Database,
  PlusCircle,
  Home
} from 'lucide-react';

function NavGroup({ icon: Icon, title, children, activePaths = [] }) {
  const location = useLocation();
  const isActive = activePaths.some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div className="nav-group">
      <button 
        className={`nav-group-header ${isActive ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Icon className="nav-icon" />
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="nav-group-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  // role_id = 1 is admin, role_id = 2 is normal user
  const isAdmin = user?.role_id === 1;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Sprout className="logo-icon" size={32} />
          <h2>Yolo Farm</h2>
        </div>

        <nav className="sidebar-nav" style={{ padding: '0.5rem' }}>
          
          <NavGroup 
            icon={Home} 
            title="Trang chủ" 
            activePaths={['/', '/dashboard', '/devices']} 
            defaultOpen={true}
          >
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
              <LayoutDashboard className="nav-icon" />
              Tổng quan
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard className="nav-icon" />
              Bảng điều khiển
            </NavLink>
            <NavLink to="/devices" className={({ isActive }) => isActive && location.pathname === '/devices' ? "nav-item active" : "nav-item"} end>
              <Cpu className="nav-icon" />
              {isAdmin ? 'Quản lý thiết bị' : 'Cài đặt ngưỡng'}
            </NavLink>
            {isAdmin && (
              <NavLink to="/devices/add" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <PlusCircle className="nav-icon" />
                Thêm thiết bị
              </NavLink>
            )}
          </NavGroup>

          <NavGroup 
            icon={Database} 
            title="Dữ liệu & Báo cáo" 
            activePaths={['/activity', '/statistics', '/sensor-history']}
          >
            <NavLink to="/activity" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Activity className="nav-icon" />
              Lịch sử hoạt động
            </NavLink>
            <NavLink to="/sensor-history" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <LineChart className="nav-icon" />
              Lịch sử dữ liệu
            </NavLink>
            <NavLink to="/statistics" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <BarChart3 className="nav-icon" />
              Thống kê hoạt động
            </NavLink>
          </NavGroup>

          <div style={{ marginTop: '0.5rem' }}>
            <NavLink to="/account" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Users className="nav-icon" />
              Quản lý tài khoản
            </NavLink>
          </div>

        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="dashboard-header">
          <div className="user-info">
            <span>Xin chào, {user?.full_name || user?.username || 'User'}!</span>
          </div>
        </header>

        <main className="dashboard-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
