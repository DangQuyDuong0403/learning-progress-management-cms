import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayout from '../../component/teacherlayout/ThemedLayout';
import usePageTitle from '../../hooks/usePageTitle';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Set page title
  usePageTitle('404 - Page Not Found');

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Check user role and redirect accordingly
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role?.toLowerCase();
        
        switch (role) {
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/dashboard');
            break;
          case 'manager':
            navigate('/manager/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/choose-login');
        }
      } catch (error) {
        navigate('/choose-login');
      }
    } else {
      navigate('/choose-login');
    }
  };

  return (
    <ThemedLayout>
      <div className={`not-found-container ${theme}-not-found-container`} style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: theme === 'sun' ? '#f5f5f5' : '#1a1a2e'
      }}>
        <Result
          status="404"
          title="404"
          subTitle="Sorry, the page you visited does not exist or you don't have permission to access it."
          extra={[
            <Button type="primary" key="home" onClick={handleGoHome}>
              Go Home
            </Button>,
            <Button key="back" onClick={handleGoBack}>
              Go Back
            </Button>,
          ]}
        />
      </div>
    </ThemedLayout>
  );
};

export default NotFound;
