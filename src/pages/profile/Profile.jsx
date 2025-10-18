import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Typography } from 'antd';
import usePageTitle from '../../hooks/usePageTitle';
import './Profile.css';
import ThemedLayout from '../../component/ThemedLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile } from '../../redux/auth';
import TableSpinner from '../../component/spinner/TableSpinner';
import EditEmailModal from './EditEmailModal';
import EditPersonalInfoModal from './EditPersonalInfoModal';

export default function Profile() {
  const { t } = useTranslation();
  const { user, profileData, profileLoading, profileError } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  
  // Set page title
  usePageTitle('Profile');
  const dispatch = useDispatch();
  
  // Modal state
  const [isEditEmailModalVisible, setIsEditEmailModalVisible] = useState(false);
  const [isEditPersonalInfoModalVisible, setIsEditPersonalInfoModalVisible] = useState(false);
  
  // Spinner state
  const [showSpinner, setShowSpinner] = useState(true);
  const [spinnerCompleted, setSpinnerCompleted] = useState(false);

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

  // Handle spinner completion when profile data is loaded
  useEffect(() => {
    if (!profileLoading && profileData) {
      // Add 100 second delay before starting fade out animation
      setTimeout(() => {
        setSpinnerCompleted(true);
      }, 1000);
    }
  }, [profileLoading, profileData]);

  // Handle spinner animation end
  const handleSpinnerAnimationEnd = () => {
    setShowSpinner(false);
  };


  const handleEditEmail = () => {
    setIsEditEmailModalVisible(true);
  };

  const handleEditPersonalInfo = () => {
    setIsEditPersonalInfoModalVisible(true);
  };

  const handleEmailUpdateSuccess = (newEmail) => {
    // Handle email update success
    console.log('Email updated to:', newEmail);
    // You can dispatch an action to update the profile data here
  };

  const handlePersonalInfoUpdateSuccess = (updatedData) => {
    // Handle personal info update success
    console.log('Personal info updated:', updatedData);
    // You can dispatch an action to update the profile data here
  };

  

  // Show TableSpinner while fetching profile data or during fade animation
  if (showSpinner) {
    return (
      <ThemedLayout>
        <div className={`profile-container profile-page ${theme}-profile-container`} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TableSpinner 
            message={t('common.loading') || "Đang tải..."}
            isCompleted={spinnerCompleted}
            onAnimationEnd={handleSpinnerAnimationEnd}
          />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      {/* Main Content Panel */}
      <div className={`profile-page main-content-panel ${theme}-main-panel`}>
        {/* Page Title */}
        <div className="page-title-container">
          <Typography.Title 
            level={1} 
            className="page-title"
          >
            {t('profile.title')}
          </Typography.Title>
        </div>
        {/* Header Section */}
        <div className={`panel-header ${theme}-panel-header`}>
          <div className='search-section'>
            <div style={{width: 500}}></div>
          </div>
          <div className='action-buttons'>
            <button className={`btn btn-secondary ${theme}-btn-secondary`} onClick={handleEditEmail}>
              {t('common.editEmail')}
            </button>
            <button className={`btn btn-primary ${theme}-btn-primary`} onClick={handleEditPersonalInfo}>
              {t('common.editPersonalInfo')}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className={`content-section ${theme}-content-section`}>
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
                        {profileData ? 
                          `${profileData.lastName || ''} ${profileData.firstName || ''}`.trim() || 
                          (user?.fullName || '') 
                          : (user?.fullName || '')}
                      </h4>
                      <p className="profile-role">{profileData?.roleName || user?.role || 'Admin'}</p>
                    </div>
                  </div>
                  
                  {/* Right side - Personal Info Display */}
                  <div className="profile-right">
                    {/* Username Field */}
                    <div className="form-group">
                      <label className={`form-label ${theme}-form-label`}>{t('common.username')}</label>
                      <div className={`form-display ${theme}-form-display`}>
                        {profileData?.userName || "test1"}
                      </div>
                    </div>

                    {/* Name Fields Row */}
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.lastName')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.lastName || "Nguyen Duc"}
                        </div>
                      </div>
                      <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.firstName')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.firstName || "Anh"}
                        </div>
                      </div>
                    </div>

                    {/* Gender and Date of Birth Row */}
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.gender')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.gender || "Male"}
                        </div>
                      </div>
                      <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.dateOfBirth')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.dateOfBirth 
                            ? new Date(profileData.dateOfBirth).toLocaleDateString()
                            : "16/05/2003"
                          }
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
                    <label className={`form-label ${theme}-form-label`}>{t('common.email')}</label>
                    <div className={`form-display ${theme}-form-display`}>
                      {profileData?.email || "anhtony2003@gmail.com"}
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div className="form-group">
                    <label className={`form-label ${theme}-form-label`}>{t('common.phoneNumber')}</label>
                    <div className={`form-display ${theme}-form-display`}>
                      {profileData?.phoneNumber || "0987654321"}
                    </div>
                  </div>

                  {/* Address Field */}
                  <div className="form-group">
                    <label className={`form-label ${theme}-form-label`}>{t('common.address')}</label>
                    <div className={`form-display ${theme}-form-display`}>
                      {profileData?.address || "fsd"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Email Modal */}
      <EditEmailModal
        isVisible={isEditEmailModalVisible}
        onCancel={() => setIsEditEmailModalVisible(false)}
        onSuccess={handleEmailUpdateSuccess}
        currentEmail={profileData?.email || "anhtony2003@gmail.com"}
      />

      {/* Edit Personal Info Modal */}
      <EditPersonalInfoModal
        isVisible={isEditPersonalInfoModalVisible}
        onCancel={() => setIsEditPersonalInfoModalVisible(false)}
        onSuccess={handlePersonalInfoUpdateSuccess}
        profileData={profileData}
      />
    </ThemedLayout>
  );
    }
