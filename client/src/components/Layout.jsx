import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createNotificationSocket } from '../api';
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
  Home,
  Sliders,
  UserCircle,
  UserCog,
  Bell,
  CircleAlert,
  CircleCheck,
  Inbox,
  X
} from 'lucide-react';

function NavGroup({ icon, title, children, activePaths = [], groupId, openGroup, setOpenGroup }) {
  const location = useLocation();
  const isActive = activePaths.some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const isOpen = openGroup === groupId;

  return (
    <div className="nav-group">
      <button
        className={`nav-group-header ${isActive ? 'active' : ''}`}
        onClick={() => setOpenGroup(isOpen ? null : groupId)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {React.createElement(icon, { className: 'nav-icon' })}
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
  const { token, user, logout } = useAuth();
  const location = useLocation();
  // role_id = 1 is admin, role_id = 2 is normal user
  const isAdmin = user?.role_id === 1;
  const [openGroup, setOpenGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const notificationCenterRef = React.useRef(null);
  const unreadCount = notifications.filter(item => !item.read).length;

  const dismissNotification = React.useCallback((id) => {
    setNotifications(current => current.map(item => (
      item.id === id ? { ...item, showToast: false } : item
    )));
  }, []);

  const pushNotification = React.useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const severity = payload.severity || (payload.type === 'EMERGENCY' ? 'error' : payload.type === 'ALERT' ? 'warning' : 'info');
    const notification = {
      id,
      type: payload.type || 'MESSAGE',
      severity,
      title: payload.title || 'Thông báo',
      message: payload.message || 'Có thông báo mới từ hệ thống',
      deviceId: payload.device_id,
      createdAt: payload.created_at,
      read: false,
      showToast: true,
    };

    setNotifications(current => [notification, ...current].slice(0, 10));
    window.setTimeout(() => dismissNotification(id), 7000);
  }, [dismissNotification]);

  const markAllNotificationsRead = React.useCallback(() => {
    setNotifications(current => current.map(item => ({ ...item, read: true })));
  }, []);

  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
    setNotificationPanelOpen(false);
  }, []);

  React.useEffect(() => {
    const homePaths = ['/', '/dashboard', '/devices', '/devices/add', '/threshold-management'];
    const dataPaths = ['/activity', '/statistics', '/sensor-history'];
    const accountPaths = ['/account/me', '/account/users'];
    let nextGroup = null;
    
    if (homePaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`))) {
      nextGroup = 'home';
    } else if (dataPaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`))) {
      nextGroup = 'data';
    } else if (accountPaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`))) {
      nextGroup = 'account';
    }

    const timer = window.setTimeout(() => {
      setOpenGroup(nextGroup);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setNotificationPanelOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!notificationPanelOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!notificationCenterRef.current?.contains(event.target)) {
        setNotificationPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [notificationPanelOpen]);

  React.useEffect(() => {
    if (!token || !user) return undefined;

    let socket;
    let reconnectTimer;
    let pingTimer;
    let closedByComponent = false;

    const connect = () => {
      socket = createNotificationSocket(token, {
        onOpen: () => {
          pingTimer = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send('ping');
            }
          }, 30000);
        },
        onMessage: pushNotification,
        onClose: () => {
          if (pingTimer) window.clearInterval(pingTimer);
          if (!closedByComponent) {
            reconnectTimer = window.setTimeout(connect, 3000);
          }
        },
        onError: () => {
          socket?.close();
        },
      });
    };

    connect();

    return () => {
      closedByComponent = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (pingTimer) window.clearInterval(pingTimer);
      socket?.close();
    };
  }, [token, user, pushNotification]);

  const getBreadcrumbs = () => {
    const paths = {
      '/': [{ label: 'Trang chủ', path: '/' }, { label: 'Tổng quan' }],
      '/dashboard': [{ label: 'Trang chủ', path: '/' }, { label: 'Bảng điều khiển' }],
      '/devices': [{ label: 'Trang chủ', path: '/' }, { label: isAdmin ? 'Quản lý thiết bị' : 'Cài đặt ngưỡng' }],
      '/devices/add': [{ label: 'Trang chủ', path: '/' }, { label: 'Thêm thiết bị' }],
      '/activity': [{ label: 'Dữ liệu & Báo cáo', path: '/activity' }, { label: 'Lịch sử hoạt động' }],
      '/sensor-history': [{ label: 'Dữ liệu & Báo cáo', path: '/activity' }, { label: 'Lịch sử gửi dữ liệu' }],
      '/statistics': [{ label: 'Dữ liệu & Báo cáo', path: '/activity' }, { label: 'Thống kê hoạt động' }],
      '/threshold-management': [{ label: 'Trang chủ', path: '/' }, { label: 'Quản lý cấu hình ngưỡng' }],
      '/account/me': [{ label: 'Quản lý tài khoản' }, { label: 'Tài khoản của tôi' }],
      '/account/users': [{ label: 'Quản lý tài khoản' }, { label: 'Danh sách người dùng' }],
      '/account': [{ label: 'Quản lý tài khoản' }]
    };
    return paths[location.pathname] || [];
  };

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
            groupId="home"
            openGroup={openGroup}
            setOpenGroup={setOpenGroup}
            icon={Home}
            title="Trang chủ"
            activePaths={['/', '/dashboard', '/devices', '/devices/add']}
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
            <NavLink to="/threshold-management" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Sliders className="nav-icon" />
              Quản lý ngưỡng
            </NavLink>
            {isAdmin && (
              <NavLink to="/devices/add" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <PlusCircle className="nav-icon" />
                Thêm thiết bị
              </NavLink>
            )}
          </NavGroup>

          <NavGroup
            groupId="data"
            openGroup={openGroup}
            setOpenGroup={setOpenGroup}
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
              Lịch sử gửi dữ liệu
            </NavLink>
            <NavLink to="/statistics" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <BarChart3 className="nav-icon" />
              Thống kê hoạt động
            </NavLink>
          </NavGroup>

          <NavGroup
            groupId="account"
            openGroup={openGroup}
            setOpenGroup={setOpenGroup}
            icon={Users}
            title="Quản lý tài khoản"
            activePaths={['/account/me', '/account/users']}
          >
            <NavLink to="/account/me" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <UserCircle className="nav-icon" />
              Tài khoản của tôi
            </NavLink>
            {isAdmin && (
              <NavLink to="/account/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <UserCog className="nav-icon" />
                Danh sách người dùng
              </NavLink>
            )}
          </NavGroup>

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
        <header className="dashboard-header" style={{ justifyContent: 'space-between' }}>
          <div className="breadcrumb" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getBreadcrumbs().map((crumb, index, arr) => (
              <React.Fragment key={index}>
                {crumb.path ? (
                  <NavLink
                    to={crumb.path}
                    style={({ isActive }) => ({
                      color: isActive && index === arr.length - 1 ? 'white' : '#cbd5e1',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      fontWeight: index === arr.length - 1 ? 600 : 500
                    })}
                    className="breadcrumb-link"
                  >
                    {crumb.label}
                  </NavLink>
                ) : (
                  <span style={{ color: index === arr.length - 1 ? 'white' : '#cbd5e1', fontWeight: index === arr.length - 1 ? 600 : 500 }}>
                    {crumb.label}
                  </span>
                )}
                {index < arr.length - 1 && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
              </React.Fragment>
            ))}
          </div>
          <div className="user-info">
            <div className="notification-center" ref={notificationCenterRef}>
              <button
                type="button"
                className={`notification-bell ${notificationPanelOpen ? 'active' : ''}`}
                onClick={() => setNotificationPanelOpen(open => !open)}
                aria-label="Mở thông báo"
                aria-expanded={notificationPanelOpen}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notificationPanelOpen && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <div>
                      <h3>Thông báo</h3>
                      <span>{unreadCount} chua doc</span>
                    </div>
                    <button
                      type="button"
                      className="notification-panel-action"
                      onClick={markAllNotificationsRead}
                      disabled={unreadCount === 0}
                    >
                      Da doc
                    </button>
                  </div>

                  <div className="notification-panel-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <Inbox size={24} />
                        <span>Chưa có thông báo mới</span>
                      </div>
                    ) : (
                      notifications.map(notification => {
                        const Icon = notification.severity === 'error'
                          ? CircleAlert
                          : notification.severity === 'success'
                            ? CircleCheck
                            : notification.severity === 'warning'
                              ? CircleAlert
                              : Bell;

                        return (
                          <button
                            type="button"
                            key={notification.id}
                            className={`notification-panel-item notification-panel-item-${notification.severity} ${notification.read ? '' : 'unread'}`}
                            onClick={() => setNotifications(current => current.map(item => (
                              item.id === notification.id ? { ...item, read: true } : item
                            )))}
                          >
                            {React.createElement(Icon, { size: 18, className: 'notification-panel-icon' })}
                            <span className="notification-panel-copy">
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                              {notification.deviceId && <em>Thiet bi #{notification.deviceId}</em>}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <button type="button" className="notification-clear" onClick={clearNotifications}>
                      Xoa tat ca
                    </button>
                  )}
                </div>
              )}
            </div>
            <span>Xin chào, {user?.full_name || user?.username || 'User'}!</span>
          </div>
        </header>

        <main className="dashboard-body">
          <Outlet />
        </main>
      </div>

      <div className="notification-stack" aria-live="polite" aria-atomic="false">
        {notifications.filter(notification => notification.showToast).map(notification => {
          const Icon = notification.severity === 'error'
            ? CircleAlert
            : notification.severity === 'success'
              ? CircleCheck
              : notification.severity === 'warning'
                ? CircleAlert
                : Bell;

          return (
            <div key={notification.id} className={`ws-toast ws-toast-${notification.severity}`}>
              {React.createElement(Icon, { size: 22, className: 'ws-toast-icon' })}
              <div className="ws-toast-content">
                <div className="ws-toast-title">
                  <span>{notification.title}</span>
                  {notification.deviceId && <span className="ws-toast-device">#{notification.deviceId}</span>}
                </div>
                <p>{notification.message}</p>
              </div>
              <button
                type="button"
                className="ws-toast-close"
                onClick={() => dismissNotification(notification.id)}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
