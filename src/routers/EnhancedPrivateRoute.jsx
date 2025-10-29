import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { decodeJWT, getRoleFromToken } from "../utils/jwtUtils";
import { spaceToast } from "../component/SpaceToastify";

/**
 * Enhanced Private Route với kiểm tra bảo mật nhiều lớp
 * Ngăn chặn bypass reset password cho accounts có trạng thái PENDING
 */
const EnhancedPrivateRoute = ({ children, requiredRole = null }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
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
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // 3. Decode JWT token để kiểm tra thông tin
        const tokenPayload = decodeJWT(accessToken);
        if (!tokenPayload) {
          console.error('Invalid JWT token');
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // 4. Kiểm tra trạng thái mustChangePassword từ localStorage
        const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
        const userRole = getRoleFromToken(accessToken);

        console.log('EnhancedPrivateRoute - Token validation:', {
          mustChangePassword,
          userRole,
          currentPath: location.pathname
        });

        // 5. Kiểm tra nếu phải đổi mật khẩu
        if (mustChangePassword) {
          // Chỉ cho phép truy cập các routes liên quan đến reset password
          const allowedPaths = [
            '/reset-password',
            '/change-password',
            '/choose-login',
            '/login-teacher',
            '/login-student'
          ];
          
          const isAllowedPath = allowedPaths.some(path => 
            location.pathname.startsWith(path)
          );

          if (!isAllowedPath) {
            console.warn('🚨 SECURITY ALERT: Attempted to bypass password reset');
            spaceToast.error('You must reset your password before accessing this area');
            
            // Redirect to appropriate reset password page based on role
            if (userRole === 'STUDENT') {
              setIsAuthorized(false);
              setIsValidating(false);
              return;
            } else {
              setIsAuthorized(false);
              setIsValidating(false);
              return;
            }
          }
        }

        // 6. Kiểm tra role-based access nếu có yêu cầu
        if (requiredRole) {
          const userRoleLower = userRole?.toLowerCase();
          const requiredRoleLower = requiredRole.toLowerCase();
          
          if (userRoleLower !== requiredRoleLower) {
            console.warn(`🚨 AUTHORIZATION ERROR: User role ${userRole} does not match required role ${requiredRole}`);
            setIsAuthorized(false);
            setIsValidating(false);
            return;
          }
        }

        // 7. Kiểm tra account status ACTIVE (bỏ qua vì không có trong token)
        // Account status sẽ được kiểm tra ở backend level

        // 8. Tất cả kiểm tra đều pass
        setIsAuthorized(true);
        
      } catch (error) {
        console.error('EnhancedPrivateRoute validation error:', error);
        setIsAuthorized(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [isAuthenticated, location.pathname, requiredRole]);

  // Hiển thị loading trong khi validate
  if (isValidating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Validating access...
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

export default EnhancedPrivateRoute;
