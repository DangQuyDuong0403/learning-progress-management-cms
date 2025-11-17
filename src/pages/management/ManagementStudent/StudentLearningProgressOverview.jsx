import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Empty, Select, Button } from 'antd';
import LoadingWithEffect from '../../../component/spinner/LoadingWithEffect';
import {
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  HistoryOutlined,
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
import { Tag, Timeline } from 'antd';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemedLayout from '../../../component/teacherlayout/ThemedLayout';
import ThemedHeader from '../../../component/ThemedHeader';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../../hooks/usePageTitle';
import { spaceToast } from '../../../component/SpaceToastify';
import { studentManagementApi } from '../../../apis/apis';
import { getUserIdFromToken } from '../../../utils/jwtUtils';
import './StudentLearningProgressView.css';

const StudentLearningProgressOverview = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, accessToken } = useSelector((state) => state.auth);
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
  const [selectedLevelClassId, setSelectedLevelClassId] = useState(null);

  // Load student learning progress data
  useEffect(() => {
    if (!user && !accessToken) {
      setLoading(false);
      setOverviewData(null);
      setLevelChartData([]);
      setStudentClasses([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Get userId from JWT token or user object
        let userId = null;
        if (accessToken) {
          userId = getUserIdFromToken(accessToken);
        }
        // Fallback to user object or profileData if token doesn't have userId
        if (!userId) {
          userId = user?.userId || user?.id;
        }
        if (!userId) {
          console.error('No userId found in token or user object');
          if (user || accessToken) {
            spaceToast.error('User ID not found');
          }
          setLoading(false);
          return;
        }
        
        // Call both APIs in parallel
        const [overviewResponse, levelHistoryResponse] = await Promise.all([
          studentManagementApi.getStudentOverview(userId),
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
        
        // Process level chart data from API only
        if (levels && Array.isArray(levels) && levels.length > 0) {
          const levelChartDataArray = [];
          levels.forEach(level => {
            if (level.classes && Array.isArray(level.classes) && level.classes.length > 0) {
              level.classes.forEach(classItem => {
                const scores = classItem.scoreByType || {};
                levelChartDataArray.push({
                  levelId: level.levelId,
                  level: level.levelName,
                  levelCode: level.levelCode,
                  classId: classItem.classId,
                  class: classItem.className,
                  classCode: classItem.classCode,
                  vocabulary: scores.vocabularyAvg || 0,
                  reading: scores.readingAvg || 0,
                  listening: scores.listeningAvg || 0,
                  writing: scores.writingAvg || 0,
                  speaking: scores.speakingAvg || 0,
                  ranking: classItem.ranking ?? null,
                  studentAverageScore: classItem.studentAverageScore ?? null,
                  classAverageScore: classItem.classAverageScore ?? null,
                  completionRate: classItem.completionRate ?? null,
                  lateSubmissionRate: classItem.lateSubmissionRate ?? null,
                  notStartedRate: classItem.notStartedRate ?? null,
                  totalChallenges: classItem.totalChallenges ?? null,
                  completedChallenges: classItem.completedChallenges ?? null,
                  lateChallenges: classItem.lateChallenges ?? null,
                  notStartedChallenges: classItem.notStartedChallenges ?? null,
                  joinedAt: classItem.joinedAt || null,
                  leftAt: classItem.leftAt || null,
                  startDate: classItem.startDate || null,
                  endDate: classItem.endDate || null,
                });
              });
            }
          });
          
          console.log('Level Chart Data Array:', levelChartDataArray);
          setLevelChartData(levelChartDataArray);
          if (levelChartDataArray.length > 0) {
            setSelectedLevelClassId(levelChartDataArray[0].classId);
          } else {
            setSelectedLevelClassId(null);
          }
        } else {
          console.warn('No levels data found in response');
          setLevelChartData([]);
          setSelectedLevelClassId(null);
        }
        
        // Collect all classes from levels data - both past and current
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
  }, [user, accessToken]);

  // Load challenge detail when selectedClassId is available
  useEffect(() => {
    if (!selectedClassId || (!user && !accessToken)) {
      setChallengeDetailData(null);
      return;
    }

    const loadChallengeDetail = async () => {
      try {
        // Get userId from JWT token or user object
        let userId = null;
        if (accessToken) {
          userId = getUserIdFromToken(accessToken);
        }
        // Fallback to user object if token doesn't have userId
        if (!userId) {
          userId = user?.userId || user?.id;
        }
        if (!userId) {
          console.error('No userId found for challenge detail');
          if (user || accessToken) {
            spaceToast.error('User ID not found');
          }
          return;
        }

        const response = await studentManagementApi.getStudentClassChallengeDetail(selectedClassId, userId);
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
        if (user || accessToken) {
          spaceToast.error(err.response?.data?.message || 'Failed to load challenge detail');
        }
        setChallengeDetailData(null);
      }
    };

    loadChallengeDetail();
  }, [selectedClassId, user, accessToken]);

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

  const formatDateValue = (value, withTime = false) => {
    if (!value) return 'N/A';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'N/A';
      const baseOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      const timeOptions = withTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
          }
        : {};
      return date.toLocaleString('vi-VN', {
        ...baseOptions,
        ...timeOptions,
      });
    } catch (e) {
      return 'N/A';
    }
  };

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
      classId: item.classId,
      startDate: item.startDate,
      endDate: item.endDate,
      joinedAt: item.joinedAt,
      leftAt: item.leftAt,
      ranking: item.ranking,
      studentAverageScore: item.studentAverageScore,
      classAverageScore: item.classAverageScore,
    }));
  }, [levelChartData]);

  const selectedLevelClassData = useMemo(() => {
    if (!selectedLevelClassId) return null;
    return levelChartData.find(item => item.classId === selectedLevelClassId) || null;
  }, [levelChartData, selectedLevelClassId]);

  const selectedLevelSummaryCards = useMemo(() => {
    if (!selectedLevelClassData) return [];
    const data = selectedLevelClassData;
    const cards = [];

    if (typeof data.ranking === 'number') {
      cards.push({
        key: 'ranking',
        title: 'Ranking',
        value: `#${data.ranking}`,
        subtitle: data.classCode ? data.classCode : data.class,
        bg: '#fff7ed',
        tag: data.totalChallenges ? `${data.totalChallenges} challenges` : null,
      });
    }

    if (data.studentAverageScore !== null || data.classAverageScore !== null) {
      const studentAvg =
        data.studentAverageScore !== null ? Number(data.studentAverageScore) : null;
      const classAvg = data.classAverageScore !== null ? Number(data.classAverageScore) : null;
      const diff =
        studentAvg !== null && classAvg !== null ? studentAvg - classAvg : null;

      cards.push({
        key: 'averageScore',
        title: 'Student average score',
        value: studentAvg !== null ? studentAvg.toFixed(2) : 'N/A',
        subtitle: classAvg !== null ? `Class avg: ${classAvg.toFixed(2)}` : null,
        bg: '#ecfdf5',
        trend:
          diff !== null
            ? {
                positive: diff >= 0,
                text: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`,
              }
            : null,
      });
    }

    if (data.completionRate !== null) {
      const completionRate = Number(data.completionRate);
      cards.push({
        key: 'completionRate',
        title: 'Completion rate',
        value: `${completionRate.toFixed(1)}%`,
        subtitle:
          data.completedChallenges !== null && data.totalChallenges !== null
            ? `${data.completedChallenges}/${data.totalChallenges} challenges`
            : null,
        bg: '#eef2ff',
        trend:
          data.lateSubmissionRate !== null
            ? {
                positive: completionRate >= 0,
                text: `Late: ${Number(data.lateSubmissionRate).toFixed(1)}%`,
                neutral: true,
              }
            : null,
      });
    }

    if (data.notStartedRate !== null) {
      cards.push({
        key: 'notStarted',
        title: 'Not started rate',
        value: `${Number(data.notStartedRate).toFixed(1)}%`,
        subtitle:
          data.notStartedChallenges !== null
            ? `${data.notStartedChallenges} pending challenges`
            : null,
        bg: '#fdf2f8',
      });
    }

    return cards;
  }, [selectedLevelClassData]);

  const renderLevelTooltip = useCallback(
    ({ active, payload }) => {
      if (!active || !payload || !payload.length) {
        return null;
      }
      const data = payload[0].payload;
      const labelMap = {
        vocabulary: 'Vocabulary',
        reading: 'Reading',
        listening: 'Listening',
        writing: 'Writing',
        speaking: 'Speaking',
      };

      const tooltipBackground = theme === 'sun' ? '#ffffff' : '#0f172a';
      const tooltipAccent = theme === 'sun' ? '#f3f4f6' : 'rgba(255,255,255,0.08)';
      const primaryText = theme === 'sun' ? '#111827' : '#f1f5f9';
      const secondaryText = theme === 'sun' ? '#6b7280' : '#cbd5f5';

      return (
        <div
          style={{
            background: tooltipBackground,
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
            minWidth: 240,
            border: `1px solid ${theme === 'sun' ? '#e5e7eb' : 'rgba(255,255,255,0.12)'}`,
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: primaryText, marginBottom: 6 }}>
            {data.level} · {data.class}
          </div>
          <div style={{ fontSize: 12, color: secondaryText, marginBottom: 12, lineHeight: 1.5 }}>
            Program: {formatDateValue(data.startDate)} → {formatDateValue(data.endDate)}
            <br />
            Joined: {formatDateValue(data.joinedAt, true)} | Left:{' '}
            {data.leftAt ? formatDateValue(data.leftAt, true) : 'Present'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {payload.map((entry) => (
              <div
                key={entry.dataKey}
                style={{
                  background: tooltipAccent,
                  borderRadius: 10,
                  padding: 8,
                  border: `1px solid ${theme === 'sun' ? '#e5e7eb' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div style={{ fontSize: 11, color: secondaryText }}>{labelMap[entry.dataKey] || entry.dataKey}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: primaryText }}>
                  {Number(entry.value).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
    [formatDateValue, theme]
  );

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

  // ========== FAKE DATA FOR NEW FEATURES ==========
  
  // 1. Class Ranking Data
  const fakeClassRankingData = useMemo(() => {
    return {
      studentRank: 8,
      totalStudents: 25,
      percentile: 68, // Top 68% = rank 8/25
      averageScore: 7.2,
      classAverageScore: 7.8,
      completionRate: 85.5,
      classCompletionRate: 78.3,
      improvementScore: 12.5, // % improvement
    };
  }, []);

  // 3. Level Progression Timeline Data (with classes)
  const fakeLevelProgressionData = useMemo(() => {
    return [
      {
        levelId: 'LE-001',
        levelName: 'Little Explorers',
        levelCode: 'LE',
        startDate: '2023-09-01',
        endDate: '2023-12-15',
        durationDays: 105,
        finalScore: 7.8,
        status: 'completed',
        classes: [
          {
            classId: 'CL-LE-001',
            className: 'Little Explorers A1',
            classCode: 'LE-A1',
            joinedAt: '2023-09-01',
            leftAt: '2023-10-20',
            finalScore: 7.5,
            syllabus: {
              syllabusId: 'SYL-LE-001',
              syllabusName: 'Little Explorers Foundation',
              syllabusCode: 'LE-FOUNDATION',
            },
          },
          {
            classId: 'CL-LE-002',
            className: 'Little Explorers A2',
            classCode: 'LE-A2',
            joinedAt: '2023-10-21',
            leftAt: '2023-12-15',
            finalScore: 8.0,
            syllabus: {
              syllabusId: 'SYL-LE-002',
              syllabusName: 'Little Explorers Advanced',
              syllabusCode: 'LE-ADVANCED',
            },
          },
        ],
      },
      {
        levelId: 'ST-001',
        levelName: 'Starters',
        levelCode: 'ST',
        startDate: '2023-12-16',
        endDate: '2024-03-20',
        durationDays: 95,
        finalScore: 8.2,
        status: 'completed',
        classes: [
          {
            classId: 'CL-ST-001',
            className: 'Starters B1',
            classCode: 'ST-B1',
            joinedAt: '2023-12-16',
            leftAt: '2024-02-05',
            finalScore: 8.0,
            syllabus: {
              syllabusId: 'SYL-ST-001',
              syllabusName: 'Starters Basic Course',
              syllabusCode: 'ST-BASIC',
            },
          },
          {
            classId: 'CL-ST-002',
            className: 'Starters B2',
            classCode: 'ST-B2',
            joinedAt: '2024-02-06',
            leftAt: '2024-03-20',
            finalScore: 8.4,
            syllabus: {
              syllabusId: 'SYL-ST-002',
              syllabusName: 'Starters Intermediate Course',
              syllabusCode: 'ST-INTERMEDIATE',
            },
          },
        ],
      },
      {
        levelId: 'MO-001',
        levelName: 'Movers',
        levelCode: 'MO',
        startDate: '2024-03-21',
        endDate: null,
        durationDays: null,
        finalScore: null,
        status: 'current',
        classes: [
          {
            classId: 'CL-MO-001',
            className: 'Movers C1',
            classCode: 'MO-C1',
            joinedAt: '2024-03-21',
            leftAt: null,
            finalScore: null,
            syllabus: {
              syllabusId: 'SYL-MO-001',
              syllabusName: 'Movers Comprehensive Course',
              syllabusCode: 'MO-COMPREHENSIVE',
            },
          },
        ],
      },
    ];
  }, []);


  const headerExtraLeft = useCallback(({ theme: headerTheme }) => {
    const handleBack = () => {
      navigate(`${routePrefix}/dashboard`);
    };

    return (
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
          {t('common.back')}
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
            fontSize: 20,
            fontWeight: 600,
            color: headerTheme === 'sun' ? '#1e40af' : '#fff',
            textShadow:
              headerTheme === 'sun'
                ? '0 0 5px rgba(30, 64, 175, 0.3)'
                : '0 0 15px rgba(134, 134, 134, 0.8)',
          }}
        >
          {t('studentDashboard.learningProgressOverview')}
        </h2>
      </div>
    );
  }, [navigate, routePrefix, t]);

  const customHeader = <ThemedHeader extraLeftContent={headerExtraLeft} />;

  if (loading) {
    return (
      <ThemedLayout customHeader={customHeader}>
        <div className="slpv-container">
          <LoadingWithEffect
            loading={true}
            message={t('studentProgress.loading', 'Loading learning progress...')}
          />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`slpv-container ${theme}-theme`}>
        {/* Overview Section */}
        {renderSummaryCards(overviewCards)}

        {/* Level Comparison Chart */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={15} style={{ display: 'flex' }}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%',
                flex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <div className="slpv-title">Level-related chart</div>
              </div>
              {levelChartFormatted.length === 0 ? (
                <Empty description="No level data" />
              ) : (
                <div style={{ width: '100%', height: 340, marginTop: 12 }}>
                  <ResponsiveContainer>
                    <ReBarChart
                      data={levelChartFormatted}
                      margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
                      barCategoryGap="18%"
                    >
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
                        content={renderLevelTooltip}
                        cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                        wrapperStyle={{ zIndex: 2000 }}
                      />
                      <Legend />
                      <Bar
                        dataKey="vocabulary"
                        fill="#A5B4FC"
                        radius={[6, 6, 0, 0]}
                        name="Vocabulary"
                        onClick={(data) => setSelectedLevelClassId(data?.classId)}
                      />
                      <Bar
                        dataKey="reading"
                        fill="#86EFAC"
                        radius={[6, 6, 0, 0]}
                        name="Reading"
                        onClick={(data) => setSelectedLevelClassId(data?.classId)}
                      />
                      <Bar
                        dataKey="listening"
                        fill="#FDE68A"
                        radius={[6, 6, 0, 0]}
                        name="Listening"
                        onClick={(data) => setSelectedLevelClassId(data?.classId)}
                      />
                      <Bar
                        dataKey="writing"
                        fill="#C4B5FD"
                        radius={[6, 6, 0, 0]}
                        name="Writing"
                        onClick={(data) => setSelectedLevelClassId(data?.classId)}
                      />
                      <Bar
                        dataKey="speaking"
                        fill="#FCA5A5"
                        radius={[6, 6, 0, 0]}
                        name="Speaking"
                        onClick={(data) => setSelectedLevelClassId(data?.classId)}
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={9} style={{ display: 'flex' }}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%',
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrophyOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                  <div className="slpv-title" style={{ marginBottom: 0 }}>
                    Class metrics
                  </div>
                </div>
                {levelChartData.length > 0 && (
                  <Select
                    size="small"
                    style={{ minWidth: 240, flexShrink: 0 }}
                    value={selectedLevelClassId}
                    onChange={setSelectedLevelClassId}
                    options={levelChartData.map(item => ({
                      value: item.classId,
                      label: `${item.level} - ${item.class}`,
                    }))}
                  />
                )}
              </div>
              {selectedLevelClassData ? (
                selectedLevelSummaryCards.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {selectedLevelSummaryCards.map((card) => (
                      <Col xs={24} sm={12} key={card.key}>
                        <Card
                          style={{
                            backgroundColor: card.bg,
                            border: 'none',
                            borderRadius: 12,
                            textAlign: 'center',
                            height: '100%',
                          }}
                        >
                          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{card.title}</div>
                          <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                            {card.value}
                          </div>
                          {card.subtitle && (
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{card.subtitle}</div>
                          )}
                          {card.tag && (
                            <div style={{ marginTop: 4 }}>
                              <Tag color="orange">{card.tag}</Tag>
                            </div>
                          )}
                          {card.trend && card.trend.text && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                fontSize: 12,
                                color: card.trend.neutral
                                  ? '#6b7280'
                                  : card.trend.positive
                                  ? '#22c55e'
                                  : '#ef4444',
                              }}
                            >
                              {!card.trend.neutral && (
                                card.trend.positive ? (
                                  <RiseOutlined style={{ fontSize: 12 }} />
                                ) : (
                                  <FallOutlined style={{ fontSize: 12 }} />
                                )
                              )}
                              <span>{card.trend.text}</span>
                            </div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="No metrics available" />
                )
              ) : (
                <Empty description="No level details" />
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
    </ThemedLayout>
  );
};

export default StudentLearningProgressOverview;

