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
        backgroundImage: "url('/img/bg-management.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(2px)'
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
            <img 
              src={theme === 'sun' ? "/img/logo.png" : "/img/logo.png"} 
              alt="Logo" 
              className="themed-logo-img" 
            />
            {!collapsed && (
              <span className={`themed-logo-text ${theme}-logo-text`}>
                Learning CMS
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
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default ThemedLayout;
