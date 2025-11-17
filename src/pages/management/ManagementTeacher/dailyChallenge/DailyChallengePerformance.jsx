import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Button, Avatar, Empty } from "antd";
import { TrophyOutlined, BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined, BookOutlined } from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
  LabelList
} from 'recharts';
import "./DailyChallengePerformanceReport.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { dailyChallengeApi } from "../../../../apis/apis";
import { useSelector } from "react-redux";

const DailyChallengePerformance = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role?.toLowerCase();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, dailyChallengeData } = useDailyChallengeMenu();
  
  // Get data from navigation state or fetch from API
  // Priority: location.state > query params > dailyChallengeData > null
  const [challengeInfo, setChallengeInfo] = useState(() => {
    const params = new URLSearchParams(location.search || '');
    const qp = {
      classId: params.get('classId'),
      className: params.get('className'),
      challengeName: params.get('challengeName'),
    };
    return {
      classId: location.state?.classId || qp.classId || null,
      className: location.state?.className || qp.className || dailyChallengeData?.className || null,
      challengeId: location.state?.challengeId || id,
      challengeName: location.state?.challengeName || qp.challengeName || null,
      lessonName: location.state?.lessonName || null,
    };
  });
  
  // Update challengeInfo when location.state or query params change (e.g., when navigating back from SubmissionList)
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const qp = {
      classId: params.get('classId'),
      className: params.get('className'),
      challengeName: params.get('challengeName'),
    };
    
    // Check if we need to update challengeInfo
    const newClassId = location.state?.classId || qp.classId;
    const newClassName = location.state?.className || qp.className || dailyChallengeData?.className;
    const newChallengeName = location.state?.challengeName || qp.challengeName;
    
    if (newClassId !== challengeInfo.classId || 
        newClassName !== challengeInfo.className || 
        newChallengeName !== challengeInfo.challengeName) {
      setChallengeInfo({
        classId: newClassId || challengeInfo.classId,
        className: newClassName || challengeInfo.className,
        challengeId: location.state?.challengeId || challengeInfo.challengeId || id,
        challengeName: newChallengeName || challengeInfo.challengeName,
        lessonName: location.state?.lessonName || challengeInfo.lessonName || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.search, id, dailyChallengeData?.className]);
  
  // Set page title
  usePageTitle('Daily Challenge Management / Performance');
  
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    attemptDistribution: [],
    submissionStats: {
      completedCount: 0,
      lateCount: 0,
      notStartedCount: 0,
      totalStudents: 0
    }
  });
  const [studentScores, setStudentScores] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [questionStats, setQuestionStats] = useState([]);
  const [questionStatsLoading, setQuestionStatsLoading] = useState(false);
  const [questionStatsMeta, setQuestionStatsMeta] = useState({
    challengeName: null,
    challengeId: null
  });
  const [questionStatsError, setQuestionStatsError] = useState(null);

  // Fetch challenge info from API if not available in state
  const fetchChallengeInfo = useCallback(async () => {
    // If we already have all info, no need to fetch
    if (challengeInfo.challengeName && challengeInfo.className) {
      return;
    }

    try {
      // Fetch challenge detail from API
      const response = await dailyChallengeApi.getDailyChallengeById(id);
      console.log('Challenge detail response:', response);
      
      const data = response?.data;
      if (data) {
        setChallengeInfo(prev => ({
          ...prev,
          challengeId: data.id || id,
          challengeName: data.challengeName || data.name || data.title || prev.challengeName,
          // Note: API might not return class info directly, may need additional fetch
        }));
      }
    } catch (error) {
      console.error('Error fetching challenge info:', error);
    }
  }, [id, challengeInfo.challengeName, challengeInfo.className]);

  // Calculate distribution by submission status (not started, completed, late, etc.)
  const calculateAttemptDistribution = (scores, submissionStats) => {
    // Group students by submission status
    const groups = {
      hsin: { label: 'Not Started', count: 0, avgScore: 0, avgTime: 0, totalScore: 0, totalTime: 0 },
      hs1: { label: 'Completed', count: 0, avgScore: 0, avgTime: 0, totalScore: 0, totalTime: 0 },
      hs2: { label: 'Late Submissions', count: 0, avgScore: 0, avgTime: 0, totalScore: 0, totalTime: 0 },
      hs3plus: { label: 'Other', count: 0, avgScore: 0, avgTime: 0, totalScore: 0, totalTime: 0 },
    };

    scores.forEach(student => {
      const status = student.submissionStatus;
      const isLate = student.isLate;
      
      if (status === 'NOT_STARTED' || !status) {
        groups.hsin.count++;
        groups.hsin.totalScore += student.score || 0;
        groups.hsin.totalTime += student.completionTime || 0;
      } else if (status === 'SUBMITTED' && !isLate) {
        groups.hs1.count++;
        groups.hs1.totalScore += student.score || 0;
        groups.hs1.totalTime += student.completionTime || 0;
      } else if (status === 'SUBMITTED' && isLate) {
        groups.hs2.count++;
        groups.hs2.totalScore += student.score || 0;
        groups.hs2.totalTime += student.completionTime || 0;
      } else {
        groups.hs3plus.count++;
        groups.hs3plus.totalScore += student.score || 0;
        groups.hs3plus.totalTime += student.completionTime || 0;
      }
    });

    // Calculate averages
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      if (group.count > 0) {
        group.avgScore = parseFloat((group.totalScore / group.count).toFixed(1));
        group.avgTime = parseFloat((group.totalTime / group.count).toFixed(1));
      }
    });

    return [
      groups.hsin,
      groups.hs1,
      groups.hs2,
      groups.hs3plus,
    ];
  };

  const fetchPerformanceData = async () => {
    // Get challengeId from multiple sources (priority: challengeInfo.challengeId > id from URL params)
    const challengeId = challengeInfo.challengeId || id;
    
    if (!challengeId) {
      console.error('Challenge ID is missing. challengeInfo:', challengeInfo, 'id:', id);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching performance data for challengeId:', challengeId);
      console.log('Current challengeInfo:', challengeInfo);
      
      // Call all APIs in parallel
      const [overviewResponse, studentsResponse, chartResponse] = await Promise.all([
        dailyChallengeApi.getChallengeOverview(challengeId),
        dailyChallengeApi.getChallengeStudentPerformance(challengeId),
        dailyChallengeApi.getChallengeChartData(challengeId)
      ]);

      console.log('Overview API Response:', overviewResponse);
      console.log('Overview API Response.data:', overviewResponse?.data);
      console.log('Overview API Response.data.data:', overviewResponse?.data?.data);
      console.log('Students API Response:', studentsResponse);
      console.log('Students API Response.data:', studentsResponse?.data);
      console.log('Students API Response.data.data:', studentsResponse?.data?.data);
      console.log('Chart API Response:', chartResponse);
      console.log('Chart API Response.data:', chartResponse?.data);
      console.log('Chart API Response.data.data:', chartResponse?.data?.data);

      // Check if responses are successful
      // Note: axios interceptor returns response.data, so overviewResponse is already { traceId, success, message, data }
      if (overviewResponse?.success === false) {
        console.error('Overview API returned unsuccessful response:', overviewResponse);
        setLoading(false);
        return;
      }
      if (studentsResponse?.success === false) {
        console.error('Students API returned unsuccessful response:', studentsResponse);
        setLoading(false);
        return;
      }
      if (chartResponse?.success === false) {
        console.error('Chart API returned unsuccessful response:', chartResponse);
        // Don't return, just log error - chart is optional
      }

      // Process overview data
      // Note: axios interceptor returns response.data, so overviewResponse is already the server response
      // Structure: { traceId, success, message, data: { averageScore, ... } }
      let overviewData = overviewResponse?.data;
      
      // If data is nested (shouldn't be, but handle both cases)
      if (!overviewData || (overviewData.success !== undefined && !overviewData.averageScore)) {
        overviewData = overviewResponse?.data?.data || overviewResponse?.data;
      }
      
      // Remove non-data fields if present (traceId, success, message, timestamp)
      if (overviewData && (overviewData.success !== undefined || overviewData.traceId !== undefined)) {
        const { traceId, success, message, timestamp, ...dataFields } = overviewData;
        overviewData = dataFields;
      }
      
      console.log('Processed overviewData:', overviewData);
      console.log('OverviewData keys:', Object.keys(overviewData || {}));
      
      // Validate that we have data
      if (!overviewData || Object.keys(overviewData).length === 0) {
        console.error('Overview data is empty or invalid:', overviewData);
        console.error('Full overviewResponse structure:', JSON.stringify(overviewResponse, null, 2));
        setLoading(false);
        return;
      }
      
      const submissionStats = overviewData.submissionStats || {
        completedCount: 0,
        lateCount: 0,
        notStartedCount: 0,
        totalStudents: 0
      };

      // Process student data
      // Note: axios interceptor returns response.data, so studentsResponse is already the server response
      // Structure: { traceId, success, message, data: { students: [...] } }
      let students = studentsResponse?.data?.students;
      
      // If data is nested
      if (!students || !Array.isArray(students)) {
        students = studentsResponse?.data?.data?.students || studentsResponse?.students || [];
      }
      
      students = students || [];
      console.log('Processed students:', students);
      console.log('Number of students:', students.length);
      
      // Normalize score helper
      const normalizeStudentScore = (score) => {
        if (score > 10 && score <= 100) {
          return score / 10;
        }
        return score;
      };
      
      const mappedStudents = students.map(student => ({
        id: student.userId,
        name: student.fullName,
        email: student.email,
        score: normalizeStudentScore(student.score || 0),
        avatar: student.avatarUrl,
        completionTime: student.completionTimeMinutes || 0,
        submissionStatus: student.submissionStatus,
        isLate: student.isLate || false,
        submittedAt: student.submittedAt || null
      }));

      setStudentScores(mappedStudents);

      // Calculate statistics from API data
      // Normalize scores from 100 scale to 10 scale if needed
      const normalizeScore = (score) => {
        if (score > 10 && score <= 100) {
          // If score is on 100 scale, convert to 10 scale
          return score / 10;
        }
        return score;
      };

      const average = normalizeScore(overviewData.averageScore || 0);
      const highest = normalizeScore(overviewData.highestScore || 0);
      const lowest = normalizeScore(overviewData.lowestScore || 0);
      const attemptDistribution = calculateAttemptDistribution(mappedStudents, submissionStats);

      // Process chart data
      let chartDataPoints = chartResponse?.data?.dataPoints || [];
      if (!chartDataPoints || !Array.isArray(chartDataPoints)) {
        chartDataPoints = chartResponse?.data?.data?.dataPoints || [];
      }
      
      // Normalize scores and prepare chart data
      const processedChartData = (chartDataPoints || []).map((point, index) => ({
        name: point.fullName || `Student ${index + 1}`,
        score: normalizeScore(point.score || 0),
        time: point.completionTimeMinutes || 0
      }));
      
      console.log('Processed chart data:', processedChartData);
      setChartData(processedChartData);

      const finalPerformanceData = {
        average: parseFloat(average.toFixed(1)),
        highest: parseFloat(highest.toFixed(1)),
        lowest: parseFloat(lowest.toFixed(1)),
        attemptDistribution,
        submissionStats
      };

      console.log('Setting performance data:', {
        ...finalPerformanceData,
        rawAverage: overviewData.averageScore,
        rawHighest: overviewData.highestScore,
        rawLowest: overviewData.lowestScore,
        normalizedAverage: average,
        normalizedHighest: highest,
        normalizedLowest: lowest
      });

      setPerformanceData(finalPerformanceData);
      console.log('Performance data set. State should update now.');

      setLoading(false);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      console.error('Error details:', error.response || error.message);
      setLoading(false);
    }
  };

  // Sort students by score (highest to lowest), then by completion time (lowest to highest)
  const getSortedStudents = () => {
    return [...studentScores].sort((a, b) => {
      // First sort by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by completion time (ascending - fastest first)
      return a.completionTime - b.completionTime;
    });
  };

  const mapQuestionStats = useCallback((questions = []) => {
    if (!Array.isArray(questions)) return [];
    const sorted = [...questions].sort((a, b) => {
      const sectionOrderA = typeof a.sectionOrder === 'number' ? a.sectionOrder : Number.MAX_SAFE_INTEGER;
      const sectionOrderB = typeof b.sectionOrder === 'number' ? b.sectionOrder : Number.MAX_SAFE_INTEGER;
      if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
      const questionOrderA = typeof a.questionOrder === 'number' ? a.questionOrder : Number.MAX_SAFE_INTEGER;
      const questionOrderB = typeof b.questionOrder === 'number' ? b.questionOrder : Number.MAX_SAFE_INTEGER;
      if (questionOrderA !== questionOrderB) return questionOrderA - questionOrderB;
      return (a.questionId || 0) - (b.questionId || 0);
    });

    return sorted.map((question, index) => {
      const totalAttempts = Number(question.totalAttempts) || 0;
      const correctAttempts = Number(question.correctCount ?? question.correctAttempts) || 0;
      const accuracySource = typeof question.correctRate === 'number'
        ? question.correctRate
        : (totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0);
      const accuracy = Number(Math.min(100, Math.max(0, accuracySource)).toFixed(1));

      return {
        key: question.questionId || `Q-${index + 1}`,
        questionKey: `Q${index + 1}`,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle || question.sectionName || question.skill || question.questionType || t('dailyChallenge.generalSection', 'General section'),
        sectionOrder: typeof question.sectionOrder === 'number' ? question.sectionOrder : index,
        questionId: question.questionId,
        questionText: question.questionText,
        questionType: question.questionType,
        questionOrder: question.questionOrder,
        totalAttempts,
        correctAttempts,
        accuracy,
      };
    });
  }, [t]);

  const fetchQuestionStats = useCallback(async () => {
    const challengeId = challengeInfo.challengeId || id;
    if (!challengeId) {
      return;
    }

    setQuestionStatsLoading(true);
    setQuestionStatsError(null);

    try {
      const response = await dailyChallengeApi.getChallengeQuestionStats(challengeId);
      let payload = response?.data ?? response;
      if (payload?.data?.questions) {
        payload = payload.data;
      }
      const questions = payload?.questions || [];
      const normalized = mapQuestionStats(questions);
      setQuestionStats(normalized);
      setQuestionStatsMeta({
        challengeName: payload?.challengeName || challengeInfo.challengeName || null,
        challengeId: payload?.challengeId || challengeId
      });
    } catch (error) {
      console.error('Error fetching question statistics:', error);
      console.error('Error details:', error?.response || error?.message);
      setQuestionStats([]);
      setQuestionStatsError(error);
    } finally {
      setQuestionStatsLoading(false);
    }
  }, [challengeInfo.challengeId, challengeInfo.challengeName, id, mapQuestionStats]);

  // Fetch challenge info if needed
  useEffect(() => {
    fetchChallengeInfo();
  }, [fetchChallengeInfo]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Determine back path based on classId
    const getBackPath = () => {
      if (challengeInfo.classId) {
        // If coming from class-specific daily challenges, go back to that list
        // Route: /teacher/classes/daily-challenges/:classId
        const userRole = user?.role?.toLowerCase();
        if (userRole === 'teacher' || userRole === 'teaching_assistant') {
          return `/teacher/classes/daily-challenges/${challengeInfo.classId}`;
        } else {
          return `/manager/classes/daily-challenges/${challengeInfo.classId}`;
        }
      } else {
        // Otherwise, go back to general daily challenges list
        const userRole = user?.role?.toLowerCase();
        return userRole === 'teacher' || userRole === 'teaching_assistant' 
          ? '/teacher/daily-challenges' 
          : '/manager/daily-challenges';
      }
    };

    // Determine subtitle for header
    // Priority: location.state > challengeInfo > dailyChallengeData
    const getSubtitle = () => {
      // First priority: Use location.state if available (when navigating back from SubmissionList)
      if (location?.state?.className && location?.state?.challengeName) {
        return `${location.state.className} / ${location.state.challengeName}`;
      } else if (location?.state?.challengeName) {
        return location.state.challengeName;
      } else if (location?.state?.className) {
        return location.state.className;
      }
      
      // Second priority: Use challengeInfo
      if (challengeInfo.className && challengeInfo.challengeName) {
        return `${challengeInfo.className} / ${challengeInfo.challengeName}`;
      } else if (challengeInfo.challengeName) {
        return challengeInfo.challengeName;
      }
      
      // Fallback to preserved subtitle from context if navigation/query lacks info
      return (typeof dailyChallengeData?.subtitle === 'string' && dailyChallengeData.subtitle.trim().length > 0)
        ? dailyChallengeData.subtitle
        : null;
    };
    
    // Enter daily challenge menu mode with backPath and subtitle
    enterDailyChallengeMenu(
      0, 
      getSubtitle(), 
      getBackPath(), 
      challengeInfo.className || dailyChallengeData?.className || null
    );
    
    // Exit daily challenge menu mode when component unmounts
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, challengeInfo, user, dailyChallengeData?.subtitle, dailyChallengeData?.className, location?.state?.className, location?.state?.challengeName]);

  useEffect(() => {
    if (challengeInfo.challengeId || id) {
      fetchPerformanceData();
      fetchQuestionStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, challengeInfo.challengeId]);

  // Debug: Log when performanceData changes
  useEffect(() => {
    console.log('Performance data state updated:', performanceData);
  }, [performanceData]);

  // Debug: Log when studentScores changes
  useEffect(() => {
    console.log('Student scores state updated:', studentScores);
    console.log('Number of students in state:', studentScores.length);
  }, [studentScores]);

  // Custom Tooltip for Chart (new chart data)
  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`dcpr-tooltip ${theme}-dcpr-tooltip`}>
          <p className="dcpr-tooltip__title">
            {data.name}
          </p>
          {payload.find(p => p.dataKey === 'score') && (
            <p className="dcpr-tooltip__item">
              {t('dailyChallenge.score', 'Score')}: {data.score.toFixed(2)}/10
            </p>
          )}
          {payload.find(p => p.dataKey === 'time') && (
            <p className="dcpr-tooltip__item">
              {t('dailyChallenge.completionTime', 'Completion Time')}: {data.time} {t('dailyChallenge.minutes', 'minutes')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const QuestionAnalysisTooltip = ({ active, payload }) => {
    if (!(active && payload && payload.length)) {
      return null;
    }
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className={`dcpr-tooltip ${theme}-dcpr-tooltip`}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{data.questionId}</div>
        <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 8 }}>
          {data.questionText}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          {t('dailyChallenge.questionType', 'Type')}: {data.questionType || t('dailyChallenge.unknown', 'Unknown')}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          {t('dailyChallenge.totalAttempts', 'Total Attempts')}: {data.totalAttempts}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          {t('dailyChallenge.correctAttempts', 'Correct Count')}: {data.correctAttempts}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {t('dailyChallenge.correctRate', 'Correct Rate')}: {data.accuracy}% ({data.correctAttempts}/{data.totalAttempts})
        </div>
      </div>
    );
  };

  const wrapXAxisLabel = (label = '', maxCharsPerLine = 10) => {
    if (!label) return [''];
    const words = label.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      if ((currentLine + word).trim().length <= maxCharsPerLine) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else if (word.length > maxCharsPerLine) {
        // Break very long words
        const chunks = word.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [];
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(...chunks.slice(0, -1));
        currentLine = chunks[chunks.length - 1] || '';
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const CustomXAxisTick = ({ x, y, payload }) => {
    const lines = wrapXAxisLabel(payload?.value || '');
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={32}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={11}
        >
          {lines.map((line, index) => (
            <tspan key={index} x={0} dy={index === 0 ? 0 : 12}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  const renderAccuracyLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === null || value === undefined) {
      return null;
    }
    const labelValue = `${Number(value).toFixed(0)}%`;
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fill="#374151"
        fontSize={11}
        fontWeight={600}
      >
        {labelValue}
      </text>
    );
  };


  return (
    <ThemedLayout>
      <div className={`dcpr-wrapper ${theme}-dcpr-wrapper`}>
        {/* Action Section */}
        <div className="dcpr-action-section">
          {userRole !== 'teaching_assistant' && (
            <Button
              className={`dcpr-tab-button ${theme}-dcpr-tab-button`}
              onClick={() => navigate(`/teacher/daily-challenges/detail/${id}/content`, {
                state: challengeInfo
              })}
            >
              {t('dailyChallenge.content')}
            </Button>
          )}
          <Button
            className={`dcpr-tab-button ${theme}-dcpr-tab-button`}
            onClick={() => navigate(`/teacher/daily-challenges/detail/${id}/submissions`, {
              state: challengeInfo
            })}
          >
            {t('dailyChallenge.submission')}
          </Button>
        </div>

        {/* Performance Content */}
        <div className="dcpr-content">
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingPerformance')}>
            {/* Overview Section - Statistics Cards */}
            <Row gutter={[12, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={8} lg={8} flex="1 1 220px" style={{ display: 'flex' }}>
                <Card
                  hoverable
                  style={{
                    backgroundColor: '#d6e6fb',
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
                      <BarChartOutlined style={{ color: '#2b6cb0' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#5b6b83', lineHeight: 1.1 }}>
                      {t('dailyChallenge.averageScore')}
                    </div>
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {performanceData.average}/10
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    Average score
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} flex="1 1 220px" style={{ display: 'flex' }}>
                <Card
                  hoverable
                  style={{
                    backgroundColor: '#dff7e8',
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
                      <BarChartOutlined style={{ color: '#1f7a3e' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#5b6b83', lineHeight: 1.1 }}>
                      {t('dailyChallenge.highestScore')}
                    </div>
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {performanceData.highest}/10
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    Highest score
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} flex="1 1 220px" style={{ display: 'flex' }}>
                <Card
                  hoverable
                  style={{
                    backgroundColor: '#fee2e2',
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
                      <BarChartOutlined style={{ color: '#ef4444' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#5b6b83', lineHeight: 1.1 }}>
                      {t('dailyChallenge.lowestScore')}
                    </div>
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {performanceData.lowest}/10
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    Lowest score
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {/* Top Rank Section */}
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
                    <TrophyOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Top Scoring Students</div>
                  </div>
                  {getSortedStudents().length === 0 ? (
                    <Empty description="No student data" style={{ padding: '40px 20px' }} />
                  ) : (
                    <div className="dcpr-table">
                      <div className="dcpr-table__head" style={{ gridTemplateColumns: '0.6fr 2.4fr 1fr' }}>
                        <div>Rank</div>
                        <div>Student</div>
                        <div>Score</div>
                      </div>
                      {getSortedStudents().slice(0, 5).map((student, index) => {
                        const isTopScore = index === 0;
                        const rank = index + 1;
                        
                        return (
                          <div 
                            key={student.id || student.userId || index}
                            className={`dcpr-table__row ${isTopScore ? 'dcpr-table__row--top' : ''}`}
                            style={{ gridTemplateColumns: '0.6fr 2.4fr 1fr' }}
                          >
                            <div style={{ 
                              fontWeight: 700, 
                              color: isTopScore ? '#1890ff' : '#6366f1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              {isTopScore && <TrophyOutlined style={{ color: '#f59e0b' }} />}
                              #{rank}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Avatar 
                                size={36} 
                                src={student.avatar} 
                                icon={<UserOutlined />} 
                                style={{ backgroundColor: '#6366f1' }} 
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: '#1f2937' }}>{student.name || student.email}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>{student.email}</div>
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, color: '#1f2937', fontSize: 16 }}>
                              {Number(student.score || 0).toFixed(2)}/10
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </Col>

              {/* Submission Stats Section */}
              <Col xs={24} lg={8}>
                <Card
                  style={{
                    backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    paddingTop: 8,
                    minHeight: 420,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <TeamOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Submission Statistics</div>
                  </div>
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-around',
                    padding: '4px 0'
                  }}>
                    {[
                      {
                        label: t('dailyChallenge.completed', 'Completed'),
                        count: performanceData.submissionStats?.completedCount || 0,
                        icon: <CheckCircleOutlined />,
                        color: '#1f7a3e',
                        bgColor: '#dff7e8'
                      },
                      {
                        label: t('dailyChallenge.late', 'Late'),
                        count: performanceData.submissionStats?.lateCount || 0,
                        icon: <ClockCircleOutlined />,
                        color: '#f59e0b',
                        bgColor: '#fef3c7'
                      },
                      {
                        label: t('dailyChallenge.notStarted', 'Not Started'),
                        count: performanceData.submissionStats?.notStartedCount || 0,
                        icon: <UserOutlined />,
                        color: '#ef4444',
                        bgColor: '#fee2e2'
                      },
                      {
                        label: t('dailyChallenge.totalStudents', 'Total Students'),
                        count: performanceData.submissionStats?.totalStudents || 0,
                        icon: <TeamOutlined />,
                        color: '#6366f1',
                        bgColor: '#e0e7ff'
                      }
                    ].map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          marginBottom: index < 3 ? 10 : 0,
                          backgroundColor: item.bgColor,
                          borderRadius: 10,
                          border: `2px solid ${item.color}20`,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${item.color}30`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${item.color}40`
                          }}>
                            <span style={{ fontSize: 20, color: item.color }}>
                              {item.icon}
                            </span>
                          </div>
                          <span style={{ 
                            fontSize: 16, 
                            fontWeight: 600, 
                            color: item.color,
                            flex: 1
                          }}>
                            {item.label}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: item.color,
                          minWidth: 50,
                          textAlign: 'right'
                        }}>
                          {item.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Chart Section - Full Width */}
            <Row gutter={[16, 16]}>
              <Col xs={24}>
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
                    <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">Performance Chart</div>
                  </div>
                  <div style={{ width: '100%', height: 360 }}>
                    {chartData.length === 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: '#999'
                      }}>
                        No chart data available
                      </div>
                    ) : (
                      <ResponsiveContainer>
                        <ComposedChart 
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            tick={<CustomXAxisTick />}
                            height={80}
                            tickMargin={12}
                            interval={0}
                          />
                          <YAxis 
                            yAxisId="left"
                            label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontSize: '14px' } }}
                            tick={{ fontSize: 12 }}
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Time (minutes)', angle: 90, position: 'insideRight', style: { fontSize: '14px' } }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: '8px' }} />
                          <Bar 
                            yAxisId="left"
                            dataKey="score" 
                            fill="#6366f1"
                            radius={[6, 6, 0, 0]}
                            name="Score"
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="time" 
                            stroke="#f59e0b"
                            strokeWidth={2.2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Completion Time"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* ========== 1. QUESTION ANALYSIS SECTION ========== */}
            <Row gutter={[16, 16]} style={{ marginTop: 32, marginBottom: 32 }}>
              <Col xs={24}>
                <Card
                  style={{
                    backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                    padding: '16px 16px 32px',
                    minHeight: 360,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <BookOutlined style={{ color: '#10b981', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">
                      Question-Level Analysis
                      {questionStatsMeta.challengeName && (
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                          {questionStatsMeta.challengeName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 320 }}>
                    <LoadingWithEffect loading={questionStatsLoading} message={t('dailyChallenge.loadingQuestionStats', 'Loading question statistics...')}>
                      {questionStats.length === 0 ? (
                        <Empty
                          description={
                            questionStatsError
                              ? t('dailyChallenge.questionStatsError', 'Unable to load question statistics')
                              : t('dailyChallenge.noQuestionStats', 'No question statistics available')
                          }
                          style={{ padding: '40px 0' }}
                        />
                      ) : (
                        <ResponsiveContainer>
                          <ComposedChart
                            data={questionStats}
                            margin={{ top: 10, right: 32, left: 0, bottom: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="questionKey"
                              tick={{ fontSize: 11 }}
                              interval={0}
                            />
                            <YAxis
                              yAxisId="accuracy"
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<QuestionAnalysisTooltip />} />
                            <Legend />
                            <Bar
                              yAxisId="accuracy"
                              dataKey="accuracy"
                              name={t('dailyChallenge.correctRate', 'Correct rate (%)')}
                              radius={[6, 6, 0, 0]}
                              fill="#10b981"
                            >
                              {questionStats.map((entry, index) => (
                                <Cell
                                  key={`accuracy-${entry.key}`}
                                  fill={
                                    entry.accuracy >= 70
                                      ? '#10b981'
                                      : entry.accuracy >= 40
                                        ? '#f59e0b'
                                        : '#ef4444'
                                  }
                                />
                              ))}
                              <LabelList content={renderAccuracyLabel} />
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </LoadingWithEffect>
                  </div>
                </Card>
              </Col>
            </Row>

          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengePerformance;

