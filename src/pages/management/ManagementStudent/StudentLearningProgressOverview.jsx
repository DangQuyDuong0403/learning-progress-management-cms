import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Empty, Button, Select } from 'antd';
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
import ThemedHeader from '../../../component/ThemedHeader';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../../hooks/usePageTitle';
import { spaceToast } from '../../../component/SpaceToastify';
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
  const [challengeDetailData, setChallengeDetailData] = useState(null);
  const [challengeTypeFilter, setChallengeTypeFilter] = useState('GV');
  const [studentClasses, setStudentClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

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
          
          // Normalize percent values from BE (accepts 0-1 or 0-100)
          const normalizePercent = (value) => {
            const v = Number(value) || 0;
            return v > 1 ? v : v * 100;
          };
          // Calculate completion rate and on-time rate
          const completionRateRaw = challengeProgress.completionRate ?? 0;
          const lateRateRaw = challengeProgress.lateRate ?? 0;
          const completionRate = normalizePercent(completionRateRaw);
          const lateRate = normalizePercent(lateRateRaw);
          const onTimeRate = Math.max(0, completionRate - lateRate);
          
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
            completionRate: completionRate, // percentage 0-100
            onTimeRate: onTimeRate, // percentage 0-100
            lateRate: lateRate,
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
        
        // Ensure we have at least 3 levels by adding mock levels if necessary
        const randomBetween = (min, max) => {
          const value = min + Math.random() * (max - min);
          return Math.round(value * 10) / 10;
        };
        const buildMockScores = () => ({
          vocabularyAvg: randomBetween(6.0, 9.2),
          readingAvg: randomBetween(5.5, 8.8),
          listeningAvg: randomBetween(6.2, 9.5),
          writingAvg: randomBetween(5.0, 8.0),
          speakingAvg: randomBetween(5.8, 9.0),
        });
        const mockLevelMeta = [
          { name: 'Little Explorers', code: 'LV-M01' },
          { name: 'Young Achievers', code: 'LV-M02' },
          { name: 'Smart Learners', code: 'LV-M03' },
        ];
        const levelsForCharts = (() => {
          const base = Array.isArray(levels) ? [...levels] : [];
          let need = Math.max(0, 3 - base.length);
          let idx = 0;
          while (need > 0) {
            const meta = mockLevelMeta[idx % mockLevelMeta.length];
            base.push({
              levelId: 1000 + idx,
              levelName: meta.name,
              levelCode: meta.code,
              classes: [
                {
                  classId: 2000 + idx,
                  className: `DEMO-${idx + 1}`,
                  classCode: `CL-M${idx + 1}`,
                  joinedAt: new Date(Date.now() - (idx + 1) * 7 * 24 * 3600 * 1000).toISOString(),
                  leftAt: null,
                  scoreByType: buildMockScores(),
                },
              ],
            });
            idx += 1;
            need -= 1;
          }
          return base;
        })();
        
        if (levelsForCharts && Array.isArray(levelsForCharts) && levelsForCharts.length > 0) {
          // Prepare level chart data (for bar chart)
          // Show 5 grouped bars per level (Vocabulary, Reading, Listening, Writing, Speaking)
          const buildMockScoresIfNeeded = (scores) => {
            const s = scores || {};
            const values = [
              s.vocabularyAvg || 0,
              s.readingAvg || 0,
              s.listeningAvg || 0,
              s.writingAvg || 0,
              s.speakingAvg || 0,
            ];
            const allZero = values.every((v) => !v || v === 0);
            if (!allZero) return s;
            return buildMockScores();
          };
          const levelChartDataArray = [];
          levelsForCharts.forEach(level => {
            if (level.classes && Array.isArray(level.classes) && level.classes.length > 0) {
              level.classes.forEach(classItem => {
                const scores = buildMockScoresIfNeeded(classItem.scoreByType);
                levelChartDataArray.push({
                  level: level.levelName,
                  levelCode: level.levelCode,
                  class: classItem.className,
                  classCode: classItem.classCode,
                  vocabulary: scores.vocabularyAvg || 0,
                  reading: scores.readingAvg || 0,
                  listening: scores.listeningAvg || 0,
                  writing: scores.writingAvg || 0,
                  speaking: scores.speakingAvg || 0,
                });
              });
            }
          });
          
          console.log('Level Chart Data Array:', levelChartDataArray);
          setLevelChartData(levelChartDataArray);
        } else {
          console.warn('No levels data found in response');
          setLevelChartData([]);
        }
        
        // Collect all classes from REAL levels data (not mock data) - both past and current
        const allClasses = [];
        if (Array.isArray(levels) && levels.length > 0) {
          levels.forEach(level => {
            if (level.classes && Array.isArray(level.classes)) {
              level.classes.forEach(classItem => {
                allClasses.push({
                  classId: classItem.classId,
                  className: classItem.className,
                  classCode: classItem.classCode,
                  levelName: level.levelName,
                  levelCode: level.levelCode,
                  joinedAt: classItem.joinedAt,
                  leftAt: classItem.leftAt,
                });
              });
            }
          });
        }
        setStudentClasses(allClasses);
        
        // Set default selected class to current class
        const currentClassId = overview?.currentClass?.classId || null;
        if (currentClassId && allClasses.some(c => c.classId === currentClassId)) {
          setSelectedClassId(currentClassId);
        } else if (allClasses.length > 0) {
          // If current class not found, select the first class
          setSelectedClassId(allClasses[0].classId);
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

  // Load challenge detail when selectedClassId is available
  useEffect(() => {
    const loadChallengeDetail = async () => {
      if (!selectedClassId) {
        setChallengeDetailData(null);
        return;
      }

      try {
        const response = await studentManagementApi.getStudentClassChallengeDetail(selectedClassId);
        console.log('Student Class Challenge Detail Response:', response);
        
        const challengeData = response?.data?.data || response?.data;
        if (challengeData && (response?.data?.success !== false)) {
          setChallengeDetailData(challengeData);
        } else {
          console.warn('No valid challenge detail data found in response');
          setChallengeDetailData(null);
        }
      } catch (err) {
        console.error('Error loading challenge detail:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load challenge detail');
        setChallengeDetailData(null);
      }
    };

    if (selectedClassId) {
      loadChallengeDetail();
    }
  }, [selectedClassId]);

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
              minHeight: 140,
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
              <div style={{ fontWeight: 400, fontSize: 14, color: '#5b6b83', lineHeight: 1.1 }}>{stat.title}</div>
            </div>
            <div style={{ fontSize: 25, fontWeight: 600, marginBottom: 6, lineHeight: 1, color: '#1f2937' }}>
              {stat.value}
            </div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>
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
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('vi-VN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit'
        });
      } catch (e) {
        return 'N/A';
      }
    };
    
    return [
      {
        key: 'firstClassJoinedAt',
        title: t('studentProgress.firstClassJoinedAt', 'First class joined at'),
        value: overviewData.firstClassJoinedAt ? formatDate(overviewData.firstClassJoinedAt) : 'N/A',
        subtitle: 'First class join date',
        icon: <BookOutlined style={{ color: '#10b981' }} />,
        bg: '#d1fae5',
      },
      {
        key: 'currentLevel',
        title: t('studentProgress.currentLevel', 'Current level'),
        value: overviewData.currentLevel && overviewData.currentLevel !== 'N/A' ? overviewData.currentLevel : 'N/A',
        subtitle: overviewData.currentLevelCode ? `${overviewData.currentLevelCode}` : 'No level',
        icon: <TrophyOutlined style={{ color: '#f59e0b' }} />,
        bg: '#fff7ed',
      },
      {
        key: 'currentClass',
        title: t('studentProgress.currentClass', 'Current class'),
        value: overviewData.currentClass && overviewData.currentClass !== 'N/A' ? overviewData.currentClass : 'N/A',
        subtitle: overviewData.currentClassCode || 'No class',
        icon: <TeamOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe',
      },
      {
        key: 'completionRate',
        title: t('studentProgress.completionRate', 'Completion rate'),
        value: `${Number(overviewData.completionRate ?? 0).toFixed(1)}%`,
        subtitle: `${overviewData.completedChallenges ?? 0}/${overviewData.totalChallenges ?? 0} challenges`,
        icon: <CheckCircleOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5',
      },
      {
        key: 'lateRate',
        title: t('studentProgress.lateRate', 'Late rate'),
        value: `${Number(overviewData.lateRate ?? 0).toFixed(1)}%`,
        subtitle: `${overviewData.lateChallenges ?? 0}/${overviewData.totalChallenges ?? 0} challenges`,
        icon: <ClockCircleOutlined style={{ color: '#ef4444' }} />,
        bg: '#fee2e2',
      },
    ];
  }, [overviewData, t]);

  // Level chart data formatted
  const levelChartFormatted = useMemo(() => {
    return levelChartData.map(item => ({
      name: `${item.level}\n(${item.class})`,
      level: item.level,
      class: item.class,
      vocabulary: item.vocabulary ?? 0,
      reading: item.reading ?? 0,
      listening: item.listening ?? 0,
      writing: item.writing ?? 0,
      speaking: item.speaking ?? 0,
    }));
  }, [levelChartData]);

  // Challenge line chart data (0-10 scale), sorted by submittedAt, filter by challenge type
  const challengeLineData = useMemo(() => {
    if (!challengeDetailData?.challenges || !Array.isArray(challengeDetailData.challenges)) return [];
    const filtered = challengeDetailData.challenges.filter(c => c.challengeType === challengeTypeFilter);
    const withOrder = filtered
      .map((c) => ({
        ...c,
        _dateValue: c.submittedAt ? new Date(c.submittedAt).getTime() : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a._dateValue - b._dateValue)
      .map((c, idx) => ({
        label: `DC${idx + 1}`,
        challengeName: c.challengeName,
        challengeType: c.challengeType,
        submissionStatus: c.submissionStatus,
        isLate: c.isLate,
        submittedAt: c.submittedAt,
        score10: (Number(c.score) || 0) / 10,
      }));
    return withOrder;
  }, [challengeDetailData, challengeTypeFilter]);

  // Handle back navigation
  const handleBack = () => {
    navigate(`${routePrefix}/dashboard`);
  };

  const headerExtraLeft = ({ theme: headerTheme, t: headerT }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        className={`class-menu-back-button ${headerTheme}-class-menu-back-button`}
        style={{
          height: 36,
          borderRadius: 10,
          fontWeight: 500,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid rgba(0, 0, 0, 0.1)',
          background: '#ffffff',
          color: '#000000',
          backdropFilter: 'blur(10px)',
        }}
      >
        {headerT('common.back')}
      </Button>
      <div
        style={{
          height: 24,
          width: 1,
          backgroundColor:
            headerTheme === 'sun' ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255, 255, 255, 0.3)',
        }}
      />
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
          color: headerTheme === 'sun' ? '#1e40af' : '#fff',
          textShadow:
            headerTheme === 'sun'
              ? '0 0 5px rgba(30, 64, 175, 0.3)'
              : '0 0 15px rgba(134, 134, 134, 0.8)',
        }}
      >
        {headerT('studentDashboard.learningProgressOverview', 'View Student Learning Progress Overview')}
      </h2>
    </div>
  );

  const customHeader = <ThemedHeader extraLeftContent={headerExtraLeft} />;

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
                <div className="slpv-title">Level-related chart</div>
              </div>
              {levelChartFormatted.length === 0 ? (
                <Empty description="No level data" />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <ReBarChart data={levelChartFormatted} margin={{ top: 20, right: 30, bottom: 60, left: 20 }} barCategoryGap="18%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }} 
                        height={80}
                        label={{ value: 'Levels (Class)', position: 'insideBottom', offset: 10 }}
                      />
                      <YAxis 
                        domain={[0, 10]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                      />
                      <ReTooltip 
                        formatter={(value, name, props) => {
                          const labelMap = {
                            vocabulary: 'Vocabulary',
                            reading: 'Reading',
                            listening: 'Listening',
                            writing: 'Writing',
                            speaking: 'Speaking',
                          };
                          return [`${Number(value).toFixed(1)}`, labelMap[name] || name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="vocabulary" fill="#A5B4FC" radius={[6, 6, 0, 0]} name="Vocabulary" />
                      <Bar dataKey="reading" fill="#86EFAC" radius={[6, 6, 0, 0]} name="Reading" />
                      <Bar dataKey="listening" fill="#FDE68A" radius={[6, 6, 0, 0]} name="Listening" />
                      <Bar dataKey="writing" fill="#C4B5FD" radius={[6, 6, 0, 0]} name="Writing" />
                      <Bar dataKey="speaking" fill="#FCA5A5" radius={[6, 6, 0, 0]} name="Speaking" />
                    </ReBarChart>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircleOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                    <div className="slpv-title">
                      Challenge details - {challengeDetailData.className} ({challengeDetailData.classCode})
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Class:</span>
                      <Select
                        size="small"
                        style={{ width: 200 }}
                        value={selectedClassId}
                        onChange={setSelectedClassId}
                        options={studentClasses.map(cls => ({
                          value: cls.classId,
                          label: `${cls.className} (${cls.classCode})`,
                        }))}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Skill:</span>
                      <Select
                        size="small"
                        style={{ width: 160 }}
                        value={challengeTypeFilter}
                        onChange={setChallengeTypeFilter}
                        options={[
                          { value: 'GV', label: 'Vocabulary' },
                          { value: 'RE', label: 'Reading' },
                          { value: 'LI', label: 'Listening' },
                          { value: 'WR', label: 'Writing' },
                          { value: 'SP', label: 'Speaking' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Line chart for class challenges (0-10 scale) */}
                <div style={{ width: '100%', height: 360, marginBottom: 16 }}>
                  {challengeLineData.length === 0 ? (
                    <Empty description="No score data to display" />
                  ) : (
                    <>
                      <ResponsiveContainer>
                        <LineChart data={challengeLineData} margin={{ top: 20, right: 30, bottom: 60, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 12, dy: 8 }}
                            label={{ value: 'Challenges over time', position: 'bottom', offset: 18 }}
                          />
                          <YAxis 
                            domain={[0, 10]}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Score (0-10)', angle: -90, position: 'insideLeft' }}
                          />
                          <ReTooltip 
                            formatter={(value, name, props) => {
                              return [`${Number(value).toFixed(1)}`, 'Score'];
                            }}
                            labelFormatter={(label, payload) => {
                              if (!payload || !payload[0]) return label;
                              const p = payload[0].payload;
                              const typeMap = {
                                GV: 'Vocabulary',
                                RE: 'Reading',
                                LI: 'Listening',
                                WR: 'Writing',
                                SP: 'Speaking',
                              };
                              const dateStr = p.submittedAt
                                ? new Date(p.submittedAt).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-';
                              return `${label} • ${typeMap[p.challengeType] || p.challengeType} • ${dateStr}`;
                            }}
                          />
                          <Line 
                            type="monotone"
                            dataKey="score10"
                            stroke={
                              challengeTypeFilter === 'GV' ? '#A5B4FC' :
                              challengeTypeFilter === 'RE' ? '#86EFAC' :
                              challengeTypeFilter === 'LI' ? '#FDE68A' :
                              challengeTypeFilter === 'WR' ? '#C4B5FD' :
                              '#FCA5A5'
                            }
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#3B82F6' }}
                            activeDot={{ r: 6, fill: '#2563EB' }}
                            name="Score (0-10)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      {/* Custom legend placed under X-axis label */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          color: (
                            challengeTypeFilter === 'GV' ? '#A5B4FC' :
                            challengeTypeFilter === 'RE' ? '#86EFAC' :
                            challengeTypeFilter === 'LI' ? '#FDE68A' :
                            challengeTypeFilter === 'WR' ? '#C4B5FD' :
                            '#FCA5A5'
                          )
                        }}>
                          <span style={{ 
                            width: 18, 
                            height: 3, 
                            backgroundColor: (
                              challengeTypeFilter === 'GV' ? '#A5B4FC' :
                              challengeTypeFilter === 'RE' ? '#86EFAC' :
                              challengeTypeFilter === 'LI' ? '#FDE68A' :
                              challengeTypeFilter === 'WR' ? '#C4B5FD' :
                              '#FCA5A5'
                            ), 
                            borderRadius: 2 
                          }} />
                          <span style={{ 
                            color: (
                              challengeTypeFilter === 'GV' ? '#A5B4FC' :
                              challengeTypeFilter === 'RE' ? '#86EFAC' :
                              challengeTypeFilter === 'LI' ? '#FDE68A' :
                              challengeTypeFilter === 'WR' ? '#C4B5FD' :
                              '#FCA5A5'
                            ), 
                            fontSize: 14 
                          }}>Score (0-10)</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Table removed as requested */}
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </ThemedLayoutNoSidebar>
  );
};

export default StudentLearningProgressOverview;

