import React from 'react';
import { Layout as AntLayout } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedHeader from '../ThemedHeader';
import './ThemedLayout.css';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

const { Content } = AntLayout;

const ThemedLayout = ({ children, customHeader, contentMargin = 20, contentPadding = 20 }) => {
  const { theme } = useTheme();

  return (
    <AntLayout 
      className={`themed-layout ${theme}-theme`}
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
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Main Content Area */}
      <AntLayout 
        className={`themed-main-layout ${theme}-main-layout`}
        style={{ 
          marginLeft: 0,
          width: '100vw',
          maxWidth: '100vw',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Themed Header */}
        <div style={{ position: 'relative', zIndex: 10000 }}>
          {customHeader || <ThemedHeader hideThemeToggle hideLanguageToggle />}
        </div>

        {/* Background Elements */}
        <div className="bg-element-1"></div>
        {/* <div className="bg-element-2"></div> */}
        <div className="bg-element-3"></div>
        <div className="bg-element-4"></div>
        <div className="bg-element-5"></div>
        
        {/* Overlay Element for Space Theme - Overlays Sidebar */}
        {theme === 'space' && <div className="bg-element-2-overlay"></div>}

        {/* Content */}
        <Content
          className={`themed-content ${theme}-content`}
          style={{
            margin: `${contentMargin}px 0`,
            padding: `${contentPadding}px 0`,
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            maxHeight: 'calc(100vh - 112px)',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            paddingLeft: '40px',
            zIndex: 1
          }}
        >
          <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: 'leave',
                autoHideSuspend: false,
                theme: 'os-theme-custom',
                visibility: 'auto',
                pointers: ['mouse', 'touch', 'pen']
              },
              overflow: { x: 'hidden', y: 'scroll' }
            }}
            style={{ height: 'calc(100vh - 112px)', width: '100%' }}
            className={`themed-sidebar-scrollbar themed-content-scrollbar ${theme}-content-scrollbar`}
          >
            {children}
          </OverlayScrollbarsComponent>
          
          {/* Sun Theme Background Decorations - Only for Sun Theme */}
          {theme === 'sun' && (
            <>
              <div className="sun-decoration-icon">
                <img 
                  src="/img/icon-sun1.png" 
                  alt="Sun Decoration" 
                  className="sun-icon-image" 
                />
              </div>
              <div className="astronaut-decoration-icon">
                <img 
                  src="/img/astronut-11.png" 
                  alt="Astronaut Decoration" 
                  className="astronaut-icon-image" 
                />
              </div>
            </>
          )}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default ThemedLayout;

