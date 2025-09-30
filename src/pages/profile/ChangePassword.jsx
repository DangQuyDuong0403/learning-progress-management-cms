import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Input } from 'antd';
import './Profile.css';
import Layout from '../../component/Layout';

export default function ChangePassword() {
  const { t } = useTranslation();
  
  const newPasswordRef = useRef();
  const confirmPasswordRef = useRef();


  // Password change handler
  const handleChangePassword = (e) => {
    e.preventDefault();
    const newPassword = newPasswordRef.current.input.value;
    const confirmPassword = confirmPasswordRef.current.input.value;
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
                          <Input.Password
                            id="currentPassword"
                            placeholder="Enter current password"
                            size="large"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="newPassword">{t('profile.newPassword')}</label>
                          <Input.Password
                            id="newPassword"
                            placeholder="Enter new password"
                            ref={newPasswordRef}
                            size="large"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="confirmPassword">{t('profile.confirmPassword')}</label>
                          <Input.Password
                            id="confirmPassword"
                            placeholder="Re-enter new password"
                            ref={confirmPasswordRef}
                            size="large"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
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
