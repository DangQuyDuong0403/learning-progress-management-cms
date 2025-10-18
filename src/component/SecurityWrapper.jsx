import React from 'react';
import { useSecurityCheck } from '../hooks/useSecurityCheck';
import { Spin, Alert } from 'antd';
import { SecurityScanOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * Component wrapper để bảo vệ các component quan trọng
 * Ngăn chặn truy cập từ PENDING accounts
 */
const SecurityWrapper = ({ 
  children, 
  requiredRoles = [], 
  fallbackComponent = null,
  showSecurityWarning = true 
}) => {
  const { 
    isSecure, 
    accountStatus, 
    mustChangePassword, 
    userRole, 
    isLoading,
    checkBeforeAction 
  } = useSecurityCheck();

  // Hiển thị loading
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div style={{ color: '#666', fontSize: '16px' }}>
          Checking security permissions...
        </div>
      </div>
    );
  }

  // Kiểm tra role nếu có yêu cầu
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      role.toLowerCase() === userRole?.toLowerCase()
    );
    
    if (!hasRequiredRole) {
      return (
        <div style={{ padding: '20px' }}>
          <Alert
            message="Access Denied"
            description={`You do not have permission to access this area. Required role: ${requiredRoles.join(' or ')}`}
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
          />
        </div>
      );
    }
  }

  // Kiểm tra security status
  if (!isSecure) {
    if (fallbackComponent) {
      return fallbackComponent;
    }

    if (showSecurityWarning) {
      return (
        <div style={{ padding: '20px' }}>
          <Alert
            message="Security Alert"
            description={
              <div>
                <p>Your account requires password setup before accessing this area.</p>
                <p><strong>Status:</strong> {accountStatus}</p>
                <p><strong>Must Change Password:</strong> {mustChangePassword ? 'Yes' : 'No'}</p>
                <p>Please complete the password reset process to continue.</p>
              </div>
            }
            type="warning"
            icon={<SecurityScanOutlined />}
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>
      );
    }

    return null;
  }

  // Render children nếu tất cả kiểm tra đều pass
  return children;
};

/**
 * HOC để wrap component với security check
 */
export const withSecurityCheck = (WrappedComponent, options = {}) => {
  return function SecurityCheckedComponent(props) {
    return (
      <SecurityWrapper {...options}>
        <WrappedComponent {...props} />
      </SecurityWrapper>
    );
  };
};

export default SecurityWrapper;
