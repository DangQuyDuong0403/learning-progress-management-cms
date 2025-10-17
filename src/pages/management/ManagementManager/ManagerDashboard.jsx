import React from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  BookOutlined, 
  BarChartOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  SolutionOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemedLayout from '../../../component/ThemedLayout';
import ROUTER_PAGE from '../../../constants/router';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleNavigateToClasses = () => {
    navigate(ROUTER_PAGE.MANAGER_CLASSES);
  };

  const handleNavigateToStudents = () => {
    navigate(ROUTER_PAGE.MANAGER_STUDENTS);
  };

  const handleNavigateToTeachers = () => {
    navigate(ROUTER_PAGE.MANAGER_TEACHERS);
  };

  const handleNavigateToSyllabuses = () => {
    navigate(ROUTER_PAGE.MANAGER_SYLLABUSES);
  };

  const statsData = [
    {
      title: 'Tổng lớp học',
      value: 25,
      icon: <HomeOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Giáo viên',
      value: 15,
      icon: <SolutionOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Học sinh',
      value: 450,
      icon: <UserOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: 'Giáo trình',
      value: 8,
      icon: <ReadOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ];

  const quickActions = [
    {
      title: 'Quản lý lớp học',
      description: 'Quản lý các lớp học và học sinh',
      icon: <HomeOutlined />,
      action: handleNavigateToClasses,
      color: '#1890ff'
    },
    {
      title: 'Quản lý học sinh',
      description: 'Theo dõi tiến độ học tập của học sinh',
      icon: <UserOutlined />,
      action: handleNavigateToStudents,
      color: '#52c41a'
    },
    {
      title: 'Quản lý giáo viên',
      description: 'Quản lý thông tin và phân công giáo viên',
      icon: <SolutionOutlined />,
      action: handleNavigateToTeachers,
      color: '#faad14'
    },
    {
      title: 'Quản lý giáo trình',
      description: 'Tạo và chỉnh sửa giáo trình học',
      icon: <ReadOutlined />,
      action: handleNavigateToSyllabuses,
      color: '#722ed1'
    },
    {
      title: 'Quản lý cấp độ',
      description: 'Quản lý các cấp độ học tập',
      icon: <BookOutlined />,
      action: () => navigate(ROUTER_PAGE.MANAGER_LEVELS),
      color: '#13c2c2'
    },
    {
      title: 'Báo cáo thống kê',
      description: 'Xem báo cáo và thống kê chi tiết',
      icon: <BarChartOutlined />,
      action: () => {},
      color: '#eb2f96'
    }
  ];

  return (
    <ThemedLayout>
      <div className="manager-dashboard">
        {/* Welcome Header */}
        <Card 
          className="welcome-card" 
          style={{ 
            marginBottom: 24,
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
            border: theme === 'sun' ? '1px solid #d9d9d9' : undefined
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <h1 style={{ margin: 0, color: '#52c41a' }}>Chào mừng Manager!</h1>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
                Quản lý học tập và tiến độ của học sinh
              </p>
            </Col>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={handleNavigateToClasses}
                >
                  Quản lý lớp học
                </Button>
                <Button 
                  size="large"
                  icon={<UserOutlined />}
                  onClick={handleNavigateToStudents}
                >
                  Quản lý học sinh
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsData.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card 
                hoverable
                style={{
                  backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                  border: theme === 'sun' ? '1px solid #d9d9d9' : undefined
                }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.icon}
                  valueStyle={{ color: stat.color, fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Actions */}
        <Card 
          title="Thao tác nhanh" 
          style={{ 
            marginBottom: 24,
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
            border: theme === 'sun' ? '1px solid #d9d9d9' : undefined
          }}
        >
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card 
                  hoverable 
                  className="quick-action-card"
                  onClick={action.action}
                  style={{ 
                    cursor: 'pointer',
                    border: `2px solid ${action.color}`,
                    borderRadius: '8px',
                    backgroundColor: theme === 'sun' ? '#ffffff' : undefined
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', color: action.color }}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: action.color }}>{action.title}</h3>
                      <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                        {action.description}
                      </p>
                    </div>
                    <Button 
                      type="text" 
                      icon={<ArrowRightOutlined />}
                      style={{ color: action.color }}
                    >
                      Truy cập
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Recent Activities */}
        <Card title="Hoạt động gần đây">
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>Chưa có hoạt động nào</p>
          </div>
        </Card>
      </div>
    </ThemedLayout>
  );
};

export default ManagerDashboard;
