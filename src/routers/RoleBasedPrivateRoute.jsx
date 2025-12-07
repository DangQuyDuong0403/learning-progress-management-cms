import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { decodeJWT, getRoleFromToken } from "../utils/jwtUtils";
import { spaceToast } from "../component/SpaceToastify";

/**
 * Role-based Private Route với kiểm tra bảo mật nghiêm ngặt
 * Đảm bảo chỉ user có role phù hợp và trạng thái ACTIVE mới được truy cập
 */
const RoleBasedPrivateRoute = ({ children, requiredRoles = [], allowedPaths = [] }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const hasNotifiedRef = useRef(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const refreshTimerRef = useRef(null);

  const notifyOnce = (message, storageKey = 'rbpr_last_toast') => {
    try {
      const now = Date.now();
      const last = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
      if (!hasNotifiedRef.current && (!last || now - last > 1200)) {
        spaceToast.error(message);
        hasNotifiedRef.current = true;
        sessionStorage.setItem(storageKey, String(now));
      }
    } catch (e) {
      if (!hasNotifiedRef.current) {
        spaceToast.error(message);
        hasNotifiedRef.current = true;
      }
    }
  };

  useEffect(() => {
    const validateRoleAccess = async () => {
      setIsValidating(true);
      
      try {
        // 1. Kiểm tra authentication cơ bản
        if (!isAuthenticated) {
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // 2. Lấy token từ localStorage
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
          const refreshToken = localStorage.getItem('refreshToken');
          if (sessionStorage.getItem('auth_refresh_in_progress') || (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null')) {
            setIsRefreshingToken(true);
            if (!refreshTimerRef.current) {
              refreshTimerRef.current = setInterval(() => {
                const newToken = localStorage.getItem('accessToken');
                if (newToken && newToken !== 'undefined' && newToken !== 'null') {
                  clearInterval(refreshTimerRef.current);
                  refreshTimerRef.current = null;
                  setIsRefreshingToken(false);
                  setIsValidating(true);
                } else {
                  const stillRefreshing = sessionStorage.getItem('auth_refresh_in_progress');
                  const stillHasRefresh = localStorage.getItem('refreshToken');
                  if (!stillRefreshing && (!stillHasRefresh || stillHasRefresh === 'undefined' || stillHasRefresh === 'null')) {
                    clearInterval(refreshTimerRef.current);
                    refreshTimerRef.current = null;
                    setIsRefreshingToken(false);
                    setIsAuthorized(false);
                    setIsValidating(false);
                  }
                }
              }, 200);
            }
            return;
          }
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // 3. Decode JWT token để kiểm tra thông tin
        const tokenPayload = decodeJWT(accessToken);
        if (!tokenPayload) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (sessionStorage.getItem('auth_refresh_in_progress') || (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null')) {
            setIsRefreshingToken(true);
            if (!refreshTimerRef.current) {
              refreshTimerRef.current = setInterval(() => {
                const newToken = localStorage.getItem('accessToken');
                const refreshedPayload = newToken ? decodeJWT(newToken) : null;
                if (refreshedPayload) {
                  clearInterval(refreshTimerRef.current);
                  refreshTimerRef.current = null;
                  setIsRefreshingToken(false);
                  setIsValidating(true);
                } else {
                  const stillRefreshing = sessionStorage.getItem('auth_refresh_in_progress');
                  const stillHasRefresh = localStorage.getItem('refreshToken');
                  if (!stillRefreshing && (!stillHasRefresh || stillHasRefresh === 'undefined' || stillHasRefresh === 'null')) {
                    clearInterval(refreshTimerRef.current);
                    refreshTimerRef.current = null;
                    setIsRefreshingToken(false);
                    setIsAuthorized(false);
                    setIsValidating(false);
                  }
                }
              }, 200);
            }
            return;
          }
          console.error('Invalid JWT token');
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // 4. Lấy thông tin từ localStorage và token
        const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
        const userRole = getRoleFromToken(accessToken);

        // 5. Kiểm tra trạng thái mustChangePassword
        if (mustChangePassword) {
          console.warn('SECURITY ALERT: User must change password');
          notifyOnce('You must complete password setup before accessing this area');
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // 6. Kiểm tra role-based access
        if (requiredRoles.length > 0) {
          const userRoleLower = userRole?.toLowerCase();
          const hasRequiredRole = requiredRoles.some(role => 
            role.toLowerCase() === userRoleLower
          );

          if (!hasRequiredRole) {
            console.warn(`AUTHORIZATION ERROR: User role ${userRole} not in required roles ${requiredRoles.join(', ')}`);
            notifyOnce('You do not have permission to access this area');
            setIsAuthorized(false);
            setIsValidating(false);
            return;
          }
        }

        // 7. Kiểm tra allowed paths (nếu có)
        if (allowedPaths.length > 0) {
          const isPathAllowed = allowedPaths.some(path => 
            location.pathname.startsWith(path)
          );

          if (!isPathAllowed) {
            console.warn(`PATH ACCESS ERROR: Path ${location.pathname} not in allowed paths`);
            notifyOnce('You do not have permission to access this path');
            setIsAuthorized(false);
            setIsValidating(false);
            return;
          }
        }

        // 8. Tất cả kiểm tra đều pass
        setIsAuthorized(true);
        
      } catch (error) {
        console.error('RoleBasedPrivateRoute validation error:', error);
        setIsAuthorized(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateRoleAccess();
  }, [isAuthenticated, location.pathname, requiredRoles, allowedPaths]);

  // Reset toast guard whenever path changes so future pages can show messages again
  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [location.pathname]);

  // Hiển thị loading trong khi validate
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  if (isValidating || isRefreshingToken) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Validating permissions...
      </div>
    );
  }

  // Redirect nếu không authorized
  if (!isAuthorized) {
    const accessToken = localStorage.getItem('accessToken');
    const tokenPayload = accessToken ? decodeJWT(accessToken) : null;
    const userRole = tokenPayload ? getRoleFromToken(accessToken) : null;
    const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';

    // Redirect logic dựa trên mustChangePassword
    if (mustChangePassword) {
      if (userRole === 'STUDENT') {
        return <Navigate to="/change-password" replace />;
      } else {
        return <Navigate to="/reset-password" replace />;
      }
    }

    return <Navigate to="/choose-login" replace />;
  }

  return children;
};

export default RoleBasedPrivateRoute;
