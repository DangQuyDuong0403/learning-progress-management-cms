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
            <li className="nav-item">
              <button className="nav-link btn btn-link" style={{ padding: 0, border: 'none', background: 'none', boxShadow: 'none' }} onClick={() => navigate('/profile')}>
                <img src="/img/avatar_1.png" alt="Profile" width="35" height="35" className="rounded-circle" />
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
