import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { confirmEmailChange } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import usePageTitle from '../../hooks/usePageTitle';
import './Login.css';

export default function ConfirmEmailChange() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isSunTheme } = useTheme();
  

  
  const [status, setStatus] = useState('loading'); // loading, success, error

  // Set page title
  usePageTitle(t('common.confirmEmailChange'));

  useEffect(() => {
    console.log('useEffect triggered - token:', token);
    if (token) {
      console.log('Token exists, calling confirmEmailChange API...');
      
      const handleConfirmEmailChange = async () => {
        try {
          setStatus('loading');
          console.log('Calling confirmEmailChange API...');
          
          // Thêm timeout để tránh hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000)
          );
          
          const apiPromise = dispatch(confirmEmailChange(token)).unwrap();
          const result = await Promise.race([apiPromise, timeoutPromise]);
          
          console.log('confirmEmailChange API result:', result);
          console.log('result.data:', result.data);
          console.log('result.success:', result.success);
          console.log('result.message:', result.message);
          
          if (result.data?.success || result.data?.message) {
            setStatus('success');
            spaceToast.success(result.data?.message || t('common.emailChangeConfirmed'));
          } else {
            setStatus('error');
          }
        } catch (error) {
          console.error('Confirm Email Change Error:', error);
          setStatus('error');
          
          let errorMessage = t('common.emailChangeConfirmFailed');
          if (error.message === 'API call timeout after 30 seconds') {
            errorMessage = 'API call timeout. Please try again.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.error) {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          spaceToast.error(errorMessage);
        }
      };
      
      handleConfirmEmailChange();
    } else {
      console.log('No token found, setting error status');
      setStatus('error');
    }
  }, [token, dispatch, t]);

  const handleGoToLogin = () => {
    navigate('/choose-login');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleBackToLogin = () => {
    navigate('/choose-login');
  };

  return (
    <ThemedLayoutFullScreen>
      <div className="main-content" style={{ paddingTop: 120, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Theme Toggle - Top Right */}
        <div className={`login-theme-toggle-container ${isSunTheme ? 'sun-theme' : 'space-theme'}`} style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <ThemeToggleSwitch />
          <LanguageToggle />
        </div>
        
        <div className='d-flex align-items-center justify-content-center w-100'>
          <div className='row justify-content-center w-100'>
            <div
              className='card mb-0'
              style={getLoginCardStyle(isSunTheme)}>
              <div
                className='card-body'
                style={{ padding: '1.5rem 2.5rem 1.5rem 2.5rem' }}>
                <div className='card-body'>
                  {/* Back Button and Title */}
                  <div className='d-flex align-items-center justify-content-center mb-4' style={{ position: 'relative' }}>
                    <Button
                      type='text'
                      icon={<ArrowLeftOutlined style={{ 
                        color: isSunTheme ? '#3b82f6' : '#ffffff', 
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }} />}
                      onClick={handleBackToLogin}
                      style={{
                        color: isSunTheme ? '#3b82f6' : '#ffffff',
                        fontWeight: 600,
                        fontSize: '18px',
                        padding: '8px 12px',
                        height: 'auto',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        position: 'absolute',
                        left: '0'
                      }}>
                    </Button>
                    <h5 className='mb-0' style={getHeadingStyle(isSunTheme)}>
                      {t('common.confirmEmailChange')}
                    </h5>
                  </div>

                  {/* Content based on status */}
                  {status === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '20px', fontSize: '18px', color: isSunTheme ? '#3b82f6' : '#ffffff' }}>
                        {t('common.confirmingEmailChange')}
                      </div>
                    </div>
                  )}

                  {status === 'success' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircleOutlined 
                        style={{ 
                          fontSize: '64px', 
                          color: '#52c41a',
                          marginBottom: '20px'
                        }} 
                      />
                      <h3 style={{ color: '#52c41a', marginBottom: '16px', fontSize: '24px' }}>
                        {t('common.emailChangeConfirmed')}
                      </h3>
                      <p style={{ color: isSunTheme ? '#666' : '#ffffff', marginBottom: '24px', fontSize: '16px' }}>
                        {t('common.emailChangeSuccessMessage')}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className='btn w-auto mb-2 rounded-3'
                          style={getSuccessButtonStyle(isSunTheme)}
                          onClick={handleGoToProfile}
                        >
                          {t('common.goToProfile')}
                        </button>
                        <button
                          className='btn w-auto mb-2 rounded-3'
                          style={getSecondaryButtonStyle(isSunTheme)}
                          onClick={handleGoToLogin}
                        >
                          {t('common.goToLogin')}
                        </button>
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CloseCircleOutlined 
                        style={{ 
                          fontSize: '64px', 
                          color: '#ff4d4f',
                          marginBottom: '20px'
                        }} 
                      />
                      <h3 style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '24px' }}>
                        {t('common.emailChangeConfirmFailed')}
                      </h3>
                      <p style={{ color: isSunTheme ? '#666' : '#ffffff', marginBottom: '24px', fontSize: '16px' }}>
                        {t('common.emailChangeErrorMessage')}
                      </p>
                      <button
                        className='btn w-auto mb-2 rounded-3'
                        style={getErrorButtonStyle(isSunTheme)}
                        onClick={handleGoToLogin}
                      >
                        {t('common.goToLogin')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemedLayoutFullScreen>
  );
}

// Dynamic styles that change based on theme
const getLoginCardStyle = (isSunTheme) => ({
  background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.7)',
  backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
  borderRadius: 32,
  boxShadow: isSunTheme 
    ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
    : '0 20px 60px rgba(77, 208, 255, 0.25)',
  border: isSunTheme ? '2px solid #3B82F6' : 'none',
  minWidth: 400,
  maxWidth: 600,
  margin: '0 auto',
  padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
  fontSize: '48px',
  fontWeight: 700,
  color: isSunTheme ? '#3b82f6' : '#fff',
  textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
  marginBottom: '8px',
});

const getSuccessButtonStyle = (isSunTheme) => ({
  background: isSunTheme 
    ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' 
    : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
  border: 'none',
  color: 'white',
  fontWeight: 600,
  fontSize: '16px',
  padding: '12px 24px',
  borderRadius: '12px',
  boxShadow: '0 8px 25px rgba(82, 196, 26, 0.3)',
  transition: 'all 0.3s ease',
});

const getSecondaryButtonStyle = (isSunTheme) => ({
  background: isSunTheme 
    ? 'linear-gradient(135deg, #FFFFFF 10%, #DFEDFF 34%, #C3DEFE 66%, #9CC8FE 100%)' 
    : 'linear-gradient(135deg, #D9D9D9 0%, #CAC0E3 42%, #BAA5EE 66%, #AA8BF9 100%)',
  border: 'none',
  color: 'black',
  fontWeight: 600,
  fontSize: '16px',
  padding: '12px 24px',
  borderRadius: '12px',
  boxShadow: isSunTheme 
    ? '0 8px 25px rgba(139, 176, 249, 0.3)' 
    : '0 8px 25px rgba(170, 139, 249, 0.3)',
  transition: 'all 0.3s ease',
});

const getErrorButtonStyle = (isSunTheme) => ({
  background: isSunTheme 
    ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' 
    : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
  border: 'none',
  color: 'white',
  fontWeight: 600,
  fontSize: '16px',
  padding: '12px 24px',
  borderRadius: '12px',
  boxShadow: '0 8px 25px rgba(255, 77, 79, 0.3)',
  transition: 'all 0.3s ease',
});
