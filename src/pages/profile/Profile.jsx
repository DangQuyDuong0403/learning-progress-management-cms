import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import './Profile.css';
import ThemedLayout from '../../component/ThemedLayout';
import { useTheme } from '../../contexts/ThemeContext';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  
  const lastNameRef = useRef();
  const firstNameRef = useRef();
  const emailRef = useRef();
  const birthDateRef = useRef();


  function validateName(name) {
    // Only letters (including Vietnamese), spaces, at least 2 chars
    return /^[A-Za-zÀ-ỹà-ỹ\s]{2,}$/u.test(name);
  }

  function validateEmail(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const inputDate = new Date(dateStr);
    return inputDate > today;
  }

  const handleUpdate = (e) => {
    e.preventDefault();
    const lastName = lastNameRef.current.value.trim();
    const firstName = firstNameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const birthDate = birthDateRef.current.value;

    if (!lastName || !firstName || !email || !birthDate) {
      toast.error(t('messages.required'));
      return;
    }
    if (!validateName(lastName)) {
      toast.error('Last name must be at least 2 letters, no numbers or special characters!');
      return;
    }
    if (!validateName(firstName)) {
      toast.error('First name must be at least 2 letters, no numbers or special characters!');
      return;
    }
    if (!validateEmail(email)) {
      toast.error(t('messages.invalidEmail'));
      return;
    }
    if (isFutureDate(birthDate)) {
      toast.error('Date of birth cannot be in the future!');
      return;
    }
    toast.success(t('messages.updateSuccess'));
    // ...submit logic here
  };

  

  return (
     <ThemedLayout>
    <div className={`profile-container ${theme}-profile-container`}>

     
     
      <div className="main-layout">
       
        <div className="content-area">
          <div className="profile-content">
            <div className="profile-cards">
                  {/* Personal Information Card */}
                  <div className={`profile-card personal-info-card ${theme}-profile-card`}>
                    <div className={`card-header ${theme}-card-header`}>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '1.5rem',
                          letterSpacing: '0.5px',
                          margin: 0,
                         
                        }}
                      >
                        {t('profile.personalInfo')}
                      </h3>
                      <i className="ti ti-user"></i>
                    </div>
                    <div className="card-content">
                      <div className="profile-info-layout">
                        {/* Left side - Profile Picture and Name */}
                        <div className="profile-left">
                          <div className="profile-picture-container">
                            <div className="profile-picture-placeholder">
                              <img src="/img/avatar_1.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            </div>
                          </div>
                          <div className="profile-name-section">
                            <h4 className="profile-full-name">{user?.fullName || 'Nguyen Duc Anh'}</h4>
                            <p className="profile-role">{user?.role || 'Admin'}</p>
                          
                          </div>
                        </div>
                        {/* Right side - Form Fields */}
                        <div className="profile-right">
                          <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                              <label htmlFor="lastName" className={`form-label ${theme}-form-label`}>{t('common.lastName')}</label>
                              <input 
                                type="text" 
                                id="lastName" 
                                className={`form-input ${theme}-form-input`} 
                                defaultValue="Nguyen Duc"
                                ref={lastNameRef}
                              />
                            </div>
                            <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                              <label htmlFor="firstName" className={`form-label ${theme}-form-label`}>{t('common.firstName')}</label>
                              <input 
                                type="text" 
                                id="firstName" 
                                className={`form-input ${theme}-form-input`} 
                                defaultValue="Anh"
                                ref={firstNameRef}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="email" className={`form-label ${theme}-form-label`}>{t('common.email')}</label>
                            <input 
                              type="email" 
                              id="email" 
                              className={`form-input ${theme}-form-input`} 
                              defaultValue="anhtony2003@gmail.com"
                              ref={emailRef}
                            />
                          </div>
                          <div className="form-group">
                            <label className={`form-label ${theme}-form-label`}>{t('common.gender')}</label>
                            <div className="radio-group">
                              <label className={`radio-label ${theme}-radio-label`}>
                                <input type="radio" name="gender" value="male" defaultChecked />
                                <span className={`radio-custom ${theme}-radio-custom`}></span>
                                {t('common.male')}
                              </label>
                              <label className={`radio-label ${theme}-radio-label`}>
                                <input type="radio" name="gender" value="female" />
                                <span className={`radio-custom ${theme}-radio-custom`}></span>
                                {t('common.female')}
                              </label>
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="birthDate" className={`form-label ${theme}-form-label`}>{t('common.dateOfBirth')}</label>
                            <div className="date-input-container">
                              <input 
                                type="date" 
                                id="birthDate" 
                                className={`form-input ${theme}-form-input`} 
                                defaultValue="2003-05-16"
                                ref={birthDateRef}
                              />
                              <i className="ti ti-calendar date-icon"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className={`btn btn-primary ${theme}-btn-primary`} onClick={handleUpdate}>{t('common.update')}</button>
                      </div>
                    </div>
                  </div>
                
                </div>
              </div>
            </div>
          </div>
        </div>
        </ThemedLayout>
      );
    }
