import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Statistic, Button, List } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import "./DailyChallengePerformance.css";
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
    scoreDistribution: []
  });
  const [studentScores, setStudentScores] = useState([]);

  const mockStudentScores = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', score: 9.5, avatar: null, completionTime: 15 },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', score: 9.0, avatar: null, completionTime: 18 },
    { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', score: 8.5, avatar: null, completionTime: 20 },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', score: 8.2, avatar: null, completionTime: 22 },
    { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', score: 8.0, avatar: null, completionTime: 25 },
    { id: 6, name: 'Đỗ Thị F', email: 'dothif@example.com', score: 7.5, avatar: null, completionTime: 28 },
    { id: 7, name: 'Vũ Văn G', email: 'vuvang@example.com', score: 7.2, avatar: null, completionTime: 30 },
    { id: 8, name: 'Bùi Thị H', email: 'buithih@example.com', score: 7.0, avatar: null, completionTime: 32 },
    { id: 9, name: 'Đặng Văn I', email: 'dangvani@example.com', score: 6.5, avatar: null, completionTime: 35 },
    { id: 10, name: 'Ngô Thị K', email: 'ngothik@example.com', score: 5.0, avatar: null, completionTime: 40 },
  ];

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

  // Calculate score distribution by range (0-1, 1-2, 2-3, ..., 9-10)
  const calculateScoreDistribution = (scores) => {
    // Create distribution for score ranges
    const ranges = [
      { range: '0-1', min: 0, max: 1, studentCount: 0 },
      { range: '1-2', min: 1, max: 2, studentCount: 0 },
      { range: '2-3', min: 2, max: 3, studentCount: 0 },
      { range: '3-4', min: 3, max: 4, studentCount: 0 },
      { range: '4-5', min: 4, max: 5, studentCount: 0 },
      { range: '5-6', min: 5, max: 6, studentCount: 0 },
      { range: '6-7', min: 6, max: 7, studentCount: 0 },
      { range: '7-8', min: 7, max: 8, studentCount: 0 },
      { range: '8-9', min: 8, max: 9, studentCount: 0 },
      { range: '9-10', min: 9, max: 10, studentCount: 0 },
    ];

    // Count students for each range
    scores.forEach(student => {
      const score = student.score;
      for (let i = 0; i < ranges.length; i++) {
        // For the last range (9-10), include 10
        if (i === ranges.length - 1) {
          if (score >= ranges[i].min && score <= ranges[i].max) {
            ranges[i].studentCount++;
            break;
          }
        } else {
          // For other ranges, include min but exclude max
          if (score >= ranges[i].min && score < ranges[i].max) {
            ranges[i].studentCount++;
            break;
          }
        }
      }
    });

    return ranges;
  };

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setStudentScores(mockStudentScores);

        // Calculate statistics
        const scores = mockStudentScores.map(s => s.score);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);
        const scoreDistribution = calculateScoreDistribution(mockStudentScores);

        setPerformanceData({
          average: parseFloat(average.toFixed(1)),
          highest,
          lowest,
          scoreDistribution
        });

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setLoading(false);
    }
  };

  // Sort students by score (highest to lowest)
  const getSortedStudents = () => {
    return [...studentScores].sort((a, b) => b.score - a.score);
  };

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
    fetchPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: theme === 'sun' ? '#fff' : '#2d1b69',
          border: `1px solid ${theme === 'sun' ? '#d9d9d9' : '#4dd0ff'}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ 
            margin: 0, 
            fontWeight: 600, 
            marginBottom: '4px',
            color: theme === 'sun' ? '#000' : '#fff'
          }}>
            {t('dailyChallenge.scoreRange')}: {data.range}
          </p>
          <p style={{ 
            margin: 0, 
            color: theme === 'sun' ? '#666' : '#d2cbf2'
          }}>
            {t('class.studentCount')}: {data.studentCount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ThemedLayout>
      <div className="daily-challenge-performance-wrapper">
        {/* Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          {userRole !== 'teaching_assistant' && (
            <Button
              className={`tab-button ${theme}-tab-button`}
              onClick={() => navigate(`/teacher/daily-challenges/detail/${id}/content`, {
                state: challengeInfo
              })}
            >
              {t('dailyChallenge.content')}
            </Button>
          )}
          <Button
            className={`tab-button ${theme}-tab-button`}
            onClick={() => navigate(`/teacher/daily-challenges/detail/${id}/submissions`, {
              state: challengeInfo
            })}
          >
            {t('dailyChallenge.submission')}
          </Button>
        </div>

        {/* Performance Content */}
        <div className="performance-content" style={{ padding: '0 24px 24px 24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingPerformance')}>
            <Row gutter={24} style={{ alignItems: 'stretch' }}>
              {/* Left Section - Student List (1/3) */}
              <Col xs={24} lg={8} style={{ display: 'flex' }}>
                <Card 
                  className={`student-list-card ${theme}-student-list-card`}
                  style={{ 
                    marginBottom: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1
                  }}
                >
                  <h2 style={{ 
                    margin: 0, 
                    marginBottom: '16px', 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: theme === 'sun' ? '#000' : '#000',
                    textAlign: 'center'
                  }}>
                    {t('dailyChallenge.topRank')}
                  </h2>
                  
                  <div style={{ 
                    flex: 1, 
                    overflow: 'auto',
                    maxHeight: '480px' // Chiều cao cho khoảng 6 học sinh (mỗi item ~80px)
                  }}>
                    <List
                      dataSource={getSortedStudents()}
                      renderItem={(student, index) => {
                        const isTopScore = index === 0;
                        
                        return (
                          <List.Item
                            style={{
                              padding: '12px 16px',
                              borderBottom: theme === 'sun' ? '1px solid #f0f0f0' : '1px solid rgba(58, 52, 88, 0.3)',
                              background: isTopScore 
                                ? (theme === 'sun' ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' : 'linear-gradient(135deg, #5a4a8f 0%, #6b5aa0 100%)')
                                : 'transparent',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              border: isTopScore ? (theme === 'sun' ? '2px solid #1890ff' : '2px solid #8b7dd8') : 'none',
                              borderRadius: isTopScore ? '8px' : '0',
                              boxShadow: isTopScore ? (theme === 'sun' ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 4px 12px rgba(139, 125, 216, 0.3)') : 'none'
                            }}
                            className={`student-list-item ${theme}-student-list-item`}
                          >
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              flex: 1
                            }}>
                              {isTopScore && (
                                <TrophyOutlined 
                                  style={{ 
                                    color: theme === 'sun' ? '#1890ff' : '#ffc53d',
                                    fontSize: '20px',
                                    animation: 'pulse 2s infinite'
                                  }} 
                                />
                              )}
                              <span style={{ 
                                fontWeight: isTopScore ? 700 : 600,
                                fontSize: isTopScore ? '17px' : '16px',
                                color: isTopScore 
                                  ? (theme === 'sun' ? '#1890ff' : '#ffc53d')
                                  : (theme === 'sun' ? '#000' : '#000')
                              }}>
                                {student.name}
                              </span>
                              <span style={{ 
                                fontSize: '15px',
                                color: theme === 'sun' ? '#666' : '#999',
                                fontWeight: 500,
                                marginLeft: 'auto',
                                marginRight: '16px'
                              }}>
                                {student.completionTime} {t('dailyChallenge.minutes')}
                              </span>
                            </div>
                            <span style={{ 
                              fontWeight: isTopScore ? 800 : 700,
                              fontSize: isTopScore ? '20px' : '18px',
                              color: isTopScore
                                ? (theme === 'sun' ? '#1890ff' : '#ffc53d')
                                : student.score >= 8 
                                ? '#52c41a' 
                                : student.score >= 6 
                                ? '#faad14' 
                                : '#ff4d4f'
                            }}>
                              {student.score}/10
                            </span>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                </Card>
              </Col>

              {/* Right Section - Performance Stats & Chart (2/3) */}
              <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Performance Statistics */}
                <Card className={`performance-card ${theme}-performance-card`} style={{ marginBottom: '24px', flexShrink: 0 }}>
                  <h2 style={{ 
                    margin: 0, 
                    marginBottom: '24px', 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#000',
                    textAlign: 'center'
                  }}>
                    {t('dailyChallenge.performance')}
                  </h2>

                  <Row gutter={[24, 24]}>
                    <Col xs={24} sm={8}>
                      <Card 
                        className={`stat-card ${theme}-stat-card`}
                        style={{ background: theme === 'sun' ? '#e6f5ff' : '#4b4177' }}
                      >
                        <Statistic
                          title={<span style={{ color: theme === 'sun' ? '#000' : '#fff' }}>{t('dailyChallenge.averageScore')}</span>}
                          value={performanceData.average}
                          suffix={<span style={{ color: theme === 'sun' ? '#000' : '#fff' }}>/10</span>}
                          valueStyle={{ color: theme === 'sun' ? '#000' : '#fff', fontSize: '24px', fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card 
                        className={`stat-card ${theme}-stat-card`}
                        style={{ background: theme === 'sun' ? '#e6f5ff' : '#4b4177' }}
                      >
                        <Statistic
                          title={<span style={{ color: theme === 'sun' ? '#000' : '#fff' }}>{t('dailyChallenge.highestScore')}</span>}
                          value={performanceData.highest}
                          suffix={<span style={{ color: theme === 'sun' ? '#000' : '#fff' }}>/10</span>}
                          valueStyle={{ color: theme === 'sun' ? '#000' : '#fff', fontSize: '24px', fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card 
                        className={`stat-card ${theme}-stat-card`}
                        style={{ background: theme === 'sun' ? '#e6f5ff' : '#4b4177' }}
                      >
                        <Statistic
                          title={<span style={{ color: theme === 'sun' ? '#000' : '#fff' }}>{t('dailyChallenge.lowestScore')}</span>}
                          value={performanceData.lowest}
                          suffix={<span style={{ color: theme === 'sun' ? '#000' : '#fff' }}>/10</span>}
                          valueStyle={{ color: theme === 'sun' ? '#000' : '#fff', fontSize: '24px', fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </Card>

                {/* Score Distribution Chart */}
                <Card className={`chart-card ${theme}-chart-card`} style={{ flex: 1, marginBottom: '24px' }}>
                  <h2 style={{ 
                    margin: 0, 
                    marginBottom: '24px', 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: theme === 'sun' ? '#000' : '#000',
                    textAlign: 'center'
                  }}>
                    {t('dailyChallenge.scoreDistribution')}
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={performanceData.scoreDistribution}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis 
                        dataKey="range" 
                        stroke={theme === 'sun' ? '#000' : '#000'}
                        style={{ fontSize: '14px' }}
                      />
                      <YAxis 
                        stroke={theme === 'sun' ? '#000' : '#000'}
                        style={{ fontSize: '14px' }}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="studentCount" 
                        fill={theme === 'sun' ? '#1890ff' : '#8b7dd8'}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
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

