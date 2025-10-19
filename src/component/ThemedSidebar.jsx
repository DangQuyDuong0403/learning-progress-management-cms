import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
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
  SecurityScanOutlined,
  HomeOutlined,
  SolutionOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import CONFIG_ROUTER from "../routers/configRouter";

export default function ThemedSidebar({ collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const menuRef = useRef(null);

  // Map route keys to icons
  const getIcon = (key) => {
    const iconMap = {
      'ADMIN_ACCOUNTS': <UserOutlined />,
      'ADMIN_ROLES': <TeamOutlined />,
      'ADMIN_LEVELS': <TrophyOutlined />,
      'ADMIN_COURSES': <BookOutlined />,
      'ADMIN_REPORTS': <BarChartOutlined />,
      'ADMIN_DASHBOARD': <DashboardOutlined />,
      'ADMIN_SETTINGS': <SettingOutlined />,
      'MANAGER_SYLLABUSES': <BookOutlined />,
      'MANAGER_LEVELS': <TrophyOutlined />,
      'MANAGER_COURSES': <BookOutlined />,
      'MANAGER_STUDENTS': <TeamOutlined />, // Student icon - học sinh với tài liệu học tập
      'TEACHER_DASHBOARD': <DashboardOutlined />,
      'TEACHER_CLASSES': <AppstoreOutlined />, // Class icon - lớp học/phòng học
      'MANAGER_CLASSES': <AppstoreOutlined />, // Class icon - lớp học/phòng học
      'MANAGER_DASHBOARD': <DashboardOutlined />,
      'TEACHER_DAILY_CHALLENGES': <TrophyOutlined />,
      'TEACHING_ASSISTANT_CLASSES': <AppstoreOutlined />, // Class icon - lớp học/phòng học
      'MANAGER_TEACHERS': <SolutionOutlined />, // Teacher icon - giáo viên với vương miện (quyền uy)
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
      'MANAGER_DASHBOARD': t('sidebar.dashboard'),
      'MANAGER_SYLLABUSES': t('sidebar.syllabusManagement'),
      'MANAGER_LEVELS': t('sidebar.levelsManagement'),
      'MANAGER_COURSES': t('sidebar.coursesManagement'),
      'MANAGER_STUDENTS': t('sidebar.studentsManagement'),
      'TEACHER_DASHBOARD': t('sidebar.dashboard'),
      'TEACHER_CLASSES': t('sidebar.classesManagement'),
      'TEACHER_DAILY_CHALLENGES': t('sidebar.dailyChallengeManagement'),
      'TEACHING_ASSISTANT_CLASSES': t('sidebar.classesManagement'),
      'MANAGER_TEACHERS': t('sidebar.teacherManagement'),
      'SECURITY': 'Security',
    };
    return menuNameMap[key] || key;
  };

  // Handle menu click
  const handleMenuClick = ({ key }) => {
    if (key === 'SETTINGS') {
      navigate('/settings');
    } else {
      const route = CONFIG_ROUTER.find(r => r.key === key);
      if (route) {
        navigate(route.path);
      }
    }
  };

  // Prevent auto-expansion when navigating
  const handleMenuOpenChange = () => {
    // Do nothing to prevent auto-expansion
  };

  // Create settings menu item (separate for positioning)
  const settingsMenuItem = {
    key: 'SETTINGS',
    icon: <SettingOutlined />,
    label: collapsed ? null : t('sidebar.settings'),
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
      label: collapsed ? null : getMenuName(route.key),
      title: collapsed ? getMenuName(route.key) : undefined,
      path: route.path,
    }));

  // Combine route menu items and settings at the end
  const menuItems = [...routeMenuItems, settingsMenuItem];

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
        onClick={handleMenuClick}
        onOpenChange={handleMenuOpenChange}
        style={{
          border: 'none',
          background: 'transparent',
          marginTop: '12px',
          marginBottom: collapsed ? '48px' : '12px'
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
