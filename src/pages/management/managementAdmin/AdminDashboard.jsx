import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
dayjs.extend(relativeTime);

const ROLE_COLORS = ['#c0aaff', '#80b9ff', '#7dd3b8', '#ffc98a', '#f79ac0', '#9aa7ff'];
const STATUS_COLORS = {
  ACTIVE: '#7fe2b3',
  PENDING: '#ffdf8b',
  INACTIVE: '#f7b7cf'
};

const ROLE_TEXTS = {
  student: { en: 'Student', vi: 'Học viên' },
  teacher: { en: 'Teacher', vi: 'Giáo viên' },
  manager: { en: 'Manager', vi: 'Quản lý' },
  admin: { en: 'Admin', vi: 'Quản trị viên' },
  test_taker: { en: 'Test Taker', vi: 'Thí sinh' },
  teaching_assistant: { en: 'Teaching Assistant', vi: 'Trợ giảng' },
};

const STATUS_TEXTS = {
  active: { en: 'Active', vi: 'Hoạt động' },
  pending: { en: 'Pending', vi: 'Đang chờ' },
  inactive: { en: 'Inactive', vi: 'Ngừng hoạt động' },
};

const AdminDashboard = () => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

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

  const translate = useCallback(
    (englishText, vietnameseText) => {
      const lang = i18n.language || 'en';
      if (lang.startsWith('vi')) return vietnameseText || englishText;
      if (lang.startsWith('en')) return englishText;
      return vietnameseText ? `${englishText} / ${vietnameseText}` : englishText;
    },
    [i18n.language]
  );

  const summaryCards = useMemo(() => {
    const s = dashboard.summary || {};
    const total = s.totalAccounts ?? 0;
    const pct = (v) => {
      const denominator = total || 0;
      if (!denominator) return translate('0% of total', '0% tổng số');
      const p = ((v ?? 0) / denominator) * 100;
      return `${p.toFixed(1)}% ${translate('of total', 'tổng số')}`;
    };

    return [
      {
        key: 'totalAccounts',
        title: translate('Total accounts', 'Tổng tài khoản'),
        value: s.totalAccounts ?? 0,
        subtitle: translate('All users', 'Tất cả người dùng'),
        icon: <UserOutlined style={{ color: '#2b6cb0' }} />,
        bg: '#d6e6fb'
      },
      {
        key: 'activeAccounts',
        title: translate('Active', 'Hoạt động'),
        value: s.activeAccounts ?? 0,
        subtitle: pct(s.activeAccounts),
        icon: <UsergroupAddOutlined style={{ color: '#1f7a3e' }} />,
        bg: '#dff7e8'
      },
      {
        key: 'pendingAccounts',
        title: translate('Pending', 'Đang chờ'),
        value: s.pendingAccounts ?? 0,
        subtitle: pct(s.pendingAccounts),
        icon: <ClockCircleOutlined style={{ color: '#b28000' }} />,
        bg: '#fff2b8'
      },
      {
        key: 'inactiveAccounts',
        title: translate('Inactive', 'Ngừng hoạt động'),
        value: s.inactiveAccounts ?? 0,
        subtitle: translate('Locked accounts', 'Tài khoản bị khóa'),
        icon: <CloseCircleOutlined style={{ color: '#a11a2b' }} />,
        bg: '#ffd9df'
      },
      {
        key: 'newToday',
        title: translate('Today', 'Hôm nay'),
        value: s.newToday ?? 0,
        subtitle: translate('New accounts', 'Tài khoản mới'),
        icon: <UserAddOutlined style={{ color: '#6b46c1' }} />,
        bg: '#efe1ff'
      }
    ];
  }, [dashboard.summary, translate]);

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

  const localizeRole = useCallback(
    (role) => {
      const key = String(role || '').toLowerCase();
      const entry = ROLE_TEXTS[key];
      if (entry) {
        return translate(entry.en, entry.vi);
      }
      const fallback = formatEnumLabel(role);
      return translate(fallback, fallback);
    },
    [translate]
  );

  const localizeStatus = useCallback(
    (status) => {
      const key = String(status || '').toLowerCase();
      const entry = STATUS_TEXTS[key];
      if (entry) {
        return translate(entry.en, entry.vi);
      }
      const fallback = formatEnumLabel(status);
      return translate(fallback, fallback);
    },
    [translate]
  );

  

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
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>
                  {translate('Role distribution', 'Phân bổ vai trò')}
                </div>
              </div>
              {rolePieData.length === 0 && !loading ? (
                <Empty description={translate('No data', 'Không có dữ liệu')} />
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
                        label={({ name, percentage }) => `${localizeRole(name)} (${(percentage ?? 0).toFixed(1)}%)`}
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
                        formatter={(value) => localizeRole(value)}
                      />
                      <ReTooltip
                        formatter={(value, name, props) => {
                          const pct = props?.payload?.percentage;
                          return [`${value} (${(pct ?? 0).toFixed(1)}%)`, localizeRole(name)];
                        }}
                      />
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
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>
                  {translate('Account status', 'Trạng thái tài khoản')}
                </div>
              </div>
              {statusPieData.length === 0 && !loading ? (
                <Empty description={translate('No data', 'Không có dữ liệu')} />
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
                        label={({ name, percentage }) => `${localizeStatus(name)} (${(percentage ?? 0).toFixed(1)}%)`}
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
                        formatter={(value) => localizeStatus(value)}
                      />
                      <ReTooltip
                        formatter={(value, name, props) => {
                          const pct = props?.payload?.percentage;
                          return [`${value} (${(pct ?? 0).toFixed(1)}%)`, localizeStatus(name)];
                        }}
                      />
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
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>
                  {translate('Account growth (30 days)', 'Tăng trưởng tài khoản (30 ngày)')}
                </div>
              </div>
              {lineChartData.length === 0 && !growthLoading ? (
                <Empty description={translate('No data', 'Không có dữ liệu')} />
              ) : (
                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <ReTooltip formatter={(value, name) => [value, localizeRole(name)]} />
                      <Legend formatter={(value) => localizeRole(value)} />
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
                <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>
                  {translate('Recent accounts', 'Tài khoản mới')}
                </div>
              </div>

              {(!dashboard.recentAccounts || dashboard.recentAccounts.length === 0) && !loading ? (
                <Empty description={translate('No recent accounts', 'Không có tài khoản mới')} />
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
                            {localizeRole(acc.role)}
                          </span>
                          <span style={{
                            padding: '6px 10px', borderRadius: 10,
                            background: statusBg, color: statusColor, fontWeight: 700, fontSize: 12
                          }}>
                            {localizeStatus(acc.status)}
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
