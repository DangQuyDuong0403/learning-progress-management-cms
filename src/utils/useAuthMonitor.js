import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, getUserProfile } from '../redux/auth';
import { spaceToast } from '../component/SpaceToastify';

/**
 * Custom hook to monitor authentication state across browser tabs
 * Simplified version to avoid logout issues
 */
export const useAuthMonitor = () => {
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.auth.profileData);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Function to check if user is still authenticated
    const checkAuthStatus = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');

      // Check if tokens are valid (not just empty strings or 'undefined')
      const hasValidTokens = accessToken && 
                            accessToken !== 'undefined' && 
                            accessToken !== 'null' &&
                            refreshToken && 
                            refreshToken !== 'undefined' && 
                            refreshToken !== 'null' &&
                            user && 
                            user !== 'undefined' && 
                            user !== 'null';

      if (!hasValidTokens) {
        localStorage.removeItem('mustChangePassword');
        localStorage.removeItem('mustUpdateProfile');
        dispatch(logout());
        return false;
      }
      return true;
    };

    // Function to check account status from profile
    const checkAccountStatus = async () => {
      try {
        const result = await dispatch(getUserProfile()).unwrap();
        const accountStatus = result?.data?.status;
        
        // Nếu tài khoản bị inactive, tự động logout
        if (accountStatus && accountStatus.toUpperCase() === 'INACTIVE') {
          console.warn('ACCOUNT INACTIVE: Account status is INACTIVE, logging out...');
          spaceToast.error('Your account has been deactivated. Please contact administrator.');
          
          // Clear all tokens and user data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('mustChangePassword');
          localStorage.removeItem('mustUpdateProfile');
          
          dispatch(logout());
          
          // Redirect to login page
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/choose-login')) {
            window.location.href = '/choose-login';
          }
        }
      } catch (error) {
        // Nếu lỗi khi check profile, có thể là do account đã bị inactive
        // secureAxiosClient sẽ xử lý logout trong trường hợp này
        console.error('Failed to check account status:', error);
      }
    };

    // Listen for storage changes (when localStorage is modified in other tabs)
    const handleStorageChange = (e) => {
      // Only handle changes to auth-related keys
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        
        // Only logout if auth token was removed (not just updated)
        if (e.newValue === null) {
          localStorage.removeItem('mustChangePassword');
          localStorage.removeItem('mustUpdateProfile');
          dispatch(logout());
        }
        // Don't do anything for token updates - let the app handle it naturally
      }
    };

    // Listen for focus events (when user switches back to this tab)
    const handleFocus = () => {
      if (checkAuthStatus()) {
        // Nếu token hợp lệ, check account status
        checkAccountStatus();
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // Check auth status after a small delay to avoid immediate logout on app load
    const timeoutId = setTimeout(() => {
      if (checkAuthStatus()) {
        // Nếu token hợp lệ, check account status lần đầu
        checkAccountStatus();
      }
    }, 1000);

    // Kiểm tra định kỳ account status mỗi 2 phút (120000ms)
    // Để phát hiện khi manager inactive tài khoản trong khi user đang dùng
    if (checkAuthStatus()) {
      intervalRef.current = setInterval(() => {
        checkAccountStatus();
      }, 120000); // Check every 2 minutes
    }

    // Cleanup event listeners, timeout and interval
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch]);

  // Monitor profileData changes to detect status changes
  useEffect(() => {
    if (profileData?.status && profileData.status.toUpperCase() === 'INACTIVE') {
      console.warn('ACCOUNT INACTIVE: Profile data shows INACTIVE status, logging out...');
      spaceToast.error('Your account has been deactivated. Please contact administrator.');
      
      // Clear all tokens and user data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('mustChangePassword');
      localStorage.removeItem('mustUpdateProfile');
      
      dispatch(logout());
      
      // Redirect to login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/choose-login')) {
        window.location.href = '/choose-login';
      }
    }
  }, [profileData, dispatch]);
};

export default useAuthMonitor;