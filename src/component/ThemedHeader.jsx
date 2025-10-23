import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Switch, Tooltip, Button } from 'antd';
import { SunOutlined, MoonOutlined, ArrowLeftOutlined, SettingOutlined } from '@ant-design/icons';
import { logoutApi, logout, getUserProfile } from '../redux/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useClassMenu } from '../contexts/ClassMenuContext';
import { useSyllabusMenu } from '../contexts/SyllabusMenuContext';
import { useDailyChallengeMenu } from '../contexts/DailyChallengeMenuContext';
import LanguageToggle from './LanguageToggle';
import { spaceToast } from './SpaceToastify';
import './ThemedHeader.css';

export default function ThemedHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, refreshToken, profileData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme, isSunTheme } = useTheme();
  const { isInClassMenu, classData } = useClassMenu();
  const { isInSyllabusMenu, syllabusData } = useSyllabusMenu();
  const { isInDailyChallengeMenu, dailyChallengeData } = useDailyChallengeMenu();

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

  const handleBackToClassList = () => {
    // If custom back URL is provided, use it
    if (classData?.backUrl) {
      navigate(classData.backUrl);
      return;
    }

    // Go back to previous page
    navigate(-1);
  };

  const handleBackToDashboard = () => {
    // Navigate to appropriate dashboard based on user role
    const userRole = user?.role?.toLowerCase();
    
    switch (userRole) {
      case 'student':
        navigate('/student/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'teaching_assistant':
        navigate('/teaching-assistant/dashboard');
        break;
      case 'test_taker':
        navigate('/test-taker/dashboard');
        break;
      case 'manager':
        navigate('/manager/dashboard');
        break;
      default:
        // Fallback to going back if role is not recognized
        navigate(-1);
        break;
    }
  };

  const handleBackToSyllabusList = () => {
    // If custom back URL is provided, use it
    if (syllabusData?.backUrl) {
      navigate(syllabusData.backUrl);
      return;
    }
    
    // Go back to previous page
    navigate(-1);
  };

  const handleBackToDailyChallengeList = () => {
    // If custom backPath is provided in context, use it
    if (dailyChallengeData?.backPath) {
      navigate(dailyChallengeData.backPath);
      return;
    }

    // Go back to previous page
    navigate(-1);
  };

  // Handle back button click - go to dashboard
  const handleBackButtonClick = () => {
    handleBackToDashboard();
  };

  // Check if on teacher/teaching_assistant/student classes list page
  const isOnClassesListPage = () => {
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'teacher') {
      return location.pathname === '/teacher/classes';
    }
    if (userRole === 'teaching_assistant') {
      return location.pathname === '/teaching-assistant/classes';
    }
    if (userRole === 'student') {
      return location.pathname === '/student/classes';
    }
    if (userRole === 'manager') {
      return location.pathname === '/manager/classes';
    }
    return false;
  };

  // Check if on Settings or Profile page for specific roles that need back button
  const isOnSettingsOrProfilePageWithBackButton = () => {
    // Role từ Redux được lưu là chữ hoa: TEACHER, TEACHING_ASSISTANT, STUDENT, TEST_TAKER
    const userRole = user?.role;
    const shouldShowBack = ['TEACHER', 'TEACHING_ASSISTANT', 'STUDENT', 'TEST_TAKER'].includes(userRole);
    const isOnTargetPage = location.pathname === '/settings' || location.pathname === '/profile';
    return isOnTargetPage && shouldShowBack;
  };

  // Handle back button for Settings/Profile page
  const handleBackFromSettingsOrProfile = () => {
    // Go back to previous page
    navigate(-1);
  };

  // Check if current user has no sidebar (teacher, student, teaching_assistant, test_taker)
  const hasNoSidebar = () => {
    const userRole = user?.role;
    return ['TEACHER', 'TEACHING_ASSISTANT', 'STUDENT', 'TEST_TAKER'].includes(userRole);
  };

  // Check if should show logo - always show for users without sidebar
  const shouldShowLogo = () => {
    return hasNoSidebar();
  };

  return (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content">
          <div className="themed-navbar-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Logo and CAMKEY Text - Show for users without sidebar when not in special menus */}
            {shouldShowLogo() && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0 20px'
              }}>
                {theme === 'space' ? (
                  <img 
                    src="/img/logo-dark.png"
                    alt="CAMKEY Logo"
                    style={{
                      width: '40px',
                      height: '40px',
                      filter: 'drop-shadow(0 0 15px rgba(125, 211, 252, 0.8))'
                    }}
                  />
                ) : (
                  <img 
                    src="/img/logo-blue.png"
                    alt="CAMKEY Logo"
                    style={{
                      width: '40px',
                      height: '40px'
                    }}
                  />
                )}
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
                }}>
                  CAMKEY
                </span>
              </div>
            )}

            {/* Back to Dashboard Button - Show when on Settings or Profile page for specific roles */}
            {isOnSettingsOrProfilePageWithBackButton() && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBackFromSettingsOrProfile}
                className={`settings-profile-back-button ${theme}-settings-profile-back-button`}
                style={{
                  height: '32px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#ffffff',
                  color: '#000000',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.target.style.filter = 'brightness(0.95)';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.filter = 'none';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }}
              >
                {t('common.back')}
              </Button>
            )}

            {/* Back to Dashboard Button - Show when on teacher/teaching_assistant classes list page or daily challenges page */}
            {isOnClassesListPage() && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBackButtonClick}
                className={`class-menu-back-button ${theme}-class-menu-back-button`}
                style={{
                  height: '32px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#ffffff',
                  color: '#000000',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.target.style.filter = 'brightness(0.95)';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.filter = 'none';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }}
              >
                {t('common.back')}
              </Button>
            )}

            {/* Class Menu Header - Show when in class menu */}
            {isInClassMenu && classData && (
              <div className="class-menu-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 20px'
              }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToClassList}
                  className={`class-menu-back-button ${theme}-class-menu-back-button`}
                  style={{
                    height: '32px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    background: '#ffffff',
                    color: '#000000',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    e.target.style.filter = 'brightness(0.95)';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.filter = 'none';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {t('common.back')}
                </Button>
                <div style={{
                  height: '24px',
                  width: '1px',
                  backgroundColor: theme === 'sun' ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255, 255, 255, 0.3)'
                }} />
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1e40af' : '#fff',
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
                }}>
                  {classData.description || classData.name}
                </h2>
              </div>
            )}

            {/* Syllabus Menu Header - Show when in syllabus menu */}
            {isInSyllabusMenu && syllabusData && (
              <div className="syllabus-menu-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 20px'
              }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToSyllabusList}
                  className={`syllabus-menu-back-button ${theme}-syllabus-menu-back-button`}
                  style={{
                    height: '32px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    background: '#ffffff',
                    color: '#000000',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    e.target.style.filter = 'brightness(0.95)';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.filter = 'none';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {t('common.back')}
                </Button>
                <div style={{
                  height: '24px',
                  width: '1px',
                  backgroundColor: theme === 'sun' ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255, 255, 255, 0.3)'
                }} />
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1e40af' : '#fff',
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
                }}>
                  {syllabusData.chapterName ? `${syllabusData.name} / ${syllabusData.chapterName}` : syllabusData.name}
                </h2>
              </div>
            )}

            {/* Daily Challenge Menu Header - Show when in daily challenge menu */}
            {isInDailyChallengeMenu && dailyChallengeData && (
              <div className="daily-challenge-menu-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 20px'
              }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToDailyChallengeList}
                  className={`daily-challenge-menu-back-button ${theme}-daily-challenge-menu-back-button`}
                  style={{
                    height: '32px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    background: '#ffffff',
                    color: '#000000',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    e.target.style.filter = 'brightness(0.95)';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.filter = 'none';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {t('common.back')}
                </Button>
                <div style={{
                  height: '24px',
                  width: '1px',
                  backgroundColor: theme === 'sun' ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255, 255, 255, 0.3)'
                }} />
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1e40af' : '#fff',
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
                }}>
                  {t('dailyChallenge.dailyChallengeManagement')}
                  {dailyChallengeData.subtitle && (
                    <span style={{
                      fontWeight: '500',
                      marginLeft: '8px'
                    }}>
                      / {dailyChallengeData.subtitle}
                    </span>
                  )}
                </h2>
              </div>
            )}
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
                   user?.role === 'TEACHING_ASSISTANTS' ? 'Teaching Assistant' :
                   user?.role === 'STUDENT' ? 'Student' :
                   user?.role === 'TEST_TAKER' ? 'Test Taker' :  
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
                      src={profileData?.avatarUrl || "/img/avatar_1.png"} 
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
                        src={profileData?.avatarUrl || "/img/avatar_1.png"} 
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
                          {profileData?.fullName || user?.fullName || user?.name || 'User'}
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

                    {/* Settings */}
                    <button 
                      onClick={() => navigate('/settings')}
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
                        <SettingOutlined style={{ fontSize: '14px' }} />
                      </div>
                      {t('header.settings')}
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
