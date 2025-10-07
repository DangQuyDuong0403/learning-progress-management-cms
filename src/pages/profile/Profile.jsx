import React, { useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import './Profile.css';
import ThemedLayout from '../../component/ThemedLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile } from '../../redux/auth';

export default function Profile() {
  const { t } = useTranslation();
  const { user, profileData, profileLoading, profileError } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  
  const usernameRef = useRef();
  const lastNameRef = useRef();
  const firstNameRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const addressRef = useRef();
  const birthDateRef = useRef();

  // Fetch user profile data on component mount
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  // Handle profile error
  useEffect(() => {
    if (profileError) {
      toast.error('Failed to load profile data');
    }
  }, [profileError]);


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
    const username = usernameRef.current.value.trim();
    const lastName = lastNameRef.current.value.trim();
    const firstName = firstNameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const phone = phoneRef.current.value.trim();
    const address = addressRef.current.value.trim();
    const birthDate = birthDateRef.current.value;

    if (!username || !lastName || !firstName || !email || !phone || !address || !birthDate) {
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

  

  // Show loading spinner while fetching profile data
  if (profileLoading) {
    return (
      <ThemedLayout>
        <div className={`profile-container profile-page ${theme}-profile-container`}>
          <div className="loading-container" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh' 
          }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </ThemedLayout>
    );
  }

  return (
     <ThemedLayout>
    <div className={`profile-container profile-page ${theme}-profile-container`}>

     
     
      <div className="main-layout">
       
        <div className="content-area">
          <div className="profile-content">
            <div className="profile-cards">
              {/* Update Button */}
              <div className="form-actions-container">
                <button className={`btn btn-primary ${theme}-btn-primary`} onClick={handleUpdate}>
                  {t('common.update')}
                </button>
              </div>

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
                    {t('common.personalInformation')}
                  </h3>
                  <i className="ti ti-user"></i>
                </div>
                <div className="card-content">
                  <div className="profile-info-layout">
                    {/* Left side - Profile Picture and Name */}
                    <div className="profile-left">
                      <div className="profile-picture-container">
                        <div className="profile-picture-placeholder">
                          <img 
                            src={profileData?.avatarUrl || "/img/avatar_1.png"} 
                            alt="Profile" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                          />
                        </div>
                      </div>
                      <div className="profile-name-section">
                        <h4 className="profile-full-name">
                          {profileData ? `${profileData.lastName} ${profileData.firstName}` : (user?.fullName || 'Nguyen Duc Anh')}
                        </h4>
                        <p className="profile-role">{profileData?.role || user?.role || 'Admin'}</p>
                      </div>
                    </div>
                    
                    {/* Right side - Personal Info Form Fields */}
                    <div className="profile-right">
                      {/* Username Field */}
                      <div className="form-group">
                        <label htmlFor="username" className={`form-label ${theme}-form-label`}>{t('common.username')}</label>
                        <input 
                          type="text" 
                          id="username" 
                          className={`form-input ${theme}-form-input`} 
                          defaultValue={profileData?.username || "test1"}
                          ref={usernameRef}
                        />
                      </div>

                      {/* Name Fields Row */}
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label htmlFor="lastName" className={`form-label ${theme}-form-label`}>{t('common.lastName')}</label>
                          <input 
                            type="text" 
                            id="lastName" 
                            className={`form-input ${theme}-form-input`} 
                            defaultValue={profileData?.lastName || "Nguyen Duc"}
                            ref={lastNameRef}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                          <label htmlFor="firstName" className={`form-label ${theme}-form-label`}>{t('common.firstName')}</label>
                          <input 
                            type="text" 
                            id="firstName" 
                            className={`form-input ${theme}-form-input`} 
                            defaultValue={profileData?.firstName || "Anh"}
                            ref={firstNameRef}
                          />
                        </div>
                      </div>

                      {/* Gender and Date of Birth Row */}
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className={`form-label ${theme}-form-label`}>{t('common.gender')}</label>
                          <div className="radio-group">
                            <label className={`radio-label ${theme}-radio-label`}>
                              <input 
                                type="radio" 
                                name="gender" 
                                value="Male" 
                                defaultChecked={profileData?.gender === "Male"} 
                              />
                              <span className={`radio-custom ${theme}-radio-custom`}></span>
                              {t('common.male')}
                            </label>
                            <label className={`radio-label ${theme}-radio-label`}>
                              <input 
                                type="radio" 
                                name="gender" 
                                value="Female" 
                                defaultChecked={profileData?.gender === "Female"} 
                              />
                              <span className={`radio-custom ${theme}-radio-custom`}></span>
                              {t('common.female')}
                            </label>
                          </div>
                        </div>
                        <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                          <label htmlFor="birthDate" className={`form-label ${theme}-form-label`}>{t('common.dateOfBirth')}</label>
                          <div className="date-input-container">
                            <input 
                              type="date" 
                              id="birthDate" 
                              className={`form-input ${theme}-form-input`} 
                              defaultValue={
                                profileData?.dateOfBirth 
                                  ? new Date(profileData.dateOfBirth).toISOString().split('T')[0]
                                  : "2003-05-16"
                              }
                              ref={birthDateRef}
                            />
                            <i className="ti ti-calendar date-icon"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className={`profile-card contact-info-card ${theme}-profile-card`}>
                <div className={`card-header ${theme}-card-header`}>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      letterSpacing: '0.5px',
                      margin: 0,
                    }}
                  >
                    {t('common.contactInformation')}
                  </h3>
                  <i className="ti ti-mail"></i>
                </div>
                <div className="card-content">
                  <div className="contact-info-layout">
                    {/* Email Field */}
                    <div className="form-group">
                      <label htmlFor="email" className={`form-label ${theme}-form-label`}>{t('common.email')}</label>
                      <input 
                        type="email" 
                        id="email" 
                        className={`form-input ${theme}-form-input`} 
                        defaultValue={profileData?.email || "anhtony2003@gmail.com"}
                        ref={emailRef}
                      />
                    </div>

                    {/* Phone Number Field */}
                    <div className="form-group">
                      <label htmlFor="phone" className={`form-label ${theme}-form-label`}>{t('common.phoneNumber')}</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        className={`form-input ${theme}-form-input`} 
                        defaultValue={profileData?.phoneNumber || "0987654321"}
                        ref={phoneRef}
                      />
                    </div>

                    {/* Address Field */}
                    <div className="form-group">
                      <label htmlFor="address" className={`form-label ${theme}-form-label`}>{t('common.address')}</label>
                      <input 
                        type="text" 
                        id="address" 
                        className={`form-input ${theme}-form-input`} 
                        defaultValue={profileData?.address || "fsd"}
                        ref={addressRef}
                      />
                    </div>
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
