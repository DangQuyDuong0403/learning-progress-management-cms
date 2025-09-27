import React from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  BookOutlined, 
  BarChartOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../component/Layout';
import ROUTER_PAGE from '../../../constants/router';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleNavigateToAccounts = () => {
    navigate(ROUTER_PAGE.ADMIN_ACCOUNTS);
  };

  const statsData = [
    {
      title: 'Tổng tài khoản',
      value: 1250,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Giáo viên',
      value: 85,
      icon: <TeamOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Học sinh',
      value: 1150,
      icon: <UserOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: 'Khóa học',
      value: 42,
      icon: <BookOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ];

  const quickActions = [
    {
      title: 'Quản lý tài khoản',
      description: 'Thêm, sửa, xóa tài khoản người dùng',
      icon: <UserOutlined />,
      action: () => navigate(ROUTER_PAGE.ADMIN_ACCOUNTS),
      color: '#1890ff'
    },
    {
      title: 'Quản lý vai trò',
      description: 'Phân quyền và quản lý vai trò',
      icon: <TeamOutlined />,
      action: () => {},
      color: '#52c41a'
    },
    {
      title: 'Báo cáo thống kê',
      description: 'Xem báo cáo và thống kê hệ thống',
      icon: <BarChartOutlined />,
      action: () => {},
      color: '#722ed1'
    }
  ];

  return (
    <Layout>
      <div className="admin-dashboard">
        {/* Welcome Header */}
        <Card className="welcome-card" style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h1 style={{ margin: 0, color: '#1890ff' }}>Chào mừng Admin!</h1>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
                Quản lý hệ thống Learning Progress Management CMS
              </p>
            </Col>
            <Col>
              <Button 
                type="primary" 
                size="large"
                icon={<UserOutlined />}
                onClick={handleNavigateToAccounts}
              >
                Quản lý tài khoản
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
            <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>Chưa có hoạt động nào</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
