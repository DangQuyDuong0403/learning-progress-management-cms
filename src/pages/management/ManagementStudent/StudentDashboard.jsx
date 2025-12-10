import React from "react";
import {
  Card,
  Row,
  Col,
  Typography,
} from "antd";
import {
  TeamOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import usePageTitle from "../../../hooks/usePageTitle";
import { useSelector } from "react-redux";
import CustomCursor from "../../../component/cursor/CustomCursor";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSunTheme } = useTheme();
  const userRole = useSelector((state) => state.auth?.user?.role);
  const isTestTaker = userRole === 'TEST_TAKER';
  
  // Set page title based on role
  usePageTitle(isTestTaker ? 'Test Taker Dashboard' : 'Student Dashboard');

  // Theme-based colors for cards
  const getCardBackgroundColor = () => {
    return isSunTheme ? '#E6F5FF' : 'rgb(224 217 255)';
  };

  const menuItems = [
    {
      id: "class-list",
      title: t('studentDashboard.classList'),
      description: t('studentDashboard.classListDescription'),
      icon: <TeamOutlined style={{ fontSize: '48px', color: '#00d4ff' }} />,
      path: isTestTaker ? '/test-taker/classes' : '/student/classes',
      color: "#00d4ff",
    },
    // Hide learning progress overview for test_taker
    ...(isTestTaker ? [] : [{
      id: "learning-progress-overview",
      title: t('studentDashboard.learningProgressOverview'),
      description: t('studentDashboard.learningProgressOverviewDescription'),
      icon: <BarChartOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      path: '/student/learning-progress',
      color: "#722ed1",
    }]),
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <ThemedLayout>
      <CustomCursor />
      <div className={`student-dashboard-container ${isSunTheme ? 'light-theme' : 'dark-theme'}`}>
        {/* Page Title */}
        <div className="page-title-container" style={{ marginBottom: '24px' }}>
          <Typography.Title
            level={1}
            className="page-title"
          >
            {isTestTaker ? t('studentDashboard.testTakerTitle', 'Test Taker Dashboard') : t('studentDashboard.title')}
          </Typography.Title>
        </div>

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

export default StudentDashboard;
