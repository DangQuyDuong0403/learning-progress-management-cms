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
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        width={250}
        collapsedWidth={80}
        collapsed={collapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="sidebar-header">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" className="logo-img" />
            {!collapsed && <span className="logo-text">Learning CMS</span>}
          </div>
        </div>
        <Sidebar collapsed={collapsed} />
        
        {/* Toggle Button */}
        <div className="sidebar-toggle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className="toggle-button"
          />
        </div>
      </Sider>

      {/* Main Content Area */}
      <AntLayout style={{ marginLeft: collapsed ? 80 : 250 }}>
        {/* Header */}
        <Header/>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};


export default Layout;

