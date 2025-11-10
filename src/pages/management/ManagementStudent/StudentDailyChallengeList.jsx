import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Typography,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../component/spinner/LoadingWithEffect";
import "../ManagementTeacher/dailyChallenge/DailyChallengeList.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import { useClassMenu } from "../../../contexts/ClassMenuContext";
import { dailyChallengeApi, classManagementApi } from "../../../apis/apis";
import dailyChallengeApiBackend from "../../../apis/backend/dailyChallengeManagement";
import { spaceToast } from "../../../component/SpaceToastify";
import { useSelector } from "react-redux";
import CustomCursor from "../../../component/cursor/CustomCursor";

// Transform API response data to match UI structure
const transformApiData = (apiData) => {
  const flattened = [];
  
  if (!Array.isArray(apiData)) {
    return flattened;
  }
  
  apiData.forEach((lesson) => {
    const challenges = lesson.challenges || [];
    
    if (challenges.length === 0) {
      // Create a placeholder row for lessons without challenges
      const emptyLessonRow = {
        id: `empty-lesson-${lesson.classLessonId}`,
        title: null,
        type: null,
        status: null,
        startDate: null,
        endDate: null,
        lessonId: lesson.classLessonId,
        lessonName: lesson.classLessonName,
        lessonOrder: lesson.orderNumber,
        isFirstChallengeInLesson: true,
        totalChallengesInLesson: 0,
        rowSpan: 1,
        totalScore: null,
          scorePercentage: null,
        submissionChallengeId: null,
        submissionStatus: null,
        late: null,
        isEmptyLesson: true, // Flag to identify empty lessons
      };
      flattened.push(emptyLessonRow);
    } else {
      challenges.forEach((challenge, index) => {
        // Support both old flat structure and new nested structure
        const dc = challenge.dailyChallenge || challenge || {};
        const ss = challenge.studentSubmission || {};

        const transformedChallenge = {
          id: dc.id,
          title: dc.challengeName,
          type: dc.challengeType,
          status: dc.challengeStatus,
          startDate: dc.startDate,
          endDate: dc.endDate,
          durationMinutes: dc.durationMinutes,
          lessonId: lesson.classLessonId,
          lessonName: lesson.classLessonName,
          lessonOrder: lesson.orderNumber,
          isFirstChallengeInLesson: index === 0,
          totalChallengesInLesson: challenges.length,
          rowSpan: index === 0 ? challenges.length : 0,
          totalScore: (ss.finalScore ?? challenge.finalScore ?? challenge.totalScore ?? null),
          scorePercentage: null,
          totalWeight: (ss.totalWeight ?? challenge.totalWeight),
          maxPossibleWeight: (ss.maxPossibleWeight ?? challenge.maxPossibleWeight),
          submissionChallengeId: (ss.submissionId ?? challenge.submissionChallengeId),
          submissionStatus: (ss.submissionStatus ?? challenge.submissionStatus),
          late: (typeof ss.late !== 'undefined' ? ss.late : challenge.late),
          hasAntiCheat: dc.hasAntiCheat,
          shuffleQuestion: dc.shuffleQuestion,
          translateOnScreen: dc.translateOnScreen,
          isEmptyLesson: false,
        };

        flattened.push(transformedChallenge);
      });
    }
  });
  
  return flattened;
};

