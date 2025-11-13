import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Empty, Button, Typography, Table, Tag } from 'antd';
import LoadingWithEffect from '../../../component/spinner/LoadingWithEffect';
import {
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  BarChart as ReBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemedLayoutNoSidebar from '../../../component/teacherlayout/ThemedLayout';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../../hooks/usePageTitle';
import { spaceToast } from '../../../component/SpaceToastify';
import { getUserProfile } from '../../../redux/auth';
import { studentManagementApi } from '../../../apis/apis';
import './StudentLearningProgressView.css';

const StudentLearningProgressOverview = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const userRole = user?.role;
  const isTestTaker = userRole === 'TEST_TAKER' || userRole === 'test_taker';
  const routePrefix = isTestTaker ? '/test-taker' : '/student';

  // Set page title
  usePageTitle(t('studentDashboard.learningProgressOverview', 'View Student Learning Progress Overview'));

  // State management
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [levelChartData, setLevelChartData] = useState([]);
  const [scoreTrendData, setScoreTrendData] = useState([]);
  const [challengeDetailData, setChallengeDetailData] = useState(null);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // Load student learning progress data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Call both APIs in parallel
        const [overviewResponse, levelHistoryResponse] = await Promise.all([
          studentManagementApi.getStudentOverview(),
          studentManagementApi.getStudentLevelHistory(),
        ]);
        
        console.log('Student Overview Response:', overviewResponse);
        console.log('Student Level History Response:', levelHistoryResponse);
        
        // Process overview data
        const overview = overviewResponse?.data?.data || overviewResponse?.data;
        
        if (overview && (overviewResponse?.data?.success !== false)) {
          // Extract challenge progress
          const challengeProgress = overview.challengeProgress || {};
          const totalChallenges = challengeProgress.totalChallenges ?? 0;
          const completedChallenges = challengeProgress.completedCount ?? 0;
          const lateChallenges = challengeProgress.lateCount ?? 0;
          const notStartedChallenges = challengeProgress.notStartedCount ?? 0;
          
          // Calculate learning rate (Tỷ lệ học tập = số DC đã làm / tổng số DC)
          const learningRate = totalChallenges > 0 
            ? (completedChallenges / totalChallenges) * 100 
            : 0;
          
          // Calculate completion rate and on-time rate
          const completionRate = challengeProgress.completionRate ?? 0;
          const lateRate = challengeProgress.lateRate ?? 0;
          const onTimeRate = Math.max(0, (completionRate - lateRate) * 100); // Convert to percentage
          
          // Set overview data
          setOverviewData({
            firstClassJoinedAt: overview.firstClassJoinedAt || null,
            learningRate: learningRate, // Tỷ lệ học tập = số DC đã làm / tổng số DC
            currentLevel: overview.currentLevel?.levelName || 'N/A',
            currentLevelId: overview.currentLevel?.levelId || null,
            currentLevelCode: overview.currentLevel?.levelCode || '',
            currentLevelDescription: overview.currentLevel?.description || '',
            currentClass: overview.currentClass?.className || 'N/A',
            currentClassId: overview.currentClass?.classId || null,
            currentClassCode: overview.currentClass?.classCode || '',
            currentClassJoinedAt: overview.currentClass?.joinedAt || null,
            completionRate: completionRate * 100, // Convert to percentage
            onTimeRate: onTimeRate, // Already converted to percentage
            lateRate: lateRate * 100,
            totalChallenges: totalChallenges,
            completedChallenges: completedChallenges,
            lateChallenges: lateChallenges,
            notStartedChallenges: notStartedChallenges,
          });
        } else {
          console.warn('No valid overview data found in response');
          setOverviewData({
            learningRate: 0,
            currentLevel: 'N/A',
            currentClass: 'N/A',
            completionRate: 0,
            onTimeRate: 0,
            totalChallenges: 0,
            completedChallenges: 0,
            lateChallenges: 0,
            notStartedChallenges: 0,
          });
        }
        
        // Process level history data for charts
        const levelHistoryData = levelHistoryResponse?.data?.data || levelHistoryResponse?.data;
        const levels = levelHistoryData?.levels || [];
        
        console.log('Level History Levels:', levels);
        
        if (levels && Array.isArray(levels) && levels.length > 0) {
          // Prepare level chart data (for bar chart)
          // Show "All V" = average of all DC types (vocabulary, reading, listening, writing, speaking)
          const levelChartDataArray = [];
          levels.forEach(level => {
            if (level.classes && Array.isArray(level.classes) && level.classes.length > 0) {
              level.classes.forEach(classItem => {
                // Calculate average score across all DC types (All V)
                const scores = classItem.scoreByType || {};
                const avgScores = [
                  scores.vocabularyAvg || 0,
                  scores.readingAvg || 0,
                  scores.listeningAvg || 0,
                  scores.writingAvg || 0,
                  scores.speakingAvg || 0,
                ];
                // Calculate average of all non-zero scores
                const validScores = avgScores.filter(s => s > 0);
                const allV = validScores.length > 0
                  ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
                  : 0;
                
                levelChartDataArray.push({
                  level: level.levelName,
                  levelCode: level.levelCode,
                  class: classItem.className,
                  classCode: classItem.classCode,
                  value: allV,
                  scores: scores,
                });
              });
            }
          });
          
          console.log('Level Chart Data Array:', levelChartDataArray);
          setLevelChartData(levelChartDataArray);
          
          // Prepare score trend data (for line chart)
          // Group by time periods (weeks) from joined dates
          const scoreTrendArray = [];
          levels.forEach(level => {
            if (level.classes && Array.isArray(level.classes)) {
              level.classes.forEach(classItem => {
                const joinedAt = classItem.joinedAt ? new Date(classItem.joinedAt) : null;
                if (joinedAt && !isNaN(joinedAt.getTime())) {
                  const scores = classItem.scoreByType || {};
                  const avgScores = [
                    scores.vocabularyAvg || 0,
                    scores.readingAvg || 0,
                    scores.listeningAvg || 0,
                    scores.writingAvg || 0,
                    scores.speakingAvg || 0,
                  ];
                  const validScores = avgScores.filter(s => s > 0);
                  const studentAvg = validScores.length > 0
                    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
                    : 0;
                  
                  if (studentAvg > 0) {
                    // Calculate week number from joined date
                    const weekNumber = Math.max(1, Math.floor((new Date() - joinedAt) / (1000 * 60 * 60 * 24 * 7)) + 1);
                    
                    scoreTrendArray.push({
                      date: `Tuần ${weekNumber}`,
                      weekNumber: weekNumber,
                      studentScore: studentAvg,
                      classAverage: studentAvg * 0.9, // Mock class average (90% of student score)
                      level: level.levelName,
                      class: classItem.className,
                    });
                  }
                }
              });
            }
          });
          
          // Sort by week number and group by week
          scoreTrendArray.sort((a, b) => a.weekNumber - b.weekNumber);
          const groupedByWeek = {};
          scoreTrendArray.forEach(item => {
            if (!groupedByWeek[item.date]) {
              groupedByWeek[item.date] = {
                date: item.date,
                weekNumber: item.weekNumber,
                scores: [],
              };
            }
            groupedByWeek[item.date].scores.push(item.studentScore);
          });
          
          // Calculate average for each week
          const finalScoreTrend = Object.values(groupedByWeek).map(week => ({
            date: week.date,
            studentScore: week.scores.reduce((sum, s) => sum + s, 0) / week.scores.length,
            classAverage: (week.scores.reduce((sum, s) => sum + s, 0) / week.scores.length) * 0.9,
          }));
          
          console.log('Score Trend Data:', finalScoreTrend);
          setScoreTrendData(finalScoreTrend);
        } else {
          console.warn('No levels data found in response');
          setLevelChartData([]);
          setScoreTrendData([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading student learning progress:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load learning progress data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load challenge detail when currentClassId is available
  useEffect(() => {
    const loadChallengeDetail = async () => {
      const classId = overviewData?.currentClassId;
      if (!classId) {
        setChallengeDetailData(null);
        return;
      }

      setLoadingChallenges(true);
      try {
        const response = await studentManagementApi.getStudentClassChallengeDetail(classId);
        console.log('Student Class Challenge Detail Response:', response);
        
        const challengeData = response?.data?.data || response?.data;
        if (challengeData && (response?.data?.success !== false)) {
          setChallengeDetailData(challengeData);
        } else {
          console.warn('No valid challenge detail data found in response');
          setChallengeDetailData(null);
        }
        setLoadingChallenges(false);
      } catch (err) {
        console.error('Error loading challenge detail:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load challenge detail');
        setChallengeDetailData(null);
        setLoadingChallenges(false);
      }
    };

    if (overviewData?.currentClassId) {
      loadChallengeDetail();
    }
  }, [overviewData?.currentClassId]);

  // Render summary cards
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
              width: '100%',
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
                justifyContent: 'center',
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

  // Overview cards
  const overviewCards = useMemo(() => {
    if (!overviewData) return [];
    
    // Format first class joined date
    const formatDate = (dateString) => {
      if (!dateString) return 'Chưa có';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Chưa có';
        return date.toLocaleDateString('vi-VN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return 'Chưa có';
      }
    };
    
    return [
      {
        key: 'firstClassJoinedAt',
        title: t('studentProgress.firstClassJoinedAt', 'Thời gian bắt đầu học'),
        value: overviewData.firstClassJoinedAt ? formatDate(overviewData.firstClassJoinedAt) : 'Chưa có',
        subtitle: 'Ngày tham gia lớp đầu tiên',
        icon: <BookOutlined style={{ color: '#10b981' }} />,
        bg: '#d1fae5',
      },
      {
        key: 'currentLevel',
        title: t('studentProgress.currentLevel', 'Level hiện tại'),
        value: overviewData.currentLevel && overviewData.currentLevel !== 'N/A' ? overviewData.currentLevel : 'Chưa có',
        subtitle: overviewData.currentLevelCode ? `${overviewData.currentLevelCode}` : 'Chưa có level',
        icon: <TrophyOutlined style={{ color: '#f59e0b' }} />,
        bg: '#fff7ed',
      },
      {
        key: 'currentClass',
        title: t('studentProgress.currentClass', 'Lớp hiện tại'),
        value: overviewData.currentClass && overviewData.currentClass !== 'N/A' ? overviewData.currentClass : 'Chưa có',
        subtitle: overviewData.currentClassCode || 'Chưa có class',
        icon: <TeamOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe',
      },
      {
        key: 'completionRate',
        title: t('studentProgress.completionRate', 'Tỷ lệ hoàn thành'),
        value: `${Number(overviewData.completionRate ?? 0).toFixed(1)}%`,
        subtitle: `${overviewData.completedChallenges ?? 0}/${overviewData.totalChallenges ?? 0} DC`,
        icon: <CheckCircleOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5',
      },
      {
        key: 'onTimeRate',
        title: t('studentProgress.onTimeRate', 'Tỷ lệ đúng hạn'),
        value: `${Number(overviewData.onTimeRate ?? 0).toFixed(1)}%`,
        subtitle: `${Math.max(0, (overviewData.completedChallenges ?? 0) - (overviewData.lateChallenges ?? 0))}/${overviewData.totalChallenges ?? 0} DC`,
        icon: <ClockCircleOutlined style={{ color: '#8b5cf6' }} />,
        bg: '#f5f3ff',
      },
    ];
  }, [overviewData, t]);

  // Level chart data formatted
  const levelChartFormatted = useMemo(() => {
    return levelChartData.map(item => ({
      name: `${item.level}\n(${item.class})`,
      value: item.value,
      level: item.level,
      class: item.class,
    }));
  }, [levelChartData]);

  const dispatch = useDispatch();
  const { profileData } = useSelector((state) => state.auth);

  // Fetch user profile data on component mount
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  // Handle back navigation
  const handleBack = () => {
    navigate(`${routePrefix}/dashboard`);
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      case 'TEACHER':
        return 'Teacher';
      case 'TEACHING_ASSISTANT':
        return 'Teaching Assistant';
      case 'STUDENT':
        return 'Student';
      case 'TEST_TAKER':
        return 'Test Taker';
      default:
        return 'User';
    }
  };

  // Get avatar URL
  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl === 'string' || avatarUrl.trim() === '') {
      return '/img/avatar_1.png';
    }
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('/')) {
      return avatarUrl;
    }
    return '/img/avatar_1.png';
  };

  // Custom header with logo, back button, page title, and right side elements
  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content">
          <div className="themed-navbar-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Logo and CAMKEY Text */}
            <div onClick={() => navigate(`${routePrefix}/dashboard`)} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 20px',
              cursor: 'pointer'
            }}>
              {theme === 'space' ? (
                <img 
                  src="/img/logo-dark.png"
                  alt="CAMKEY Logo"
                  style={{
                    width: '40px',
                    height: '40px',
                    filter: 'drop-shadow(0 0 15px rgba(125, 211, 252, 0.8))'
                  }}
                />
              ) : (
                <img 
                  src="/img/logo-blue.png"
                  alt="CAMKEY Logo"
                  style={{
                    width: '40px',
                    height: '40px'
                  }}
                />
              )}
              <span style={{
                fontSize: '32px',
                fontWeight: 700,
                color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
                textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
              }}>
                CAMKEY
              </span>
            </div>

            {/* Back Button */}
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className={`class-menu-back-button ${theme}-class-menu-back-button`}
              style={{
                height: '32px',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                color: '#000000',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              {t('common.back')}
            </Button>

            {/* Page Title */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '0 20px'
            }}>
              <div style={{
                height: '24px',
                width: '1px',
                backgroundColor: theme === 'sun' ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255, 255, 255, 0.3)'
              }} />
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: theme === 'sun' ? '#1e40af' : '#fff',
                textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
              }}>
                {t('studentDashboard.learningProgressOverview', 'View Student Learning Progress Overview')}
              </h2>
            </div>
          </div>
          
          {/* Right side: Notification, Role, Profile */}
          <div className="themed-navbar-actions">
            <ul className="themed-navbar-nav">
              {/* Notifications - Simplified version */}
              <li className="themed-nav-item">
                <button
                  className="themed-nav-link notification-button"
                  type="button"
                  onClick={() => {/* Handle notification click */}}
                >
                  <img 
                    src="/img/notification_icon.png" 
                    alt="Notifications" 
                    className={`notification-icon ${theme}-notification-icon`}
                  />
                </button>
              </li>

              {/* User Role Display */}
              <li className="themed-nav-item">
                <span className={`user-role ${theme}-user-role`}>
                  {getRoleDisplayName()}
                </span>
              </li>

              {/* User Avatar */}
              <li className="themed-nav-item">
                <div className={`user-avatar ${theme}-user-avatar`}>
                  <img 
                    src={getAvatarUrl(profileData?.avatarUrl || user?.avatarUrl)} 
                    alt="Profile" 
                    className="avatar-image"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );

  if (loading) {
    return (
      <ThemedLayoutNoSidebar customHeader={customHeader}>
        <div className="slpv-container">
          <LoadingWithEffect loading={true} message={t('studentProgress.loading')} />
        </div>
      </ThemedLayoutNoSidebar>
    );
  }

  return (
    <ThemedLayoutNoSidebar customHeader={customHeader}>
      <div className={`slpv-container ${theme}-theme`}>
        {/* Page Title */}
        <div className="page-title-container" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Typography.Title 
            level={1} 
            className="page-title"
            style={{ margin: 0 }}
          >
            {t('studentDashboard.learningProgressOverview', 'View Student Learning Progress Overview')}
          </Typography.Title>
        </div>
        {/* Overview Section */}
        {renderSummaryCards(overviewCards)}

        {/* Level Comparison Chart */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <div className="slpv-title">Biểu đồ liên quan đến levels</div>
              </div>
              {levelChartFormatted.length === 0 ? (
                <Empty description="No level data" />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <ReBarChart data={levelChartFormatted} margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }} 
                        angle={-20} 
                        textAnchor="end" 
                        height={80}
                        label={{ value: 'Levels (Class)', position: 'insideBottom', offset: 10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'All V', angle: -90, position: 'insideLeft' }}
                      />
                      <ReTooltip 
                        formatter={(value, name, props) => {
                          return [`${value}`, 'Value'];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Score Trend Chart */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#10b981', fontSize: 20 }} />
                <div className="slpv-title">Biểu đồ theo dõi điểm theo thời gian</div>
              </div>
              {scoreTrendData.length === 0 ? (
                <Empty description="No score trend data" />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <LineChart data={scoreTrendData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Thời gian', position: 'insideBottom', offset: 10 }}
                      />
                      <YAxis 
                        domain={[0, 10]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Điểm', angle: -90, position: 'insideLeft' }}
                      />
                      <ReTooltip 
                        formatter={(value, name) => {
                          if (name === 'studentScore') {
                            return [`${Number(value).toFixed(1)}`, 'Điểm học sinh'];
                          }
                          if (name === 'classAverage') {
                            return [`${Number(value).toFixed(1)}`, 'Điểm TB lớp'];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="studentScore" 
                        stroke="#6366f1" 
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1' }}
                        activeDot={{ r: 6, fill: '#4c1d95' }}
                        name="Điểm học sinh"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="classAverage" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#22c55e' }}
                        activeDot={{ r: 5, fill: '#16a34a' }}
                        name="Điểm TB lớp"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Challenge Detail Section */}
        {challengeDetailData && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card
                style={{
                  backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                  border: 'none',
                  borderRadius: 16,
                  boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                  paddingTop: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircleOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                    <div className="slpv-title">
                      Chi tiết DC - {challengeDetailData.className} ({challengeDetailData.classCode})
                    </div>
                  </div>
                  {challengeDetailData.onTimeCompletionRate !== null && challengeDetailData.onTimeCompletionRate !== undefined && (
                    <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                      Tỷ lệ hoàn thành đúng hạn: {(challengeDetailData.onTimeCompletionRate * 100).toFixed(1)}%
                    </Tag>
                  )}
                </div>
                
                {loadingChallenges ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <LoadingWithEffect loading={true} message="Đang tải danh sách DC..." />
                  </div>
                ) : challengeDetailData.challenges && challengeDetailData.challenges.length > 0 ? (
                  <Table
                    dataSource={challengeDetailData.challenges}
                    rowKey="challengeId"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Tổng ${total} DC`,
                    }}
                    columns={[
                      {
                        title: 'Tên DC',
                        dataIndex: 'challengeName',
                        key: 'challengeName',
                        width: '35%',
                        render: (text) => (
                          <Typography.Text strong>{text}</Typography.Text>
                        ),
                      },
                      {
                        title: 'Loại',
                        dataIndex: 'challengeType',
                        key: 'challengeType',
                        width: '10%',
                        align: 'center',
                        render: (type) => {
                          const typeMap = {
                            'GV': { color: 'blue', text: 'Vocabulary' },
                            'RE': { color: 'green', text: 'Reading' },
                            'LI': { color: 'orange', text: 'Listening' },
                            'WR': { color: 'purple', text: 'Writing' },
                            'SP': { color: 'red', text: 'Speaking' },
                          };
                          const typeInfo = typeMap[type] || { color: 'default', text: type };
                          return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
                        },
                      },
                      {
                        title: 'Điểm',
                        dataIndex: 'score',
                        key: 'score',
                        width: '10%',
                        align: 'center',
                        render: (score) => (
                          <Typography.Text strong style={{ color: score > 0 ? '#22c55e' : '#6b7280' }}>
                            {score > 0 ? score.toFixed(1) : '-'}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'submissionStatus',
                        key: 'submissionStatus',
                        width: '15%',
                        align: 'center',
                        render: (status) => {
                          if (!status) {
                            return <Tag color="default">Chưa làm</Tag>;
                          }
                          const statusMap = {
                            'PENDING': { color: 'orange', text: 'Đang chờ' },
                            'SUBMITTED': { color: 'blue', text: 'Đã nộp' },
                            'GRADED': { color: 'green', text: 'Đã chấm' },
                            'REJECTED': { color: 'red', text: 'Từ chối' },
                          };
                          const statusInfo = statusMap[status] || { color: 'default', text: status };
                          return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                        },
                      },
                      {
                        title: 'Nộp muộn',
                        dataIndex: 'isLate',
                        key: 'isLate',
                        width: '10%',
                        align: 'center',
                        render: (isLate) => {
                          if (isLate === null || isLate === undefined) {
                            return <Tag color="default">-</Tag>;
                          }
                          return isLate ? (
                            <Tag color="red">Có</Tag>
                          ) : (
                            <Tag color="green">Không</Tag>
                          );
                        },
                      },
                      {
                        title: 'Ngày nộp',
                        dataIndex: 'submittedAt',
                        key: 'submittedAt',
                        width: '20%',
                        render: (submittedAt) => {
                          if (!submittedAt) return <Typography.Text type="secondary">-</Typography.Text>;
                          try {
                            const date = new Date(submittedAt);
                            return date.toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          } catch (e) {
                            return <Typography.Text type="secondary">-</Typography.Text>;
                          }
                        },
                      },
                    ]}
                  />
                ) : (
                  <Empty description="Không có DC nào trong lớp này" />
                )}
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </ThemedLayoutNoSidebar>
  );
};

export default StudentLearningProgressOverview;

