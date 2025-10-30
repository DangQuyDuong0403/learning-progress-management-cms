import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
} from "antd";
import {
  TeamOutlined,
  HistoryOutlined,
  BookOutlined,
  SolutionOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import ThemedLayoutWithSidebar from "../../../../component/ThemedLayout";
import ThemedLayoutNoSidebar from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassMenu.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { classManagementApi } from "../../../../apis/apis";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";

const ClassMenu = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { isSunTheme } = useTheme();
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  
  // Determine which layout to use based on user role
  const userRole = user?.role?.toLowerCase();
  const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
    ? ThemedLayoutNoSidebar 
    : ThemedLayoutWithSidebar;
  
  // Set page title
  usePageTitle('Class Menu');
  
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);

  // Determine route prefix based on user role
  const getRoutePrefix = () => {
    const userRole = user?.role?.toLowerCase();
    switch (userRole) {
      case 'manager':
        return '/manager/classes';
      case 'teacher':
        return '/teacher/classes';
      case 'teaching_assistant':
        return '/teaching-assistant/classes';
      case 'student':
        return '/student/classes';
      default:
        return '/manager/classes';
    }
  };

  const routePrefix = getRoutePrefix();

  const fetchClassData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await classManagementApi.getClassDetail(id);
      
      if (response.success && response.data) {
        setClassData({
          id: response.data.id,
          name: response.data.className,
          description: '',
          isActive: response.data.isActive,
          syllabusId: response.data.syllabusId,
          createdBy: response.data.createdBy,
          createdAt: response.data.createdAt,
          updatedBy: response.data.updatedBy,
          updatedAt: response.data.updatedAt,
        });
      } else {
        spaceToast.error('Failed to load class information');
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      spaceToast.error('Failed to load class information');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // Enter class menu mode when component mounts
  useEffect(() => {
    if (classData) {
      // Determine back URL based on user role
      const getBackUrl = () => {
        const userRole = user?.role?.toLowerCase();
        switch (userRole) {
          case 'teacher':
          case 'teaching_assistant':
            return '/teacher/classes';
          case 'manager':
            return '/manager/classes';
          default:
            return '/manager/classes';
        }
      };

      enterClassMenu({
        id: classData.id,
        name: classData.name,
        description: classData.description,
        backUrl: getBackUrl()
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData, enterClassMenu, exitClassMenu, user]);

  // Theme-based colors for cards
  const getCardBackgroundColor = () => {
    return isSunTheme ? '#E6F5FF' : 'rgb(224 217 255 / 100%)';
  };

  // Filter menu items based on user role
  const allMenuItems = [
    {
      id: "overview",
      title: t('classMenu.overview'),
      description: t('classMenu.overviewDescription'),
      icon: <EyeOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />,
      path: `${routePrefix}/overview/${id}`,
      color: "#13c2c2",
    },
    // Temporarily hidden
    // {
    //   id: "report",
    //   title: t('classMenu.report'),
    //   description: t('classMenu.reportDescription'),
    //   icon: <BarChartOutlined style={{ fontSize: '48px', color: '#00d4ff' }} />,
    //   path: `${routePrefix}/dashboard/${id}`,
    //   color: "#00d4ff",
    // },
    {
      id: "activities",
      title: t('classMenu.activities'),
      description: t('classMenu.activitiesDescription'),
      icon: <HistoryOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />,
      path: `${routePrefix}/activities/${id}`,
      color: "#fa8c16",
    },
    {
      id: "chapters-lessons",
      title: t('classMenu.chaptersLessons'),
      description: t('classMenu.chaptersLessonsDescription'),
      icon: <BookOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      path: `${routePrefix}/chapters/${id}`,
      color: "#722ed1",
    },
    {
      id: "daily-challenge",
      title: t('classMenu.dailyChallenge'),
      description: t('classMenu.dailyChallengeDescription'),
      icon: <img src="/img/dc-icon.png" alt="daily-challenge" style={{ width: '60px', height: '60px' }} />,
      path: userRole === 'student' ? `${routePrefix}/daily-challenges/${id}` : `${routePrefix}/daily-challenges/${id}`,
      color: "#eb2f96",
      hideForRoles: ['manager'], // Only hide for manager, allow student, teacher, and teaching_assistant to see
    },
    {
      id: "teachers",
      title: t('classMenu.teachers'),
      description: userRole === 'teacher'
        ? t('classMenu.viewTeachers', 'View teachers')
        : t('classMenu.teachersDescription'),
      icon: <SolutionOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      path: `${routePrefix}/teachers/${id}`,
      color: "#52c41a",
      hideForRoles: ['student'], // Hide for student
    },
    {
      id: "students",
      title: t('classMenu.students'),
      description: userRole === 'teacher'
        ? t('classMenu.viewStudents', 'View students')
        : t('classMenu.studentsDescription'),
      icon: <TeamOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      path: `${routePrefix}/student/${id}`,
      color: "#1890ff",
      hideForRoles: ['student'], // Hide for student
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (item.hideForRoles && item.hideForRoles.includes(userRole)) {
      return false;
    }
    return true;
  });

  const handleCardClick = (path, itemId) => {
    // If navigating to daily challenge, pass classId in state
    if (itemId === 'daily-challenge') {
      navigate(path, { state: { classId: id } });
    } else {
      navigate(path);
    }
  };

  if (loading) {
    return (
      <ThemedLayout>
        <div className={`class-menu-container ${isSunTheme ? 'light-theme' : 'dark-theme'}`}>
          <LoadingWithEffect loading={true} message={t('classMenu.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      <div className={`class-menu-container ${isSunTheme ? 'light-theme' : 'dark-theme'}`}>
        {/* Page Title */}
        <div className="page-title-container" style={{ marginBottom: '24px' }}>
          <Typography.Title 
            level={1} 
            className="page-title"
          >
            {t('classMenu.title')}
          </Typography.Title>
        </div>

        {/* Menu Cards */}
        <div className="menu-cards-section">
          <Row gutter={[24, 24]} justify="start">
            {menuItems.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  className="menu-card"
                  hoverable
                  onClick={() => handleCardClick(item.path, item.id)}
                  style={{
                    border: `2px solid ${item.color}20`,
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    backgroundColor: getCardBackgroundColor(),
                    overflow: 'hidden',
                  }}
                  bodyStyle={{
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div className="menu-card-content">
                    <div 
                      className="menu-icon-wrapper"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderRadius: '50%',
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {item.icon}
                    </div>
                    
                    <h3 
                      className="menu-title"
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '8px',
                      }}
                    >
                      {item.title}
                    </h3>
                    
                    <p 
                      className="menu-description"
                      style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: '1.5',
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

      </div>
    </ThemedLayout>
  );
};

export default ClassMenu;
