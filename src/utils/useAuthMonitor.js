import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/auth';

/**
 * Custom hook to monitor authentication state across browser tabs
 * Simplified version to avoid logout issues
 */
export const useAuthMonitor = () => {
  const dispatch = useDispatch();

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
        console.log('Invalid auth tokens detected, logging out...');
        localStorage.removeItem('mustChangePassword');
        localStorage.removeItem('mustUpdateProfile');
        dispatch(logout());
        return false;
      }
      return true;
    };

    // Listen for storage changes (when localStorage is modified in other tabs)
    const handleStorageChange = (e) => {
      // Only handle changes to auth-related keys
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        console.log('Storage change detected:', e.key, e.newValue);
        
        // Only logout if auth token was removed (not just updated)
        if (e.newValue === null) {
          console.log('Auth token removed, logging out...');
          localStorage.removeItem('mustChangePassword');
          localStorage.removeItem('mustUpdateProfile');
          dispatch(logout());
        }
        // Don't do anything for token updates - let the app handle it naturally
      }
    };

    // Listen for focus events (when user switches back to this tab)
    const handleFocus = () => {
      console.log('Window focused, checking auth status...');
      checkAuthStatus();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // Check auth status after a small delay to avoid immediate logout on app load
    const timeoutId = setTimeout(() => {
      checkAuthStatus();
    }, 1000);

    // Cleanup event listeners and timeout
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeoutId);
    };
  }, [dispatch]);
};

export default useAuthMonitor;