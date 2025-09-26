import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Tận dụng lại nền và hiệu ứng từ Login.css

export default function ChooseLogin() {
  const navigate = useNavigate();

  const selectRole = (role) => {
    localStorage.setItem('selectedRole', role);
    if (role === 'student') {
      navigate('/login-student');
    } else if (role === 'teacher') {
      navigate('/login-teacher');
    }
  };

  return (
    <div className="kids-space" style={{ minHeight: '100vh' }}>
      <div className="main-content" style={{ paddingTop: 120, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container">
          <h1 className="page-title" style={{fontSize: 48,fontWeight: 700,background: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)',WebkitBackgroundClip: 'text',WebkitTextFillColor: 'transparent',backgroundClip: 'text', textFillColor: 'transparent',textAlign: 'center',marginBottom: 16,letterSpacing: 0.5 }}>
            Welcome to Camkey
          </h1>
          <p className="page-subtitle" style={{ fontSize: 20, color: '#4dd0ff', textAlign: 'center', marginBottom: 60, fontWeight: 500 }}>Choose role to continue</p>
          <div className="role-cards" style={{ display: 'flex', gap: 40, justifyContent: 'center',justifySelf: 'center',flexWrap: 'wrap', maxWidth: 1000, width: '100%' }}>
           
            {/* Student Card */}
            <div className="role-card" style={roleCardStyle} onClick={() => selectRole('student')}>
              <div className="role-illustration student-illustration" style={roleIllustrationStyle}>
                <img 
                  src="/img/student-illustration.svg" 
                  alt="Student illustration" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <button className="role-button" style={roleButtonStyle}>I am student</button>
            </div>
            {/* Teacher Card */}
            <div className="role-card" style={roleCardStyle} onClick={() => selectRole('teacher')}>
              <div className="role-illustration teacher-illustration" style={roleIllustrationStyle}>
                <img 
                  src="/img/teacher-illustration.svg" 
                  alt="Teacher illustration" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <button className="role-button" style={roleButtonStyle}>I am teacher</button>
            </div>
          
          </div>
        </div>
      </div>
      {/* Background decorative elements */}
      <img className="rocket-bg" src="/img/astro.png" alt="rocket" style={{ position: 'absolute', right: '2%', bottom: '2%', width: 120, opacity: 0.9, pointerEvents: 'none', animation: 'float 4s ease-in-out infinite' }} />
          <img className='planet-1' src='img/planet-1.png' alt='plant-1' />
					<img className='planet-2' src='img/planet-2.png' alt='plant-2' />
					<img className='planet-3' src='img/planet-3.png' alt='plant-3' />
					<img className='planet-4' src='img/planet-4.png' alt='plant-4' />
					<img className='planet-5' src='img/planet-5.png' alt='plant-5' />
					<img className='planet-6' src='img/planet-6.png' alt='plant-6' />
      {/* Decorative planet */}
      <svg className="planet" viewBox="0 0 120 120" style={{ position: 'absolute', top: '8%', left: '6%', width: 130, opacity: 0.5, pointerEvents: 'none', animation: 'float 6s ease-in-out infinite', animationDelay: '.4s' }}>
        <defs>
          <linearGradient id="pGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff7ad9" />
            <stop offset="100%" stopColor="#ffd36e" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="34" fill="url(#pGrad)" />
        <ellipse cx="60" cy="70" rx="54" ry="14" fill="none" stroke="#ffe8a3" strokeWidth="6" />
        <ellipse cx="60" cy="70" rx="54" ry="14" fill="none" stroke="#ffb3e6" strokeWidth="3" />
      </svg>
      {/* Twinkle stars */}
      <div className="twinkle" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className={`star star-${i + 1}`}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              background: '#fff',
              borderRadius: '50%',
              opacity: 0.2,
              animation: 'twinkle 2.6s ease-in-out infinite',
              ...twinklePositions[i]
            }}
          />
        ))}
      </div>
      {/* Decorative moon */}
      <svg className="moon" viewBox="0 0 100 100" style={{ position: 'absolute', top: '22%', right: '12%', width: 90, opacity: 0.5, pointerEvents: 'none', animation: 'float 6s ease-in-out infinite', animationDelay: '1.2s' }}>
        <defs>
          <linearGradient id="mGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#d9e6ff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="30" fill="url(#mGrad)" stroke="#e5e8ff" />
        <circle cx="62" cy="40" r="5" fill="#ccd6ff" />
        <circle cx="42" cy="58" r="6" fill="#ccd6ff" />
        <circle cx="56" cy="64" r="3" fill="#ccd6ff" />
      </svg>
    </div>
  );
}

// Inline styles for illustration
const roleCardStyle = {
  background: 'white',
  borderRadius: 24,
  padding: '50px 40px',
  boxShadow: '0 15px 50px rgba(30, 20, 90, 0.15)',
  textAlign: 'center',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  border: '2px solid transparent',
  width: 400,
  marginBottom: 24,
};

const roleIllustrationStyle = {
  width: 250,
  height: 180,
  margin: '0 auto 30px',
  background: 'linear-gradient(135deg, #f1f5ff 0%, #e4e8ff 100%)',
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
};

const roleButtonStyle = {
  background: 'linear-gradient(90deg, #5e17eb 0%, #7a5cff 50%, #4dd0ff 100%)',
  border: 'none',
  color: 'white',
  padding: '16px 32px',
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 16,
  transition: 'all 0.3s ease',
  width: '100%',
  marginTop: 16,
};

const twinklePositions = [
  { left: '3%', top: '10%', animationDelay: '.1s' },
  { left: '12%', top: '28%', animationDelay: '.8s' },
  { left: '22%', top: '6%', animationDelay: '1.6s' },
  { left: '30%', top: '18%', animationDelay: '2.1s' },
  { left: '38%', top: '9%', animationDelay: '1.1s' },
  { left: '46%', top: '26%', animationDelay: '.5s' },
  { left: '55%', top: '12%', animationDelay: '2.3s' },
  { left: '63%', top: '22%', animationDelay: '1.4s' },
  { left: '72%', top: '8%', animationDelay: '.3s' },
  { left: '80%', top: '20%', animationDelay: '1.9s' },
  { left: '88%', top: '6%', animationDelay: '.7s' },
  { left: '6%', top: '44%', animationDelay: '1.2s' },
  { left: '18%', top: '58%', animationDelay: '.9s' },
  { left: '36%', top: '48%', animationDelay: '1.8s' },
  { left: '50%', top: '56%', animationDelay: '.2s' },
  { left: '64%', top: '44%', animationDelay: '1.3s' },
  { left: '78%', top: '52%', animationDelay: '.6s' },
  { left: '92%', top: '42%', animationDelay: '1.7s' },
];