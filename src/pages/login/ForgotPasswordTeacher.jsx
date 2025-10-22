import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeLayoutLogin from '../../component/ThemeLayoutLogin';
import authApi from '../../apis/backend/auth';
import { spaceToast } from '../../component/SpaceToastify';
import usePageTitle from '../../hooks/usePageTitle';
import './Login.css';

export default function ForgotPasswordTeacher() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isSunTheme } = useTheme();

    // Set page title
    usePageTitle('Forgot Password via Teacher');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username.trim()) {
            spaceToast.error(t('forgotPassword.usernameRequired') || 'Please enter your username');
            return;
        }

        setLoading(true);
        
        try {
            const response = await authApi.requestPasswordByTeacher(username);
            
            // Show success message
            spaceToast.success(response.data.message || t('forgotPassword.teacherResetSuccess') || 'Password reset request sent to teacher successfully!');
            
            // Redirect back to login after a delay
            setTimeout(() => {
                navigate('/login-student');
            }, 2000);
            
        } catch (error) {
            console.error('Reset password by teacher error:', error);
            
            // Handle error from API
            if (error.response) {
                const errorMessage = error.response.data.error || error.response.data.message;
                spaceToast.error(errorMessage);
            } else {
                spaceToast.error(t('forgotPassword.resetError') || 'An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login-student');
    };

    return (
        <ThemeLayoutLogin>
            <div className="main-content" style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className='d-flex align-items-center justify-content-center w-100'>
                    <div className='row justify-content-center w-100'>
                        <div
                            className='card mb-0'
                            style={getLoginCardStyle(isSunTheme)}>
                            <div
                                className='card-body'
                                style={{ padding: '1rem 1.5rem 1rem 1.5rem' }}>
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
                                            {t('forgotPassword.viaTeacher')}
                                        </h5>
                                    </div>
                                    
                                    {/* Description */}
                                    <div className='text-center mb-4'>
                                        <p
                                            style={{ 
                                                color: isSunTheme ? '#6b7280' : '#C8C8F7',
                                                fontSize: '16px',
                                                fontWeight: 400,
                                                margin: 0
                                            }}>
                                            {t('forgotPassword.teacherDescription')}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className='mb-4'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='username' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('login.username')}
                                                </label>
                                                <Input
                                                    id='username'
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    prefix={<UserOutlined />}
                                                    size='large'
                                                    placeholder={t('login.usernamePlaceholder') || 'Enter your username'}
                                                    style={getInputStyle(isSunTheme)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className='text-center'>
                                            <button
                                                type='submit'
                                                className='btn w-90 mb-4 rounded-3'
                                                style={getSubmitButtonStyle(isSunTheme)}
                                                disabled={loading}>
                                                {loading ? t('common.loading') : t('forgotPassword.send')}
                                            </button>
                                        </div>
                                    </form>
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
    borderRadius: 24,
    boxShadow: isSunTheme 
        ? '0 15px 40px rgba(0, 0, 0, 0.15)' 
        : '0 15px 40px rgba(77, 208, 255, 0.25)',
    border: isSunTheme ? '2px solid #3B82F6' : 'none',
    minWidth: 350,
    maxWidth: 500,
    margin: '0 auto',
    padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
    fontSize: '32px',
    fontWeight: 700,
    color: isSunTheme ? '#3b82f6' : '#fff',
    textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
    marginBottom: '8px',
});

const getLabelStyle = (isSunTheme) => ({
    color: isSunTheme ? '#3b82f6' : '#ffffff',
    fontWeight: 400,
    fontSize: '16px',
    marginBottom: '6px',
});

const getInputStyle = (isSunTheme) => ({
    borderRadius: '50px',
    background: isSunTheme ? '#ffffff' : '#ffffff',
    border: isSunTheme ? '2px solid #3B82F6' : 'none',
    color: isSunTheme ? '#374151' : 'black',
    fontSize: '14px',
    width: '90%',
    margin: '0 auto',
    height: '40px',
});

const getSubmitButtonStyle = (isSunTheme) => ({
    background: isSunTheme 
        ? 'linear-gradient(135deg, #FFFFFF 10%, #DFEDFF 34%, #C3DEFE 66%, #9CC8FE 100%)' 
        : 'linear-gradient(135deg, #D9D9D9 0%, #CAC0E3 42%, #BAA5EE 66%, #AA8BF9 100%)',
    border: 'none',
    color: 'black',
    fontWeight: 600,
    fontSize: '18px',
    padding: '10px 20px',
    width: '90%',
    borderRadius: '10px',
    boxShadow: isSunTheme 
        ? '0 6px 20px rgba(139, 176, 249, 0.3)' 
        : '0 6px 20px rgba(170, 139, 249, 0.3)',
    transition: 'all 0.3s ease',
});
