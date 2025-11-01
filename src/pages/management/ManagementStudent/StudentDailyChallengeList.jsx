import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../component/spinner/LoadingWithEffect";
import "../ManagementTeacher/dailyChallenge/DailyChallengeList.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";

// Fake data generator
const generateFakeData = () => {
  const lessons = [
    { id: 1, name: "Lesson 1: Introduction to English" },
    { id: 2, name: "Lesson 2: Basic Grammar" },
    { id: 3, name: "Lesson 3: Vocabulary Building" },
    { id: 4, name: "Lesson 4: Reading Comprehension" },
    { id: 5, name: "Lesson 5: Speaking Practice" },
  ];

  const types = ["GV", "RE", "LI", "WR", "SP"];
  // Student view only shows PUBLISHED challenges
  const status = "PUBLISHED";
  
  const challenges = [];
  let challengeId = 1;

  // First, create 5 challenges with each type (GV, RE, LI, WR, SP)
  const firstFiveTypes = ["GV", "RE", "LI", "WR", "SP"];
  const firstLesson = lessons[0];
  
  for (let i = 0; i < 5; i++) {
    const type = firstFiveTypes[i];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);

    // First 5 challenges should have no score (not attempted) - for testing
    const totalScore = null; // All first 5 challenges are not attempted yet

    challenges.push({
      id: challengeId++,
      title: `${type} Challenge ${i + 1} - ${firstLesson.name.split(':')[0]}`,
      type: type,
      status: status, // Always PUBLISHED for student view
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      lessonId: firstLesson.id,
      lessonName: firstLesson.name,
      lessonOrder: 1,
      isFirstChallengeInLesson: i === 0,
      totalChallengesInLesson: 5,
      rowSpan: i === 0 ? 5 : 0,
      description: `This is a ${type} challenge for ${firstLesson.name}`,
      timeLimit: 30 + Math.floor(Math.random() * 30),
      totalQuestions: 10 + Math.floor(Math.random() * 20),
      createdAt: startDate.toISOString().split('T')[0],
      hasAntiCheat: Math.random() > 0.5,
      shuffleQuestion: Math.random() > 0.5,
      translateOnScreen: Math.random() > 0.5,
      challengeMode: Math.random() > 0.5 ? 'exam' : 'normal',
        totalScore: totalScore, // Total score (0-10) or null if not attempted
      });
    }

  // Then, continue generating random challenges for other lessons
  lessons.forEach((lesson, lessonIndex) => {
    if (lessonIndex === 0) return; // Skip first lesson as we already handled it
    
    let challengesPerLesson, lessonChallenges;
    
    // Special handling for lesson 2 (lessonIndex === 1): 5 challenges with all 5 types and all have scores
    if (lessonIndex === 1) {
      challengesPerLesson = 5;
      lessonChallenges = [];
      const allTypes = ["GV", "RE", "LI", "WR", "SP"];
      
      for (let i = 0; i < 5; i++) {
        const type = allTypes[i];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);

        // All lesson 2 challenges have scores (completed)
        const totalScore = parseFloat((Math.random() * 10).toFixed(1)); // Random score between 0-10

        lessonChallenges.push({
          id: challengeId++,
          title: `${type} Challenge ${i + 1} - ${lesson.name.split(':')[0]}`,
          type: type,
          status: status,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          lessonId: lesson.id,
          lessonName: lesson.name,
          lessonOrder: lessonIndex + 1,
          isFirstChallengeInLesson: i === 0,
          totalChallengesInLesson: 5,
          rowSpan: i === 0 ? 5 : 0,
          description: `This is a ${type} challenge for ${lesson.name}`,
          timeLimit: 30 + Math.floor(Math.random() * 30),
          totalQuestions: 10 + Math.floor(Math.random() * 20),
          createdAt: startDate.toISOString().split('T')[0],
          hasAntiCheat: Math.random() > 0.5,
          shuffleQuestion: Math.random() > 0.5,
          translateOnScreen: Math.random() > 0.5,
          challengeMode: Math.random() > 0.5 ? 'exam' : 'normal',
          totalScore: totalScore, // All have scores
        });
      }
    } else {
      // Other lessons: random 2-4 challenges
      challengesPerLesson = Math.floor(Math.random() * 3) + 2;
      lessonChallenges = [];
      
      for (let i = 0; i < challengesPerLesson; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);

        // Random score: null (not attempted), or a score between 0-10
        const totalScore = Math.random() > 0.3 
          ? parseFloat((Math.random() * 10).toFixed(1)) // 70% chance of having a score (0-10, 1 decimal)
          : null; // 30% chance of not attempted yet

        lessonChallenges.push({
          id: challengeId++,
          title: `${type} Challenge ${i + 1} - ${lesson.name.split(':')[0]}`,
          type: type,
          status: status, // Always PUBLISHED for student view
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          lessonId: lesson.id,
          lessonName: lesson.name,
          lessonOrder: lessonIndex + 1,
          isFirstChallengeInLesson: i === 0,
          totalChallengesInLesson: challengesPerLesson,
          rowSpan: i === 0 ? challengesPerLesson : 0,
          description: `This is a ${type} challenge for ${lesson.name}`,
          timeLimit: 30 + Math.floor(Math.random() * 30),
          totalQuestions: 10 + Math.floor(Math.random() * 20),
          createdAt: startDate.toISOString().split('T')[0],
          hasAntiCheat: Math.random() > 0.5,
          shuffleQuestion: Math.random() > 0.5,
          translateOnScreen: Math.random() > 0.5,
          challengeMode: Math.random() > 0.5 ? 'exam' : 'normal',
          totalScore: totalScore, // Total score (0-10) or null if not attempted
        });
      }
    }
    
    challenges.push(...lessonChallenges);
  });

  return challenges;
};

