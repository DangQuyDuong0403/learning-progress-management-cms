import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  BarChartOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemedLayout from '../../../component/ThemedLayout';
import { adminDashboardApi } from '../../../apis/apis';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PieChart, Pie, Cell, Legend, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';
dayjs.extend(relativeTime);

const AdminDashboard = () => {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState({ summary: null, roleBreakdown: [], statusBreakdown: [], recentAccounts: [] });


  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // Adjust the endpoint if different in BE
        const res = await adminDashboardApi.getDashboard();
        // Accept either direct shape or nested under data
        const payload = res?.data ? res.data : res;
        setDashboard({
          summary: payload?.summary || null,
          roleBreakdown: payload?.roleBreakdown || [],
          statusBreakdown: payload?.statusBreakdown || [],
          recentAccounts: payload?.recentAccounts || [],
        });
      } catch (e) {
        // Swallow errors for now; optionally surface via notification
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const summaryCards = useMemo(() => {
    const s = dashboard.summary || {};
    return [
      { key: 'totalAccounts', title: 'Total accounts', value: s.totalAccounts ?? 0, icon: <UserOutlined style={{ color: '#1890ff' }} />, color: '#1890ff' },
      { key: 'activeAccounts', title: 'Active', value: s.activeAccounts ?? 0, icon: <TeamOutlined style={{ color: '#52c41a' }} />, color: '#52c41a' },
      { key: 'pendingAccounts', title: 'Pending activation', value: s.pendingAccounts ?? 0, icon: <UserOutlined style={{ color: '#faad14' }} />, color: '#faad14' },
      { key: 'newToday', title: 'New today', value: s.newToday ?? 0, icon: <BarChartOutlined style={{ color: '#722ed1' }} />, color: '#722ed1' },
    ];
  }, [dashboard.summary]);

  const roleRows = useMemo(() => {
    return (dashboard.roleBreakdown || []).map((r, idx) => ({
      key: idx,
      role: r.role,
      count: r.count,
      percentage: r.percentage,
    }));
  }, [dashboard.roleBreakdown]);

  const statusRows = useMemo(() => {
    return (dashboard.statusBreakdown || []).map((s, idx) => ({
      key: idx,
      status: s.status,
      count: s.count,
      percentage: s.percentage,
    }));
  }, [dashboard.statusBreakdown]);

  const rolePieData = useMemo(() => roleRows.map(r => ({ name: r.role, value: r.count, percentage: r.percentage })), [roleRows]);
  const statusPieData = useMemo(() => statusRows.map(s => ({ name: s.status, value: s.count, percentage: s.percentage })), [statusRows]);

  const ROLE_COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96'];
  const STATUS_COLORS = {
    ACTIVE: '#52c41a',
    PENDING: '#faad14',
    INACTIVE: '#bfbfbf'
  };

  const formatEnumLabel = (text = '') => {
    const safe = String(text || '');
    return safe
      .toLowerCase()
      .split('_')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  const recentColumns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (v) => <Tag color="blue">{formatEnumLabel(v)}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => (
      <Tag color={v === 'ACTIVE' ? 'green' : v === 'PENDING' ? 'orange' : 'default'}>{formatEnumLabel(v)}</Tag>
    ) },
    { title: 'Created at', dataIndex: 'createdAt', key: 'createdAt', render: (v) => (
      <span title={dayjs(v).format('YYYY-MM-DD HH:mm')}>{dayjs(v).fromNow()}</span>
    ) },
  ];

  return (
    <ThemedLayout>
      <div
        className="admin-dashboard-container"
        style={{ padding: '0 24px 24px' }}
      >
        <div className="admin-dashboard" style={{ maxWidth: 1280, margin: '0 auto' }}>
        

        {/* Summary */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {summaryCards.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.key}>
              <Card
                hoverable
                loading={loading && !dashboard.summary}
                style={{
                  backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                  border: theme === 'sun' ? '1px solid #d9d9d9' : undefined,
                  borderRadius: 12,
                  boxShadow: theme === 'sun' ? '0 4px 12px rgba(0,0,0,0.06)' : undefined
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

        {/* Breakdown */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
              <Card
              title="Role distribution"
              headStyle={{ textAlign: 'center' }}
              loading={loading && roleRows.length === 0}
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: theme === 'sun' ? '1px solid #d9d9d9' : undefined,
                borderRadius: 12,
                boxShadow: theme === 'sun' ? '0 4px 12px rgba(0,0,0,0.06)' : undefined
              }}
            >
              {rolePieData.length === 0 && !loading ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={rolePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name, percentage }) => `${formatEnumLabel(name)} (${(percentage ?? 0).toFixed(1)}%)`}
                      >
                        {rolePieData.map((entry, index) => (
                          <Cell key={`cell-role-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(value) => formatEnumLabel(value)} />
                      <ReTooltip formatter={(value, name, props) => {
                        const pct = props?.payload?.percentage;
                        return [`${value} (${(pct ?? 0).toFixed(1)}%)`, formatEnumLabel(name)];
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
              <Card
              title="Account status"
              headStyle={{ textAlign: 'center' }}
              loading={loading && statusRows.length === 0}
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: theme === 'sun' ? '1px solid #d9d9d9' : undefined,
                borderRadius: 12,
                boxShadow: theme === 'sun' ? '0 4px 12px rgba(0,0,0,0.06)' : undefined
              }}
            >
              {statusPieData.length === 0 && !loading ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name, percentage }) => `${formatEnumLabel(name)} (${(percentage ?? 0).toFixed(1)}%)`}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[entry.name] || '#bfbfbf'} />
                        ))}
                      </Pie>
                      <Legend formatter={(value) => formatEnumLabel(value)} />
                      <ReTooltip formatter={(value, name, props) => {
                        const pct = props?.payload?.percentage;
                        return [`${value} (${(pct ?? 0).toFixed(1)}%)`, formatEnumLabel(name)];
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Recent Accounts */}
        <Card 
          title="Recent accounts"
          style={{
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
            border: theme === 'sun' ? '1px solid #d9d9d9' : undefined,
            borderRadius: 12,
            boxShadow: theme === 'sun' ? '0 4px 12px rgba(0,0,0,0.06)' : undefined
          }}
        >
          <Table
            rowKey={(r) => r.userId}
            loading={loading && dashboard.recentAccounts.length === 0}
            dataSource={dashboard.recentAccounts}
            columns={recentColumns}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            locale={{ emptyText: <Empty description="No recent accounts" /> }}
          />
        </Card>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default AdminDashboard;
