import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Empty } from 'antd';
import {
  UserOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  UserSwitchOutlined,
  StockOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemedLayout from '../../../component/ThemedLayout';
import { adminDashboardApi } from '../../../apis/apis';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import './AdminDashboard.css';
dayjs.extend(relativeTime);

const ROLE_COLORS = ['#c0aaff', '#80b9ff', '#7dd3b8', '#ffc98a', '#f79ac0', '#9aa7ff'];
const STATUS_COLORS = {
  ACTIVE: '#7fe2b3',
  PENDING: '#ffdf8b',
  INACTIVE: '#f7b7cf'
};

const AdminDashboard = () => {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState({ summary: null, roleBreakdown: [], statusBreakdown: [], recentAccounts: [] });
  const [growthLoading, setGrowthLoading] = useState(false);
  const [accountGrowth, setAccountGrowth] = useState({ labels: [], series: [] });


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

  useEffect(() => {
    const fetchGrowth = async () => {
      setGrowthLoading(true);
      try {
        const res = await adminDashboardApi.getAccountGrowthByRole({ range: 30, unit: 'daily' });
        const payload = res?.data ? res.data : res;
        setAccountGrowth({
          labels: payload?.labels || [],
          series: payload?.series || []
        });
      } catch (e) {
        // Optional: surface error
      } finally {
        setGrowthLoading(false);
      }
    };
    fetchGrowth();
  }, []);

  const summaryCards = useMemo(() => {
    const s = dashboard.summary || {};
    const total = s.totalAccounts ?? 0;
    const pct = (v) => {
      const denominator = total || 0;
      if (!denominator) return '0% of total';
      const p = ((v ?? 0) / denominator) * 100;
      return `${p.toFixed(1)}% of total`;
    };

    return [
      {
        key: 'totalAccounts',
        title: 'Total accounts',
        value: s.totalAccounts ?? 0,
        subtitle: 'All users',
        icon: <UserOutlined style={{ color: '#2b6cb0' }} />,
        bg: '#d6e6fb'
      },
      {
        key: 'activeAccounts',
        title: 'Active',
        value: s.activeAccounts ?? 0,
        subtitle: pct(s.activeAccounts),
        icon: <UsergroupAddOutlined style={{ color: '#1f7a3e' }} />,
        bg: '#dff7e8'
      },
      {
        key: 'pendingAccounts',
        title: 'Pending',
        value: s.pendingAccounts ?? 0,
        subtitle: pct(s.pendingAccounts),
        icon: <ClockCircleOutlined style={{ color: '#b28000' }} />,
        bg: '#fff2b8'
      },
      {
        key: 'inactiveAccounts',
        title: 'Inactive',
        value: s.inactiveAccounts ?? 0,
        subtitle: 'Locked accounts',
        icon: <CloseCircleOutlined style={{ color: '#a11a2b' }} />,
        bg: '#ffd9df'
      },
      {
        key: 'newToday',
        title: 'Today',
        value: s.newToday ?? 0,
        subtitle: 'New accounts',
        icon: <UserAddOutlined style={{ color: '#6b46c1' }} />,
        bg: '#efe1ff'
      }
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
  const growthSeries = useMemo(() => accountGrowth?.series || [], [accountGrowth]);
  const growthLabels = useMemo(() => accountGrowth?.labels || [], [accountGrowth]);

  const roleColorMap = useMemo(() => {
    const map = {};
    (dashboard.roleBreakdown || []).forEach((r, idx) => {
      map[r.role] = ROLE_COLORS[idx % ROLE_COLORS.length];
    });
    growthSeries.forEach((series, idx) => {
      if (!map[series.role]) {
        map[series.role] = ROLE_COLORS[idx % ROLE_COLORS.length];
      }
    });
    return map;
  }, [dashboard.roleBreakdown, growthSeries]);

  const lineChartData = useMemo(() => {
    if (!growthLabels.length || !growthSeries.length) return [];
    return growthLabels.map((label, index) => {
      const entry = { label };
      growthSeries.forEach((series) => {
        entry[series.role] = Array.isArray(series.data) ? series.data[index] ?? 0 : 0;
      });
      return entry;
    });
  }, [growthLabels, growthSeries]);

  const formatEnumLabel = (text = '') => {
    const safe = String(text || '');
    return safe
      .toLowerCase()
      .split('_')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  

  return (
    <ThemedLayout>
      <div className={`admin-page ${theme}-theme main-content-panel`} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <div className="admin-dashboard" style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Summary */}
        <Row gutter={[12, 16]} style={{ marginBottom: 24 }}>
          {summaryCards.map((stat) => (
            <Col
              key={stat.key}
              xs={24}
              sm={12}
              md={8}
              flex="1 1 220px"
              style={{ display: 'flex' }}
            >
              <Card
                hoverable
                loading={loading && !dashboard.summary}
                style={{
                  backgroundColor: stat.bg,
                  border: 'none',
                  borderRadius: 16,
                  boxShadow: theme === 'sun' ? '0 8px 20px rgba(0,0,0,0.08)' : undefined,
                  minHeight: 170,
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: '#5b6b83', lineHeight: 1.1 }}>{stat.title}</div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                  {stat.value}
                </div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>
                  {stat.subtitle}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Breakdown */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
              <Card
              loading={loading && roleRows.length === 0}
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#f1eafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserSwitchOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>Role distribution</div>
              </div>
              {rolePieData.length === 0 && !loading ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 380, overflow: 'visible' }}>
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 24, right: 24, bottom: 48, left: 24 }}>
                      <Pie
                        data={rolePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        outerRadius={105}
                        label={({ name, percentage }) => `${formatEnumLabel(name)} (${(percentage ?? 0).toFixed(1)}%)`}
                      >
                        {rolePieData.map((entry, index) => (
                          <Cell key={`cell-role-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                        wrapperStyle={{ marginTop: 12 }}
                        formatter={(value) => formatEnumLabel(value)}
                      />
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
              loading={loading && statusRows.length === 0}
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#e8fff5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <StockOutlined style={{ color: '#10b981', fontSize: 20 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>Account status</div>
              </div>
              {statusPieData.length === 0 && !loading ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 380, overflow: 'visible' }}>
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 24, right: 24, bottom: 48, left: 24 }}>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        outerRadius={105}
                        label={({ name, percentage }) => `${formatEnumLabel(name)} (${(percentage ?? 0).toFixed(1)}%)`}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[entry.name] || '#bfbfbf'} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                        wrapperStyle={{ marginTop: 12 }}
                        formatter={(value) => formatEnumLabel(value)}
                      />
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

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>Account growth (30 days)</div>
              </div>
              {lineChartData.length === 0 && !growthLoading ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <ReTooltip formatter={(value, name) => [value, formatEnumLabel(name)]} />
                      <Legend formatter={(value) => formatEnumLabel(value)} />
                      {growthSeries.map((series) => (
                        <Line
                          key={series.role}
                          type="monotone"
                          dataKey={series.role}
                          stroke={roleColorMap[series.role] || '#8884d8'}
                          strokeWidth={2.2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            {/* Recent Accounts */}
            <Card 
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#fff3e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserAddOutlined style={{ color: '#fb923c', fontSize: 20 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>Recent accounts</div>
              </div>

              {(!dashboard.recentAccounts || dashboard.recentAccounts.length === 0) && !loading ? (
                <Empty description="No recent accounts" />
              ) : (
                <div style={{ maxHeight: 420, overflow: 'auto', paddingRight: 4 }}>
                  {(dashboard.recentAccounts || []).map((acc, idx) => {
                    const statusColor = acc.status === 'ACTIVE' ? '#22c55e' : acc.status === 'PENDING' ? '#f59e0b' : '#9ca3af';
                    const statusBg = acc.status === 'ACTIVE' ? 'rgba(34,197,94,0.12)' : acc.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(156,163,175,0.2)';
                    const roleColor = roleColorMap[acc.role] || '#60a5fa';
                    const roleBg = `${roleColor}30`;
                    return (
                      <div key={acc.userId || idx} style={{
                        border: theme === 'sun' ? '1px solid #eef2f7' : '1px solid transparent',
                        background: theme === 'sun' ? '#fbfdff' : undefined,
                        borderRadius: 14,
                        padding: 16,
                        marginBottom: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: '#f3f6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <UserOutlined style={{ color: '#4f46e5' }} />
                            </div>
                            <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={acc.email}>
                              {acc.email}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 10px', borderRadius: 10,
                            background: roleBg, color: roleColor, fontWeight: 700, fontSize: 12
                          }}>
                            {formatEnumLabel(acc.role)}
                          </span>
                          <span style={{
                            padding: '6px 10px', borderRadius: 10,
                            background: statusBg, color: statusColor, fontWeight: 700, fontSize: 12
                          }}>
                            {formatEnumLabel(acc.status)}
                          </span>
                        </div>
                        <div style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
                          <span title={dayjs(acc.createdAt).format('YYYY-MM-DD HH:mm')}>{dayjs(acc.createdAt).format('HH:mm DD/MM/YYYY')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Col>
        </Row>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default AdminDashboard;
