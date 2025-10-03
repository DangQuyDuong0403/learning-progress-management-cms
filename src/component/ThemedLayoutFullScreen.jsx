import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemedLayout.css';

const ThemedLayoutFullScreen = ({ children }) => {
  const { theme } = useTheme();

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
          <div className="astronaut-decoration-icon">
            <img 
              src="/img/astronut-11.png" 
              alt="Astronaut Decoration" 
              className="astronaut-icon-image" 
            />
          </div>
        )}

        {/* Space Theme Decorations */}
        {theme === 'space' && (
          <>
           
            
            {/* Astronaut rocket */}
            <img 
              className="astronaut-rocket" 
              src="/img/astro.png" 
              alt="astronaut rocket" 
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
