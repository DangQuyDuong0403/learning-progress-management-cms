import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import { Input, Button } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import './Login.css';

export default function LoginTeacher() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
        <div className='kids-space'>
            {/* Language Toggle - Top Right */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                <LanguageToggle />
            </div>
            
            <div
                className='page-wrapper'
                id='main-wrapper'
                data-layout='vertical'
                data-navbarbg='skin6'
                data-sidebartype='full'
                data-sidebar-position='fixed'
                data-header-position='fixed'>
                <div className='position-relative overflow-hidden min-vh-100 d-flex align-items-center justify-content-center'>
                    <div className='d-flex align-items-center justify-content-center w-100'>
                        <div className='row justify-content-center w-100'>
                            <div className='col-md-10 col-lg-8 col-xxl-5'>
                                <div className='card mb-0 kids-card' style={{ minWidth: 520, maxWidth: 720, margin: '0 auto', padding: 0, borderRadius: 32, boxShadow: '0 20px 60px rgba(30, 20, 90, 0.25)' }}>
                                    <div className='card-body' style={{ padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
                                        {/* Back Button */}
                                        <div className='d-flex justify-content-start mb-3'>
                                            <Button
                                                type='text'
                                                icon={<ArrowLeftOutlined />}
                                                onClick={handleBackToChoose}
                                                style={{
                                                    color: '#1677ff',
                                                    fontWeight: 600,
                                                    padding: '4px 8px',
                                                    height: 'auto',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                {t('common.back')} to Choose Role
                                            </Button>
                                        </div>
                                        <h3 className='text-center kids-heading mb-2' style={{ fontSize: 30, fontWeight: 800, background: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textFillColor: 'transparent', letterSpacing: 0.5 }}>Log in to the management system</h3>
                                        <form onSubmit={handleSubmit}>
                                            <div className='mb-3'>
                                                <label htmlFor='loginUsername' className='form-label' style={{ fontWeight: 600 }}>
                                                    {t('login.username')}
                                                </label>
                                                <Input
                                                    id='loginUsername'
                                                    placeholder={t('login.username')}
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    prefix={<UserOutlined />}
                                                    size='large'
                                                    style={{ borderRadius: '8px', fontSize: 16 }}
                                                />
                                            </div>
                                            <div className='mb-4'>
                                                <label htmlFor='loginPassword' className='form-label' style={{ fontWeight: 600 }}>
                                                    {t('login.password')}
                                                </label>
                                                <Input.Password
                                                    id='loginPassword'
                                                    placeholder={t('login.password')}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    prefix={<LockOutlined />}
                                                    size='large'
                                                    style={{ borderRadius: '8px', fontSize: 16 }}
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
                                                    />
                                                    <label
                                                        className='form-check-label text-dark'
                                                        htmlFor='flexCheckChecked'>
                                                        {t('login.rememberMe')}
                                                    </label>
                                                </div>
                                                <a
                                                    className='fw-bold forgot-password'
                                                    href='/forgot-password-email'>
                                                    {t('login.forgotPassword')}
                                                </a>
                                            </div>
                                            <div className='text-center'>
                                                <button
                                                    type='submit'
                                                    className='btn btn-space w-100 mb-4 rounded-3'
                                                    style={{ color: 'white', fontWeight: 700, fontSize: 18, padding: '14px 0' }}>
                                                    {t('login.signIn')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img className='rocket-bg' src='img/astro.png' alt='rocket' />
                    <img className='planet-1' src='img/planet-1.png' alt='plant-1' />
					<img className='planet-2' src='img/planet-2.png' alt='plant-2' />
					<img className='planet-3' src='img/planet-3.png' alt='plant-3' />
					<img className='planet-4' src='img/planet-4.png' alt='plant-4' />
					<img className='planet-5' src='img/planet-5.png' alt='plant-5' />
					<img className='planet-6' src='img/planet-6.png' alt='plant-6' />
                    <svg
                        className='planet'
                        viewBox='0 0 120 120'
                        xmlns='http://www.w3.org/2000/svg'
                        aria-hidden='true'>
                        <defs>
                            <linearGradient id='pGrad' x1='0' x2='1' y1='0' y2='1'>
                                <stop offset='0%' stopColor='#ff7ad9' />
                                <stop offset='100%' stopColor='#ffd36e' />
                            </linearGradient>
                        </defs>
                        <circle cx='60' cy='60' r='34' fill='url(#pGrad)' />
                        <ellipse
                            cx='60'
                            cy='70'
                            rx='54'
                            ry='14'
                            fill='none'
                            stroke='#ffe8a3'
                            strokeWidth='6'
                        />
                        <ellipse
                            cx='60'
                            cy='70'
                            rx='54'
                            ry='14'
                            fill='none'
                            stroke='#ffb3e6'
                            strokeWidth='3'
                        />
                    </svg>

                    <div className='twinkle' aria-hidden='true'>
                        <span className='star star-1'></span>
                        <span className='star star-2'></span>
                        <span className='star star-3'></span>
                        <span className='star star-4'></span>
                        <span className='star star-5'></span>
                        <span className='star star-6'></span>
                        <span className='star star-7'></span>
                        <span className='star star-8'></span>
                        <span className='star star-9'></span>
                        <span className='star star-10'></span>
                        <span className='star star-11'></span>
                        <span className='star star-12'></span>
                        <span className='star star-13'></span>
                        <span className='star star-14'></span>
                        <span className='star star-15'></span>
                        <span className='star star-16'></span>
                        <span className='star star-17'></span>
                        <span className='star star-18'></span>
                    </div>

                    <svg
                        className='moon'
                        viewBox='0 0 100 100'
                        xmlns='http://www.w3.org/2000/svg'
                        aria-hidden='true'>
                        <defs>
                            <linearGradient id='mGrad' x1='0' x2='1' y1='0' y2='1'>
                                <stop offset='0%' stopColor='#d9e6ff' />
                                <stop offset='100%' stopColor='#ffffff' />
                            </linearGradient>
                        </defs>
                        <circle
                            cx='50'
                            cy='50'
                            r='30'
                            fill='url(#mGrad)'
                            stroke='#e5e8ff'
                        />
                        <circle cx='62' cy='40' r='5' fill='#ccd6ff' />
                        <circle cx='42' cy='58' r='6' fill='#ccd6ff' />
                        <circle cx='56' cy='64' r='3' fill='#ccd6ff' />
                    </svg>
                </div>
            </div>
        </div>
    );
}
