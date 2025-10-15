import React, { useEffect, useRef } from 'react';
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
  const menuRef = useRef(null);

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
      'MANAGER_STUDENTS': <UserOutlined />,
      'MANAGER_CLASSES': <UserOutlined />,
      'TEACHER_CLASSES': <UserOutlined />,
      'TEACHER_DAILY_CHALLENGES': <TrophyOutlined />,
      'TEACHING_ASSISTANT_CLASSES': <UserOutlined />,
      'MANAGER_TEACHERS': <UserOutlined />,
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
      'MANAGER_STUDENTS': t('sidebar.studentsManagement'),
      'TEACHER_CLASSES': t('sidebar.classesManagement'),
      'TEACHER_DAILY_CHALLENGES': t('sidebar.dailyChallengeManagement'),
      'TEACHING_ASSISTANT_CLASSES': t('sidebar.classesManagement'),
      'MANAGER_TEACHERS': t('sidebar.teacherManagement'),
      'SECURITY': 'Security',
    };
    return menuNameMap[key] || key;
  };

  // Create static menu items (Dashboard only)
  const staticMenuItems = [
    {
      key: 'DASHBOARD',
      icon: <DashboardOutlined />,
      label: (
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          {t('sidebar.dashboard')}
        </Link>
      ),
      title: collapsed ? t('sidebar.dashboard') : undefined,
    }
  ];

  // Create settings menu item (separate for positioning)
  const settingsMenuItem = {
    key: 'SETTINGS',
    icon: <SettingOutlined />,
    label: (
      <Link to="/settings" style={{ textDecoration: 'none' }}>
        {t('sidebar.settings')}
      </Link>
    ),
    title: collapsed ? t('sidebar.settings') : undefined,
  };

  // Create menu items from routes based on user role
  const routeMenuItems = CONFIG_ROUTER
    .filter((route) => {
      // Show routes that are visible and match user role
      if (!route.show) return false;
      if (!route.role) return true;
      
      const userRole = user?.role?.toLowerCase();
      if (Array.isArray(route.role)) {
        return route.role.includes(userRole);
      }
      return route.role === userRole;
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

  // Combine static, route menu items, and settings at the end
  const menuItems = [...staticMenuItems, ...routeMenuItems, settingsMenuItem];

  // Auto scroll to selected item when sidebar is expanded
  useEffect(() => {
    if (!collapsed) {
      // Use setTimeout to ensure DOM is rendered
      setTimeout(() => {
        // Find the selected menu item element in the sidebar
        const selectedElement = document.querySelector('.themed-sidebar-menu .ant-menu-item-selected');
        const menuContainer = document.querySelector('.themed-sidebar-menu');
        
        if (selectedElement && menuContainer) {
          // Calculate the position to scroll to center the selected item
          const containerHeight = menuContainer.clientHeight;
          const itemTop = selectedElement.offsetTop;
          const itemHeight = selectedElement.offsetHeight;
          
          // Scroll to center the selected item
          const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
          menuContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [collapsed, location.pathname]);

  return (
    <div className={`themed-sidebar-container ${theme}-sidebar-container`}>
      <Menu
        ref={menuRef}
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
