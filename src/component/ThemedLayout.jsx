import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import ThemedSidebar from './ThemedSidebar';
import ThemedHeader from './ThemedHeader';
import ROUTER_PAGE from '../constants/router';
import './ThemedLayout.css';

const { Sider, Content } = AntLayout;

const ThemedLayout = ({ children }) => {
  // Load collapsed state from localStorage, default to false
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    // Save to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
  };

  // Listen for changes in localStorage (from other tabs and ClassMenuContext)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        setCollapsed(JSON.parse(saved));
      }
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (from ClassMenuContext)
    window.addEventListener('sidebarStateChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarStateChanged', handleStorageChange);
    };
  }, []);

  // Handle logo/title click to redirect to dashboard based on user role
  const handleLogoClick = () => {
    const userRole = user?.role?.toLowerCase();
    let dashboardPath = '/choose-login'; // default fallback
    
    switch (userRole) {
      case 'admin':
        dashboardPath = ROUTER_PAGE.ADMIN_DASHBOARD;
        break;
      case 'manager':
        dashboardPath = ROUTER_PAGE.MANAGER_DASHBOARD;
        break;
      case 'teacher':
        dashboardPath = ROUTER_PAGE.TEACHER_DASHBOARD;
        break;
      case 'student':
        dashboardPath = ROUTER_PAGE.STUDENT_DASHBOARD;
        break;
      default:
        dashboardPath = '/choose-login';
    }
    
    navigate(dashboardPath);
  };

  // Force sidebar state to prevent auto-expansion
  React.useEffect(() => {
    const sider = document.querySelector('.themed-sider');
    if (sider) {
      sider.style.transition = 'none';
      sider.style.width = collapsed ? '80px' : '300px';
    }
  }, [collapsed]);

  return (
    <AntLayout 
      className={`themed-layout ${theme}-theme`}
      style={{ 
        minHeight: '100vh',
        height: '100vh',
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
      {/* Themed Sidebar */}
      <Sider
        width={240}
        collapsedWidth={64}
        collapsed={collapsed}
        theme="dark"
        trigger={null}
        collapsible={false}
        className={`themed-sider ${theme}-sider`}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          width: collapsed ? 64 : 240,
          maxWidth: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
        }}
      >
        <div className="themed-sidebar-header">
          <div 
            className="themed-logo"
            onClick={handleLogoClick}
            style={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {theme === 'space' ? (
              <img 
                src="/img/logo-dark.png" 
                alt="CAMKEY Logo" 
                className="themed-logo-img"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  filter: 'drop-shadow(0 0 15px rgba(125, 211, 252, 0.8))'
                }}
              />
            ) : (
              <img 
                src="/img/logo-blue.png" 
                alt="CAMKEY Logo" 
                className="themed-logo-img"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                }}
              />
            )}
            {!collapsed && (
              <span 
                className={`themed-logo-text ${theme}-logo-text`}
                style={{ 
                  fontSize: '32px', 
                  fontWeight: 700, 
                  color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
                }}
              >
                CAMKEY
              </span>
            )}
          </div>
        </div>
        <ThemedSidebar collapsed={collapsed} />
        
        {/* Toggle Button */}
        <div className="themed-sidebar-toggle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className={`themed-toggle-button ${theme}-toggle-button`}
          />
        </div>
      </Sider>

      {/* Main Content Area */}
      <AntLayout 
        className={`themed-main-layout ${theme}-main-layout`}
        style={{ 
          marginLeft: collapsed ? 64 : 240,
          width: collapsed ? 'calc(100vw - 64px)' : 'calc(100vw - 240px)',
          maxWidth: collapsed ? 'calc(100vw - 64px)' : 'calc(100vw - 240px)',
          boxSizing: 'border-box',
          minWidth: 0,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Themed Header */}
        <div style={{ position: 'relative', zIndex: 10000 }}>
          <ThemedHeader />
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
            padding: '20px 0',
            borderRadius: '8px',
            height: 'calc(100vh - 112px)',
            maxHeight: 'calc(100vh - 112px)',
            width: '100%',
            maxWidth: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 1
          }}
        >
          {children}
          
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
          
          {/* Space Theme Background Decorations - Only for Space Theme */}
          {theme === 'space' && (
            <div className="space-astronaut-decoration-icon">
              <img 
                src="/img/astro.png" 
                alt="Space Astronaut Decoration" 
                className="space-astronaut-icon-image" 
              />
            </div>
          )}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default ThemedLayout;
