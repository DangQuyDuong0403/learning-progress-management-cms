import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import './Login.css'; // Tận dụng lại nền và hiệu ứng từ Login.css

export default function ChooseLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isSunTheme } = useTheme();

  const selectRole = (role) => {
    localStorage.setItem('selectedRole', role);
    if (role === 'student') {
      navigate('/login-student');
    } else if (role === 'teacher') {
      navigate('/login-teacher');
    }
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

        <div className="container">
          <h1 className="page-title" style={{
            fontSize: 48,
            fontWeight: 700,
            color: isSunTheme ? '#3b82f6' : '#fff',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: 0.5,
            textShadow: isSunTheme ? 'none' : '0 0 20px rgba(77, 208, 255, 0.5)'
          }}>
            {t('login.chooseRole')}
          </h1>      
        </div>
          <div className="role-cards" style={{ display: 'flex', gap: 40, justifyContent: 'center',justifySelf: 'center',flexWrap: 'wrap', maxWidth: 1000, width: '100%', marginTop: '40px' }}>
           
            {/* Student Card */}
            <div className="role-card" style={getRoleCardStyle(isSunTheme)} onClick={() => selectRole('student')}>
              <div className="role-illustration student-illustration" style={getRoleIllustrationStyle(isSunTheme)}>
                <img 
                  src="/img/student-illustration.svg" 
                  alt="Student illus  tration" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <button className="role-button" style={getRoleButtonStyle(isSunTheme)}>{t('login.student')}</button>
            </div>
            {/* Teacher Card */}
            <div className="role-card" style={getRoleCardStyle(isSunTheme)} onClick={() => selectRole('teacher')}>
              <div className="role-illustration teacher-illustration" style={getRoleIllustrationStyle(isSunTheme)}>
                <img 
                  src="/img/teacher-illustration.svg" 
                  alt="Teacher illustration" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <button className="role-button" style={getRoleButtonStyle(isSunTheme)}>{t('login.teacher')}</button>
            </div>
          
          </div>
        </div>
    </ThemedLayoutFullScreen>
  );
}

// Dynamic styles that change based on theme
const getRoleCardStyle = (isSunTheme) => ({
  background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.4)',
  backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
  borderRadius: 24,
  padding: '60px 50px',
  boxShadow: isSunTheme 
    ? '0 15px 50px rgba(0, 0, 0, 0.1)' 
    : '0 15px 50px rgba(77, 208, 255, 0.15)',
  textAlign: 'center',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  border: isSunTheme 
    ? '2px solid #3B82F6' 
    : '2px solid #131326',
  width: 450,
  marginBottom: 24,
});

const getRoleIllustrationStyle = (isSunTheme) => ({
  width: 280,
  height: 200,
  margin: '0 auto 30px',
  background: isSunTheme 
    ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' 
    : 'linear-gradient(135deg, rgba(77, 208, 255, 0.1) 0%, rgba(77, 208, 255, 0.2) 100%)',
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  border: isSunTheme 
    ? '1px solid rgba(0, 0, 0, 0.05)' 
    : '1px solid rgba(77, 208, 255, 0.2)',
});

const getRoleButtonStyle = (isSunTheme) => ({
  background: isSunTheme 
    ? 'linear-gradient(135deg, #ffffff, #8bb0f9, #1d0161)' 
    : 'linear-gradient(135deg, #ffffff, #aa8bf9, #1d0161)',
  border: 'none',
  color: isSunTheme ? '#000000' : '#000000',
  padding: '16px 32px', // Tăng padding
  borderRadius: 12,
  fontWeight: 700, // Tăng font weight
  fontSize: 18, // Tăng font size từ 16 lên 18
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  textShadow: isSunTheme ? '0 1px 2px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.2)',
  letterSpacing: '0.5px', // Thêm letter spacing
  transition: 'all 0.3s ease',
  width: '100%',
  marginTop: 16,
});
