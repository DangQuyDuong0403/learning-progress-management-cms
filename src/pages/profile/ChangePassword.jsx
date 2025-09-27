import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Header from '../../component/Header';
import Sidebar from '../../component/Sidebar';
import './Profile.css';
import Layout from '../../component/Layout';

export default function ChangePassword() {
  const { t } = useTranslation();
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPasswordRef = useRef();
  const confirmPasswordRef = useRef();


  // Password change handler
  const handleChangePassword = (e) => {
    e.preventDefault();
    const newPassword = newPasswordRef.current.value;
    const confirmPassword = confirmPasswordRef.current.value;
    if (!newPassword || !confirmPassword) {
      toast.error(t('messages.required'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('messages.passwordMismatch'));
      return;
    }
    toast.success(t('messages.updateSuccess'));
    // ...submit logic here
  };

  return (
    <Layout>
    <div className="profile-container">
      {/* Floating Planets */}
      <img src="/img/planet-1.png" alt="Planet" className="planet-1" />
      <img src="/img/planet-2.png" alt="Planet" className="planet-2" />
      <img src="/img/planet-3.png" alt="Planet" className="planet-3" />
      <img src="/img/planet-4.png" alt="Planet" className="planet-4" />
      <img src="/img/planet-5.png" alt="Planet" className="planet-5" />
      <img src="/img/planet-6.png" alt="Planet" className="planet-6" />
  
    
      <div className="main-layout">
      
        <div className="content-area">
          <div className="profile-content">
            <div className="profile-cards">
                 
                  {/* Change Password Card */}
                  <div className="profile-card password-card">
                    <div className="card-header">
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '1.5rem',
                          letterSpacing: '0.5px',
                          margin: 0,
                          color: '#fff'
                        }}
                      >
                        {t('profile.changePassword')}
                      </h3>
                      <i className="ti ti-lock"></i>
                    </div>
                    <div className="card-content">
                      <div className="password-form">
                        <div className="form-group">
                          <label htmlFor="currentPassword">{t('profile.currentPassword')}</label>
                          <div className="password-input-container">
                            <input 
                              type={showCurrentPassword ? "text" : "password"}
                              id="currentPassword" 
                              className="form-input" 
                              placeholder="Enter current password"
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => setShowCurrentPassword(v => !v)}
                              style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                            >
                              {showCurrentPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="newPassword">{t('profile.newPassword')}</label>
                          <div className="password-input-container">
                            <input 
                              type={showNewPassword ? "text" : "password"}
                              id="newPassword" 
                              className="form-input" 
                              placeholder="Enter new password"
                              ref={newPasswordRef}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => setShowNewPassword(v => !v)}
                              style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                              {showNewPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </span>
                          </div>
                          {/* <div className="password-strength">
                            <div className="password-strength-bar"></div>
                          </div> */}
                        </div>
                        <div className="form-group">
                          <label htmlFor="confirmPassword">{t('profile.confirmPassword')}</label>
                          <div className="password-input-container">
                            <input 
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword" 
                              className="form-input" 
                              placeholder="Re-enter new password"
                              ref={confirmPasswordRef}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => setShowConfirmPassword(v => !v)}
                              style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className="btn btn-secondary">{t('common.cancel')}</button>
                        <button className="btn btn-primary" onClick={handleChangePassword}>{t('profile.changePassword')}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Layout>
      );
    }
                        <div className="password-strength-bar"></div>
