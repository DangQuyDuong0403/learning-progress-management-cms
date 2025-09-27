import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { Menu } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import CONFIG_ROUTER from "../routers/configRouter";

export default function Sidebar() {
  const location = useLocation();

  // Map route keys to icons
  const getIcon = (key) => {
    const iconMap = {
      'ADMIN_ACCOUNTS': <UserOutlined />,
      'ADMIN_ROLES': <TeamOutlined />,
      'ADMIN_COURSES': <BookOutlined />,
      'ADMIN_REPORTS': <BarChartOutlined />,
      'ADMIN_DASHBOARD': <DashboardOutlined />,
      'ADMIN_SETTINGS': <SettingOutlined />,
    };
    return iconMap[key] || <UserOutlined />;
  };

  // Create menu items from routes
  const menuItems = CONFIG_ROUTER
    .filter((route) => route.show)
    .map((route) => ({
      key: route.key,
      icon: getIcon(route.key),
      label: (
        <Link to={route.path} style={{ textDecoration: 'none' }}>
          {route.menuName}
        </Link>
      ),
      path: route.path,
    }));

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      style={{
        border: 'none',
        background: 'transparent',
        marginTop: '16px'
      }}
      className="sidebar-menu"
    />
  );
}
