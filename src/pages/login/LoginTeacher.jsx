import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import { Input, Button } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import './Login.css';

export default function LoginTeacher() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isSunTheme } = useTheme();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation: empty fields
        if (!username || !password) {
            spaceToast.error("Fields cannot be empty!");
            return;
        }
        // Validation: email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(username)) {
            spaceToast.error("Invalid email format!");
            return;
        }
        // Fake login logic for demo
        if (
            (username === 'admin@gmail.com' && password === '123456') ||
            (username === 'manager@gmail.com' && password === '123456') ||
            (username === 'teacher@gmail.com' && password === '123456')
        ) {
            let role = '';
            if (username === 'admin@gmail.com') role = 'ADMIN';
            else if (username === 'manager@gmail.com') role = 'MANAGER';
            else if (username === 'teacher@gmail.com') role = 'TEACHER';
            const fakeResponse = {
                user: { id: 1, name: username, email: username, role },
                token: 'fake-jwt-token-123',
            };
            dispatch(loginSuccess(fakeResponse));
            spaceToast.success('Login successful!');
            
            // Redirect based on role
            let redirectPath = '/choose-login';
            if (role === 'ADMIN') {
                redirectPath = '/admin/accounts';
            } else if (role === 'MANAGER') {
                redirectPath = '/manager/syllabuses';
            } else if (role === 'TEACHER') {
                redirectPath = '/teacher/classes';
            }
            
            setTimeout(() => {
                navigate(redirectPath);
            }, 1000);
        } else {
            spaceToast.error('Wrong username or password!');
        }
    };

    const handleBackToChoose = () => {
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
                
                {/* Logo CAMKEY - Top Left */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {isSunTheme ? (
                            <img 
                                src="/img/sun-logo.png" 
                                alt="CAMKEY Logo" 
                                style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))'
                                }} 
                            />
                        ) : (
                            <span style={{ color: '#7DD3FC', fontSize: '36px', textShadow: '0 0 15px rgba(125, 211, 252, 0.8)' }}>🚀</span>
                        )}
                        <span style={{ 
                            fontSize: '28px', 
                            fontWeight: 700, 
                            color: isSunTheme ? '#3b82f6' : '#fff',
                            textShadow: isSunTheme ? '0 0 5px rgba(59, 130, 246, 0.5)' : '0 0 15px rgba(255, 255, 255, 0.8)'
                        }}>
                            CAMKEY
                        </span>
                    </div>
                </div>

                <div className='d-flex align-items-center justify-content-center w-100'>
                    <div className='row justify-content-center w-100'>
                        <div className='col-md-10 col-lg-8 col-xxl-5'>
                            <div
                                className='card mb-0'
                                style={getLoginCardStyle(isSunTheme)}>
                                <div className='card-body' style={{ padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
                                    {/* Back Button */}
                                    <div className='d-flex justify-content-start mb-3'>
                                        <Button
                                            type='text'
                                            icon={<ArrowLeftOutlined style={{ color: isSunTheme ? '#3b82f6' : '#c8c8f7' }} />}
                                            onClick={handleBackToChoose}
                                            style={{
                                                color: isSunTheme ? '#3b82f6' : '#c8c8f7',
                                                fontWeight: 600,
                                                padding: '4px 8px',
                                                height: 'auto',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                            {t('common.back')}
                                        </Button>
                                    </div>
                                    <h3 className='text-center mb-2' style={getHeadingStyle(isSunTheme)}>Log in to the management system</h3>
                                        <form onSubmit={handleSubmit}>
                                            <div className='mb-3'>
                                                <label htmlFor='loginUsername' className='form-label' style={getLabelStyle(isSunTheme)}>
                                                    {t('login.username')}
                                                </label>
                                                <Input
                                                    id='loginUsername'
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    prefix={<UserOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                />
                                            </div>
                                            <div className='mb-4'>
                                                <label htmlFor='loginPassword' className='form-label' style={getLabelStyle(isSunTheme)}>
                                                    {t('login.password')}
                                                </label>
                                                <Input.Password
                                                    id='loginPassword'
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    prefix={<LockOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                    styles={{
                                                        suffix: {
                                                            color: isSunTheme ? '#6b7280' : '#ffffff'
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className='d-flex align-items-center justify-content-between mb-4'>
                                                <div className='form-check'>
                                                    <input
                                                        className='form-check-input primary'
                                                        type='checkbox'
                                                        value=''
                                                        id='flexCheckChecked'
                                                        defaultChecked
                                                        style={{
                                                            accentColor: isSunTheme ? '#1677ff' : '#c8c8f7'
                                                        }}
                                                    />
                                                    <label
                                                        className='form-check-label'
                                                        htmlFor='flexCheckChecked'
                                                        style={getLabelStyle(isSunTheme)}>
                                                        {t('login.rememberMe')}
                                                    </label>
                                                </div>
                                                <a
                                                    className='fw-bold forgot-password'
                                                    href='/forgot-password-email'
                                                    style={{ 
                                                        color: isSunTheme ? '#3b82f6' : '#c8c8f7' 
                                                    }}>
                                                    {t('login.forgotPassword')}
                                                </a>
                                            </div>
                                            <div className='text-center'>
                                                <button
                                                    type='submit'
                                                    className='btn w-100 mb-4 rounded-3'
                                                    style={getSubmitButtonStyle(isSunTheme)}>
                                                    {t('login.signIn')}
                                                </button>
                                            </div>
                                        </form>
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
    background: isSunTheme ? 'rgba(255, 255, 255, 0.4)' : 'rgba(109, 95, 143, 0.4)',
    backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
    borderRadius: 32,
    boxShadow: isSunTheme 
        ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
        : '0 20px 60px rgba(77, 208, 255, 0.25)',
    border: isSunTheme 
        ? '1px solid #3b82f6' 
        : '1px solid #131326',
    minWidth: 520,
    maxWidth: 720,
    margin: '0 auto',
    padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
    fontSize: 30,
    fontWeight: 800,
    color: isSunTheme ? '#3b82f6' : '#fff',
    textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
    letterSpacing: 0.5,
});

const getLabelStyle = (isSunTheme) => ({
    color: isSunTheme ? '#3b82f6' : '#c8c8f7',
    fontWeight: 600,
    marginBottom: '8px',
});

const getInputStyle = (isSunTheme) => ({
    borderRadius: '8px',
    background: isSunTheme ? '#e9f7fa' : '#afa0d3',
    border: isSunTheme ? '1px solid #3b82f6' : '1px solid #131326',
    color: isSunTheme ? '#374151' : '#ffffff',
    fontSize: 16,
});

const getSubmitButtonStyle = (isSunTheme) => ({
    background: isSunTheme 
        ? 'linear-gradient(135deg, #ffffff, #8bb0f9, #1d0161)' 
        : 'linear-gradient(135deg, #ffffff, #aa8bf9, #1d0161)',
    border: 'none',
    color: 'black',
    fontWeight: 700,
    fontSize: 18,
    padding: '14px 0',
    width: '100%',
    borderRadius: '12px',
    boxShadow: isSunTheme 
        ? '0 8px 25px rgba(139, 176, 249, 0.3)' 
        : '0 8px 25px rgba(170, 139, 249, 0.3)',
    transition: 'all 0.3s ease',
});
