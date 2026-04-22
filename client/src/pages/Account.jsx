import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, Calendar, CheckCircle } from 'lucide-react';

function getRoleName(roleId) {
  if (roleId === 1) return 'Quản trị viên (Admin)';
  return 'Người dùng';
}

export default function Account() {
  const { user } = useAuth();
  
  return (
    <div>
      <div className="page-header">
        <h1>Quản lý tài khoản</h1>
      </div>
      <div className="card">
        <h3>Thông tin cá nhân</h3>
        <div className="account-info">
          <div className="info-row">
            <UserIcon size={16} />
            <span className="info-label">Tên đăng nhập:</span>
            <span>{user?.username}</span>
          </div>
          <div className="info-row">
            <UserIcon size={16} />
            <span className="info-label">Họ và tên:</span>
            <span>{user?.full_name}</span>
          </div>
          <div className="info-row">
            <Shield size={16} />
            <span className="info-label">Vai trò:</span>
            <span className={user?.role_id === 1 ? 'badge badge-admin' : 'badge badge-user'}>
              {getRoleName(user?.role_id)}
            </span>
          </div>
          <div className="info-row">
            <CheckCircle size={16} />
            <span className="info-label">Trạng thái:</span>
            <span className={user?.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
              {user?.is_active ? 'Đang hoạt động' : 'Bị khóa'}
            </span>
          </div>
          <div className="info-row">
            <Calendar size={16} />
            <span className="info-label">Ngày tạo:</span>
            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
