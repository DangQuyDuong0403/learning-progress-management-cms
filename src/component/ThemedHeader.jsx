import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Switch, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';
import { logout, loginSuccess } from '../redux/auth';
import { useTheme } from '../contexts/ThemeContext';
import LanguageToggle from './LanguageToggle';
import './ThemedHeader.css';

export default function ThemedHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authState = useSelector((state) => state.auth);
  const { user, token, isAuthenticated } = authState;
  const dispatch = useDispatch();
  const { theme, toggleTheme, isSunTheme } = useTheme();

  console.log("=== THEMED HEADER REDUX DEBUG ===");
  console.log("Full auth state:", authState);
  console.log("user:", user);
  console.log("user role:", user?.role);
  console.log("token:", token);
  console.log("isAuthenticated:", isAuthenticated);
  

  const handleLogout = () => {
    dispatch(logout());
    navigate('/choose-login');
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
                        <div className="notification-avatar">
                          <img src="/img/logo.png" alt="System" />
                          <div className="notification-icon event">
                            <i className="ti ti-calendar"></i>
                          </div>
                        </div>
                        <div className="notification-content">
                          <p className="notification-text">
                            <strong>{t('header.systemRole')}</strong> {t('header.systemPostedEvent')} "{t('header.systemMaintenanceEvent')}"
                          </p>
                          <span className="notification-time">2 {t('header.hoursAgo')}</span>
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
                        <div className="notification-avatar">
                          <img src="/img/logo.png" alt="System" />
                          <div className="notification-icon update">
                            <i className="ti ti-refresh"></i>
                          </div>
                        </div>
                        <div className="notification-content">
                          <p className="notification-text">
                            <strong>{t('header.systemRole')}</strong> {t('header.systemUpdated')} "{t('header.newVersionReleased')}"
                          </p>
                          <span className="notification-time">1 {t('header.daysAgo')}</span>
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
                  {user?.role === 'Admin' ? 'Admin' : 
                   user?.role === 'Manager' ? 'Manager' : 
                   user?.role === 'Teacher' ? 'Teacher' : 'User'}
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
                <ul className={`dropdown-menu dropdown-menu-end ${theme}-profile-dropdown-menu`} aria-labelledby="profileDropdown" style={{ 
                    minWidth: 280, 
                    padding: 0, 
                    background: theme === 'sun' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 26, 46, 0.98)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    boxShadow: theme === 'sun' ? '0 12px 40px rgba(30, 64, 175, 0.15)' : '0 12px 40px rgba(0, 0, 0, 0.3)',
                    border: theme === 'sun' ? '1px solid rgba(30, 64, 175, 0.2)' : '1px solid rgba(77, 208, 255, 0.3)',
                    overflow: 'hidden',
                    zIndex: 10001,
                    position: 'absolute'
                  }}>
                  {/* Profile Header */}
                  <li style={{ padding: '20px', borderBottom: theme === 'sun' ? '1px solid rgba(30, 64, 175, 0.1)' : '1px solid rgba(77, 208, 255, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src="/img/avatar_1.png" 
                        alt="Profile" 
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }} 
                      />
                      <div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '16px', 
                          color: theme === 'sun' ? '#1e40af' : '#fff',
                          marginBottom: '2px'
                        }}>
                          {user?.name || 'User'}
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: theme === 'sun' ? '#64748b' : 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {user?.email || user?.name || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                  </li>

                  {/* Menu Items */}
                  <li style={{ padding: '8px 0' }}>
                    {/* View Profile */}
                    <button 
                      onClick={() => navigate('/profile')}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: theme === 'sun' ? '#1e40af' : '#fff',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      {t('header.viewProfile')}
                    </button>

                    {/* Change Password */}
                    <button 
                      onClick={() => navigate('/change-password')}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: theme === 'sun' ? '#1e40af' : '#fff',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <circle cx="12" cy="16" r="1"></circle>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      {t('header.changePassword')}
                    </button>

                    {/* Settings */}
                    <button 
                      onClick={() => navigate('/settings')}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: theme === 'sun' ? '#1e40af' : '#fff',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                      </div>
                      {t('header.settings')}
                    </button>

                    {/* Logout */}
                    <button 
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        border: 'none',
                        background: theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#ff4757',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#ffeeee'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = theme === 'sun' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(77, 208, 255, 0.1)'}
                    >
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