const StudentDailyChallengeList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation();
  const { classId } = useParams();
  const userRole = useSelector((state) => state.auth?.user?.role);
  const isTestTaker = userRole === 'test_taker' || userRole === 'TEST_TAKER';
  const routePrefix = isTestTaker ? '/test-taker' : '/student';
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  const hasEnteredClassMenu = useRef(false);
  
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [searchText, setSearchText] = useState("");
  // Removed type filter per request
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [allChallenges, setAllChallenges] = useState([]);
  const [searchDebounce, setSearchDebounce] = useState("");

  // Removed filter dropdown logic per request

  // Helper to translate type codes to labels
  const getTypeLabelByCode = useCallback((typeCode) => {
    switch(typeCode) {
      case 'GV': return t('dailyChallenge.typeNames.GV') || 'Grammar & Vocabulary';
      case 'RE': return t('dailyChallenge.typeNames.RE') || 'Reading';
      case 'LI': return t('dailyChallenge.typeNames.LI') || 'Listening';
      case 'WR': return t('dailyChallenge.typeNames.WR') || 'Writing';
      case 'SP': return t('dailyChallenge.typeNames.SP') || 'Speaking';
      default: return typeCode;
    }
  }, [t]);

  // Helper to extract error message from backend response
  const getErrorMessage = useCallback((error, defaultMessage) => {
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return defaultMessage || t('common.errorOccurred', 'An error occurred');
  }, [t]);

  // Load data from API
  useEffect(() => {
    const resolvedClassId = classId || location.state?.classId;
    
    if (!resolvedClassId) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data (no pagination) - client-side pagination will handle it
        const response = await dailyChallengeApi.getStudentDailyChallengesByClass(resolvedClassId, {
          text: searchDebounce || undefined,
          size: 100,
        });

        // Handle both possible response structures
        // Axios wraps response in response.data, so if API returns {success: true, data: [...]}
        // it becomes response.data = {success: true, data: [...]}
        let responseData = null;
        if (response.data?.data && Array.isArray(response.data.data)) {
          // Standard structure: { success: true, data: [...] }
          responseData = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Direct array structure: [...]
          responseData = response.data;
        } else if (response.data?.success && response.data?.data) {
          responseData = response.data.data;
        }

        if (responseData && Array.isArray(responseData)) {
          const transformedData = transformApiData(responseData);
          setAllChallenges(transformedData);
          setTotalItems(transformedData.length);
        } else {
          setAllChallenges([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error('Error fetching daily challenges:', error);
        const errorMessage = getErrorMessage(error, 'Failed to load daily challenges');
        spaceToast.error(errorMessage);
        setAllChallenges([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, location.state?.classId, searchDebounce, getErrorMessage, t]);

  // Fetch class data for header display
  useEffect(() => {
    const resolvedClassId = classId || location.state?.classId;
    
    if (!resolvedClassId) return;

    const fetchClassData = async () => {
      try {
        const response = await classManagementApi.getClassDetail(resolvedClassId);
        if (response.success && response.data) {
          setClassData({
            id: response.data.id,
            name: response.data.className,
            description: response.data.className,
          });
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
        const errorMessage = getErrorMessage(error, t('common.errorLoadingClassData', 'Failed to load class data'));
        spaceToast.error(errorMessage);
      }
    };

    fetchClassData();
  }, [classId, location.state?.classId, getErrorMessage, t]);

  // Reset ref when classId changes
  useEffect(() => {
    hasEnteredClassMenu.current = false;
  }, [classId, location.state?.classId]);

  // Enter class menu mode when component mounts to show back button in header
  useEffect(() => {
    const resolvedClassId = classId || location.state?.classId;
    
    if (!resolvedClassId || !classData) return;
    
    // Check if we already entered class menu with the same classId to avoid infinite loop
    if (hasEnteredClassMenu.current) {
      return; // Already entered
    }
    
    // Mark as entered and call enterClassMenu
    hasEnteredClassMenu.current = true;
    enterClassMenu({
      id: classData.id,
      name: classData.name,
      description: classData.description,
      backUrl: `${routePrefix}/classes/menu/${resolvedClassId}`
    });
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      hasEnteredClassMenu.current = false;
      exitClassMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData?.id, classId, location.state?.classId, routePrefix]);

  // Compute lesson-aware pagination: recalculate rowSpan and first-in-lesson within the current page window
  const computePagedRows = useCallback((fullList, page, size) => {
    if (!Array.isArray(fullList) || fullList.length === 0) return [];
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    const slice = fullList.slice(startIndex, endIndex);

    const lessonToIndices = new Map();
    for (let i = 0; i < fullList.length; i++) {
      const rec = fullList[i];
      const key = rec.lessonId ?? `no-lesson-${i}`;
      if (!lessonToIndices.has(key)) lessonToIndices.set(key, []);
      lessonToIndices.get(key).push(i);
    }

    const result = slice.map((rec, idxInSlice) => ({ ...rec }));
    let i = 0;
    while (i < result.length) {
      const current = result[i];
      const lessonKey = current.lessonId ?? `no-lesson-${startIndex + i}`;

      let j = i;
      while (
        j < result.length &&
        (result[j].lessonId ?? `no-lesson-${startIndex + j}`) === lessonKey
      ) {
        j++;
      }
      const countInSlice = j - i;

      if (countInSlice > 0) {
        result[i].isFirstChallengeInLesson = true;
        result[i].rowSpan = countInSlice;

        for (let k = i + 1; k < j; k++) {
          result[k].isFirstChallengeInLesson = false;
          result[k].rowSpan = 0;
        }
      }

      i = Math.max(j, i + 1);
    }

    return result;
  }, []);

  // Build filtered full list (type/search) - only PUBLISHED challenges shown
  const filteredAllChallenges = useMemo(() => {
    // If no search text, return all challenges immediately
    if (!searchDebounce || searchDebounce.trim() === "") {
      return allChallenges;
    }

    // Pre-compute lowercase search text for better performance
    const searchLower = searchDebounce.toLowerCase();

    return allChallenges.filter((challenge) => {
      // Empty lessons (lessons without challenges) should always be shown
      if (challenge.isEmptyLesson) {
        const matchesSearch = challenge.lessonName?.toLowerCase().includes(searchLower);
        return matchesSearch;
      }

      // Only apply search filter now (type filter removed)
      const matchesSearch = 
        challenge.title?.toLowerCase().includes(searchLower) ||
        challenge.lessonName?.toLowerCase().includes(searchLower);
      return matchesSearch;
    });
  }, [allChallenges, searchDebounce]);

  // Recompute page data whenever pagination or filtered full list changes
  useEffect(() => {
    const paged = computePagedRows(filteredAllChallenges, currentPage, pageSize);
    setDailyChallenges(paged);
  }, [filteredAllChallenges, currentPage, pageSize, computePagedRows]);

  // Keep totalItems in sync with filtered total and correct currentPage bounds
  useEffect(() => {
    const total = filteredAllChallenges.length;
    setTotalItems(total);
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (total > 0 && currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredAllChallenges, pageSize, currentPage]);

  // Debounce search text - reduced delay for better responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trim spaces at the beginning and end before setting debounced value
      // This allows users to type spaces normally, but trims when they stop typing
      const trimmedValue = searchText.trim();
      setSearchDebounce(trimmedValue);
      setCurrentPage(1);
    }, 400); // Reduced from 500ms to 300ms for better responsiveness

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearch = (value) => {
    // Don't trim here - allow users to type spaces normally
    // Trimming will happen in the debounce useEffect
    setSearchText(value);
    setCurrentPage(1);
  };

  // Removed filter handlers per request

  const handleViewClick = async (challenge) => {
    // If status is PENDING and submissionChallengeId exists, call API to mark as started
    if (challenge.submissionStatus === 'PENDING' && challenge.submissionChallengeId) {
      try {
        await dailyChallengeApiBackend.startSubmission(challenge.submissionChallengeId);
        // Success - continue with navigation
      } catch (error) {
        console.error('Error starting submission:', error);
        const errorMessage = getErrorMessage(error, t('dailyChallenge.errorStartingChallenge', 'Failed to start challenge. Please try again.'));
        spaceToast.error(errorMessage);
        return; // Don't navigate if API call fails
      }
    }

    // Resolve classId for return navigation
    const resolvedClassId = classId || location.state?.classId;

    // Navigate to challenge take view (student/test_taker view)
    navigate(`${routePrefix}/daily-challenges/take/${challenge.id}`, {
      state: {
        challengeId: challenge.id,
        challengeName: challenge.title,
        lessonName: challenge.lessonName,
        challengeType: challenge.type, // Pass challenge type (GV, RE, LI, WR, SP)
        type: challenge.type, // Also pass as 'type' for compatibility
        submissionChallengeId: challenge.submissionChallengeId, // Pass submissionChallengeId for saving/submitting
        submissionStatus: challenge.submissionStatus, // Pass submissionStatus to determine if viewing submitted answer
        hasAntiCheat: challenge.hasAntiCheat,
        shuffleQuestion: challenge.shuffleQuestion,
        translateOnScreen: challenge.translateOnScreen,
        classId: resolvedClassId, // For redirecting back to the class DC list
      }
    });
  };

  const handleViewAnswer = (challenge) => {
    // Navigate to challenge take view in view-only mode to see submitted answer
    const resolvedClassId = classId || location.state?.classId;
    
    navigate(`${routePrefix}/daily-challenges/take/${challenge.id}`, {
      state: {
        challengeId: challenge.id,
        challengeName: challenge.title,
        lessonName: challenge.lessonName,
        challengeType: challenge.type,
        type: challenge.type,
        submissionChallengeId: challenge.submissionChallengeId,
        submissionStatus: challenge.submissionStatus, // SUBMITTED status will make it view-only
        hasAntiCheat: challenge.hasAntiCheat,
        shuffleQuestion: challenge.shuffleQuestion,
        translateOnScreen: challenge.translateOnScreen,
        classId: resolvedClassId,
        viewAnswer: true, // Flag to indicate viewing submitted answer
      }
    });
  };

  const handleViewResult = (challenge) => {
      // Navigate to submission detail view (same interface as teacher but for student)
      // Need challengeId and submissionId (submissionChallengeId)
      const challengeId = challenge.id;
      const submissionId = challenge.submissionChallengeId;
      
      if (!submissionId) {
        spaceToast.error(t('dailyChallenge.errorNoSubmission', 'No submission found for this challenge.'));
        return;
      }
      
      // Get classId from params or location state
      const resolvedClassId = classId || location.state?.classId;
      
      navigate(`${routePrefix}/daily-challenges/detail/${challengeId}/submissions/${submissionId}`, {
      state: {
        challengeId: challenge.id,
        submissionChallengeId: challenge.submissionChallengeId,
        challengeName: challenge.title,
        lessonName: challenge.lessonName,
        challengeType: challenge.type,
        type: challenge.type,
        viewResult: true, // Flag to indicate viewing result
        className: challenge.lessonName, // For header display
        studentName: null, // Student viewing their own submission
        classId: resolvedClassId, // Pass classId for back navigation
      }
    });
  };

  const columns = [
    {
      title: t('dailyChallenge.no'),
      key: 'stt',
      width: 70,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t('dailyChallenge.lesson'),
      dataIndex: 'lessonName',
      key: 'lessonName',
      width: 220,
      align: 'left',
      render: (text, record) => {
        if (record.isFirstChallengeInLesson) {
          return {
            children: (
              <div 
                className="lesson-cell-container"
                style={{
                  fontSize: '18px',
                  color: '#333',
                  padding: '8px 12px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderRadius: '4px',
                  textAlign: 'left',
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%'
                }}
              >
                <span 
                  className="lesson-text" 
                  style={{ 
                    display: 'block', 
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflow: 'visible',
                    maxWidth: '100%'
                  }}
                >
                  {text}
                </span>
              </div>
            ),
            props: {
              rowSpan: record.rowSpan,
            },
          };
        }
        return {
          children: null,
          props: {
            rowSpan: 0,
          },
        };
      },
    },
    {
      title: t('dailyChallenge.challengeTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 300,
      align: 'left',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => {
        if (record.isEmptyLesson) {
          return <span style={{ color: '#999' }}></span>;
        }
        return (
          <Tooltip placement="topLeft" title={text}>
            <span style={{ 
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}>
              {text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('dailyChallenge.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      align: 'center',
      render: (type, record) => {
        if (record.isEmptyLesson) {
          return <span style={{ color: '#999' }}></span>;
        }
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '17px',
            color: '#000000'
          }}>
            {getTypeLabelByCode(type)}
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      align: 'center',
      render: (endDate) => {
        if (!endDate) return '';
        const date = new Date(endDate);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        });
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#1f2937' }}>{timeStr}</span>
            <span style={{ fontSize: '14px', color: '#888', marginTop: 2 }}>{dateStr}</span>
          </div>
        );
      },
    },
    {
      title: t('dailyChallenge.duration', 'Duration'),
      dataIndex: 'durationMinutes',
      key: 'duration',
      width: 180,
      align: 'center',
      ellipsis: false,
      render: (durationMinutes, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return <span></span>;
        }

        if (!durationMinutes || durationMinutes === 0) {
          return (
            <span style={{
              fontSize: '16px',
              color: '#999',
            }}>
              {t('common.notSet', 'Not set')}
            </span>
          );
        }

        return (
          <span style={{
            fontSize: '16px',
            color: '#333',
            fontWeight: 500,
          }}>
            {durationMinutes} {t('dailyChallenge.minutes', 'minutes')}
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.totalScore', 'Total Score'),
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 120,
      align: 'center',
      render: (totalScore, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return <span></span>;
        }

        // Check if endDate has passed - only show score after endDate
        const now = new Date();
        const endDate = record.endDate ? new Date(record.endDate) : null;
        const hasEndDatePassed = endDate ? now >= endDate : false;

        // If endDate hasn't passed yet, don't show score
        if (!hasEndDatePassed) {
          return (
            <span style={{
              fontSize: '16px',
              color: '#999',
            }}>
             Not available
            </span>
          );
        }

        const computedScore = totalScore;

        if (computedScore === null || computedScore === undefined) {
          return (
            <span style={{
              fontSize: '16px',
              color: '#999',
            }}>
              {t('dailyChallenge.notAttempted', 'Not yet')}
            </span>
          );
        }

        // Color based on score (scale 0-10)
        const getScoreColor = (score) => {
          if (score >= 8) return 'rgb(20, 150, 26)'; // Green for good score (>= 8)
          if (score >= 5) return 'rgb(223, 175, 56)'; // Yellow for average score (5-7.9)
          return 'rgb(255, 77, 79)'; // Red for low score (< 5)
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
            <span style={{
              fontSize: '18px',
              color: getScoreColor(Number(computedScore)),
              fontWeight: 600,
            }}>
              {(typeof computedScore === 'number' ? computedScore.toFixed(1) : (parseFloat(computedScore)?.toFixed ? parseFloat(computedScore).toFixed(1) : String(computedScore)))}
              /10
            </span>
          </div>
        );
      },
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => {
        // Don't show actions for empty lessons
        if (record.isEmptyLesson) {
          return <span style={{ color: '#999' }}></span>;
        }
        
        const isLate = record.late === true;
        
        const renderStartLikeButton = (label, icon = <PlayCircleOutlined />) => {
          // Use different color for "Do challenge" button
          const isDoChallenge = label === 'Do challenge';
          const buttonColor = isDoChallenge ? 'rgb(244,127,127)' : 'rgb(244,203,127)';
          const hoverColor = isDoChallenge ? 'rgb(224,107,107)' : 'rgb(224,183,107)';
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                type="primary"
                icon={icon}
                onClick={() => handleViewClick(record)}
                className="action-btn-start"
                style={{
                  borderRadius: '6px',
                  fontWeight: 500,
                  height: '36px',
                  padding: '0 16px',
                  fontSize: '14px',
                  background: buttonColor,
                  borderColor: buttonColor,
                  color: '#000',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = buttonColor;
                }}
              >
                {label}
              </Button>
              {isLate && (
                <span style={{ 
                  marginTop: '4px',
                  fontSize: '12px', 
                  color: 'rgb(255, 77, 79)',
                  fontWeight: 600,
                }}>
                  {t('dailyChallenge.late', 'Late')}
                </span>
              )}
            </div>
          );
        };

        const renderViewResultButton = (label) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewResult(record)}
              className="action-btn-view-result"
              style={{
                borderRadius: '6px',
                fontWeight: 500,
                height: '36px',
                padding: '0 16px',
                fontSize: '14px',
                background: 'rgb(157,207,242)',
                borderColor: 'rgb(157,207,242)',
                color: '#000',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgb(137,187,222)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgb(157,207,242)';
              }}
            >
              {label}
            </Button>
            {isLate && (
              <span style={{ 
                marginTop: '4px',
                fontSize: '12px', 
                color: 'rgb(255, 77, 79)',
                fontWeight: 600,
              }}>
                {t('dailyChallenge.late', 'Late')}
              </span>
            )}
          </div>
        );

        const renderViewAnswerButton = (label) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewAnswer(record)}
              className="action-btn-view-answer"
              style={{
                borderRadius: '6px',
                fontWeight: 500,
                height: '36px',
                padding: '0 16px',
                fontSize: '14px',
                background: 'rgb(157,207,242)',
                borderColor: 'rgb(157,207,242)',
                color: '#000',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgb(137,187,222)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgb(157,207,242)';
              }}
            >
              {label}
            </Button>
            {isLate && (
              <span style={{ 
                marginTop: '4px',
                fontSize: '12px', 
                color: 'rgb(255, 77, 79)',
                fontWeight: 600,
              }}>
                {t('dailyChallenge.late', 'Late')}
              </span>
            )}
          </div>
        );
        
        const effectiveStatus = (record.submissionStatus || 'PENDING').toUpperCase();

        return (
          <Space size="small">
            {effectiveStatus === 'PENDING' && renderStartLikeButton('Do challenge')}
            {effectiveStatus === 'DRAFT' && renderStartLikeButton('Edit answer', <EditOutlined />)}
            {effectiveStatus === 'SUBMITTED' && renderViewAnswerButton('View answer')}
            {effectiveStatus === 'GRADED' && renderViewResultButton('View result')}
          </Space>
        );
      },
    },
  ];

  return (
    <ThemedLayout>
      <CustomCursor />
      <style>
        {`
          .daily-challenge-list-wrapper .lesson-cell-container:hover .lesson-text {
            opacity: 1 !important;
          }
        `}
      </style>
      <div className="daily-challenge-list-wrapper">
        {/* Page Title */}
        <div className="page-title-container" style={{ padding: '24px 24px 0 24px' }}>
          <Typography.Title 
            level={1} 
            className="page-title"
            style={{
              fontSize: '32px',
              fontWeight: '600',
              margin: '0 0 24px 0',
              color: theme === 'sun' ? '#1e40af' : '#fff'
            }}
          >
            {t('dailyChallenge.dailyChallengeManagement')} <span className="student-count" style={{
              fontSize: '24px',
              fontWeight: '500',
            }}>({totalItems})</span>
          </Typography.Title>
        </div>

        {/* Search and Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', padding: '0 24px' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className={`search-input ${theme}-search-input`}
            style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
            placeholder={t('common.search') || 'Search...'}
          />
          {/* Filter removed as requested */}
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{ paddingBottom: '24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingChallenges')}>
            <Table
              columns={columns}
              dataSource={dailyChallenges}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalItems,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                  }
                },
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} ${t('dailyChallenge.of')} ${total} ${t('dailyChallenge.challenges')}`,
                className: `${theme}-pagination`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 800 }}
              className={`daily-challenge-table ${theme}-daily-challenge-table`}
            />
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default StudentDailyChallengeList;
