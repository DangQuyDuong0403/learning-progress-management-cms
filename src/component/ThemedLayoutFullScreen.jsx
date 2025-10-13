import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './ThemedLayout.css';

const ThemedLayoutFullScreen = ({ children }) => {
  const navigate = useNavigate();
  const { theme, isSunTheme } = useTheme();

  const handleCamkeyClick = () => {
    navigate('/choose-login');
  };

  return (
    <div 
      className={`themed-layout-fullscreen ${theme}-theme`}
      style={{ 
        minHeight: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        overflow: 'hidden',
        backgroundImage: theme === 'sun' ? "url('/img/sun-logo2.png')" : "url('/img/bg-management.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Background Elements */}
      <div className="bg-element-1"></div>
      <div className="bg-element-2"></div>
      <div className="bg-element-3"></div>
      <div className="bg-element-4"></div>
      <div className="bg-element-5"></div>

      {/* Space Theme Background Images */}
      {theme === 'space' && (
        <>
          {/* img-bg-2.png - top right */}
          <img 
            src="/img/img-bg-2.png" 
            alt="Space decoration" 
            style={{ 
              position: 'absolute', 
              top: '5%', 
              right: '5%', 
              width: 250, 
              height: 250,
              opacity: 0.8, 
              pointerEvents: 'none', 
              zIndex: 1
            }} 
          />
          
          {/* img-bg-3.png - bottom left */}
          <img 
            src="/img/img-bg-3.png" 
            alt="Space decoration" 
            style={{ 
              position: 'absolute', 
              bottom: '5%', 
              left: '5%', 
              width: 250, 
              height: 250,
              opacity: 0.8, 
              pointerEvents: 'none', 
              zIndex: 1
            }} 
          />
          
         
          
          {/* img-bg.png - top left */}
          <img 
            src="/img/img-bg.png" 
            alt="Space decoration" 
            style={{ 
              position: 'absolute', 
              top: '10%', 
              left: '10%', 
              width: 200, 
              height: 200,
              opacity: 0.8, 
              pointerEvents: 'none', 
              zIndex: 1
            }} 
          />
          
          {/* img-bg-1.png - center */}
          <img 
            src="/img/img-bg-1.png" 
            alt="Space decoration" 
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: 900, 
              height: 900,
              opacity: 0.6, 
              pointerEvents: 'none', 
              zIndex: 1,
             
            }} 
          />
        </>
      )}

      {/* Logo CAMKEY - Top Left */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onClick={handleCamkeyClick}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          {isSunTheme ? (
            <img 
              src="/img/sun-logo.png" 
              alt="CAMKEY Logo" 
              style={{ 
                width: '100px', 
                height: '100px', 
                filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))'
              }} 
            />
          ) : (
            <img 
              src="/img/astro.png" 
              alt="CAMKEY Logo" 
              style={{ 
                width: '100px', 
                height: '100px', 
                filter: 'drop-shadow(0 0 15px rgba(125, 211, 252, 0.8))'
              }} 
            />
          )}
          <span style={{ 
            fontSize: '40px', 
            fontWeight: 700, 
            color: isSunTheme ? '#1E40AF' : '#FFFFFF',
            textShadow: isSunTheme ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(255, 255, 255, 0.8)'
          }}>
            CAMKEY
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`themed-content-fullscreen ${theme}-content`}
        style={{ 
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100vh',
          overflow: 'auto'
        }}
      >
        {children}
        
        {/* Sun Decoration Icon - Only for Sun Theme */}
        {theme === 'sun' && (
          <div className="sun-decoration-icon">
            <img 
              src="/img/icon-sun1.png" 
              alt="Sun Decoration" 
              className="sun-icon-image" 
            />
          </div>
        )}

        {/* Astronaut Decoration Icon - Only for Sun Theme */}
        {theme === 'sun' && (
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000 }}>
            <img 
              src="/img/astronut-11.png" 
              alt="Astronaut Decoration" 
              style={{ 
                width: '120px', 
                height: 'auto',
                filter: 'drop-shadow(0 0 20px rgba(125, 211, 252, 0.6))'
              }} 
            />
          </div>
        )}

        {/* Space Theme Decorations */}
        {theme === 'space' && (
          <>
            {/* Spaceship - Bottom Right */}
            <img 
              src="/img/spaceship-1.png" 
              alt="Spaceship" 
              style={{ 
                position: 'absolute', 
                right: '2%', 
                bottom: '2%', 
                width: 120, 
                opacity: 0.9, 
                pointerEvents: 'none', 
                animation: 'float 4s ease-in-out infinite',
                animationDelay: '0.5s'
              }} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ThemedLayoutFullScreen;
