import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Switch, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';
import { logout } from '../redux/auth';
import { useTheme } from '../contexts/ThemeContext';
import LanguageToggle from './LanguageToggle';
import './ThemedHeader.css';

export default function ThemedHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme, isSunTheme } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/choose-login');
  };

  return (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content">
          <div className="themed-navbar-brand">
            <div className="brand-logo">
              <div className="rocket-icon">🚀</div>
              <span className="brand-text">CAMKEY</span>
            </div>
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
                  {user?.role === 'ADMIN' ? 'Admin' : 
                   user?.role === 'MANAGER' ? 'Manager' : 
                   user?.role === 'TEACHER' ? 'Teacher' : 'User'}
                </span>
              </li>

              {/* User Name */}
              <li className="themed-nav-item">
                <span className={`user-name ${theme}-user-name`}>
                  {user?.name || 'Minh Thu'}
                </span>
              </li>

              {/* User Avatar */}
              <li className="themed-nav-item">
                <div className={`user-avatar ${theme}-user-avatar`}>
                  <img 
                    src="/img/avatar_1.png" 
                    alt="Profile" 
                    className="avatar-image"
                  />
                </div>
              </li>

              {/* Settings Icon */}
              <li className="themed-nav-item">
                <button
                  className="themed-nav-link settings-button"
                  onClick={() => navigate('/settings')}
                >
                  <SettingOutlined className={`settings-icon ${theme}-settings-icon`} />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
