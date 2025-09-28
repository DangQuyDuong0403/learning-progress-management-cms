import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { t } = useTranslation();

 

  return (
    <header className="app-header">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="navbar-brand">
         
        </div>
        <div className="navbar-collapse justify-content-end px-0" id="navbarNav">
          <ul className="navbar-nav flex-row ms-auto align-items-center justify-content-end" style={{ gap: '1.5rem' }}>
            {/* Language Toggle */}
            <li className="nav-item">
              <LanguageToggle />
            </li>
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
               <ul className="dropdown-menu dropdown-menu-end profile-dropdown-menu" aria-labelledby="profileDropdown" style={{ 
                   minWidth: 280, 
                   padding: 0, 
                   background: '#fff',
                   borderRadius: '12px',
                   boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                   border: 'none',
                   overflow: 'hidden'
                 }}>
                 {/* Profile Header */}
                 <li style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
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
                         color: '#000',
                         marginBottom: '2px'
                       }}>
                         Nguyen Duc Anh
                       </div>
                       <div style={{ 
                         fontSize: '14px', 
                         color: '#666'
                       }}>
                         anhndhe171462@fpt.edu.vn
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
                       color: '#000',
                       fontSize: '14px',
                       cursor: 'pointer',
                       transition: 'background-color 0.2s'
                     }}
                     onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
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
                       color: '#000',
                       fontSize: '14px',
                       cursor: 'pointer',
                       transition: 'background-color 0.2s'
                     }}
                     onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
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
                       color: '#000',
                       fontSize: '14px',
                       cursor: 'pointer',
                       transition: 'background-color 0.2s'
                     }}
                     onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
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
                     onClick={() => navigate('/login-teacher')}
                     style={{
                       width: '100%',
                       padding: '12px 20px',
                       border: 'none',
                       background: '#f5f5f5',
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
                     onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f5'}
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
      </nav>
    </header>
  );
}
