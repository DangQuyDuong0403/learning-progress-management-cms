import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@ant-design/icons";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../component/spinner/LoadingWithEffect";
import "../ManagementTeacher/dailyChallenge/DailyChallengeList.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import { dailyChallengeApi } from "../../../apis/apis";
import dailyChallengeApiBackend from "../../../apis/backend/dailyChallengeManagement";
import { spaceToast } from "../../../component/SpaceToastify";
import { useSelector } from "react-redux";

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
  
  const [loading, setLoading] = useState(false);
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
        setAllChallenges([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, location.state?.classId, searchDebounce]);

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
    return allChallenges.filter((challenge) => {
      // Empty lessons (lessons without challenges) should always be shown
      if (challenge.isEmptyLesson) {
        if (searchDebounce) {
          const matchesSearch = challenge.lessonName?.toLowerCase().includes(searchDebounce.toLowerCase());
          return matchesSearch;
        }
        return true;
      }

      // Only apply search filter now (type filter removed)
      const matchesSearch = searchDebounce === "" ||
        challenge.title?.toLowerCase().includes(searchDebounce.toLowerCase()) ||
        challenge.lessonName?.toLowerCase().includes(searchDebounce.toLowerCase());
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

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchText);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearch = (value) => {
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
        spaceToast.error(t('dailyChallenge.errorStartingChallenge', 'Failed to start challenge. Please try again.'));
        return; // Don't navigate if API call fails
      }
    }

    // Navigate to challenge take view (student view)
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
            fontSize: '18px',
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
            <span style={{ fontSize: '14px' }}>{dateStr}</span>
            <span style={{ fontSize: '11px', color: '#888', marginTop: 2 }}>{timeStr}</span>
          </div>
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
              fontStyle: 'italic',
            }}>
             Not available yet
            </span>
          );
        }

        const computedScore = totalScore;

        if (computedScore === null || computedScore === undefined) {
          return (
            <span style={{
              fontSize: '16px',
              color: '#999',
              fontStyle: 'italic',
            }}>
              {t('dailyChallenge.notAttempted', 'Not attempted')}
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
            <span style={{ fontSize: '12px', color: '#888', marginTop: 2 }}>
              {(typeof record.totalWeight === 'number' ? record.totalWeight.toFixed(2) : (record.totalWeight ?? '-'))}
              /{record.maxPossibleWeight ?? '-'}
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
        
        const status = record.submissionStatus;
        const isLate = record.late === true;
        
        const renderStartLikeButton = (label) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleViewClick(record)}
              className="action-btn-start"
              style={{
                borderRadius: '6px',
                fontWeight: 500,
                height: '36px',
                padding: '0 16px',
                fontSize: '14px',
                background: 'rgb(244,203,127)',
                borderColor: 'rgb(244,203,127)',
                color: '#000',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgb(224,183,107)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgb(244,203,127)';
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
        
        return (
          <Space size="small">
            {status === 'PENDING' && renderStartLikeButton('Do challenge')}
            {status === 'DRAFT' && renderStartLikeButton('Edit answer')}
            {status === 'SUBMITTED' && renderStartLikeButton('View answer')}
            {status === 'GRADED' && renderViewResultButton('View result')}
            {!status && renderStartLikeButton(t('dailyChallenge.startChallenge', 'Start Challenge'))}
          </Space>
        );
      },
    },
  ];

  return (
    <ThemedLayout>
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
