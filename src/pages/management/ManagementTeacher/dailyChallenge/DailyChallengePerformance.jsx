import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Button, Avatar, Empty } from "antd";
import { TrophyOutlined, BarChartOutlined, UserOutlined, TeamOutlined, BookOutlined } from "@ant-design/icons";
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
  Legend
} from 'recharts';
import "./DailyChallengePerformance.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { dailyChallengeApi } from "../../../../apis/apis";
import { useSelector } from "react-redux";

const stripHtmlTags = (text = '') => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?p[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizePlaceholders = (text = '') => {
  if (!text) return '';
  return text.replace(/\[\[pos_[^\]]+\]\]/g, ' ____ ');
};

const formatQuestionPrompt = (question = {}) => {
  const raw = question?.questionText || question?.question || '';
  return normalizePlaceholders(stripHtmlTags(raw));
};

// eslint-disable-next-line no-unused-vars
const truncateQuestionText = (text, maxLength = 80) => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return `${text.slice(0, maxLength)}...`;
};

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
      challengeType: location.state?.challengeType || null,
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
        challengeType: location.state?.challengeType || challengeInfo.challengeType || null,
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
  // eslint-disable-next-line no-unused-vars
  const [questionStats, setQuestionStats] = useState([]);
  const [questionStatsLoading, setQuestionStatsLoading] = useState(false);
  const [questionStatsMeta, setQuestionStatsMeta] = useState({
    challengeName: null,
    challengeId: null
  });
  const [questionStatsError, setQuestionStatsError] = useState(null);
  const [questionMatrixData, setQuestionMatrixData] = useState({
    questions: [],
    students: [],
    matrix: {} // { questionId: { userId: receivedWeight } }
  });
  const getQuestionTotalWeight = useCallback((question) => {
    if (!question) return 0;
    if (typeof question.totalWeight === 'number') {
      return question.totalWeight;
    }
    if (Array.isArray(question.studentPerformances)) {
      const perfWithWeight = question.studentPerformances.find(
        (perf) => typeof perf.totalWeight === 'number'
      );
      if (perfWithWeight) {
        return perfWithWeight.totalWeight;
      }
    }
    return 0;
  }, []);
  const totalQuestionWeight = useMemo(() => {
    if (!questionMatrixData.questions.length) return 0;
    return questionMatrixData.questions.reduce(
      (sum, question) => sum + getQuestionTotalWeight(question),
      0
    );
  }, [questionMatrixData.questions, getQuestionTotalWeight]);
  const studentTotalScoreMap = useMemo(() => {
    if (!questionMatrixData.students.length || !questionMatrixData.questions.length) {
      return {};
    }
    return questionMatrixData.students.reduce((acc, student) => {
      let receivedSum = 0;
      let hasScore = false;
      questionMatrixData.questions.forEach((question) => {
        const cell = questionMatrixData.matrix[question.questionId]?.[student.userId];
        if (cell && typeof cell.receivedWeight === 'number') {
          receivedSum += cell.receivedWeight;
          hasScore = true;
        }
      });
      const score10 =
        hasScore && totalQuestionWeight > 0
          ? parseFloat(((receivedSum / totalQuestionWeight) * 10).toFixed(2))
          : null;
      acc[student.userId] = {
        raw: hasScore ? receivedSum : null,
        score10
      };
      return acc;
    }, {});
  }, [
    questionMatrixData.students,
    questionMatrixData.questions,
    questionMatrixData.matrix,
    totalQuestionWeight
  ]);

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
          challengeType: data.challengeType || data.type || prev.challengeType,
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
      
      // Update challengeType from overview data if available
      if (overviewData?.challengeType) {
        setChallengeInfo(prev => ({
          ...prev,
          challengeType: overviewData.challengeType || prev.challengeType
        }));
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
        name: point.fullName || t('dailyChallenge.studentNumber', 'Student {{number}}', { number: index + 1 }),
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
      const formattedQuestionText = formatQuestionPrompt(question);

      return {
        key: question.questionId || `Q-${index + 1}`,
        questionKey: `Q${index + 1}`,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle || question.sectionName || question.skill || question.questionType || t('dailyChallenge.generalSection', 'General section'),
        sectionOrder: typeof question.sectionOrder === 'number' ? question.sectionOrder : index,
        questionId: question.questionId,
        questionText: formattedQuestionText,
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

      // Build matrix data for the new format
      if (questions && questions.length > 0) {
        // Collect all unique students from all questions
        const studentMap = new Map();
        questions.forEach(question => {
          if (question.studentPerformances && Array.isArray(question.studentPerformances)) {
            question.studentPerformances.forEach(perf => {
              if (perf.userId && !studentMap.has(perf.userId)) {
                studentMap.set(perf.userId, {
                  userId: perf.userId,
                  fullName: perf.fullName || '',
                  email: perf.email || '',
                  avatarUrl: perf.avatarUrl || null
                });
              }
            });
          }
        });

        const students = Array.from(studentMap.values()).sort((a, b) => {
          const nameA = (a.fullName || a.email || '').toLowerCase();
          const nameB = (b.fullName || b.email || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Build matrix: { questionId: { userId: receivedWeight } }
        const matrix = {};
        questions.forEach(question => {
          if (!matrix[question.questionId]) {
            matrix[question.questionId] = {};
          }
          if (question.studentPerformances && Array.isArray(question.studentPerformances)) {
            question.studentPerformances.forEach(perf => {
              if (perf.userId) {
                matrix[question.questionId][perf.userId] = {
                  receivedWeight: typeof perf.receivedWeight === 'number' ? perf.receivedWeight : null,
                  totalWeight: typeof perf.totalWeight === 'number' ? perf.totalWeight : null,
                  isCorrect: typeof perf.isCorrect === 'boolean' ? perf.isCorrect : null
                };
              }
            });
          }
        });

        // Sort questions by sectionOrder and questionOrder
        const sortedQuestions = [...questions].sort((a, b) => {
          const sectionOrderA = typeof a.sectionOrder === 'number' ? a.sectionOrder : Number.MAX_SAFE_INTEGER;
          const sectionOrderB = typeof b.sectionOrder === 'number' ? b.sectionOrder : Number.MAX_SAFE_INTEGER;
          if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
          const questionOrderA = typeof a.questionOrder === 'number' ? a.questionOrder : Number.MAX_SAFE_INTEGER;
          const questionOrderB = typeof b.questionOrder === 'number' ? b.questionOrder : Number.MAX_SAFE_INTEGER;
          return questionOrderA - questionOrderB;
        });

        setQuestionMatrixData({
          questions: sortedQuestions,
          students,
          matrix
        });
      } else {
        setQuestionMatrixData({
          questions: [],
          students: [],
          matrix: {}
        });
      }
    } catch (error) {
      console.error('Error fetching question statistics:', error);
      console.error('Error details:', error?.response || error?.message);
      setQuestionStats([]);
      setQuestionStatsError(error);
      setQuestionMatrixData({
        questions: [],
        students: [],
        matrix: {}
      });
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
    // Also preserve pagination state from location.state for restoring when navigating back
    const getBackPath = () => {
      // Preserve state from location.state (contains pagination info from DailyChallengeList)
      const savedState = location.state || {};
      const preservedState = {
        ...savedState,
        // Keep pagination state if it exists
        currentPage: savedState.currentPage,
        pageSize: savedState.pageSize,
        searchText: savedState.searchText,
        typeFilter: savedState.typeFilter,
        statusFilter: savedState.statusFilter,
      };
      
      console.log('🔵 DailyChallengePerformance - Preserving state for back navigation:', preservedState);
      
      if (challengeInfo.classId) {
        // If coming from class-specific daily challenges, go back to that list
        // Route: /teacher/classes/daily-challenges/:classId
        const userRole = user?.role?.toLowerCase();
        const path = userRole === 'teacher' || userRole === 'teaching_assistant'
          ? `/teacher/classes/daily-challenges/${challengeInfo.classId}`
          : `/manager/classes/daily-challenges/${challengeInfo.classId}`;
        
        // Store preserved state in a way that ThemedHeader can access it
        // We'll modify the context to include state, or use a ref
        return path;
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

  // Helper to translate type codes to labels
  const getTypeLabelByCode = useCallback((typeCode) => {
    if (!typeCode) return '';
    switch(typeCode) {
      case 'GV': return t('dailyChallenge.typeNames.GV') || 'Grammar & Vocabulary';
      case 'RE': return t('dailyChallenge.typeNames.RE') || 'Reading';
      case 'LI': return t('dailyChallenge.typeNames.LI') || 'Listening';
      case 'WR': return t('dailyChallenge.typeNames.WR') || 'Writing';
      case 'SP': return t('dailyChallenge.typeNames.SP') || 'Speaking';
      default: return typeCode;
    }
  }, [t]);

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

  const CustomXAxisTick = ({ x, y, payload }) => {
    const label = payload?.value || '';
    // Rút ngắn tên nếu quá dài
    const shortLabel = label.length > 15 ? label.substring(0, 12) + '...' : label;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={8}
          textAnchor="end"
          fill="#6b7280"
          fontSize={10}
          transform={`rotate(-45, 0, 0)`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {shortLabel}
        </text>
      </g>
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
              onClick={() => {
                // Preserve pagination state from location.state when navigating to content
                const savedState = location.state || {};
                const contentPath = userRole === 'manager'
                  ? `/manager/daily-challenges/detail/${id}/content`
                  : `/teacher/daily-challenges/detail/${id}/content`;
                navigate(contentPath, {
                  state: {
                    ...challengeInfo,
                    ...savedState, // Preserve pagination state
                  }
                });
              }}
            >
              {t('dailyChallenge.content')}
            </Button>
          )}
          <Button
            className={`dcpr-tab-button ${theme}-dcpr-tab-button`}
            onClick={() => {
              // Preserve pagination state from location.state when navigating to submissions
              const savedState = location.state || {};
              const submissionsPath = userRole === 'manager'
                ? `/manager/daily-challenges/detail/${id}/submissions`
                : `/teacher/daily-challenges/detail/${id}/submissions`;
              navigate(submissionsPath, {
                state: {
                  ...challengeInfo,
                  ...savedState, // Preserve pagination state
                }
              });
            }}
          >
            {t('dailyChallenge.submission')}
          </Button>
        </div>

        {/* Performance Content */}
        <div className="dcpr-content">
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingPerformance')}>
            {/* Overview Section - Statistics Cards */}
            <Row gutter={[12, 16]} style={{ marginBottom: 24, marginTop: 32 }}>
              {/* Challenge Type Card */}
              <Col xs={24} sm={12} md={6} lg={6} flex="1 1 180px" style={{ display: 'flex' }}>
                <Card
                  hoverable
                  style={{
                    backgroundColor: '#f0f9ff',
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
                      <BookOutlined style={{ color: '#0ea5e9' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#5b6b83', lineHeight: 1.1 }}>
                      {t('dailyChallenge.challengeType', 'Challenge Type')}
                    </div>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {getTypeLabelByCode(challengeInfo.challengeType) || t('dailyChallenge.notAvailable', 'N/A')}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
                    {challengeInfo.challengeType || t('dailyChallenge.unknown', 'Unknown')}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} flex="1 1 180px" style={{ display: 'flex' }}>
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
                  <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {performanceData.average}/10
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
                    {t('dailyChallenge.averageScoreLabel', 'Average score')}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} flex="1 1 180px" style={{ display: 'flex' }}>
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
                  <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {performanceData.highest}/10
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
                    {t('dailyChallenge.highestScoreLabel', 'Highest score')}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} flex="1 1 180px" style={{ display: 'flex' }}>
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
                  <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
                    {performanceData.lowest}/10
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
                    {t('dailyChallenge.lowestScoreLabel', 'Lowest score')}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Chart Section - Left 2/3, Right Sidebar 1/3 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {/* Performance Chart - Left Side (2/3) */}
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
                    <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                    <div className="manager-dashboard-v2__title">{t('dailyChallenge.performanceChart', 'Performance Chart')}</div>
                  </div>
                  <div style={{ width: '100%', height: 528 }}>
                    {chartData.length === 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: '#999'
                      }}>
                        {t('dailyChallenge.noChartData', 'No chart data available')}
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
                            tickMargin={4}
                            interval={0}
                          />
                          <YAxis 
                            yAxisId="left"
                            label={{ value: t('dailyChallenge.scoreLabel', 'Score'), angle: -90, position: 'insideLeft', style: { fontSize: '14px' } }}
                            tick={{ fontSize: 12 }}
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            label={{ value: `${t('dailyChallenge.completionTime', 'Completion Time')} (${t('dailyChallenge.minutes', 'minutes')})`, angle: 90, position: 'insideRight', style: { fontSize: '14px' } }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: 24 }}
                          />
                          <Bar 
                            yAxisId="left"
                            dataKey="score" 
                            fill="#6366f1"
                            radius={[6, 6, 0, 0]}
                            name={t('dailyChallenge.scoreLabel', 'Score')}
                            barCategoryGap="30%"
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="time" 
                            stroke="#f59e0b"
                            strokeWidth={2.2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name={t('dailyChallenge.completionTime', 'Completion Time')}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </Col>

              {/* Right Sidebar - Submission Statistics & Top Scoring Students (1/3) */}
              <Col xs={24} lg={8}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                  {/* Submission Statistics - Top */}
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: theme === 'sun' ? '#f9fafb' : '#1f2937',
                    borderRadius: 12,
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <TeamOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                      <div className="manager-dashboard-v2__title">{t('dailyChallenge.submissionStatistics', 'Submission Statistics')}</div>
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8
                    }}>
                      {[
                        {
                          label: t('dailyChallenge.completed', 'Completed'),
                          count: performanceData.submissionStats?.completedCount || 0,
                          color: '#1f7a3e'
                        },
                        {
                          label: t('dailyChallenge.late', 'Late'),
                          count: performanceData.submissionStats?.lateCount || 0,
                          color: '#f59e0b'
                        },
                        {
                          label: t('dailyChallenge.notStarted', 'Not Started'),
                          count: performanceData.submissionStats?.notStartedCount || 0,
                          color: '#ef4444'
                        },
                        {
                          label: t('dailyChallenge.totalStudents', 'Total Students'),
                          count: performanceData.submissionStats?.totalStudents || 0,
                          color: '#6366f1'
                        }
                      ].map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '8px 4px',
                            textAlign: 'center'
                          }}
                        >
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 500, 
                            color: theme === 'sun' ? '#6b7280' : '#9ca3af',
                            marginBottom: 4
                          }}>
                            {item.label}
                          </span>
                          <div style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: item.color
                          }}>
                            {item.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Scoring Students - Bottom */}
                  <Card
                    style={{
                      backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                      border: 'none',
                      borderRadius: 16,
                      boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                      paddingTop: 8,
                      flex: 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <TrophyOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                      <div className="manager-dashboard-v2__title">{t('dailyChallenge.topScoringStudents', 'Top Scoring Students')}</div>
                    </div>
                    {getSortedStudents().length === 0 ? (
                      <Empty description={t('dailyChallenge.noStudentData', 'No student data')} style={{ padding: '40px 20px' }} />
                    ) : (
                      <div className="dcpr-table">
                        <div className="dcpr-table__head" style={{ gridTemplateColumns: '0.6fr 2.4fr 1fr' }}>
                          <div>{t('dailyChallenge.rank', 'Rank')}</div>
                          <div>{t('dailyChallenge.student', 'Student')}</div>
                          <div>{t('dailyChallenge.scoreLabel', 'Score')}</div>
                        </div>
                        {getSortedStudents().slice(0, 3).map((student, index) => {
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
                </div>
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
                      {t('dailyChallenge.questionLevelAnalysis', 'Question-Level Analysis')}
                      {questionStatsMeta.challengeName && (
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                          {questionStatsMeta.challengeName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div 
                    className={`dcpr-question-matrix-scroll ${theme === 'sun' ? '' : 'moon-dcpr-question-matrix-scroll'}`}
                    style={{ 
                      width: '100%', 
                      overflowX: 'auto', 
                      overflowY: 'auto', 
                      maxHeight: '600px',
                      borderRadius: '12px',
                      border: `1px solid ${theme === 'sun' ? '#b3d9ff' : '#374151'}`,
                      backgroundColor: theme === 'sun' ? '#e6f5ff' : '#111827'
                    }}
                  >
                    <LoadingWithEffect loading={questionStatsLoading} message={t('dailyChallenge.loadingQuestionStats', 'Loading question statistics...')}>
                      {questionMatrixData.questions.length === 0 ? (
                        <Empty
                          description={
                            questionStatsError
                              ? t('dailyChallenge.questionStatsError', 'Unable to load question statistics')
                              : t('dailyChallenge.noQuestionStats', 'No question statistics available')
                          }
                          style={{ padding: '40px 0' }}
                        />
                      ) : (
                        <table style={{ 
                          width: '100%',
                          minWidth: 'max-content',
                          borderCollapse: 'separate',
                          borderSpacing: 0,
                          tableLayout: 'auto'
                        }}>
                          <thead>
                            <tr style={{ 
                              backgroundColor: theme === 'sun' ? '#cce5ff' : '#374151'
                            }}>
                              <th style={{ 
                                padding: '12px 16px',
                                fontWeight: 700,
                                fontSize: 14,
                                color: theme === 'sun' ? '#1f2937' : '#f9fafb',
                                border: `1px solid ${theme === 'sun' ? '#b3d9ff' : '#374151'}`,
                                backgroundColor: theme === 'sun' ? '#cce5ff' : '#374151',
                                position: 'sticky',
                                top: 0,
                                left: 0,
                                zIndex: 12,
                                minWidth: 120,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                borderTopLeftRadius: '12px',
                                boxShadow: theme === 'sun' 
                                  ? '0 2px 4px rgba(0,0,0,0.1), 2px 0 4px rgba(0,0,0,0.1)' 
                                  : '0 2px 4px rgba(0,0,0,0.3), 2px 0 4px rgba(0,0,0,0.3)'
                              }}>
                                {t('dailyChallenge.question', 'Question')}
                              </th>
                              {questionMatrixData.students.map((student, idx) => (
                                <th
                                  key={student.userId}
                                  style={{
                                    padding: '12px 16px',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: theme === 'sun' ? '#1f2937' : '#f9fafb',
                                    border: `1px solid ${theme === 'sun' ? '#b3d9ff' : '#374151'}`,
                                    backgroundColor: theme === 'sun' ? '#cce5ff' : '#374151',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 11,
                                    minWidth: 120,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    boxShadow: theme === 'sun' ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.3)',
                                    ...(idx === questionMatrixData.students.length - 1 && { borderTopRightRadius: '12px' })
                                  }}
                                >
                                  {student.fullName || student.email || t('dailyChallenge.studentNumber', 'Student {{number}}', { number: idx + 1 })}
                                </th>
                              ))}
                            </tr>
                            <tr
                              style={{
                                backgroundColor: theme === 'sun' ? '#bbf7d0' : '#047857'
                              }}
                            >
                              <th
                                style={{
                                  padding: '10px 16px',
                                  fontWeight: 700,
                                  fontSize: 14,
                                  color: theme === 'sun' ? '#065f46' : '#f0fdf4',
                                  border: `1px solid ${theme === 'sun' ? '#10b981' : '#34d399'}`,
                                  backgroundColor: theme === 'sun' ? '#bbf7d0' : '#047857',
                                  position: 'sticky',
                                  top: 52,
                                  left: 0,
                                  zIndex: 11,
                                  minWidth: 120,
                                  textAlign: 'left',
                                  whiteSpace: 'nowrap',
                                  boxShadow: theme === 'sun'
                                    ? '0 2px 4px rgba(0,0,0,0.06), 2px 0 4px rgba(0,0,0,0.08)'
                                    : '0 2px 4px rgba(0,0,0,0.4), 2px 0 4px rgba(0,0,0,0.3)'
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>{t('dailyChallenge.totalScore', 'Total Score')}</div>
                                <div style={{ fontSize: 11, fontWeight: 500, color: theme === 'sun' ? '#047857' : '#86efac' }}>
                                  {t('dailyChallenge.scale010', 'Scale 0 – 10')}
                                </div>
                              </th>
                              {questionMatrixData.students.map((student, idx) => {
                                const totalScore = studentTotalScoreMap[student.userId];
                                const displayScore =
                                  typeof totalScore?.score10 === 'number'
                                    ? totalScore.score10.toFixed(2)
                                    : '-';
                                let textColor = theme === 'sun' ? '#065f46' : '#f0fdf4';
                                if (typeof totalScore?.score10 === 'number') {
                                  if (totalScore.score10 < 5) {
                                    textColor = '#dc2626'; // Red
                                  } else if (totalScore.score10 < 7) {
                                    textColor = '#f97316'; // Orange
                                  } else {
                                    textColor = '#047857'; // Green
                                  }
                                }
                                return (
                                  <th
                                    key={`${student.userId}-totals`}
                                    style={{
                                      padding: '10px 16px',
                                      fontWeight: 600,
                                      fontSize: 14,
                                      color: textColor,
                                      border: `1px solid ${theme === 'sun' ? '#10b981' : '#34d399'}`,
                                      backgroundColor: theme === 'sun' ? '#bbf7d0' : '#047857',
                                      position: 'sticky',
                                      top: 52,
                                      zIndex: 10,
                                      minWidth: 120,
                                      textAlign: 'center',
                                      whiteSpace: 'nowrap',
                                      boxShadow: theme === 'sun'
                                        ? '0 2px 4px rgba(0,0,0,0.08)'
                                        : '0 2px 4px rgba(0,0,0,0.4)',
                                      ...(idx === questionMatrixData.students.length - 1 && { borderTopRightRadius: '12px' })
                                    }}
                                  >
                                    {displayScore}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {questionMatrixData.questions.map((question, qIdx) => {
                              const totalWeight = getQuestionTotalWeight(question);
                              const questionKey = t('dailyChallenge.questionNumber', 'Question #{{number}}', { number: qIdx + 1 });
                              const isLastRow = qIdx === questionMatrixData.questions.length - 1;
                              return (
                                <tr
                                  key={question.questionId || qIdx}
                                  style={{
                                    backgroundColor: qIdx % 2 === 0 
                                      ? (theme === 'sun' ? '#e6f5ff' : '#111827')
                                      : (theme === 'sun' ? '#d6ebff' : '#1f2937')
                                  }}
                                >
                                  <td style={{
                                    padding: '12px 16px',
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: theme === 'sun' ? '#1f2937' : '#f9fafb',
                                    border: `1px solid ${theme === 'sun' ? '#b3d9ff' : '#374151'}`,
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 9,
                                    backgroundColor: qIdx % 2 === 0 
                                      ? (theme === 'sun' ? '#e6f5ff' : '#111827')
                                      : (theme === 'sun' ? '#d6ebff' : '#1f2937'),
                                    minWidth: 120,
                                    textAlign: 'left',
                                    boxShadow: theme === 'sun' ? '2px 0 4px rgba(0,0,0,0.1)' : '2px 0 4px rgba(0,0,0,0.3)',
                                    ...(isLastRow && { borderBottomLeftRadius: '12px' })
                                  }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                      {questionKey}
                                    </div>
                                    <div style={{ fontSize: 11, color: theme === 'sun' ? '#6b7280' : '#9ca3af', fontWeight: 400 }}>
                                      {t('dailyChallenge.maxScore', 'Max score')}: {totalWeight}
                                    </div>
                                  </td>
                                  {questionMatrixData.students.map((student, sIdx) => {
                                    const cellData = questionMatrixData.matrix[question.questionId]?.[student.userId];
                                    const receivedWeight = 
                                      typeof cellData?.receivedWeight === 'number'
                                        ? cellData.receivedWeight
                                        : null;
                                    const cellTotalWeight =
                                      typeof cellData?.totalWeight === 'number'
                                        ? cellData.totalWeight
                                        : totalWeight;
                                    let textColor = theme === 'sun' ? '#1f2937' : '#f9fafb';
                                    if (typeof receivedWeight === 'number') {
                                      if (receivedWeight === 0) {
                                        textColor = '#ef4444'; // Đỏ cho điểm 0
                                      } else if (receivedWeight === cellTotalWeight) {
                                        textColor = '#10b981'; // Xanh lá cho điểm tối đa
                                      }
                                    }
                                    const isLastCell = sIdx === questionMatrixData.students.length - 1;
                                    
                                    return (
                                      <td
                                        key={student.userId}
                                        style={{
                                          padding: '12px 16px',
                                          fontWeight: 600,
                                          fontSize: 13,
                                          color: textColor,
                                          border: `1px solid ${theme === 'sun' ? '#b3d9ff' : '#374151'}`,
                                          backgroundColor: 'transparent',
                                          textAlign: 'center',
                                          minWidth: 100,
                                          maxWidth: 120,
                                          ...(isLastRow && isLastCell && { borderBottomRightRadius: '12px' })
                                        }}
                                        >
                                          {typeof receivedWeight === 'number' ? receivedWeight : '-'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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

