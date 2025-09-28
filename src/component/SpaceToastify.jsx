import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SpaceToastify = () => {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      toastStyle={{
        background: 'transparent',
        boxShadow: 'none',
        padding: '20px 24px',
        margin: '0 0 16px 0',
        minHeight: '88px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '20px',
      }}
      progressStyle={{
        background: 'linear-gradient(90deg, #00d4ff 0%, #5e17eb 50%, #ff6b6b 100%)',
        height: '3px',
        borderRadius: '2px',
      }}
      style={{
        '--toastify-color-light': '#0a0e27',
        '--toastify-color-dark': '#0a0e27',
        '--toastify-color-info': '#00d4ff',
        '--toastify-color-success': '#00ff88',
        '--toastify-color-warning': '#ffb347',
        '--toastify-color-error': '#ff6b6b',
      }}
    />
  );
};

// Custom toast functions with enhanced space theme
export const spaceToast = {
  success: (message) => {
    toast.success(message, {
      icon: () => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%)',
          border: '2px solid rgba(0, 255, 136, 0.6)',
          position: 'relative',
          animation: 'pulse 2s infinite',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.4), inset 0 0 20px rgba(0, 255, 136, 0.1)',
          flexShrink: 0
        }}>
          <img 
            src="/img/astro.png" 
            alt="Astro Success" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
              filter: 'brightness(1.3) contrast(1.2) drop-shadow(0 0 8px rgba(0, 255, 136, 0.6))',
              animation: 'float 3s ease-in-out infinite'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00ff88 0%, transparent 70%)',
            animation: 'sparkle 1.5s ease-in-out infinite'
          }} />
        </div>
      ),
      style: {
        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95) 0%, rgba(30, 20, 90, 0.9) 30%, rgba(94, 23, 235, 0.85) 70%, rgba(0, 212, 255, 0.8) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 255, 136, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        fontFamily: '"Orbitron", "Exo 2", system-ui, sans-serif',
        fontWeight: '500',
        fontSize: '14px',
        letterSpacing: '0.5px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        width: '450px',
        minWidth: '450px',
        maxWidth: '500px',
        minHeight: '88px',
        display: 'flex',
        alignItems: 'center',
        padding: '20px 24px',
        gap: '24px'
      },
      bodyStyle: {
        position: 'relative',
        zIndex: 2,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }
    });
  },
  
  error: (message) => {
    toast.error(message, {
      icon: () => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%)',
          border: '2px solid rgba(255, 107, 107, 0.6)',
          position: 'relative',
          animation: 'shake 0.5s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(255, 107, 107, 0.4), inset 0 0 20px rgba(255, 107, 107, 0.1)',
          flexShrink: 0
        }}>
          <img 
            src="/img/astro.png" 
            alt="Astro Error" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
              filter: 'brightness(1.3) contrast(1.2) drop-shadow(0 0 8px rgba(255, 107, 107, 0.6))',
              animation: 'wobble 2s ease-in-out infinite'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ff6b6b 0%, transparent 70%)',
            animation: 'flicker 1s ease-in-out infinite'
          }} />
        </div>
      ),
      style: {
        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95) 0%, rgba(90, 20, 30, 0.9) 30%, rgba(235, 23, 94, 0.85) 70%, rgba(255, 107, 107, 0.8) 100%)',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 107, 107, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        fontFamily: '"Orbitron", "Exo 2", system-ui, sans-serif',
        fontWeight: '500',
        fontSize: '14px',
        letterSpacing: '0.5px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        width: '450px',
        minWidth: '450px',
        maxWidth: '500px',
        minHeight: '88px',
        display: 'flex',
        alignItems: 'center',
        padding: '20px 24px',
        gap: '24px'
      },
      bodyStyle: {
        position: 'relative',
        zIndex: 2,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }
    });
  },
  
  info: (message) => {
    toast.info(message, {
      icon: () => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.05) 100%)',
          border: '2px solid rgba(0, 212, 255, 0.6)',
          position: 'relative',
          animation: 'glow 2s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1)',
          flexShrink: 0
        }}>
          <img 
            src="/img/astro.png" 
            alt="Astro Info" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
              filter: 'brightness(1.3) contrast(1.2) drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))',
              animation: 'rotate 4s linear infinite'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
        </div>
      ),
      style: {
        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95) 0%, rgba(20, 30, 90, 0.9) 30%, rgba(94, 23, 235, 0.85) 70%, rgba(0, 212, 255, 0.8) 100%)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        fontFamily: '"Orbitron", "Exo 2", system-ui, sans-serif',
        fontWeight: '500',
        fontSize: '14px',
        letterSpacing: '0.5px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        width: '450px',
        minWidth: '450px',
        maxWidth: '500px',
        minHeight: '88px',
        display: 'flex',
        alignItems: 'center',
        padding: '20px 24px',
        gap: '24px'
      },
      bodyStyle: {
        position: 'relative',
        zIndex: 2,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }
    });
  },
  
  warning: (message) => {
    toast.warning(message, {
      icon: () => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.15) 0%, rgba(255, 179, 71, 0.05) 100%)',
          border: '2px solid rgba(255, 179, 71, 0.6)',
          position: 'relative',
          animation: 'bounce 1s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(255, 179, 71, 0.4), inset 0 0 20px rgba(255, 179, 71, 0.1)',
          flexShrink: 0
        }}>
          <img 
            src="/img/astro.png" 
            alt="Astro Warning" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
              filter: 'brightness(1.3) contrast(1.2) drop-shadow(0 0 8px rgba(255, 179, 71, 0.6))',
              animation: 'swing 2s ease-in-out infinite'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffb347 0%, transparent 70%)',
            animation: 'twinkle 1.5s ease-in-out infinite'
          }} />
        </div>
      ),
      style: {
        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95) 0%, rgba(90, 60, 20, 0.9) 30%, rgba(235, 120, 23, 0.85) 70%, rgba(255, 179, 71, 0.8) 100%)',
        border: '1px solid rgba(255, 179, 71, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 179, 71, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        fontFamily: '"Orbitron", "Exo 2", system-ui, sans-serif',
        fontWeight: '500',
        fontSize: '14px',
        letterSpacing: '0.5px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        width: '450px',
        minWidth: '450px',
        maxWidth: '500px',
        minHeight: '88px',
        display: 'flex',
        alignItems: 'center',
        padding: '20px 24px',
        gap: '24px'
      },
      bodyStyle: {
        position: 'relative',
        zIndex: 2,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }
    });
  }
};

// Add CSS animations for enhanced space theme
const spaceToastStyles = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
  }
  
  @keyframes sparkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.2); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
  
  @keyframes wobble {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
  
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1); }
    50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.6), inset 0 0 30px rgba(0, 212, 255, 0.2); }
  }
  
  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes swing {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(10deg); }
    75% { transform: rotate(-10deg); }
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = spaceToastStyles;
  document.head.appendChild(styleSheet);
}

export default SpaceToastify;
