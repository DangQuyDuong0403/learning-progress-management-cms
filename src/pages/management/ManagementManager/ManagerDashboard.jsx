import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Row, Col, Empty, Tag } from 'antd';
import LoadingWithEffect from '../../../component/spinner/LoadingWithEffect';
import { 
  UserOutlined, 
  TeamOutlined, 
  ReadOutlined,
  HomeOutlined,
  BarChartOutlined,
  AlertOutlined,
  FunnelPlotOutlined,
  BookOutlined, 
  FileTextOutlined
} from '@ant-design/icons';
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
  CartesianGrid,
  FunnelChart,
  Funnel,
  LabelList,
  BarChart as ReBarChart,
  Bar,
  ComposedChart
} from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemedLayout from '../../../component/ThemedLayout';
import { managerDashboardApi } from '../../../apis/apis';
import './ManagerDashboardV2.css';

const ROLE_COLORS = ['#c0aaff', '#80b9ff', '#7dd3b8', '#ffc98a', '#f79ac0', '#9aa7ff'];
// Reuse pastel palette from pie for a consistent look
const FUNNEL_COLORS = ROLE_COLORS;

const ManagerDashboard = () => {
  const { theme } = useTheme();
  const [overview, setOverview] = useState(null);
  const [usersReport, setUsersReport] = useState(null);
  const [syllabusReport, setSyllabusReport] = useState(null);
  const [levelReport, setLevelReport] = useState(null);
  const [classesReport, setClassesReport] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [tabLoading, setTabLoading] = useState(true); // Start with true to show spinner on initial load
  const [tabError, setTabError] = useState(null);
  const fetchedTabsRef = useRef({
    overview: false,
    users: false,
    syllabus: false,
    levels: false,
    classes: false,
  });

  // Custom rectangular shape for funnel slices (square ends)
  const RectFunnelShape = (props) => {
    const { fill } = props;
    // Try to use provided x/y/width/height, otherwise derive from points
    let { x, y, width, height } = props;
    if (
      (typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof width !== 'number' ||
        typeof height !== 'number') &&
      Array.isArray(props.points)
    ) {
      const xs = props.points.map((p) => p.x);
      const ys = props.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      x = minX;
      y = minY;
      width = maxX - minX;
      height = maxY - minY;
    }
    // Rounded corners a bit for aesthetics
    return <rect x={x} y={y} width={Math.max(0, width)} height={Math.max(0, height)} fill={fill} rx={6} ry={6} />;
  };

  const fetchTabData = async (tab) => {
    setTabLoading(true);
    setTabError(null);
    try {
      switch (tab) {
        case 'overview': {
          const res = await managerDashboardApi.getOverview();
          const payload = res?.data ? res.data : res;
          setOverview(payload || {});
          break;
        }
        case 'users': {
          const res = await managerDashboardApi.getUsersReport();
          const payload = res?.data ? res.data : res;
          setUsersReport(payload || {});
          break;
        }
        case 'syllabus': {
          const res = await managerDashboardApi.getSyllabusReport();
          const payload = res?.data ? res.data : res;
          setSyllabusReport(payload || {});
          break;
        }
        case 'levels': {
          const res = await managerDashboardApi.getLevelReport();
          const payload = res?.data ? res.data : res;
          setLevelReport(payload || {});
          break;
        }
        case 'classes': {
          const res = await managerDashboardApi.getClassesReport();
          const payload = res?.data ? res.data : res;
          setClassesReport(payload || {});
          break;
        }
        default:
          break;
      }
      fetchedTabsRef.current[tab] = true;
    } catch (error) {
      setTabError(error?.message || 'Failed to load data');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    // Check if we need to fetch data for the active tab
    if (!fetchedTabsRef.current[activeTab]) {
      // Set loading immediately when switching to a tab that hasn't been fetched
      setTabLoading(true);
      fetchTabData(activeTab);
    } else {
      // If tab data is already fetched, ensure loading is false
      setTabLoading(false);
    }
  }, [activeTab]);

  const processedSyllabuses = useMemo(() => {
    if (!syllabusReport?.syllabuses?.length) return [];
    // Sort by usageClasses (desc), then by avgCompletion (desc)
    const sorted = [...syllabusReport.syllabuses].sort((a, b) => {
      const usageA = a.usageClasses ?? 0;
      const usageB = b.usageClasses ?? 0;
      if (usageB !== usageA) return usageB - usageA;
      return (b.avgCompletion ?? 0) - (a.avgCompletion ?? 0);
    });
    // Show top 10 most used syllabuses first, then others
    return sorted;
  }, [syllabusReport?.syllabuses]);

  const processedLevels = useMemo(() => {
    if (levelReport?.levels?.length) {
      return [...levelReport.levels]
        .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
        .map((lv) => ({
          levelId: lv.levelId,
          level: lv.levelName,
          students: lv.students ?? 0,
          completion: lv.avgCompletion ?? 0,
          syllabuses: lv.syllabuses ?? 0,
          classes: lv.classes ?? 0,
          teachers: lv.teachers ?? 0,
        }));
    }
    const fallback = Array.isArray(overview?.levelFunnel) ? overview.levelFunnel : [];
    return fallback.map((lv) => ({
      levelId: lv.levelCode,
      level: lv.level || lv.levelCode,
      students: lv.students ?? 0,
      completion: lv.completion ?? 0,
      syllabuses: lv.syllabuses ?? 0,
      classes: lv.classes ?? 0,
      teachers: lv.teachers ?? 0,
    }));
  }, [levelReport?.levels, overview?.levelFunnel]);

  const processedTopClasses = useMemo(() => {
    const list = classesReport?.topClasses || [];
    return [...list].sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0));
  }, [classesReport?.topClasses]);

  const funnelData = useMemo(() => {
    if (!processedLevels.length) return [];
    // Use descending constant values to render an inverted pyramid regardless of student counts
    // Reverse order: highest orderNumber (B1/KET) at top (largest slice), lowest (Litte Exprorers) at bottom
    const n = processedLevels.length;
    return [...processedLevels].reverse().map((lv, idx) => ({
      name: lv.level,
      value: (n - idx) * 10, // constant step width - highest level gets largest value (top)
      trueValue: lv.students ?? 0,
      color: FUNNEL_COLORS[(n - 1 - idx) % FUNNEL_COLORS.length],
      label: lv.level, // Remove ": number of students"
    }));
  }, [processedLevels]);

  const rolePieData = useMemo(() => {
    // Prefer usersReport.roleBreakdown if available; otherwise fall back to overview.summary.roleRatios
    const fromUsers = usersReport?.roleBreakdown;
    if (fromUsers && typeof fromUsers === 'object') {
      const entries = Object.entries(fromUsers);
      const total = usersReport?.summary?.totalUsers || entries.reduce((s, [, v]) => s + (v ?? 0), 0);
      return entries.map(([role, count]) => ({
        name: role,
        value: count ?? 0,
        percentage: total ? ((count ?? 0) / total) * 100 : 0
      }));
    }
    return (overview?.summary?.roleRatios || []).map((r) => ({ name: r.role, value: r.count, percentage: r.percentage }));
  }, [usersReport, overview?.summary?.roleRatios]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'syllabus', label: 'Syllabus' },
    { key: 'levels', label: 'Levels' },
    { key: 'classes', label: 'Classes' },
  ];

  const renderSummaryCards = (cards = []) => (
    <Row gutter={[12, 16]} style={{ marginBottom: 24 }}>
      {cards.map((stat) => (
        <Col
          key={stat.key}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          flex="1 1 220px"
          style={{ display: 'flex' }}
        >
          <Card
            hoverable
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
  );

  const renderOverviewTab = () => {
    if (!overview) {
      return <Empty description="No overview data" />;
    }

    const summary = overview.summary || {};
    const overviewCards = [
      {
        key: 'totalStudents',
        title: 'Total students',
        value: summary.totalStudents ?? 0,
        subtitle: 'All students',
        icon: <UserOutlined style={{ color: '#2b6cb0' }} />,
        bg: '#d6e6fb'
      },
      {
        key: 'newStudents30d',
        title: 'New (30d)',
        value: summary.newStudents30d ?? 0,
        subtitle: 'Last 30 days',
        icon: <UserOutlined style={{ color: '#6b46c1' }} />,
        bg: '#efe1ff'
      },
      {
        key: 'completionRate',
        title: 'Completion rate',
        value: `${Number(summary.completionRate ?? 0).toFixed(1)}%`,
        subtitle: 'Average completion',
        icon: <BarChartOutlined style={{ color: '#1f7a3e' }} />,
        bg: '#dff7e8'
      },
      {
        key: 'activeClasses',
        title: 'Active classes',
        value: summary.activeClasses ?? 0,
        subtitle: 'Running now',
        icon: <HomeOutlined style={{ color: '#0f766e' }} />,
        bg: '#d1fae5'
      },
    ];

    const growthTrendData = (overview.growthTrend || []).map((d) => ({
      date: d?.date,
      newStudents: d?.newStudents ?? 0,
      submissions: d?.submissions ?? 0,
    }));

    const roleRatios = overview.summary?.roleRatios || [];

    return (
      <>
        {renderSummaryCards(overviewCards)}

        {/* Role distribution + Alerts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Role distribution</div>
              </div>
              {roleRatios.length === 0 ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 24, right: 24, bottom: 48, left: 24 }}>
                      <Pie
                        data={roleRatios}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="46%"
                        outerRadius={110}
                        label={({ role, percentage }) => `${role} (${Number(percentage ?? 0).toFixed(1)}%)`}
                      >
                        {roleRatios.map((entry, index) => (
                          <Cell key={`overview-role-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ marginTop: 12 }} />
                      <ReTooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <AlertOutlined style={{ color: '#ef4444', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Alerts</div>
              </div>
              {(!overview.alerts || overview.alerts.length === 0) ? (
                <Empty description="No alerts" />
              ) : (
                <div style={{ maxHeight: 320, overflow: 'auto', paddingRight: 4 }}>
                  {(overview.alerts || []).map((al, idx) => (
                    <div className="mdv2-alert" key={idx}>
                      <div className="mdv2-alert__type">{al.type}</div>
                      <div className="mdv2-alert__msg">{al.message}</div>
                      {al.actionUrl ? (
                        <a className="mdv2-alert__action" href={al.actionUrl} target="_blank" rel="noreferrer">Action</a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Growth + Level funnel (overview) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 360
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Growth trend (30 days)</div>
              </div>
              {growthTrendData.length === 0 ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={growthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <ReTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="newStudents" stroke="#60a5fa" strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="submissions" stroke="#f59e0b" strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 360
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FunnelPlotOutlined style={{ color: '#a78bfa', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Level funnel</div>
              </div>
              {(!overview.levelFunnel || overview.levelFunnel.length === 0) ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <FunnelChart>
                      <ReTooltip
                        formatter={(value, name, props) => {
                          const p = props?.payload || {};
                          return [`${p.trueValue ?? 0} students`, p.name];
                        }}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Funnel
                        dataKey="value"
                        data={[...(overview.levelFunnel || [])].reverse().map((lv, idx, arr) => ({
                          name: lv.level,
                          value: (arr.length - idx) * 10,
                          trueValue: lv.students,
                          color: FUNNEL_COLORS[(arr.length - 1 - idx) % FUNNEL_COLORS.length],
                          label: lv.level, // Remove ": number of students"
                        }))}
                        isAnimationActive
                        stroke="#ffffff"
                        fill="#8884d8"
                        shape={RectFunnelShape}
                      >
                        {[...(overview.levelFunnel || [])].reverse().map((_, index, arr) => (
                          <Cell key={`overview-funnel-${index}`} fill={FUNNEL_COLORS[(arr.length - 1 - index) % FUNNEL_COLORS.length]} />
                        ))}
                        <LabelList
                          dataKey="label"
                          position="center"
                          fill="black"
                          stroke="none"
                          style={{ fontWeight: 500, fontSize: 14 }}
                        />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Top syllabus + Teacher workload */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <ReadOutlined style={{ color: '#7c3aed', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Top syllabus</div>
              </div>
              {(!overview.topSyllabus || overview.topSyllabus.length === 0) ? (
                <Empty description="No syllabus data" />
              ) : (
                <div className="mdv2-table" style={{ maxHeight: 360, overflow: 'auto', paddingRight: 4 }}>
                  <div className="mdv2-table__head">
                    <div>Name</div>
                    <div>Code</div>
                    <div>Classes</div>
                  </div>
                  {(overview.topSyllabus || []).map((syl, idx) => (
                    <div className="mdv2-table__row" key={syl.code || idx}>
                      <div>{syl.name}</div>
                      <div><Tag color="blue">{syl.code}</Tag></div>
                      <div>{syl.classes ?? 0}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#10b981', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Teacher workload</div>
              </div>
              {(!overview.teacherWorkload || overview.teacherWorkload.length === 0) ? (
                <Empty description="No workload data" />
              ) : (
                <div className="mdv2-table" style={{ maxHeight: 360, overflow: 'auto', paddingRight: 4 }}>
                  <div className="mdv2-table__head">
                    <div>Teacher</div>
                    <div>Classes</div>
                    <div>Status</div>
                  </div>
                  {(overview.teacherWorkload || []).map((t, idx) => {
                    const status = String(t.status || '').toUpperCase();
                    const color = status.includes('OVER') ? 'red' : status.includes('UNDER') ? 'gold' : 'green';
                    return (
                      <div className="mdv2-table__row" key={t.teacherName || idx}>
                        <div>{t.teacherName}</div>
                        <div>{t.classes ?? 0}</div>
                        <div><Tag color={color}>{t.status}</Tag></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const renderUsersTab = () => {
    if (!usersReport) {
      return <Empty description="No user data" />;
    }

    const summary = usersReport.summary || {};
    const userCards = [
      {
        key: 'activeUsers',
        title: 'Active users',
        value: summary.activeUsers ?? 0,
        subtitle: 'Currently active',
        icon: <TeamOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5'
      },
      {
        key: 'newUsers30d',
        title: 'New (30d)',
        value: summary.newUsers30d ?? 0,
        subtitle: 'Joined last 30 days',
        icon: <UserOutlined style={{ color: '#6366f1' }} />,
        bg: '#eef2ff'
      },
      {
        key: 'atRiskStudents',
        title: 'At-risk students',
        value: summary.atRiskStudents ?? 0,
        subtitle: 'Need attention',
        icon: <AlertOutlined style={{ color: '#ef4444' }} />,
        bg: '#fee2e2'
      },
      {
        key: 'totalUsers',
        title: 'Total users',
        value: summary.totalUsers ?? 0,
        subtitle: 'All accounts',
        icon: <UserOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe'
      },
    ];

    const statusBreakdown = usersReport.statusBreakdown || {};

  return (
      <>
        {renderSummaryCards(userCards)}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Role distribution</div>
              </div>
              {rolePieData.length === 0 ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 24, right: 24, bottom: 48, left: 24 }}>
                      <Pie
                        data={rolePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        outerRadius={110}
                        label={({ name, percentage }) => `${name} (${Number(percentage ?? 0).toFixed(1)}%)`}
                      >
                        {rolePieData.map((entry, index) => (
                          <Cell key={`users-role-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ marginTop: 12 }} />
                      <ReTooltip formatter={(value, name, props) => {
                        const pct = props?.payload?.percentage;
                        return [`${value} (${(pct ?? 0).toFixed(1)}%)`, name];
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              </Card>
            </Col>
          <Col xs={24} lg={10}>
              <Card 
                style={{
                  backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <AlertOutlined style={{ color: '#f97316', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Status breakdown</div>
              </div>
              {(!statusBreakdown || Object.keys(statusBreakdown).length === 0) ? (
                <Empty description="No status data" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', fontWeight: 600 }}>
                      <span>{status}</span>
                      <span>{count ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
              </Card>
            </Col>
        </Row>
      </>
    );
  };

  const renderSyllabusTab = () => {
    if (!syllabusReport) {
      return <Empty description="No syllabus data" />;
    }

    const cards = [
      {
        key: 'totalSyllabuses',
        title: 'Syllabuses',
        value: syllabusReport.totalSyllabuses ?? 0,
        subtitle: 'Available syllabuses',
        icon: <ReadOutlined style={{ color: '#6366f1' }} />,
        bg: '#eef2ff'
      },
      {
        key: 'totalChapters',
        title: 'Chapters',
        value: syllabusReport.totalChapters ?? 0,
        subtitle: 'Across syllabuses',
        icon: <FileTextOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe'
      },
      {
        key: 'totalLessons',
        title: 'Lessons',
        value: syllabusReport.totalLessons ?? 0,
        subtitle: 'Learning units',
        icon: <BookOutlined style={{ color: '#f97316' }} />,
        bg: '#fff7ed'
      },
    ];

    const usageChartData = processedSyllabuses
      .map((s) => ({ name: s.syllabusName, usage: s.usageClasses ?? 0 }))
      .sort((a, b) => (b.usage ?? 0) - (a.usage ?? 0))
      .slice(0, 6);

    const completionChartData = processedSyllabuses
      .map((s) => ({ name: s.syllabusName, completion: Number(s.avgCompletion ?? 0) }))
      .sort((a, b) => b.completion - a.completion)
      .slice(0, 6);

    const levelDonutData = Object.values(
      processedSyllabuses.reduce((acc, item) => {
        const key = item.levelName || 'Unknown';
        acc[key] = acc[key] || { level: key, value: 0 };
        acc[key].value += 1;
        return acc;
      }, {})
    );

    const contentStackedData = processedSyllabuses
      .map((s) => ({
        name: s.syllabusName,
        chapters: s.chapters ?? 0,
        lessons: s.lessons ?? 0,
      }))
      .sort((a, b) => (b.chapters + b.lessons) - (a.chapters + a.lessons))
      .slice(0, 5);

  return (
      <>
        {renderSummaryCards(cards)}
        {processedSyllabuses.length === 0 ? (
          <Empty description="No syllabus usage" />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
        <Card 
          style={{ 
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    paddingTop: 8,
                    minHeight: 360
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <ReadOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Usage by syllabus</div>
                  </div>
                  {usageChartData.length === 0 ? (
                    <Empty description="No usage data" />
                  ) : (
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <ReBarChart data={usageChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <ReTooltip />
                          <Bar dataKey="usage" radius={[6, 6, 0, 0]} fill="#6366f1" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
            </Col>
              <Col xs={24} lg={12}>
                <Card
                  style={{
                    backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    paddingTop: 8,
                    minHeight: 360
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <BarChartOutlined style={{ color: '#a855f7', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Average completion</div>
                  </div>
                  {completionChartData.length === 0 ? (
                    <Empty description="No completion data" />
                  ) : (
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <ReBarChart
                          layout="vertical"
                          data={completionChartData}
                          margin={{ left: 40, right: 24, top: 16, bottom: 16 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                          <ReTooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Completion']} />
                          <Bar dataKey="completion" radius={[0, 6, 6, 0]} fill="#22c55e" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
            </Col>
          </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={12}>
                <Card
                  style={{
                    backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    paddingTop: 8,
                    minHeight: 360
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <FunnelPlotOutlined style={{ color: '#10b981', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Syllabus by level</div>
                  </div>
                  {levelDonutData.length === 0 ? (
                    <Empty description="No level data" />
                  ) : (
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={levelDonutData}
                            dataKey="value"
                            nameKey="level"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            label={({ level, value }) => `${level} (${value})`}
                          >
                            {levelDonutData.map((entry, index) => (
                              <Cell key={`syllabus-level-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend verticalAlign="bottom" />
                          <ReTooltip formatter={(value, name) => [value, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
        </Card>
              </Col>
              <Col xs={24} lg={12}>
              <Card 
                style={{
                  backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    paddingTop: 8,
                    minHeight: 360
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <BarChartOutlined style={{ color: '#f97316', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Chapters vs lessons</div>
                  </div>
                  {contentStackedData.length === 0 ? (
                    <Empty description="No content data" />
                  ) : (
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <ReBarChart data={contentStackedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Legend />
                          <ReTooltip />
                          <Bar dataKey="chapters" stackId="content" fill="#60a5fa" />
                          <Bar dataKey="lessons" stackId="content" fill="#f59e0b" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </Card>
            </Col>
        </Row>

        <Card 
          style={{ 
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <ReadOutlined style={{ color: '#7c3aed', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Detailed syllabus list</div>
              </div>
              <div className="mdv2-table mdv2-scroll">
                <div className="mdv2-table__head" style={{ gridTemplateColumns: '2fr 1fr 0.8fr 1.2fr 1fr' }}>
                  <div>Syllabus</div>
                  <div>Level</div>
                  <div>Content</div>
                  <div>Usage</div>
                  <div>Completion</div>
                </div>
                {processedSyllabuses.map((syl, idx) => {
                  const completion = Number(syl.avgCompletion ?? 0);
                  const completionColor = completion >= 80 ? '#10b981' : completion >= 60 ? '#f59e0b' : '#ef4444';
                  const usageClasses = syl.usageClasses ?? 0;
                  return (
                    <div
                      className="mdv2-table__row"
                      key={syl.syllabusId || idx}
                      style={{ gridTemplateColumns: '2fr 1fr 0.8fr 1.2fr 1fr' }}
                    >
                      <div style={{ fontWeight: 500 }}>{syl.syllabusName}</div>
                      <div><Tag color="blue" style={{ margin: 0 }}>{syl.levelName}</Tag></div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {syl.chapters ?? 0}ch / {syl.lessons ?? 0}ls
                      </div>
                      <div>
                        {usageClasses > 0 ? (
                          <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>
                            {usageClasses} {usageClasses === 1 ? 'class' : 'classes'}
                          </Tag>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>0</span>
                        )}
                      </div>
                      <div style={{ color: completionColor, fontWeight: 600 }}>{completion.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </>
    );
  };

  const renderLevelsTab = () => {
    if (!levelReport || processedLevels.length === 0) {
      return <Empty description="No level data" />;
    }

    const cards = [
      {
        key: 'totalLevels',
        title: 'Levels',
        value: levelReport.totalLevels ?? 0,
        subtitle: 'Learning tracks',
        icon: <FunnelPlotOutlined style={{ color: '#a855f7' }} />,
        bg: '#f5f3ff'
      },
      {
        key: 'levelStudents',
        title: 'Students',
        value: levelReport.totalStudentsAcrossLevels ?? 0,
        subtitle: 'Across levels',
        icon: <TeamOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5'
      },
      {
        key: 'avgCompletion',
        title: 'Avg completion',
        value: `${(
          processedLevels.reduce((sum, lv) => sum + (lv.completion ?? 0), 0) /
          (processedLevels.length || 1)
        ).toFixed(1)}%`,
        subtitle: 'Mean completion rate',
        icon: <BarChartOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe'
      },
    ];

    const levelBarData = processedLevels.map((lv) => ({
      name: lv.level,
      students: lv.students ?? 0,
      classes: lv.classes ?? 0,
      teachers: lv.teachers ?? 0,
    }));

    const completionTrend = processedLevels.map((lv) => ({
      name: lv.level,
      completion: Number(lv.completion ?? 0),
    }));

    const levelPieData = processedLevels.map((lv) => ({
      name: lv.level,
      value: lv.students ?? 0,
    }));

    return (
      <>
        {renderSummaryCards(cards)}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="stretch">
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Resource Allocation by Level</div>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <ReBarChart data={levelBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Legend />
                    <ReTooltip />
                    <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="classes" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="teachers" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#a855f7', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Average completion</div>
              </div>
              {completionTrend.length === 0 ? (
                <Empty description="No completion data" />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <ReBarChart
                      layout="vertical"
                      data={completionTrend}
                      margin={{ left: 40, right: 24, top: 16, bottom: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                      <ReTooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Completion']} />
                      <Bar dataKey="completion" radius={[0, 6, 6, 0]} fill="#22c55e" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
              <Card 
                style={{
                  backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 360
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#22c55e', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Students distribution by level</div>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={levelPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {levelPieData.map((entry, index) => (
                        <Cell key={`level-pie-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" />
                    <ReTooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              </Card>
            </Col>
          <Col xs={24} lg={12}>
                <Card 
                  style={{ 
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 360
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FunnelPlotOutlined style={{ color: '#a78bfa', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Level funnel</div>
                    </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <FunnelChart>
                    <ReTooltip
                      formatter={(value, name, props) => {
                        const p = props?.payload || {};
                        return [`${p.trueValue ?? 0} students`, p.name];
                      }}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                      stroke="#ffffff"
                      fill="#8884d8"
                      shape={RectFunnelShape}
                    >
                      {funnelData.map((entry, index) => (
                        <Cell key={`level-funnel-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="label"
                        position="center"
                        fill="black"
                        stroke="none"
                        style={{ fontWeight: 500, fontSize: 14 }}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
                    </div>
            </Card>
          </Col>
        </Row>

        <Card 
          style={{ 
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
            border: 'none',
            borderRadius: 16,
            boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
            paddingTop: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <TeamOutlined style={{ color: '#6366f1', fontSize: 20 }} />
            <div className="manager-dashboard-v2__title">Level details</div>
          </div>
          <div className="mdv2-level-summary" style={{ marginTop: 16 }}>
            <div className="mdv2-level-summary__head">
              <div>Level</div>
              <div>Students</div>
              <div>Teachers</div>
              <div>Classes</div>
              <div>Syllabuses</div>
              <div>Completion</div>
            </div>
            {processedLevels.map((lv, idx) => {
              const completion = Number(lv.completion ?? 0);
              const completionColor = completion >= 80 ? '#10b981' : completion >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div className="mdv2-level-summary__row" key={lv.levelId || lv.level || idx}>
                  <div>{lv.level}</div>
                  <div>{lv.students ?? 0}</div>
                  <div>{lv.teachers ?? 0}</div>
                  <div>{lv.classes ?? 0}</div>
                  <div>{lv.syllabuses ?? 0}</div>
                  <div style={{ color: completionColor, fontWeight: 600 }}>{completion.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      </>
    );
  };

  const renderClassesTab = () => {
    if (!classesReport) {
      return <Empty description="No class data" />;
    }

    const summary = classesReport.summary || {};
    const cards = [
      {
        key: 'activeClasses',
        title: 'Active classes',
        value: summary.activeClasses ?? 0,
        subtitle: 'Running now',
        icon: <HomeOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5'
      },
      {
        key: 'completedClasses',
        title: 'Completed classes',
        value: summary.completedClasses ?? 0,
        subtitle: 'Finished',
        icon: <HomeOutlined style={{ color: '#6366f1' }} />,
        bg: '#eef2ff'
      },
      {
        key: 'avgStudentsPerClass',
        title: 'Avg students/class',
        value: Number(summary.avgStudentsPerClass ?? 0).toFixed(1),
        subtitle: 'Density',
        icon: <TeamOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe'
      },
    ];

    if (processedTopClasses.length === 0) {
      return (
        <>
          {renderSummaryCards(cards)}
          <Empty description="No top classes" />
        </>
      );
    }

    const barData = processedTopClasses
      .slice()
      .sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0))
      .slice(0, 8)
      .map((c) => ({ name: c.className, students: c.studentCount ?? 0 }));

    const pieData = processedTopClasses.map((c) => ({ name: c.className, value: c.studentCount ?? 0 }));

    const comboData = processedTopClasses
      .slice(0, 8)
      .map((c) => ({
        name: c.className,
        students: c.studentCount ?? 0,
        avgScore: Number(c.avgScore ?? 0) * 100,
      }));

    return (
      <>
        {renderSummaryCards(cards)}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="stretch">
          <Col xs={24} lg={12}>
                <Card 
                  style={{ 
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <HomeOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Student count by class</div>
                    </div>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <ReBarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ReTooltip />
                    <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
                    </div>
                </Card>
              </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#22c55e', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Student share by class</div>
              </div>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`class-pie-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" />
                    <ReTooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 400
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#f97316', fontSize: 20 }} />
                <div className="manager-dashboard-v2__title">Scale vs quality</div>
              </div>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <ComposedChart data={comboData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <Legend />
                    <ReTooltip formatter={(value, name) => name === 'avgScore' ? [`${Number(value).toFixed(1)}%`, 'Avg score'] : [value, name]} />
                    <Bar yAxisId="left" dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#22c55e" strokeWidth={2.2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
        </Card>
          </Col>
        </Row>

        <Card
          style={{
            backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
            border: 'none',
            borderRadius: 16,
            boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
            paddingTop: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <HomeOutlined style={{ color: '#6366f1', fontSize: 20 }} />
            <div className="manager-dashboard-v2__title">Top classes</div>
          </div>
          <div className="mdv2-table mdv2-scroll">
            <div className="mdv2-table__head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
              <div>Class</div>
              <div>Students</div>
              <div>Avg score</div>
              <div>Completion</div>
            </div>
            {processedTopClasses.map((c, idx) => {
              const completion = Number(c.completionRate ?? 0) * 100;
              const score = Number(c.avgScore ?? 0) * 100;
              const completionColor = completion >= 80 ? '#10b981' : completion >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div className="mdv2-table__row" key={c.classId || idx} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                  <div style={{ fontWeight: 500 }}>{c.className}</div>
                  <div>{c.studentCount ?? 0}</div>
                  <div style={{ color: '#475569', fontWeight: 600 }}>{score.toFixed(1)}%</div>
                  <div style={{ color: completionColor, fontWeight: 600 }}>{completion.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'syllabus':
        return renderSyllabusTab();
      case 'levels':
        return renderLevelsTab();
      case 'classes':
        return renderClassesTab();
      default:
        return null;
    }
  };

  return (
    <ThemedLayout>
      <div className={`manager-page main-content-panel ${theme}-theme`} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <div className="manager-dashboard-v2" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="manager-dashboard-tabbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`manager-dashboard-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabError && (
            <div className="mdv2-error" style={{ marginBottom: 16 }}>
              {tabError}
            </div>
          )}

          <LoadingWithEffect loading={tabLoading} message="Loading...">
            {renderTabContent()}
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default ManagerDashboard;
