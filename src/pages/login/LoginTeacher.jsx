import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/auth';
import { toast } from 'react-toastify';
import './Login.css';

export default function LoginTeacher() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation: empty fields
        if (!username || !password) {
            toast.error("Fields cannot be empty!");
            return;
        }
        // Validation: email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(username)) {
            toast.error("Invalid email format!");
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
                user: { id: 1, name: username, role },
                token: 'fake-jwt-token-123',
            };
            dispatch(loginSuccess(fakeResponse));
            toast.success('Login successful!');
            setTimeout(() => {
                navigate('/home');
            }, 1000);
        } else {
            toast.error('Wrong username or password!');
        }
    };

    return (
        <div className='kids-space'>
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
                                <div className='card mb-0 kids-card' style={{ minWidth: 420, maxWidth: 520, margin: '0 auto', padding: 0, borderRadius: 32, boxShadow: '0 20px 60px rgba(30, 20, 90, 0.25)' }}>
                                    <div className='card-body' style={{ padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
                                        <h3 className='text-center kids-heading mb-2' style={{ fontSize: 30, fontWeight: 800, background: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textFillColor: 'transparent', letterSpacing: 0.5 }}>Log in to the management system</h3>
                                        <form onSubmit={handleSubmit}>
                                            <div className='mb-3'>
                                                <label htmlFor='loginUsername' className='form-label' style={{ fontWeight: 600 }}>
                                                    User name
                                                </label>
                                                <div className='input-group'>
                                                    <span className='input-group-text'>
                                                        <svg
                                                            className='ti ti-user'
                                                            width='20'
                                                            height='20'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'>
                                                            <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
                                                            <circle cx='12' cy='7' r='4'></circle>
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type='text'
                                                        className='form-control'
                                                        id='loginUsername'
                                                        placeholder='Username'
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        aria-describedby='emailHelp'
                                                        style={{ fontSize: 16 }}
                                                    />
                                                </div>
                                            </div>
                                            <div className='mb-4'>
                                                <label htmlFor='loginPassword' className='form-label' style={{ fontWeight: 600 }}>
                                                    Password
                                                </label>
                                                <div className='input-group' style={{ position: 'relative' }}>
                                                    <span className='input-group-text'>
                                                        <svg
                                                            className='ti ti-lock'
                                                            width='20'
                                                            height='20'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'>
                                                            <rect
                                                                x='3'
                                                                y='11'
                                                                width='18'
                                                                height='11'
                                                                rx='2'
                                                                ry='2'></rect>
                                                            <circle cx='12' cy='16' r='1'></circle>
                                                            <path d='m7 11V7a5 5 0 0 1 10 0v4'></path>
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className='form-control'
                                                        id='loginPassword'
                                                        placeholder='Password'
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        style={{ fontSize: 16 }}
                                                    />
                                                    <span
                                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                                                        onClick={() => setShowPassword(v => !v)}
                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    >
                                                        {showPassword ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                                                        )}
                                                    </span>
                                                </div>
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
                                                        Remember this device
                                                    </label>
                                                </div>
                                                <a
                                                    className='fw-bold forgot-password'
                                                    href='/forgot-password'>
                                                    Forgot your password?
                                                </a>
                                            </div>
                                            <div className='text-center'>
                                                <button
                                                    type='submit'
                                                    className='btn btn-space w-100 mb-4 rounded-3'
                                                    style={{ color: 'white', fontWeight: 700, fontSize: 18, padding: '14px 0' }}>
                                                    Sign in
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img className='rocket-bg' src='img/astro.png' alt='rocket' />

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
