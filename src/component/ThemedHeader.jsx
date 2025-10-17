import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Switch, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { logoutApi, logout, getUserProfile } from '../redux/auth';
import { useTheme } from '../contexts/ThemeContext';
import LanguageToggle from './LanguageToggle';
import { spaceToast } from './SpaceToastify';
import './ThemedHeader.css';

export default function ThemedHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, refreshToken, profileData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme, isSunTheme } = useTheme();

  // Fetch user profile data on component mount
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        // Gọi API logout với refreshToken và timeout ngắn
        const logoutPromise = dispatch(logoutApi(refreshToken)).unwrap();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 5000)
        );
        
        await Promise.race([logoutPromise, timeoutPromise]);
        spaceToast.success(t('messages.logoutSuccess'));
      } else {
        // Nếu không có refreshToken, chỉ xóa localStorage
        dispatch(logout());
        spaceToast.success(t('messages.logoutSuccess'));
      }
    } catch (error) {
      // Nếu API logout lỗi hoặc timeout, vẫn đăng xuất local
      console.log('Logout error:', error);
      dispatch(logout());
      spaceToast.success(t('messages.logoutSuccess')); // Vẫn hiển thị success vì đã logout local
    } finally {
      // Luôn chuyển về trang login
      navigate('/choose-login');
    }
  };

  return (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content">
          <div className="themed-navbar-brand">
          
          </div>
          
          <div className="themed-navbar-actions">
            <ul className="themed-navbar-nav">
              {/* Theme Toggle Switch */}
              <li className="themed-nav-item">
                <Tooltip 
                  title={isSunTheme ? t('header.switchToSpace') : t('header.switchToSun')}
                  placement="bottom"
                >
                  <div className="theme-switch-container">
                    <Switch
                      checked={isSunTheme}
                      onChange={toggleTheme}
                      size="default"
                      className={`theme-switch ${theme}-theme-switch`}
                      checkedChildren={
                        <SunOutlined 
                          style={{ 
                            color: '#fff',
                            filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))'
                          }} 
                        />
                      }
                      unCheckedChildren={
                        <MoonOutlined 
                          style={{ 
                            color: '#fff',
                            filter: 'drop-shadow(0 0 3px rgba(77, 208, 255, 0.8))'
                          }} 
                        />
                      }
                    />
                  </div>
                </Tooltip>
              </li>

              {/* Language Toggle */}
              <li className="themed-nav-item">
                <LanguageToggle />
              </li>

              {/* Notifications */}
              <li className="themed-nav-item dropdown">
                <button
                  className="themed-nav-link"
                  id="notificationDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  type="button"
                >
                  <img 
                    src="/img/notification_icon.png" 
                    alt="Notifications" 
                    className={`notification-icon ${theme}-notification-icon`}
                  />
                  <div className={`notification-dot ${theme}-notification-dot`}></div>
                </button>
                <div 
                  className={`dropdown-menu dropdown-menu-end ${theme}-dropdown-menu`}
                  aria-labelledby="notificationDropdown"
                >
                  <div className="notification-header">
                    <h5>{t('header.notifications')}</h5>
                    <div className="notification-tabs">
                      <span className="tab active">{t('header.allNotifications')}</span>
                      <span className="tab">{t('header.unreadNotifications')}</span>
                    </div>
                  </div>
                  <div className="notification-section">
                    <div className="section-header">
                      <span>{t('header.today')}</span>
                      <button className="see-all">{t('header.viewAll')}</button>
                    </div>
                    <div className="notification-list">
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-text">
                            <strong>{t('header.systemRole')}</strong> {t('header.systemPostedEvent')} "{t('header.systemMaintenanceEvent')}"
                          </p>
                          <span className="notification-time">2 {t('header.hoursAgo')}</span>
                        </div>
                        <div className="notification-dot"></div>
                      </div>
                      
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-text">
                            <strong>{t('header.adminRole')}</strong> {t('header.adminSentMessage')} "{t('header.welcomeMessage')}"
                          </p>
                          <span className="notification-time">4 {t('header.hoursAgo')}</span>
                        </div>
                        <div className="notification-dot"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="notification-section">
                    <div className="section-header">
                      <span>{t('header.earlier')}</span>
                    </div>
                    <div className="notification-list">
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-text">
                            <strong>{t('header.systemRole')}</strong> {t('header.systemUpdated')} "{t('header.newVersionReleased')}"
                          </p>
                          <span className="notification-time">1 {t('header.daysAgo')}</span>
                        </div>
                      </div>
                      
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-text">
                            <strong>{t('header.supportRole')}</strong> {t('header.supportReplied')} "{t('header.issueResolved')}"
                          </p>
                          <span className="notification-time">2 {t('header.daysAgo')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* User Role Display */}
              <li className="themed-nav-item">
                <span className={`user-role ${theme}-user-role`}>
                  {user?.role === 'ADMIN' ? 'Admin' : 
                   user?.role === 'MANAGER' ? 'Manager' : 
                   user?.role === 'TEACHER' ? 'Teacher' :
                   user?.role === 'TEACHER_ASSITANTS' ? 'Teacher' :  
                   'User'}
                </span>
              </li>

            

              {/* User Avatar with Dropdown */}
              <li className="themed-nav-item dropdown">
                <button
                  className="themed-nav-link btn btn-link"
                  id="profileDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ padding: 0, border: 'none', background: 'none', boxShadow: 'none' }}
                  type="button"
                >
                  <div className={`user-avatar ${theme}-user-avatar`}>
                    <img 
                      src="/img/avatar_1.png" 
                      alt="Profile" 
                      className="avatar-image"
                    />
                  </div>
                </button>
                <ul className={`dropdown-menu dropdown-menu-end ${theme}-profile-dropdown-menu`} aria-labelledby="profileDropdown"                   style={{ 
                    minWidth: 224, 
                    padding: 0, 
                    background: theme === 'sun' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 26, 46, 0.98)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '12px',
                    boxShadow: theme === 'sun' ? '0 12px 40px rgba(30, 64, 175, 0.15)' : '0 12px 40px rgba(0, 0, 0, 0.3)',
                    border: theme === 'sun' ? '1px solid rgba(30, 64, 175, 0.2)' : '1px solid rgba(77, 208, 255, 0.3)',
                    overflow: 'hidden',
                    zIndex: 10001,
                    position: 'absolute'
                  }}>
                  {/* Profile Header */}
                  <li style={{ padding: '16px', borderBottom: theme === 'sun' ? '1px solid rgba(30, 64, 175, 0.1)' : '1px solid rgba(77, 208, 255, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src="/img/avatar_1.png" 
                        alt="Profile" 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }} 
                      />
                      <div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px', 
                          color: theme === 'sun' ? '#1e40af' : '#fff',
                          marginBottom: '2px'
                        }}>
                          {profileData ? `${profileData.lastName} ${profileData.firstName}` : (user?.fullName || user?.name || 'User')}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: theme === 'sun' ? '#64748b' : 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {profileData?.email || user?.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                  </li>

                  {/* Menu Items */}
                  <li style={{ padding: '6px 0' }}>
                    {/* View Profile */}
                    <button 
                      onClick={() => navigate('/profile')}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: theme === 'sun' ? '#1e40af' : '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      {t('header.viewProfile')}
                    </button>

                  

                    {/* Logout */}
                    <button 
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        background: theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#ff4757',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#ffeeee')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)')}
                    >
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16,17 21,12 16,7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                      </div>
                     {t('header.logOut')}
                    </button>
                  </li>
                </ul>
              </li>

           
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
