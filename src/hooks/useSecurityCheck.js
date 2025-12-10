import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { decodeJWT, getRoleFromToken } from '../utils/jwtUtils';
import { logout } from '../redux/auth';
import { spaceToast } from '../component/SpaceToastify';

/**
 * Hook để kiểm tra và theo dõi trạng thái bảo mật của user
 * Ngăn chặn bypass reset password cho PENDING accounts
 */
export const useSecurityCheck = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authState = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: true,
    accountStatus: null,
    mustChangePassword: false,
    userRole: null,
    isLoading: true
  });

  useEffect(() => {
    const checkSecurityStatus = () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!isAuthenticated || !accessToken || accessToken === 'undefined' || accessToken === 'null') {
          setSecurityStatus({
            isSecure: false,
            accountStatus: null,
            mustChangePassword: false,
            userRole: null,
            isLoading: false
          });
          return;
        }

        const tokenPayload = decodeJWT(accessToken);
        if (!tokenPayload) {
          console.error('Invalid JWT token');
          setSecurityStatus({
            isSecure: false,
            accountStatus: null,
            mustChangePassword: false,
            userRole: null,
            isLoading: false
          });
          return;
        }

        const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
        const userRole = getRoleFromToken(accessToken);

        const isSecure = !mustChangePassword;

        setSecurityStatus({
          isSecure,
          accountStatus: null, // Không sử dụng accountStatus từ token
          mustChangePassword,
          userRole,
          isLoading: false
        });

        // Nếu không secure, hiển thị cảnh báo và redirect
        if (!isSecure) {
          console.warn('SECURITY ALERT: User attempted to access protected area - must change password');
          spaceToast.error('You must reset your password before accessing this area');
          
          // Redirect based on role
          if (userRole === 'STUDENT') {
            navigate('/reset-password', { replace: true });
          } else {
            navigate('/reset-password', { replace: true });
          }
        }

      } catch (error) {
        console.error('Security check error:', error);
        setSecurityStatus({
          isSecure: false,
          accountStatus: null,
          mustChangePassword: false,
          userRole: null,
          isLoading: false
        });
      }
    };

    checkSecurityStatus();
  }, [isAuthenticated, navigate]);

  // Function để force logout và clear security
  const forceLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
    dispatch(logout());
    navigate('/choose-login', { replace: true });
  };

  // Function để check security trước khi thực hiện action quan trọng
  const checkBeforeAction = (actionName = 'this action') => {
    if (!securityStatus.isSecure) {
      spaceToast.error(`You must reset your password before performing ${actionName}`);
      return false;
    }
    return true;
  };

  return {
    ...securityStatus,
    forceLogout,
    checkBeforeAction
  };
};

/**
 * Hook để kiểm tra quyền truy cập dựa trên role
 */
export const useRoleCheck = (requiredRoles = []) => {
  const { userRole, isLoading } = useSecurityCheck();
  
  const hasRequiredRole = () => {
    if (isLoading || !userRole) return false;
    
    if (requiredRoles.length === 0) return true;
    
    const userRoleLower = userRole.toLowerCase();
    return requiredRoles.some(role => 
      role.toLowerCase() === userRoleLower
    );
  };

  return {
    hasRequiredRole: hasRequiredRole(),
    userRole,
    isLoading
  };
};

export default useSecurityCheck;
