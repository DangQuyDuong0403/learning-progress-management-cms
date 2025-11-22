import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Switch, Tooltip, Button } from 'antd';
import { SunOutlined, MoonOutlined, ArrowLeftOutlined, SettingOutlined, CloseOutlined } from '@ant-design/icons';
import { logoutApi, logout, getUserProfile } from '../redux/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useClassMenu } from '../contexts/ClassMenuContext';
import { useSyllabusMenu } from '../contexts/SyllabusMenuContext';
import { useDailyChallengeMenu } from '../contexts/DailyChallengeMenuContext';
import LanguageToggle from './LanguageToggle';
import { spaceToast } from './SpaceToastify';
import { notificationApi } from '../apis/apis';
import ROUTER_PAGE from '../constants/router';
import './ThemedHeader.css';

export default function ThemedHeader({
  hideThemeToggle = false,
  hideLanguageToggle = false,
  extraLeftContent = null,
  extraRightContent = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, refreshToken, profileData } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme, isSunTheme } = useTheme();
  const { isInClassMenu, classData } = useClassMenu();
  const { isInSyllabusMenu, syllabusData } = useSyllabusMenu();
  const { isInDailyChallengeMenu, dailyChallengeData } = useDailyChallengeMenu();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sseConnectionRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // Fetch user profile data on component mount
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return t('header.justNow') || 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('header.minutesAgo') || 'minutes ago'}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${t('header.hoursAgo') || 'hours ago'}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${t('header.daysAgo') || 'days ago'}`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${t('header.weeksAgo') || 'weeks ago'}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${t('header.monthsAgo') || 'months ago'}`;
  };

  // Safely render HTML content (only allows formatting tags)
  const renderNotificationHTML = (htmlString) => {
    if (!htmlString) return { __html: '' };
    
    // Sanitize: only allow safe formatting tags
    // Allowed tags: b, strong, i, em, u, br, span, p
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'span', 'p'];
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    
    const sanitized = htmlString.replace(tagPattern, (match, tagName) => {
      const lowerTag = tagName.toLowerCase();
      if (allowedTags.includes(lowerTag)) {
        // Strip attributes and keep only the tag name
        // For closing tags, return as is; for opening tags, remove attributes
        if (match.startsWith('</')) {
          return `</${lowerTag}>`;
        } else {
          return `<${lowerTag}>`;
        }
      }
      return ''; // Remove disallowed tags
    });
    
    return { __html: sanitized };
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      earlier: []
    };

    notifs.forEach(notif => {
      const notifDate = new Date(notif.createdAt);
      if (notifDate >= today) {
        groups.today.push(notif);
      } else {
        groups.earlier.push(notif);
      }
    });

    return groups;
  };

  // Fetch unread count via API
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.data && response.data.success) {
        const count = typeof response.data.data === 'number' ? response.data.data : 0;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch initial notifications (first page)
  const fetchInitialNotifications = async (unreadOnly = false) => {
    const pageSize = 10;
    
    try {
      setLoading(true);
      setCurrentPage(0);
      setHasMore(true);
      
      const response = await notificationApi.getNotifications({
        page: 0,
        size: pageSize,
        unreadOnly,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });

      if (response.data && response.data.success) {
        const notifs = response.data.data || [];
        setNotifications(notifs);
        
        // Check if there are more pages
        const totalElements = response.data.totalElements || 0;
        const totalPages = response.data.totalPages || 0;
        setHasMore(notifs.length < totalElements && totalPages > 1);

        // Always get accurate unread count from backend
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more notifications (infinite scroll)
  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    
    const pageSize = 10;
    const nextPage = currentPage + 1;
    
    try {
      setLoadingMore(true);
      
      // Delay 1 second before loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await notificationApi.getNotifications({
        page: nextPage,
        size: pageSize,
        unreadOnly: activeTab === 'unread',
        sortBy: 'createdAt',
        sortDir: 'desc'
      });

      if (response.data && response.data.success) {
        const newNotifs = response.data.data || [];
        
        if (newNotifs.length > 0) {
          setNotifications(prev => {
            const updated = [...prev, ...newNotifs];
            // Check if there are more pages
            const totalElements = response.data.totalElements || 0;
            const totalPages = response.data.totalPages || 0;
            setHasMore(updated.length < totalElements && nextPage + 1 < totalPages);
            return updated;
          });
          setCurrentPage(nextPage);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = (e) => {
    const element = e.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Load more when user scrolls to within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore) {
      loadMoreNotifications();
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Check if click is not on the button
        const button = document.getElementById('notificationDropdown');
        if (button && !button.contains(event.target)) {
          setIsNotificationDropdownOpen(false);
          // Remove Bootstrap dropdown show class
          if (dropdownRef.current) {
            dropdownRef.current.classList.remove('show');
          }
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        }
      }
    };

    if (isNotificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationDropdownOpen]);

  // Handle dropdown toggle
  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    const isOpen = !isNotificationDropdownOpen;
    setIsNotificationDropdownOpen(isOpen);
    
    const button = document.getElementById('notificationDropdown');
    const menu = dropdownRef.current;
    
    if (isOpen) {
      if (menu) menu.classList.add('show');
      if (button) button.setAttribute('aria-expanded', 'true');
    } else {
      if (menu) menu.classList.remove('show');
      if (button) button.setAttribute('aria-expanded', 'false');
    }
  };

  // Prevent dropdown from closing when clicking inside
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  // Connect to SSE stream
  useEffect(() => {
    if (!user) return;

    const connectSSE = () => {
      const connection = notificationApi.connectSSE(
        // onMessage
        (message) => {
          if (message.type === 'notification') {
            // Add new notification to the list
            setNotifications(prev => {
              const newNotif = message.data;
              // Check if notification already exists
              const exists = prev.some(n => n.id === newNotif.id);
              if (!exists) {
                // Add to beginning of list
                const updated = [newNotif, ...prev];
                // Increment unread counter immediately
                setUnreadCount(prevUnread => prevUnread + (newNotif.isRead ? 0 : 1));
                return updated;
              }
              return prev;
            });
          } else if (message.type === 'connect') {
            console.log('SSE Connected:', message.data);
            // Refresh notifications and unread count after connection
            fetchInitialNotifications(false);
            fetchUnreadCount();
          }
        },
        // onError
        (error) => {
          console.error('SSE Error:', error);
          // Retry connection after 5 seconds
          setTimeout(() => {
            if (user) {
              connectSSE();
            }
          }, 5000);
        },
        // onConnect
        () => {
          console.log('SSE connection established');
        }
      );

      sseConnectionRef.current = connection;
    };

    connectSSE();

    // Initial fetch: load first page and unread count
    fetchInitialNotifications(false);
    fetchUnreadCount();

    // Cleanup on unmount
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchInitialNotifications(tab === 'unread');
    // Refresh unread count whenever switching tabs
    fetchUnreadCount();
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Ensure accuracy with backend
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      // Update all notifications to read
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      // Reset unread count
      setUnreadCount(0);
      // Refresh to ensure accuracy
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const response = await notificationApi.deleteNotification(notificationId);
      // Remove notification from list
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        // Update unread count if deleted notification was unread
        const deletedNotif = prev.find(n => n.id === notificationId);
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return updated;
      });
      // Refresh unread count to ensure accuracy
      fetchUnreadCount();
      // Use message from backend, fallback to translation
      const message = response?.data?.message || t('header.notificationDeleted') || 'Notification deleted';
      spaceToast.success(message);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Try to get error message from backend response
      const errorMessage = error?.response?.data?.message || t('header.failedToDeleteNotification') || 'Failed to delete notification';
      spaceToast.error(errorMessage);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} });
    }
    
    // Navigate to target URL if available
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  const getShortLabel = (key, defaultText) => {
    const value = t(key);
    if (value && value !== key) {
      return value;
    }
    return defaultText;
  };

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

  // Brand click: navigate to class list (teacher/teaching_assistant -> class list, others -> dashboard)
  const handleBrandClick = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'teacher') {
      navigate(ROUTER_PAGE.TEACHER_CLASSES);
      return;
    }
    if (role === 'teaching_assistant') {
      navigate(ROUTER_PAGE.TEACHING_ASSISTANT_CLASSES);
      return;
    }
    // Fallback to role-based dashboard
    handleBackToDashboard();
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
      // Preserve state from location.state when navigating back to restore pagination/filters
      const savedState = location.state || {};
      const backState = {
        ...savedState,
        // Preserve pagination state if it exists
        currentPage: savedState.currentPage,
        pageSize: savedState.pageSize,
        searchText: savedState.searchText,
        typeFilter: savedState.typeFilter,
        statusFilter: savedState.statusFilter,
      };
      console.log('🔵 ThemedHeader - Navigating back to daily challenge list with state:', backState);
      navigate(dailyChallengeData.backPath, { state: backState });
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
  // Note: Back button is hidden on ClassList page for teacher and teaching_assistant
  const isOnClassesListPage = () => {
    const userRole = user?.role?.toLowerCase();
    // Don't show back button on ClassList page for teacher and teaching_assistant
    if (userRole === 'teacher' || userRole === 'teaching_assistant') {
      return false; // Hide back button on ClassList page
    }
    if (userRole === 'student') {
      return location.pathname === '/student/classes';
    }
    // Manager classes page does not need back button
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

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      case 'TEACHER':
        return 'Teacher';
      case 'TEACHING_ASSISTANT':
        return 'Teaching Assistant';
      case 'STUDENT':
        return 'Student';
      case 'TEST_TAKER':
        return 'Test Taker';
      default:
        return 'User';
    }
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
              <div onClick={handleBrandClick} style={{
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
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)',
                  cursor: 'pointer'
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
                  {dailyChallengeData.subtitle || dailyChallengeData.className || t('dailyChallenge.dailyChallengeManagement')}
                </h2>
              </div>
            )}

            {extraLeftContent && (
              <div
                className="themed-extra-left"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '0 20px',
                }}
              >
                {typeof extraLeftContent === 'function'
                  ? extraLeftContent({ theme, user, t })
                  : extraLeftContent}
              </div>
            )}
          </div>
          
          <div className="themed-navbar-actions">
            <ul className="themed-navbar-nav">
              {/* Theme Toggle Switch */}
              {!hideThemeToggle && (
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
              )}

              {/* Language Toggle */}
              {!hideLanguageToggle && (
                <li className="themed-nav-item">
                  <LanguageToggle />
                </li>
              )}

              {/* Notifications */}
              <li className="themed-nav-item dropdown">
                <button
                  className="themed-nav-link notification-button"
                  id="notificationDropdown"
                  onClick={handleDropdownToggle}
                  aria-expanded={isNotificationDropdownOpen}
                  type="button"
                >
                  <img 
                    src="/img/notification_icon.png" 
                    alt="Notifications" 
                    className={`notification-icon ${theme}-notification-icon`}
                  />
                  {unreadCount > 0 && (
                    <div className={`notification-dot notification-badge ${theme}-notification-dot`}></div>
                  )}
                </button>
                <div 
                  ref={dropdownRef}
                  className={`dropdown-menu dropdown-menu-end ${theme}-dropdown-menu ${isNotificationDropdownOpen ? 'show' : ''}`}
                  aria-labelledby="notificationDropdown"
                  onScroll={handleScroll}
                  onClick={handleDropdownClick}
                  style={{ padding: '12px 16px', boxSizing: 'border-box' }}
                >
                  <div className="notification-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h5 style={{ margin: 0 }}>{t('header.notifications')}</h5>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: theme === 'sun' 
                              ? '#fef3c7' 
                              : '#a5b4fc',
                            color: theme === 'sun' 
                              ? '#92400e' 
                              : '#ffffff',
                            transition: 'all 0.2s ease',
                            boxShadow: theme === 'sun' 
                              ? '0 2px 6px rgba(251, 191, 36, 0.2)' 
                              : '0 2px 6px rgba(129, 140, 248, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = theme === 'sun' 
                              ? '#fde68a' 
                              : '#8b9aff';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = theme === 'sun' 
                              ? '0 4px 10px rgba(251, 191, 36, 0.3)' 
                              : '0 4px 10px rgba(129, 140, 248, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme === 'sun' 
                              ? '#fef3c7' 
                              : '#a5b4fc';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = theme === 'sun' 
                              ? '0 2px 6px rgba(251, 191, 36, 0.2)' 
                              : '0 2px 6px rgba(129, 140, 248, 0.3)';
                          }}
                        >
                          {t('header.markAllAsRead') || 'Mark all as read'}
                        </button>
                      )}
                    </div>
                    <div className="notification-tabs">
                      <span 
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleTabChange('all')}
                      >
                        <span className="tab-label">{getShortLabel('header.allShort', 'All')}</span>
                      </span>
                      <span 
                        className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
                        onClick={() => handleTabChange('unread')}
                      >
                        <span className="tab-label">{getShortLabel('header.unreadShort', 'Unread')}</span>
                        {unreadCount > 0 && (
                          <span className="tab-count">
                            {unreadCount}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      {t('common.loading') || 'Loading...'}
                    </div>
                  ) : (
                    <>
                      {groupedNotifications.today.length > 0 && (
                        <div className="notification-section">
                          <div className="section-header">
                            <span>{t('header.today')}</span>
                          </div>
                          <div className="notification-list">
                            {groupedNotifications.today.map((notification) => (
                              <div 
                                key={notification.id || Math.random()}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                                style={{ cursor: notification.targetUrl ? 'pointer' : 'default' }}
                              >
                                <div className="notification-content">
                                  {notification.avatarUrl && notification.avatarUrl !== 'string' && (
                                    <img 
                                      src={getAvatarUrl(notification.avatarUrl)} 
                                      alt=""
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        marginRight: '12px',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <div className="notification-text">
                                      {notification.title && (
                                        <div className="notification-title"><strong>{notification.title}</strong></div>
                                      )}
                                      {notification.message && (
                                        <div 
                                          className="notification-message"
                                          dangerouslySetInnerHTML={renderNotificationHTML(notification.message)}
                                        />
                                      )}
                                    </div>
                                    <span className="notification-time">
                                      {formatTimeAgo(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {!notification.isRead && (
                                    <div 
                                      className="notification-dot"
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      style={{ cursor: 'pointer' }}
                                    ></div>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px',
                                      color: theme === 'sun' ? '#94a3b8' : 'rgba(255, 255, 255, 0.5)',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.color = theme === 'sun' ? '#ef4444' : '#ff6b6b';
                                      e.target.style.background = theme === 'sun' ? '#fee2e2' : 'rgba(255, 107, 107, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.color = theme === 'sun' ? '#94a3b8' : 'rgba(255, 255, 255, 0.5)';
                                      e.target.style.background = 'transparent';
                                    }}
                                    title={t('header.deleteNotification') || 'Delete notification'}
                                  >
                                    <CloseOutlined style={{ fontSize: '14px' }} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {groupedNotifications.earlier.length > 0 && (
                        <div className="notification-section">
                          <div className="section-header">
                            <span>{t('header.earlier')}</span>
                          </div>
                          <div className="notification-list">
                            {groupedNotifications.earlier.map((notification) => (
                              <div 
                                key={notification.id || Math.random()}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                                style={{ cursor: notification.targetUrl ? 'pointer' : 'default' }}
                              >
                                <div className="notification-content">
                                  {notification.avatarUrl && notification.avatarUrl !== 'string' && (
                                    <img 
                                      src={getAvatarUrl(notification.avatarUrl)} 
                                      alt=""
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        marginRight: '12px',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <div className="notification-text">
                                      {notification.title && (
                                        <div className="notification-title"><strong>{notification.title}</strong></div>
                                      )}
                                      {notification.message && (
                                        <div 
                                          className="notification-message"
                                          dangerouslySetInnerHTML={renderNotificationHTML(notification.message)}
                                        />
                                      )}
                                    </div>
                                    <span className="notification-time">
                                      {formatTimeAgo(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {!notification.isRead && (
                                    <div 
                                      className="notification-dot"
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      style={{ cursor: 'pointer' }}
                                    ></div>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px',
                                      color: theme === 'sun' ? '#94a3b8' : 'rgba(255, 255, 255, 0.5)',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.color = theme === 'sun' ? '#ef4444' : '#ff6b6b';
                                      e.target.style.background = theme === 'sun' ? '#fee2e2' : 'rgba(255, 107, 107, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.color = theme === 'sun' ? '#94a3b8' : 'rgba(255, 255, 255, 0.5)';
                                      e.target.style.background = 'transparent';
                                    }}
                                    title={t('header.deleteNotification') || 'Delete notification'}
                                  >
                                    <CloseOutlined style={{ fontSize: '14px' }} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {filteredNotifications.length === 0 && !loading && (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: theme === 'sun' ? '#64748b' : 'rgba(255, 255, 255, 0.7)' }}>
                          {activeTab === 'unread' 
                            ? (t('header.noUnreadNotifications') || 'No unread notifications')
                            : (t('header.noNotifications') || 'No notifications')
                          }
                        </div>
                      )}
                      
                      {/* Loading more indicator */}
                      {loadingMore && (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center',
                          color: theme === 'sun' ? '#64748b' : 'rgba(255, 255, 255, 0.7)'
                        }}>
                          <div style={{ 
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            border: `3px solid ${theme === 'sun' ? '#e3e8ff' : 'rgba(114, 137, 218, 0.3)'}`,
                            borderTop: `3px solid ${theme === 'sun' ? '#3b82f6' : '#7289da'}`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: '8px'
                          }}></div>
                          {t('common.loading') || 'Loading...'}
                        </div>
                      )}
                      
                      {/* End of list indicator */}
                      {!hasMore && filteredNotifications.length > 0 && (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center',
                          color: theme === 'sun' ? '#94a3b8' : 'rgba(255, 255, 255, 0.5)',
                          fontSize: '12px'
                        }}>
                          {t('header.noMoreNotifications') || 'No more notifications'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>

              {/* User Role Display */}
              <li className="themed-nav-item">
                <span className={`user-role ${theme}-user-role`}>
                  {getRoleDisplayName()}
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
                      src={getAvatarUrl(profileData?.avatarUrl)} 
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
                        src={getAvatarUrl(profileData?.avatarUrl)} 
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
                          {profileData?.fullName || user?.fullName || user?.name || getRoleDisplayName()}
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

           
              {extraRightContent && (
                <li className="themed-nav-item themed-extra-right">
                  {typeof extraRightContent === 'function'
                    ? extraRightContent({ theme, user })
                    : extraRightContent}
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
