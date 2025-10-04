import React, { useState } from 'react';
import { Layout as AntLayout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import ThemedSidebar from './ThemedSidebar';
import ThemedHeader from './ThemedHeader';
import './ThemedLayout.css';

const { Sider, Content } = AntLayout;

const ThemedLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

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
      {/* Themed Sidebar */}
      <Sider
        width={300}
        collapsedWidth={80}
        collapsed={collapsed}
        theme="dark"
        className={`themed-sider ${theme}-sider`}
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          width: collapsed ? 80 : 300,
          maxWidth: collapsed ? 80 : 300,
          minWidth: collapsed ? 80 : 300,
        }}
      >
        <div className="themed-sidebar-header">
          <div className="themed-logo">
            {theme === 'dark' ? (
              <span className="themed-logo-icon">🚀</span>
            ) : (
              <img 
                src="/img/sun-logo.png" 
                alt="Logo" 
                className="themed-logo-img" 
              />
            )}
            {!collapsed && (
              <span className={`themed-logo-text ${theme}-logo-text`}>
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
          marginLeft: collapsed ? 80 : 300,
          width: `calc(100vw - ${collapsed ? 80 : 300}px)`,
          maxWidth: `calc(100vw - ${collapsed ? 80 : 300}px)`,
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
            margin: '24px',
            padding: '24px',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            maxHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            zIndex: 1
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
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default ThemedLayout;
