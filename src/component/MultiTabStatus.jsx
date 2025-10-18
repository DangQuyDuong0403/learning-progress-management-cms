import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Button, Space, Typography, Divider } from 'antd';
import { UserOutlined, KeyOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Component để test và hiển thị trạng thái multi-tab
 */
const MultiTabStatus = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);

  const handleRefreshTokens = () => {
    // Simulate token refresh
    const currentToken = localStorage.getItem('accessToken');
    const newToken = currentToken + '_refreshed';
    localStorage.setItem('accessToken', newToken);
    
    // Trigger storage event để test sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      newValue: newToken,
      oldValue: currentToken
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
    localStorage.removeItem('mustUpdateProfile');
    
    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      newValue: null,
      oldValue: localStorage.getItem('accessToken')
    }));
  };

  return (
    <Card 
      title="Multi-Tab Authentication Status" 
      style={{ margin: '20px', maxWidth: '600px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4}>
            <UserOutlined /> Authentication Status
          </Title>
          <Text strong>Authenticated: </Text>
          <Text type={isAuthenticated ? 'success' : 'danger'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </Text>
        </div>

        {isAuthenticated && user && (
          <>
            <Divider />
            <div>
              <Title level={4}>
                <UserOutlined /> User Information
              </Title>
              <div>
                <Text strong>Username: </Text>
                <Text>{user.username}</Text>
              </div>
              <div>
                <Text strong>Role: </Text>
                <Text>{user.role}</Text>
              </div>
              <div>
                <Text strong>Token: </Text>
                <Text code style={{ fontSize: '12px' }}>
                  {accessToken ? `${accessToken.substring(0, 20)}...` : 'None'}
                </Text>
              </div>
            </div>
          </>
        )}

        <Divider />
        <div>
          <Title level={4}>
            <KeyOutlined /> Multi-Tab Testing
          </Title>
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleRefreshTokens}
              disabled={!isAuthenticated}
            >
              Simulate Token Refresh
            </Button>
            <Button 
              danger
              onClick={handleLogout}
              disabled={!isAuthenticated}
            >
              Test Logout
            </Button>
          </Space>
          <div style={{ marginTop: '10px' }}>
            <Text type="secondary">
              • Open multiple tabs and login to test multi-tab support<br/>
              • Use "Simulate Token Refresh" to test state sync<br/>
              • Use "Test Logout" to test logout across tabs
            </Text>
          </div>
        </div>

        <Divider />
        <div>
          <Title level={4}>Instructions</Title>
          <ol>
            <li>Open this page in multiple browser tabs</li>
            <li>Login in one tab - other tabs should sync automatically</li>
            <li>Use "Simulate Token Refresh" to test token sync</li>
            <li>Use "Test Logout" to test logout across all tabs</li>
            <li>Check console logs for detailed sync information</li>
          </ol>
        </div>
      </Space>
    </Card>
  );
};

export default MultiTabStatus;
