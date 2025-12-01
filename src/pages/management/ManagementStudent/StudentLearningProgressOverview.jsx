import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Empty, Select, Button, Radio, Avatar } from 'antd';
import LoadingWithEffect from '../../../component/spinner/LoadingWithEffect';
import {
  TrophyOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  DashboardOutlined,
  FileTextOutlined,
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
import ThemedLayout from '../../../component/teacherlayout/ThemedLayout';
import ThemedHeader from '../../../component/ThemedHeader';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  const location = useLocation();
  const { id: routeStudentId } = useParams();
  const userRole = user?.role;
  const normalizedRole = (userRole || '').toLowerCase();
  const routePrefixMap = {
    manager: '/manager',
    teacher: '/teacher',
    teaching_assistant: '/teaching-assistant',
    test_taker: '/test-taker',
    student: '/student',
  };
  const routePrefix = routePrefixMap[normalizedRole] || '/student';
  const locationState = location.state || {};
  const locationStudent = locationState?.student;
  const backToProfilePath = locationState?.profilePath || locationState?.fromProfile || null;
  const backToProfileState = locationState?.profileState || null;
  const fallbackReturnTo = locationState?.returnTo || null;
  const queryParams = useMemo(() => new URLSearchParams(location.search || ''), [location.search]);
  const queryStudentId = queryParams.get('studentId') || queryParams.get('userId');
  const stateStudentId =
    locationStudent?.userId ||
    locationStudent?.id ||
    locationState?.studentId ||
    locationState?.userId;
  const externalStudentId =
    (routeStudentId ? String(routeStudentId) : null) ||
    (stateStudentId ? String(stateStudentId) : null) ||
    (queryStudentId ? String(queryStudentId) : null) ||
    null;
  const tokenUserId = useMemo(() => (accessToken ? getUserIdFromToken(accessToken) : null), [accessToken]);
  const effectiveUserId = externalStudentId || tokenUserId || user?.userId || user?.id || null;

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
  const [studentProfile, setStudentProfile] = useState(locationStudent || null);

  // Prefill with student info passed from previous screen (if any)
  useEffect(() => {
    if (locationStudent) {
      setStudentProfile(locationStudent);
    }
  }, [locationStudent]);

  // Load student learning progress data
  useEffect(() => {
    if (!effectiveUserId) {
      if (!user && !accessToken && !externalStudentId) {
        setLoading(false);
        setOverviewData(null);
        setLevelChartData([]);
        setStudentClasses([]);
      }
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Call APIs in parallel
        const [overviewResponse, levelHistoryResponse, profileResponse] = await Promise.all([
          studentManagementApi.getStudentOverview(effectiveUserId),
          studentManagementApi.getStudentLevelHistory(effectiveUserId),
          studentManagementApi.getStudentProfile(effectiveUserId).catch(err => {
            console.warn('Failed to load student profile:', err);
            return null;
          }),
        ]);
        
        // Process profile data
        if (profileResponse && (profileResponse?.data?.success !== false)) {
          const profile = profileResponse?.data?.data || profileResponse?.data;
          if (profile) {
            setStudentProfile(profile);
          }
        }
        
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
  }, [effectiveUserId, user, accessToken, externalStudentId]);

  // Sync selectedLevelClassId with selectedClassId when class is selected
  useEffect(() => {
    if (selectedClassId && levelChartData.length > 0) {
      const levelClassData = levelChartData.find(item => item.classId === selectedClassId);
      if (levelClassData) {
        setSelectedLevelClassId(selectedClassId);
      }
    }
  }, [selectedClassId, levelChartData]);

  // Load challenge detail when selectedClassId is available
  useEffect(() => {
    if (!selectedClassId || !effectiveUserId) {
      setChallengeDetailData(null);
      return;
    }

    const loadChallengeDetail = async () => {
      try {
        const response = await studentManagementApi.getStudentClassChallengeDetail(selectedClassId, effectiveUserId);
        
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

    loadChallengeDetail();
  }, [selectedClassId, effectiveUserId]);

  const formatDateValue = useCallback((value, withTime = false) => {
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
  }, []);

  const studentDisplayName = useMemo(() => {
    return (
      studentProfile?.fullName ||
      studentProfile?.name ||
      user?.fullName ||
      user?.name ||
      user?.displayName ||
      user?.username ||
      t('studentProgress.studentName', 'Student')
    );
  }, [t, user, studentProfile]);


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

  // Get current class and previous class for comparison
  const currentClassData = useMemo(() => {
    if (!overviewData?.currentClassId || !levelChartData.length) return null;
    return levelChartData.find(item => item.classId === overviewData.currentClassId) || null;
  }, [overviewData, levelChartData]);

  const previousClassData = useMemo(() => {
    if (!currentClassData || !levelChartData.length) return null;
    // Find previous class by sorting by joinedAt and finding the one before current
    const sortedClasses = [...levelChartData].sort((a, b) => {
      const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return dateA - dateB;
    });
    const currentIndex = sortedClasses.findIndex(item => item.classId === currentClassData.classId);
    if (currentIndex > 0) {
      return sortedClasses[currentIndex - 1];
    }
    return null;
  }, [currentClassData, levelChartData]);

  // Calculate percentage change for skills
  const calculatePercentageChange = useCallback((current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  }, []);

  // Get color based on score
  const getScoreColor = useCallback((score) => {
    if (score >= 0 && score < 5) {
      return '#dc2626'; // Red for 0-4.9
    } else if (score >= 5 && score < 7) {
      return '#f59e0b'; // Orange/yellow for 5-6.9
    } else {
      return '#16a34a'; // Green for 7 and above
    }
  }, []);

  const skillComparison = useMemo(() => {
    if (!currentClassData) return null;
    const skills = ['vocabulary', 'reading', 'listening', 'writing', 'speaking'];
    const skillLabels = {
      vocabulary: 'Grammar & Vocab',
      reading: 'Reading',
      listening: 'Listening',
      writing: 'Writing',
      speaking: 'Speaking',
    };
    
    return skills.map(skill => {
      const currentScore = currentClassData[skill] || 0;
      const previousScore = previousClassData?.[skill] || 0;
      const percentageChange = previousClassData ? calculatePercentageChange(currentScore, previousScore) : null;
      
      return {
        name: skillLabels[skill],
        currentScore,
        previousScore,
        percentageChange,
        hasPrevious: !!previousClassData,
      };
    });
  }, [currentClassData, previousClassData, calculatePercentageChange]);

  const classMetricRows = useMemo(() => {
    if (!selectedLevelClassData) return [];
    const data = selectedLevelClassData;
    const rows = [];

    if (typeof data.ranking === 'number') {
      rows.push({
        key: 'ranking',
        label: 'Ranking',
        value: `#${data.ranking}`,
        description: null,
        labelColor: '#fbbf24',
        valueColor: '#f59e0b',
        valueWeight: 700,
      });
    }

    if (data.studentAverageScore !== null || data.classAverageScore !== null) {
      const studentAvg = data.studentAverageScore !== null ? Number(data.studentAverageScore).toFixed(2) : 'N/A';
      const classAvg =
        data.classAverageScore !== null ? `Class avg: ${Number(data.classAverageScore).toFixed(2)}` : null;
      rows.push({
        key: 'averageScore',
        label: 'Student average score',
        value: studentAvg,
        description: classAvg,
        labelColor: '#3b82f6',
        valueColor: '#2563eb',
        valueWeight: 600,
      });
    }

    if (data.completionRate !== null) {
      rows.push({
        key: 'completionRate',
        label: 'Completion rate',
        value: `${Number(data.completionRate).toFixed(1)}%`,
        description:
          data.completedChallenges !== null && data.totalChallenges !== null
            ? `${data.completedChallenges}/${data.totalChallenges} challenges`
            : null,
        labelColor: '#10b981',
        valueColor: '#059669',
        valueWeight: 600,
      });
    }

    const lateRateValue =
      data.lateSubmissionRate !== null && data.lateSubmissionRate !== undefined
        ? Number(data.lateSubmissionRate)
        : overviewData?.lateRate ?? null;
    if (lateRateValue !== null && lateRateValue !== undefined) {
      rows.push({
        key: 'lateRate',
        label: 'Late rate',
        value: `${Number(lateRateValue).toFixed(1)}%`,
        description:
          data.lateChallenges !== null && data.totalChallenges !== null
            ? `${data.lateChallenges}/${data.totalChallenges} challenges`
            : null,
        labelColor: '#ef4444',
        valueColor: '#dc2626',
        valueWeight: 600,
      });
    }

    if (data.notStartedRate !== null) {
      rows.push({
        key: 'notStarted',
        label: 'Not started rate',
        value: `${Number(data.notStartedRate).toFixed(1)}%`,
        description:
          data.notStartedChallenges !== null
            ? `${data.notStartedChallenges} pending challenges`
            : null,
        labelColor: '#6b7280',
        valueColor: '#4b5563',
        valueWeight: 600,
      });
    }

    return rows;
  }, [overviewData?.lateRate, selectedLevelClassData]);

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


  const headerExtraLeft = useCallback(({ theme: headerTheme }) => {
    const handleBack = () => {
      if (backToProfilePath) {
        navigate(
          backToProfilePath,
          backToProfileState ? { state: backToProfileState } : undefined
        );
        return;
      }
      if (fallbackReturnTo) {
        navigate(fallbackReturnTo);
        return;
      }
      if (typeof window !== 'undefined' && window.history.length > 1) {
        navigate(-1);
        return;
      }
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
  }, [navigate, routePrefix, t, backToProfilePath, backToProfileState, fallbackReturnTo]);

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

  const sidebarWidth = 280;

  return (
    <ThemedLayout customHeader={customHeader}>
      <div
        className={`slpv-layout ${theme}-theme`}
        style={{
          display: 'flex',
          position: 'relative',
          padding: '0 20px 20px 0',
          gap: 24,
          minHeight: 'calc(100vh - 140px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <Card
            style={{
              height: 'auto',
              background: theme === 'sun'
                ? 'linear-gradient(145deg, #fdf9ff 0%, #f2fbff 100%)'
                : 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.85))',
              border: 'none',
              padding: 20,
              borderRadius: 16,
              boxShadow: theme === 'sun' ? '0 20px 30px rgba(15,23,42,0.08)' : '0 15px 30px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              {/* Avatar */}
              <Avatar
                size={80}
                src={studentProfile?.avatarUrl || studentProfile?.avatar || user?.avatarUrl || user?.avatar}
                style={{
                  backgroundColor: '#6366f1',
                  fontSize: 32,
                  marginBottom: 0,
                }}
              >
                {studentDisplayName?.charAt(0)?.toUpperCase() || 'S'}
              </Avatar>

              {/* Student Code */}
              <div style={{ fontSize: 14, color: theme === 'sun' ? '#64748b' : '#cbd5f5', marginTop: 4 }}>
                {studentProfile?.studentCode || user?.username || user?.userId || user?.id || 'N/A'}
              </div>

              {/* Student Name */}
              <div style={{ fontSize: 20, fontWeight: 600, color: theme === 'sun' ? '#0f172a' : '#f8fafc', textAlign: 'center', marginTop: 2 }}>
                {studentDisplayName}
              </div>

              {/* Level Name - Large, Bold, Yellow */}
              {overviewData?.currentLevel && overviewData.currentLevel !== 'N/A' && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  whiteSpace: 'nowrap',
                  flexWrap: 'nowrap',
                }}>
                  <img 
                    src="/img/pyramid.png" 
                    alt="Pyramid" 
                    style={{ 
                      width: 28, 
                      height: 28,
                      objectFit: 'contain',
                      flexShrink: 0,
                    }} 
                  />
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 700, 
                    color: '#fbbf24',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {overviewData.currentLevel}
                  </div>
                </div>
              )}

              {/* Current Class */}
              {overviewData?.currentClass && overviewData.currentClass !== 'N/A' && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 12,
                  gap: 8,
                }}>
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 600,
                    color: theme === 'sun' ? '#6366f1' : '#a5b4fc',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    Current Class
                  </span>
                  <span style={{ 
                    fontSize: 16, 
                    fontWeight: 700, 
                    color: theme === 'sun' ? '#4f46e5' : '#c7d2fe',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {overviewData.currentClass}
                  </span>
                </div>
              )}

              {/* Skills with Scores and Percentage Change */}
              {skillComparison && skillComparison.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', marginTop: 16 }}>
                  {skillComparison.map((skill, index) => {
                    const isPositive = skill.percentageChange !== null && skill.percentageChange > 0;
                    const isNegative = skill.percentageChange !== null && skill.percentageChange < 0;
                    const skillColors = [
                      '#16a34a', // green
                      '#ec4899', // pink
                      '#f59e0b', // yellow/amber
                      '#8b5cf6', // purple
                      '#ef4444', // red
                    ];
                    const skillColor = skillColors[index % skillColors.length];
                    
                    return (
                      <div
                        key={skill.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                          <div style={{ 
                            fontSize: 14, 
                            fontWeight: 500, 
                            color: skillColor,
                          }}>
                            {skill.name}
                          </div>
                          {skill.hasPrevious && skill.percentageChange !== null && (
                            <div style={{ 
                              fontSize: 11, 
                              color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#64748b',
                              fontWeight: 500,
                            }}>
                              {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(skill.percentageChange).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: 18, 
                          fontWeight: 600, 
                          color: getScoreColor(skill.currentScore),
                        }}>
                          {skill.currentScore.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
        <div
          style={{
            flex: 1,
            paddingLeft: 16,
            alignSelf: 'stretch',
          }}
        >
          <div
            className={`slpv-container ${theme}-theme`}
            style={{
              margin: 0,
              padding: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Level Comparison Chart */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} style={{ display: 'flex' }}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: '2px solid rgba(99, 102, 241, 0.3)',
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
                        onClick={(data) => {
                          setSelectedLevelClassId(data?.classId);
                          setSelectedClassId(data?.classId);
                        }}
                      />
                      <Bar
                        dataKey="reading"
                        fill="#86EFAC"
                        radius={[6, 6, 0, 0]}
                        name="Reading"
                        onClick={(data) => {
                          setSelectedLevelClassId(data?.classId);
                          setSelectedClassId(data?.classId);
                        }}
                      />
                      <Bar
                        dataKey="listening"
                        fill="#FDE68A"
                        radius={[6, 6, 0, 0]}
                        name="Listening"
                        onClick={(data) => {
                          setSelectedLevelClassId(data?.classId);
                          setSelectedClassId(data?.classId);
                        }}
                      />
                      <Bar
                        dataKey="writing"
                        fill="#C4B5FD"
                        radius={[6, 6, 0, 0]}
                        name="Writing"
                        onClick={(data) => {
                          setSelectedLevelClassId(data?.classId);
                          setSelectedClassId(data?.classId);
                        }}
                      />
                      <Bar
                        dataKey="speaking"
                        fill="#FCA5A5"
                        radius={[6, 6, 0, 0]}
                        name="Speaking"
                        onClick={(data) => {
                          setSelectedLevelClassId(data?.classId);
                          setSelectedClassId(data?.classId);
                        }}
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Class Metrics and Challenge Details Section */}
        {challengeDetailData && (
          <Card
            style={{
              backgroundColor: theme === 'sun' ? '#ffffff' : 'rgba(15,23,42,0.65)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 20,
              boxShadow: theme === 'sun' ? '0 10px 32px rgba(15,23,42,0.1)' : '0 20px 35px rgba(0,0,0,0.55)',
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <DashboardOutlined style={{ color: '#6366f1', fontSize: 22 }} />
                <div>
                  <div className="slpv-title" style={{ marginBottom: 4 }}>
                    Class performance overview
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Class:</span>
                <Select
                  size="small"
                  style={{ width: 240 }}
                  value={selectedClassId}
                  onChange={(value) => {
                    setSelectedClassId(value);
                    const levelClassData = levelChartData.find(item => item.classId === value);
                    if (levelClassData) {
                      setSelectedLevelClassId(value);
                    }
                  }}
                  options={studentClasses.map(cls => ({
                    value: cls.classId,
                    label: `${cls.className} (${cls.classCode})`,
                  }))}
                />
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={8} style={{ display: 'flex' }}>
                <Card
                  style={{
                    backgroundColor: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(99, 102, 241, 0.3)',
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
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <TrophyOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                    <div style={{ marginBottom: 0, fontSize: 18, color: '#000000', fontWeight: 600 }}>
                      Performance Summary
                    </div>
                  </div>
                  {selectedLevelClassData ? (
                    classMetricRows.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {classMetricRows.map((row) => (
                          <div
                            key={row.key}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: '1px solid rgba(107, 114, 128, 0.15)',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ 
                                fontSize: row.key === 'ranking' ? 16 : 14, 
                                color: row.labelColor || '#000000', 
                                fontWeight: 500 
                              }}>
                                {row.label}
                              </span>
                              {row.description && (
                                <span style={{ 
                                  fontSize: 12, 
                                  color: theme === 'sun' ? '#6b7280' : '#9ca3af', 
                                  fontWeight: 400 
                                }}>
                                  {row.description}
                                </span>
                              )}
                            </div>
                            <span style={{ 
                              fontSize: row.key === 'ranking' ? 20 : 18, 
                              fontWeight: row.valueWeight || 600, 
                              color: row.valueColor || '#000000' 
                            }}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty description="No metrics available" />
                    )
                  ) : (
                    <Empty description="No level details" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={16} style={{ display: 'flex' }}>
                <Card
                  style={{
                    backgroundColor: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    paddingTop: 8,
                    height: '100%',
                    flex: 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileTextOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                      <div className="slpv-title" style={{ fontSize: 18 }}>
                        Challenge details
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Skill:</span>
                      <Radio.Group
                        value={challengeTypeFilter}
                        onChange={(e) => setChallengeTypeFilter(e.target.value)}
                        size="small"
                      >
                        <Radio.Button value="GV">Vocabulary</Radio.Button>
                        <Radio.Button value="RE">Reading</Radio.Button>
                        <Radio.Button value="LI">Listening</Radio.Button>
                        <Radio.Button value="WR">Writing</Radio.Button>
                        <Radio.Button value="SP">Speaking</Radio.Button>
                      </Radio.Group>
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
                              ticks={[0, 2, 4, 6, 8, 10]}
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
          </Card>
        )}


      </div>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default StudentLearningProgressOverview;

