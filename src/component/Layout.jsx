import React, { useState } from 'react';
import { Layout as AntLayout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import './Layout.css';
import Header from './Header';

const { Sider, Content } = AntLayout;


const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <AntLayout style={{ 
      minHeight: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <Sider
        width={300}
        collapsedWidth={80}
        collapsed={collapsed}
        theme="dark"
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
        <div className="sidebar-header">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" className="logo-img" />
            {!collapsed && <span className="logo-text">Learning CMS</span>}
          </div>
        </div>
        <Sidebar collapsed={collapsed} />
        
        {/* Toggle Button - Inside sidebar with absolute positioning */}
        {/* <div className="sidebar-toggle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className="toggle-button"
          />
        </div> */}
      </Sider>

      {/* Main Content Area */}
      <AntLayout style={{ 
        marginLeft: collapsed ? 80 : 300,
        width: `calc(100vw - ${collapsed ? 80 : 300}px)`,
        maxWidth: `calc(100vw - ${collapsed ? 80 : 300}px)`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ position: 'relative', zIndex: 10000 }}>
          <Header/>
        </div>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
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


export default Layout;

