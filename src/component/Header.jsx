import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  return (
    <header className="app-header">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="navbar-brand">
          <h1 className="profile-title">Profile</h1>
        </div>
        <div className="navbar-collapse justify-content-end px-0" id="navbarNav">
          <ul className="navbar-nav flex-row ms-auto align-items-center justify-content-end" style={{ gap: '1.5rem' }}>
            {/* Bell icon with dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link btn btn-link"
                id="notificationDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ padding: 0, border: 'none', background: 'none', boxShadow: 'none' }}
                type="button"
              >
                 <img src="/img/notification_icon.png" alt="Notifications" style={{ width: 28, height: 28 }} />
                <div className="notification bg-primary rounded-circle"></div>
              </button>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-animate-up" aria-labelledby="notificationDropdown" style={{ minWidth: 350, maxHeight: 500, overflowY: 'auto' }}>
                <div className="notification-header">
                  <h5>Thông báo</h5>
                  <div className="notification-tabs">
                    <span className="tab active">Tất cả</span>
                    <span className="tab">Chưa đọc</span>
                  </div>
                </div>
                <div className="notification-section">
                  <div className="section-header">
                    <span>Hôm nay</span>
                    <button className="see-all">Xem tất cả</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item">
                      <div className="notification-avatar">
                        <img src="/img/logo.png" alt="System" />
                        <div className="notification-icon event">
                          <i className="ti ti-calendar"></i>
                        </div>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          <strong>Hệ thống</strong> đã đăng một sự kiện sắp diễn ra: "Bảo trì hệ thống vào 22:00"
                        </p>
                        <span className="notification-time">2 giờ</span>
                      </div>
                      <div className="notification-dot"></div>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-avatar">
                        <img src="/img/logo.png" alt="Admin" />
                        <div className="notification-icon message">
                          <i className="ti ti-message"></i>
                        </div>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          <strong>Admin</strong> đã gửi tin nhắn mới: "Chào mừng bạn đến với hệ thống!"
                        </p>
                        <span className="notification-time">4 giờ</span>
                      </div>
                      <div className="notification-dot"></div>
                    </div>
                  </div>
                </div>
                
                <div className="notification-section">
                  <div className="section-header">
                    <span>Trước đó</span>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item">
                      <div className="notification-avatar">
                        <img src="/img/logo.png" alt="System" />
                        <div className="notification-icon update">
                          <i className="ti ti-refresh"></i>
                        </div>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          <strong>Hệ thống</strong> đã cập nhật: "Phiên bản mới đã được phát hành"
                        </p>
                        <span className="notification-time">1 ngày</span>
                      </div>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-avatar">
                        <img src="/img/logo.png" alt="Support" />
                        <div className="notification-icon support">
                          <i className="ti ti-headset"></i>
                        </div>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          <strong>Hỗ trợ</strong> đã trả lời ticket của bạn: "Vấn đề đã được giải quyết"
                        </p>
                        <span className="notification-time">2 ngày</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
             {/* Admin name */}
             <li className="nav-item d-flex align-items-center">
               Admin
             </li>
            {/* Profile icon */}
            <li className="nav-item dropdown">
              <button
                className="nav-link btn btn-link dropdown-toggle"
                id="profileDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ padding: 0, border: 'none', background: 'none', boxShadow: 'none' }}
                type="button"
              >
                <img src="/img/avatar_1.png" alt="Profile" width="35" height="35" className="rounded-circle" />
              </button>
              <ul className="dropdown-menu dropdown-menu-end profile-dropdown-menu" aria-labelledby="profileDropdown" style={{ minWidth: 280, padding: 0 }}>
                <li className="profile-dropdown-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e6f2fa', background: '#fff', color: '#0b1b4b', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/img/avatar_1.png" alt="Profile" width="48" height="48" className="rounded-circle" style={{ border: '2px solid #4dd0ff' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#0b1b4b' }}>Đức Anh Nguyen</div>
                    
                    </div>
                  </div>
                  <button className="btn w-100 mt-3" style={{ fontWeight: 600, fontSize: 15, borderRadius: 8, background: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)', color: '#fff', border: 'none' }} onClick={() => navigate('/profile')}>
                    <i className="ti ti-user" style={{ marginRight: 8 }}></i>View profile
                  </button>
                </li>
                <li><hr className="dropdown-divider" style={{ margin: 0, borderColor: '#e6f2fa' }} /></li>
                <li>
                  <button className="dropdown-item d-flex align-items-center" type="button" onClick={() => navigate('/change-password')} style={{ color: '#0b1b4b', fontWeight: 500 }}>
                    <i className="ti ti-settings" style={{ marginRight: 12, fontSize: 18, color: '#5e17eb' }}></i>
                    Change password
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center" type="button" onClick={() => navigate('/setting')} style={{ color: '#0b1b4b', fontWeight: 500 }}>
                    <i className="ti ti-help-circle" style={{ marginRight: 12, fontSize: 18, color: '#4dd0ff' }}></i>
                    Setting
                  </button>
                </li>
                
              
                <li><hr className="dropdown-divider" style={{ margin: 0, borderColor: '#e6f2fa' }} /></li>
                <li>
                  <button className="dropdown-item d-flex align-items-center" type="button" onClick={() => navigate('/login-teacher')} style={{ color: '#ff4757', fontWeight: 600 }}>
                    <i className="ti ti-logout" style={{ marginRight: 12, fontSize: 18, color: '#ff4757' }}></i>
                    Log out
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
