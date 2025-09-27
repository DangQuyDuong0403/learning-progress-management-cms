import React from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';
import Header from './Header';

const { Sider, Content } = AntLayout;


const Layout = ({ children }) => {
  const location = useLocation();

  // Menu dropdown cho user profile
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">Thông tin cá nhân</Link>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Cài đặt
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        width={250}
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
            <span className="logo-text">Learning CMS</span>
          </div>
        </div>
        <Sidebar />
      </Sider>

      {/* Main Content Area */}
      <AntLayout style={{ marginLeft: 250 }}>
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

// Helper function để lấy title theo route
const getPageTitle = (pathname) => {
  const titleMap = {
    '/admin/accounts': 'Quản lý tài khoản',
    '/admin/roles': 'Quản lý vai trò',
    '/admin/dashboard': 'Dashboard',
  };
  
  return titleMap[pathname] || 'Quản lý hệ thống';
};

export default Layout;
