import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getRoleFromToken } from "../utils/jwtUtils";
import ROUTER_PAGE from "../constants/router";

/**
 * Component để redirect từ "/" đến dashboard phù hợp với role của user
 * Nếu chưa đăng nhập, redirect đến "/choose-login"
 */
const HomeRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy token từ localStorage
    const accessToken = localStorage.getItem('accessToken');
    
    // Kiểm tra nếu có accessToken hợp lệ
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      navigate("/choose-login", { replace: true });
      return;
    }

    // Thử lấy role từ nhiều nguồn
    let userRole = null;
    
    // 1. Thử lấy từ token
    userRole = getRoleFromToken(accessToken);
    
    // 2. Nếu không có trong token, thử lấy từ localStorage (ưu tiên loginRole)
    if (!userRole) {
      userRole = localStorage.getItem('loginRole') || localStorage.getItem('selectedRole');
    }
    
    // 3. Nếu vẫn không có, thử parse từ user object trong localStorage
    if (!userRole) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userRole = userObj?.role || userObj?.roleName;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (!userRole) {
      navigate("/choose-login", { replace: true });
      return;
    }

    // Normalize role (chuyển về lowercase và xử lý các format khác nhau)
    const roleLower = userRole.toLowerCase().trim();
    
    // Xác định dashboard dựa trên role
    let dashboardPath = "/choose-login"; // Default fallback

    switch (roleLower) {
      case 'admin':
        dashboardPath = ROUTER_PAGE.ADMIN_DASHBOARD;
        break;
      case 'manager':
        dashboardPath = ROUTER_PAGE.MANAGER_DASHBOARD;
        break;
      case 'teacher':
        // Teacher sử dụng TEACHER_CLASSES vì đó là trang chính của teacher
        dashboardPath = ROUTER_PAGE.TEACHER_CLASSES;
        break;
      case 'teaching_assistant':
        dashboardPath = ROUTER_PAGE.TEACHING_ASSISTANT_CLASSES;
        break;
      case 'student':
        dashboardPath = ROUTER_PAGE.STUDENT_DASHBOARD;
        break;
      case 'test_taker':
        dashboardPath = ROUTER_PAGE.TEST_TAKER_DASHBOARD;
        break;
      default:
        console.log('HomeRedirect - Unknown role:', roleLower);
        dashboardPath = "/choose-login";
    }

    console.log('HomeRedirect - Redirecting to:', dashboardPath);
    navigate(dashboardPath, { replace: true });
  }, [navigate]);

  // Return null vì đang redirect
  return null;
};

export default HomeRedirect;

