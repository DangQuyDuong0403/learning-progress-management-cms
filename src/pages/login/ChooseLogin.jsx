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
    const roleUpper = role.toUpperCase();
    localStorage.setItem('selectedRole', roleUpper);
    localStorage.setItem('loginRole', roleUpper);
    if (role === 'student') {
      navigate('/login-student');
    } else if (role === 'teacher') {
      navigate('/login-teacher');
    }
  };

  return (
    <ThemedLayoutFullScreen>
      <div className="main-content" style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Theme Toggle - Top Right */}
        <div className={`login-theme-toggle-container ${isSunTheme ? 'sun-theme' : 'space-theme'}`} style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <ThemeToggleSwitch />
          <LanguageToggle />
        </div>
        

        <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <h1 className="page-title" style={{
            fontSize: 40,
            fontWeight: 700,
            color: isSunTheme ? '#3b82f6' : '#fff',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: 0.5,
            textShadow: isSunTheme ? 'none' : '0 0 20px rgba(77, 208, 255, 0.5)',
            width: '100%'
          }}>
            {t('login.chooseRole')}
          </h1>      
        </div>
          <div className="role-cards" style={{ display: 'flex', gap: 60, justifyContent: 'center',justifySelf: 'center',flexWrap: 'wrap', maxWidth: 900, width: '100%', marginTop: '30px' }}>
           
            {/* Student Card */}
            <div className="role-card" style={getRoleCardStyle(isSunTheme)} onClick={() => selectRole('student')}>
              <div className="role-illustration student-illustration" style={getRoleIllustrationStyle(isSunTheme)}>
                <img 
                  src="/img/student-illustration.svg" 
                  alt="Student illustration" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
  background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.7)',
  backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
  borderRadius: 20,
  padding: '50px 40px',
  boxShadow: isSunTheme 
    ? '0 12px 40px rgba(0, 0, 0, 0.1)' 
    : '0 12px 40px rgba(77, 208, 255, 0.15)',
  textAlign: 'center',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',

  width: 400,
  marginBottom: 20,
});

const getRoleIllustrationStyle = (isSunTheme) => ({
  width: '80%',
  height: 220,
  margin: '0 auto 25px',
  background: isSunTheme 
    ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' 
    : 'linear-gradient(135deg, rgba(77, 208, 255, 0.1) 0%, rgba(77, 208, 255, 0.2) 100%)',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  border: isSunTheme 
    ? '1px solid rgba(0, 0, 0, 0.05)' 
    : '1px solid rgba(77, 208, 255, 0.2)',
  padding: 0,
});

const getRoleButtonStyle = (isSunTheme) => ({
  background: isSunTheme 
    ? 'linear-gradient(135deg, #FFFFFF 10%, #DFEDFF 34%, #C3DEFE 66%, #9CC8FE 100%)'
    : 'linear-gradient(135deg, #D9D9D9 0%, #CAC0E3 42%, #BAA5EE 66%, #AA8BF9 100%)',
  border: 'none',
  color: '#000000',
  padding: '14px 28px', // Giảm padding
  borderRadius: 10,
  fontWeight: 700, 
  fontSize: 16, // Giảm font size từ 18 xuống 16
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  letterSpacing: '0.5px', 
  transition: 'all 0.3s ease',
  width: '100%',
  marginTop: 14,
});
