import React from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { 
  UserOutlined, 
  BookOutlined, 
  TrophyOutlined, 
  BarChartOutlined,
  ArrowRightOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ThemedLayout from '../../../component/teacherlayout/ThemedLayout';
import ROUTER_PAGE from '../../../constants/router';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const handleNavigateToProfile = () => {
    navigate(ROUTER_PAGE.PROFILE_STUDENT);
  };

  const statsData = [
    {
      title: 'Khóa học đang học',
      value: 3,
      icon: <BookOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Điểm số trung bình',
      value: 8.5,
      icon: <TrophyOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Bài tập hoàn thành',
      value: 45,
      icon: <BarChartOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: 'Ngày học liên tiếp',
      value: 12,
      icon: <UserOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ];

  const quickActions = [
    {
      title: 'Xem hồ sơ',
      description: 'Cập nhật thông tin cá nhân',
      icon: <UserOutlined />,
      action: handleNavigateToProfile,
      color: '#1890ff'
    },
    {
      title: 'Lớp của tôi',
      description: 'Xem các lớp học đang tham gia',
      icon: <BookOutlined />,
      action: () => navigate('/student/classes'),
      color: '#52c41a'
    },
    {
      title: 'Thành tích',
      description: 'Xem điểm số và thành tích',
      icon: <TrophyOutlined />,
      action: () => {},
      color: '#faad14'
    }
  ];

  return (
    <ThemedLayout>
      <div className="student-dashboard">
        {/* Welcome Header */}
        <Card className="welcome-card" style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h1 style={{ margin: 0, color: '#faad14' }}>Chào mừng Học sinh!</h1>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
                Theo dõi tiến độ học tập của bạn
              </p>
            </Col>
            <Col>
              <Button 
                type="primary" 
                size="large"
                icon={<UserOutlined />}
                onClick={handleNavigateToProfile}
              >
                Xem hồ sơ
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsData.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card hoverable>
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
        <Card title="Thao tác nhanh" style={{ marginBottom: 24 }}>
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
                    borderRadius: '8px'
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
            <BookOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>Chưa có hoạt động nào</p>
          </div>
        </Card>
      </div>
    </ThemedLayout>
  );
};

export default StudentDashboard;