const StudentDailyChallengeList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [allChallenges, setAllChallenges] = useState([]);
  const [searchDebounce, setSearchDebounce] = useState("");

  // AccountList-style filter dropdown state and refs
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedTypes: [],
  });
  const filterContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdown.visible && filterContainerRef.current) {
        if (!filterContainerRef.current.contains(event.target)) {
          setFilterDropdown((prev) => ({ ...prev, visible: false }));
        }
      }
    };

    if (filterDropdown.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdown.visible]);

  // Filter option lists
  const typeOptions = ["GV", "RE", "WR", "LI", "SP"];

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

  // Load fake data on mount
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const fakeData = generateFakeData();
      setAllChallenges(fakeData);
      setTotalItems(fakeData.length);
      setLoading(false);
    }, 500);
  }, []);

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
      const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
      const matchesSearch = searchDebounce === "" || 
        challenge.title?.toLowerCase().includes(searchDebounce.toLowerCase()) ||
        challenge.lessonName?.toLowerCase().includes(searchDebounce.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allChallenges, typeFilter, searchDebounce]);

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

  // Filter dropdown handlers
  const handleFilterToggle = () => {
    setFilterDropdown((prev) => ({ ...prev, visible: !prev.visible }));
  };

  const handleFilterSubmit = () => {
    setTypeFilter(filterDropdown.selectedTypes);
    setCurrentPage(1);
    setFilterDropdown((prev) => ({ ...prev, visible: false }));
  };

  const handleFilterReset = () => {
    setFilterDropdown((prev) => ({ ...prev, selectedTypes: [] }));
    setTypeFilter([]);
    setCurrentPage(1);
  };

  const handleViewClick = (challenge) => {
    // Navigate to challenge take view (student view)
    navigate(`/student/daily-challenges/take/${challenge.id}`, {
      state: {
        challengeId: challenge.id,
        challengeName: challenge.title,
        lessonName: challenge.lessonName,
        challengeType: challenge.type, // Pass challenge type (GV, RE, LI, WR, SP)
        type: challenge.type, // Also pass as 'type' for compatibility
      }
    });
  };

  const handleViewResult = (challenge) => {
      // Navigate to result view
      navigate(`/student/daily-challenges/result/${challenge.id}`, {
      state: {
        challengeId: challenge.id,
        challengeName: challenge.title,
        lessonName: challenge.lessonName,
        challengeType: challenge.type,
        type: challenge.type,
        viewResult: true, // Flag to indicate viewing result
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
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
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
      render: (text) => {
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
      render: (type) => {
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
      title: t('dailyChallenge.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      align: 'center',
      render: (startDate) => {
        return startDate ? new Date(startDate).toLocaleDateString() : '-';
      },
    },
    {
      title: t('dailyChallenge.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      align: 'center',
      render: (endDate) => {
        return endDate ? new Date(endDate).toLocaleDateString() : '-';
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

        if (totalScore === null || totalScore === undefined) {
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
          <span style={{
            fontSize: '18px',
            color: getScoreColor(totalScore),
            fontWeight: 600,
          }}>
            {totalScore}/10
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => {
        // Check if challenge has been attempted (has score)
        const hasScore = record.totalScore !== null && record.totalScore !== undefined;
        
        return (
          <Space size="small">
            {hasScore ? (
              // Show "View Result" button if challenge has been completed
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
                  background: theme === 'sun' 
                    ? 'rgb(113, 179, 253)' 
                    : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                  borderColor: theme === 'sun' 
                    ? 'rgb(113, 179, 253)' 
                    : '#7228d9',
                  color: '#000',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  if (theme === 'sun') {
                    e.currentTarget.style.background = 'rgb(93, 159, 233)';
                  } else {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #9C8FB0 19%, #9588AB 64%, #726795 75%, #9A95B0 97%, #5D4F7F 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme === 'sun') {
                    e.currentTarget.style.background = 'rgb(113, 179, 253)';
                  } else {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)';
                  }
                }}
              >
                View Result
              </Button>
            ) : (
              // Show "Start Challenge" button if challenge hasn't been attempted
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
                  background: theme === 'sun' 
                    ? 'rgb(255, 165, 0)' 
                    : 'linear-gradient(135deg, #FF8C42 19%, #FF7F50 64%, #FF6B35 75%, #FF8C69 97%, #FF6347 100%)',
                  borderColor: theme === 'sun' 
                    ? 'rgb(255, 165, 0)' 
                    : '#FF6347',
                  color: '#000',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  if (theme === 'sun') {
                    e.currentTarget.style.background = 'rgb(255, 140, 0)';
                  } else {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF7A32 19%, #FF6F40 64%, #FF5B25 75%, #FF7C59 97%, #FF5343 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme === 'sun') {
                    e.currentTarget.style.background = 'rgb(255, 165, 0)';
                  } else {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF8C42 19%, #FF7F50 64%, #FF6B35 75%, #FF8C69 97%, #FF6347 100%)';
                  }
                }}
              >
                {t('dailyChallenge.startChallenge', 'Start Challenge')}
              </Button>
            )}
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
          <div ref={filterContainerRef} style={{ position: 'relative' }}>
            <Button 
              icon={<FilterOutlined />}
              onClick={handleFilterToggle}
              className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${typeFilter.length > 0 ? 'has-filters' : ''}`}
            >
              {t('common.filter') || 'Filter'}
            </Button>
            
            {/* Filter Dropdown Panel */}
            {filterDropdown.visible && (
              <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                <div style={{ padding: '20px' }}>
                  {/* Type Filter */}
                  <div style={{ marginBottom: '24px' }}>
                    <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {t('dailyChallenge.type')}
                    </Typography.Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {typeOptions.map((opt) => (
                        <Button
                          key={opt}
                          onClick={() => {
                            const newTypes = filterDropdown.selectedTypes.includes(opt)
                              ? filterDropdown.selectedTypes.filter((t) => t !== opt)
                              : [...filterDropdown.selectedTypes, opt];
                            setFilterDropdown((prev) => ({ ...prev, selectedTypes: newTypes }));
                          }}
                          className={`filter-option ${filterDropdown.selectedTypes.includes(opt) ? 'selected' : ''}`}
                        >
                          {getTypeLabelByCode(opt)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Button
                      onClick={handleFilterReset}
                      className="filter-reset-button"
                    >
                      {t('common.reset')}
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleFilterSubmit}
                      className="filter-submit-button"
                    >
                      {t('common.viewResults')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
