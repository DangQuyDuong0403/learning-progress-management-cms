import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import usePageTitle from '../../hooks/usePageTitle';
import './Profile.css';
import ThemedLayoutWithSidebar from '../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../component/teacherlayout/ThemedLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile, uploadAvatar } from '../../redux/auth';
import TableSpinner from '../../component/spinner/TableSpinner';
import EditEmailModal from './EditEmailModal';
import EditPersonalInfoModal from './EditPersonalInfoModal';
import { spaceToast } from '../../component/SpaceToastify';
import CustomCursor from '../../component/cursor/CustomCursor';

export default function Profile() {
  const { t } = useTranslation();
  const { user, profileData, profileLoading, profileError, uploadAvatarLoading, uploadAvatarError, uploadAvatarSuccess, confirmEmailChangeSuccess } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  
  // Determine which layout to use based on user role
  // Role từ Redux được lưu là chữ hoa: TEACHER, TEACHING_ASSISTANT, STUDENT, TEST_TAKER
  const userRole = user?.role;
  const shouldUseTeacherLayout = ['TEACHER', 'TEACHING_ASSISTANT', 'STUDENT', 'TEST_TAKER'].includes(userRole);
  const ThemedLayout = shouldUseTeacherLayout ? ThemedLayoutNoSidebar : ThemedLayoutWithSidebar;
  
  // Check if should show custom cursor for STUDENT and TEST_TAKER roles
  const shouldShowCustomCursor = userRole === 'STUDENT' || userRole === 'TEST_TAKER';
  
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

  // Handle upload avatar success and error
  useEffect(() => {
    if (uploadAvatarSuccess) {
      spaceToast.success('Avatar updated successfully!');
      // Reload profile data to get updated avatar
      dispatch(getUserProfile());
    }
  }, [uploadAvatarSuccess, dispatch]);

  useEffect(() => {
    if (uploadAvatarError) {
      spaceToast.error('Failed to upload avatar');
    }
  }, [uploadAvatarError]);

  // Handle email confirmation success
  useEffect(() => {
    if (confirmEmailChangeSuccess) {
      spaceToast.success('Email updated successfully!');
      // Reload profile data to get updated email
      dispatch(getUserProfile());
    }
  }, [confirmEmailChangeSuccess, dispatch]);

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


  const handleEditPersonalInfo = () => {
    setIsEditPersonalInfoModalVisible(true);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      dispatch(uploadAvatar(file));
    }
  };

  const handleEmailUpdateSuccess = (newEmail) => {
    // Handle email update success - không cần làm gì vì email chưa confirm
    console.log('Email change request sent for:', newEmail);
    // Email sẽ được cập nhật khi confirm thành công
  };

  const handlePersonalInfoUpdateSuccess = (updatedData) => {
    // Handle personal info update success
    console.log('Personal info updated:', updatedData);
    // You can dispatch an action to update the profile data here
  };

  const handleEditEmail = () => {
    setIsEditEmailModalVisible(true);
  };

  // Helper function to get valid avatar URL
  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl === 'string' || avatarUrl.trim() === '') {
      return '/img/avatar_1.png';
    }
    // Check if it's a valid URL (starts with http://, https://, or /)
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('/')) {
      return avatarUrl;
    }
    return '/img/avatar_1.png';
  };

  // Helper function to safely display parent info values (handles null, undefined, and empty strings)
  const getParentInfoValue = (value) => {
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return '-';
    }
    return value;
  };

  

  // Show TableSpinner while fetching profile data or during fade animation
  if (showSpinner) {
    return (
      <ThemedLayout>
        {shouldShowCustomCursor && <CustomCursor />}
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
      {shouldShowCustomCursor && <CustomCursor />}
      <div className={`profile-container ${theme}-profile-container`}>
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
        <div className={`profile-header ${theme}-profile-header`} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className='action-buttons'>
            <button className={`btn btn-primary ${theme}-btn-primary`} onClick={handleEditPersonalInfo}>
              <i className="ti ti-edit"></i>
              {t('common.editProfile')}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className={`content-section ${theme}-content-section`}>
          {/* Profile Card */}
          <div className={`profile-container-new ${theme}-profile-container-new`}>
            {/* Profile Title */}
            <div className={`profile-title-new ${theme}-profile-title-new`}>
              {t('common.profile')}
            </div>
            
            <div className={`profile-content-new ${theme}-profile-content-new`}>
              {/* Left Section - Avatar */}
              <div className={`avatar-section-new ${theme}-avatar-section-new`}>
                <div 
                  className="profile-picture-new" 
                  onClick={() => document.getElementById('avatar-upload').click()}
                >
                  <img 
                    src={getAvatarUrl(profileData?.avatarUrl)} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                  />
                  {uploadAvatarLoading && (
                    <div className="avatar-loading-overlay">
                      Uploading...
                    </div>
                  )}
                </div>
                
                {/* Email */}
                <div className={`email-section-new ${theme}-email-section-new`}>
                  <span className={`email-text-new ${theme}-email-text-new`}>
                    {profileData?.email || '-'}
                  </span>
                  <button
                    type="button"
                    onClick={handleEditEmail}
                    className={`email-edit-icon ${theme}-email-edit-icon`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <EditOutlined />
                  </button>
                </div>
              </div>

              {/* Right Section - Profile Info */}
              <div className={`student-info-new ${theme}-student-info-new`}>
                {/* Name and Status Row */}
                <div className={`name-status-row-new ${theme}-name-status-row-new`}>
                  <h2 className={`student-name-new ${theme}-student-name-new`}>
                    {profileData?.fullName || user?.fullName || ''}
                  </h2>
                  <div className={`status-badges-new ${theme}-status-badges-new`}>
                    <span className={`role-badge-new ${theme}-role-badge-new`}>
                      {(() => {
                        const role = (profileData?.roleName || user?.role || 'ADMIN').toUpperCase();
                        const roleMap = {
                          'ADMIN': t('common.admin'),
                          'TEACHER': t('common.teacher'),
                          'TEACHING_ASSISTANT': t('common.teachingAssistant'),
                          'STUDENT': t('common.student'),
                          'TEST_TAKER': t('common.testTaker')
                        };
                        return roleMap[role] || role;
                      })()}
                    </span>
                    <span className={`status-badge-new ${theme}-status-badge-new active`}>
                      {(() => {
                        const status = (profileData?.status || 'ACTIVE').toUpperCase();
                        const statusMap = {
                          'ACTIVE': t('accountManagement.active'),
                          'INACTIVE': t('accountManagement.inactive'),
                          'PENDING': t('accountManagement.pending')
                        };
                        return statusMap[status] || status;
                      })()}
                    </span>
                  </div>
                </div>
                
                {/* User ID */}
                <div className={`student-id-new ${theme}-student-id-new`}>
                  {profileData?.userName || user?.userName || '-'}
                </div>

                {/* Personal Information Grid */}
                <div className={`personal-info-grid-new ${theme}-personal-info-grid-new`}>
                  <div className={`info-item-new ${theme}-info-item-new`}>
                    <span className={`info-label-new ${theme}-info-label-new`}>{t('common.phoneNumber')}</span>
                    <span className={`info-value-new ${theme}-info-value-new`}>{profileData?.phoneNumber || '-'}</span>
                  </div>
                  <div className={`info-item-new ${theme}-info-item-new`}>
                    <span className={`info-label-new ${theme}-info-label-new`}>{t('common.gender')}</span>
                    <span className={`info-value-new ${theme}-info-value-new`}>
                      {profileData?.gender === 'MALE' ? t('common.male') : 
                       profileData?.gender === 'FEMALE' ? t('common.female') : 
                       profileData?.gender === 'OTHER' ? t('common.other') : 
                       profileData?.gender || '-'}
                    </span>
                  </div>
                  <div className={`info-item-new ${theme}-info-item-new`}>
                    <span className={`info-label-new ${theme}-info-label-new`}>{t('common.dateOfBirth')}</span>
                    <span className={`info-value-new ${theme}-info-value-new`}>
                      {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </div>
                  <div className={`info-item-new ${theme}-info-item-new`}>
                    <span className={`info-label-new ${theme}-info-label-new`}>{t('common.address')}</span>
                    <span className={`info-value-new ${theme}-info-value-new`}>{profileData?.address || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hidden file input for avatar upload */}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Parent Information Card - Show for students */}
          {(profileData?.roleName === 'STUDENT' || user?.role === 'STUDENT') && (
            <div className={`parent-container-new ${theme}-parent-container-new`}>
              {/* Parent Title */}
              <div className={`parent-title-new ${theme}-parent-title-new`}>
                {t('common.parentInformation')}
              </div>
              
              {/* Parent Content */}
              <div className={`parent-content-new ${theme}-parent-content-new`}>
                {/* Left Section - Personal Info */}
                <div className={`parent-left-section-new ${theme}-parent-left-section-new`}>
                  {/* Family Icon */}
                  <div className={`family-icon-new ${theme}-family-icon-new`}>
                    <img 
                      src="/img/family-icon.png" 
                      alt="Family Icon" 
                      style={{ width: '60px', height: '60px' }}
                    />
                  </div>
                  
                  {/* Parent Name and Relationship */}
                  <div className={`parent-name-section-new ${theme}-parent-name-section-new`}>
                    <div className={`parent-name-new ${theme}-parent-name-new`}>
                      {getParentInfoValue(profileData?.parentInfo?.parentName)}
                    </div>
                    <div className={`parent-relationship-new ${theme}-parent-relationship-new`}>
                      {getParentInfoValue(profileData?.parentInfo?.relationship)}
                    </div>
                  </div>
                </div>

                {/* Right Section - Contact Info */}
                <div className={`parent-right-section-new ${theme}-parent-right-section-new`}>
                  {/* Phone */}
                  <div className={`parent-contact-item-new ${theme}-parent-contact-item-new`}>
                    <div className={`parent-contact-label-new ${theme}-parent-contact-label-new`}>
                      {t('common.parentPhone')}
                    </div>
                    <div className={`parent-contact-value-new ${theme}-parent-contact-value-new`}>
                      {getParentInfoValue(profileData?.parentInfo?.parentPhone)}
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className={`parent-contact-item-new ${theme}-parent-contact-item-new`}>
                    <div className={`parent-contact-label-new ${theme}-parent-contact-label-new`}>
                      {t('common.parentEmail')}
                    </div>
                    <div className={`parent-contact-value-new ${theme}-parent-contact-value-new`}>
                      {getParentInfoValue(profileData?.parentInfo?.parentEmail)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Email Modal */}
        <EditEmailModal
          isVisible={isEditEmailModalVisible}
          onCancel={() => setIsEditEmailModalVisible(false)}
          onSuccess={handleEmailUpdateSuccess}
          currentEmail={profileData?.email}
        />

        {/* Edit Personal Info Modal */}
        <EditPersonalInfoModal
          isVisible={isEditPersonalInfoModalVisible}
          onCancel={() => setIsEditPersonalInfoModalVisible(false)}
          onSuccess={handlePersonalInfoUpdateSuccess}
          profileData={profileData}
        />
      </div>
    </ThemedLayout>
  );
    }
