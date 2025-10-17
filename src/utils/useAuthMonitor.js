import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/auth';

/**
 * Custom hook to monitor authentication state across browser tabs
 * Automatically logs out user when tokens are removed from localStorage in another tab
 */
export const useAuthMonitor = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Function to check if user is still authenticated
    const checkAuthStatus = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');

      // If any of the required auth data is missing, logout
      if (!accessToken || !refreshToken || !user) {
        console.log('Auth tokens missing, logging out...');
        dispatch(logout());
      }
    };

    // Check auth status immediately
    checkAuthStatus();

    // Listen for storage changes (when localStorage is modified in other tabs)
    const handleStorageChange = (e) => {
      // Only handle changes to auth-related keys
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        console.log('Storage change detected:', e.key, e.newValue);
        
        // If any auth token was removed, logout immediately
        if (e.newValue === null) {
          console.log('Auth token removed, logging out...');
          dispatch(logout());
        }
      }
    };

    // Additional check for when multiple tokens are removed at once
    const handleMultipleTokenRemoval = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');
      
      // If any critical token is missing, logout
      if (!accessToken || !refreshToken || !user) {
        console.log('Critical auth tokens missing, logging out...');
        dispatch(logout());
      }
    };

    // Listen for focus events (when user switches back to this tab)
    const handleFocus = () => {
      console.log('Window focused, checking auth status...');
      handleMultipleTokenRemoval();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch]);
};

export default useAuthMonitor;
