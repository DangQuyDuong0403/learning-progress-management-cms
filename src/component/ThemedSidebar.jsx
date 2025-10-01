import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  DashboardOutlined,
  TrophyOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import CONFIG_ROUTER from "../routers/configRouter";

export default function ThemedSidebar({ collapsed }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useTheme();

  // Map route keys to icons
  const getIcon = (key) => {
    const iconMap = {
      'ADMIN_ACCOUNTS': <UserOutlined />,
      'ADMIN_ROLES': <TeamOutlined />,
      'ADMIN_LEVELS': <BookOutlined />,
      'ADMIN_COURSES': <BookOutlined />,
      'ADMIN_REPORTS': <BarChartOutlined />,
      'ADMIN_DASHBOARD': <DashboardOutlined />,
      'ADMIN_SETTINGS': <SettingOutlined />,
      'MANAGER_SYLLABUSES': <BookOutlined />,
      'MANAGER_LEVELS': <BookOutlined />,
      'MANAGER_COURSES': <BookOutlined />,
      'TEACHER_DAILY_CHALLENGES': <TrophyOutlined />,
      'SECURITY': <SecurityScanOutlined />,
    };
    return iconMap[key] || <UserOutlined />;
  };

  // Find the current selected menu item based on pathname
  const getSelectedKey = () => {
    const currentRoute = CONFIG_ROUTER.find(route => route.path === location.pathname);
    return currentRoute ? [currentRoute.key] : [];
  };

  // Get translated menu name
  const getMenuName = (key) => {
    const menuNameMap = {
      'ADMIN_ACCOUNTS': t('sidebar.accountsManagement'),
      'ADMIN_ROLES': t('sidebar.rolesManagement'),
      'ADMIN_LEVELS': t('sidebar.levelsManagement'),
      'ADMIN_COURSES': t('sidebar.coursesManagement'),
      'ADMIN_REPORTS': t('sidebar.reportsManagement'),
      'ADMIN_DASHBOARD': t('sidebar.dashboard'),
      'ADMIN_SETTINGS': t('sidebar.settings'),
      'MANAGER_CLASSES': t('sidebar.classesManagement'),
      'MANAGER_SYLLABUSES': t('sidebar.syllabusManagement'),
      'MANAGER_LEVELS': t('sidebar.levelsManagement'),
      'MANAGER_COURSES': t('sidebar.coursesManagement'),
      'TEACHER_CLASSES': t('sidebar.classesManagement'),
      'TEACHER_DAILY_CHALLENGES': t('sidebar.dailyChallengeManagement'),
      'SECURITY': 'Security',
    };
    return menuNameMap[key] || key;
  };

  // Create menu items from routes based on user role
  const menuItems = CONFIG_ROUTER
    .filter((route) => {
      // Show routes that are visible and match user role
      return route.show && (!route.role || route.role === user?.role?.toLowerCase());
    })
    .map((route) => ({
      key: route.key,
      icon: getIcon(route.key),
      label: (
        <Link to={route.path} style={{ textDecoration: 'none' }}>
          {getMenuName(route.key)}
        </Link>
      ),
      title: collapsed ? getMenuName(route.key) : undefined,
      path: route.path,
    }));

  return (
    <div className={`themed-sidebar-container ${theme}-sidebar-container`}>
      <Menu
        mode="inline"
        selectedKeys={getSelectedKey()}
        items={menuItems}
        style={{
          border: 'none',
          background: 'transparent',
          marginTop: '16px',
          marginBottom: collapsed ? '60px' : '16px'
        }}
        className={`themed-sidebar-menu ${theme}-sidebar-menu`}
        inlineCollapsed={collapsed}
      />
      
      {/* Moon Icon */}
      {!collapsed && (
        <div className={`moon-icon ${theme}-moon-icon`}>
          <div className="moon-face">🌙</div>
        </div>
      )}
      
      {/* Background Elements */}
      {!collapsed && (
        <div className={`sidebar-bg-elements ${theme}-bg-elements`}>
          <div className="bg-planet">🪐</div>
          <div className="bg-satellite">🛰️</div>
          <div className="bg-meteor">☄️</div>
        </div>
      )}
    </div>
  );
}
