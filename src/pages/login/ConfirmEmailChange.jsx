import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { confirmEmailChange } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeLayoutLogin from '../../component/ThemeLayoutLogin';
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
  const [changedEmail, setChangedEmail] = useState(null); // Store the changed email

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
            // Extract email from response if available
            const emailFromResponse = result.data?.email || result.data?.newEmail || result.data?.data?.email;
            if (emailFromResponse) {
              setChangedEmail(emailFromResponse);
            }
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

  const handleBack = () => {
    navigate('/profile');
  };

  return (
    <ThemeLayoutLogin>
      <div className="main-content" style={{ paddingTop: 120, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Theme Toggle - Top Right */}
        <div className={`login-theme-toggle-container ${isSunTheme ? 'sun-theme' : 'space-theme'}`} style={{ position: 'absolute', top: '20px', right: '20px' }}>
          {/* <ThemeToggleSwitch /> */}
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
                  {/* Title */}
                  <div className='d-flex align-items-center justify-content-center mb-4'>
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
                      <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
                        📧
                      </div>
                      <h3 style={{ color: '#1890ff', marginBottom: '16px', fontSize: '24px' }}>
                        {t('common.emailChangeConfirmed')}
                      </h3>
                      <p style={{ color: isSunTheme ? '#666' : '#ffffff', marginBottom: '16px', fontSize: '16px' }}>
                        {t('common.emailChangeSuccessMessage')}
                      </p>
                      {changedEmail && (
                        <div style={{ 
                          background: '#e6f7ff', 
                          border: '1px solid #91d5ff', 
                          borderRadius: '8px', 
                          padding: '12px 16px', 
                          marginBottom: '24px',
                          display: 'inline-block'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            {t('common.yourEmailIsNow')}:
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            color: '#1890ff', 
                            fontWeight: 'bold',
                            wordBreak: 'break-all'
                          }}>
                            {changedEmail}
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className='btn w-auto mb-2 rounded-3'
                          style={getSecondaryButtonStyle(isSunTheme)}
                          onClick={handleBack}
                        >
                          {t('common.back')}
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
                        onClick={handleBack}
                      >
                        {t('common.back')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeLayoutLogin>
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
  fontSize: '40px',
  fontWeight: 700,
  color: isSunTheme ? '#3b82f6' : '#fff',
  textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
  marginBottom: '8px',
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
