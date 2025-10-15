import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  TeamOutlined,
  HistoryOutlined,
  BookOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassMenu.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

// Mock class data
const mockClassData = {
  id: 1,
  name: "Rising star 1",
  studentCount: 3,
  color: "#00d4ff",
  status: "active",
  createdAt: "2024-01-15",
  teacher: "Nguyễn Văn A",
  level: "Beginner",
  ageRange: "6-8",
  description: "Basic English course for beginners",
};

const ClassMenu = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
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
      default:
        return '/manager/classes';
    }
  };

  const routePrefix = getRoutePrefix();

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClassData(mockClassData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      title: t('classMenu.dashboard'),
      description: t('classMenu.dashboardDescription'),
      icon: <DashboardOutlined style={{ fontSize: '48px', color: '#00d4ff' }} />,
      path: `${routePrefix}/dashboard/${id}`,
      color: "#00d4ff",
    },
    {
      id: "students",
      title: t('classMenu.students'),
      description: t('classMenu.studentsDescription'),
      icon: <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      path: `${routePrefix}/student/${id}`,
      color: "#1890ff",
    },
    {
      id: "teachers",
      title: t('classMenu.teachers'),
      description: t('classMenu.teachersDescription'),
      icon: <TeamOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      path: `${routePrefix}/teachers/${id}`,
      color: "#52c41a",
    },
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
      path: `${routePrefix}/chapters-lessons/${id}`,
      color: "#722ed1",
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <ThemedLayout>
        <div className="class-menu-container">
          <LoadingWithEffect loading={true} message={t('classMenu.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      <div className="class-menu-container">
        {/* Header */}
        <Card className="header-card">
          <div className="header-content">
            <div className="header-left">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`${routePrefix}`)}
                className="back-button"
              >
                {t('common.back')}
              </Button>
            </div>
            
            <div className="header-center">
              <h2 className="class-title">
                {classData?.name}
              </h2>
              <p className="class-subtitle">
                {classData?.description}
              </p>
            </div>
          </div>
        </Card>

        {/* Menu Cards */}
        <div className="menu-cards-section">
          <Row gutter={[24, 24]} justify="center">
            {menuItems.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  className="menu-card"
                  hoverable
                  onClick={() => handleCardClick(item.path)}
                  style={{
                    border: `2px solid ${item.color}20`,
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
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
