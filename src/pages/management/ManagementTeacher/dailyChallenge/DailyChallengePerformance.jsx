import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Select, Statistic, Button, List } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { Line } from '@ant-design/charts';
import "./DailyChallengePerformance.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";

const DailyChallengePerformance = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge Management / Performance');
  
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('15days');
  const [studentFilter, setStudentFilter] = useState('all'); // all, highest, lowest
  const [performanceData, setPerformanceData] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    trend: []
  });
  const [studentScores, setStudentScores] = useState([]);

  // Mock data - thay thế bằng API call thực tế
  const mockPerformanceData = {
    average: 7.5,
    highest: 9.5,
    lowest: 5.0,
    trend: [
      { date: '2024-01-01', score: 6.5 },
      { date: '2024-01-02', score: 7.0 },
      { date: '2024-01-03', score: 7.5 },
      { date: '2024-01-04', score: 6.8 },
      { date: '2024-01-05', score: 8.0 },
      { date: '2024-01-06', score: 7.2 },
      { date: '2024-01-07', score: 8.5 },
      { date: '2024-01-08', score: 7.8 },
      { date: '2024-01-09', score: 9.0 },
      { date: '2024-01-10', score: 8.2 },
      { date: '2024-01-11', score: 7.5 },
      { date: '2024-01-12', score: 6.5 },
      { date: '2024-01-13', score: 7.0 },
      { date: '2024-01-14', score: 8.5 },
      { date: '2024-01-15', score: 9.5 },
    ]
  };

  const mockStudentScores = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', score: 9.5, avatar: null },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', score: 9.0, avatar: null },
    { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', score: 8.5, avatar: null },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', score: 8.2, avatar: null },
    { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', score: 8.0, avatar: null },
    { id: 6, name: 'Đỗ Thị F', email: 'dothif@example.com', score: 7.5, avatar: null },
    { id: 7, name: 'Vũ Văn G', email: 'vuvang@example.com', score: 7.2, avatar: null },
    { id: 8, name: 'Bùi Thị H', email: 'buithih@example.com', score: 7.0, avatar: null },
    { id: 9, name: 'Đặng Văn I', email: 'dangvani@example.com', score: 6.5, avatar: null },
    { id: 10, name: 'Ngô Thị K', email: 'ngothik@example.com', score: 5.0, avatar: null },
  ];

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setPerformanceData(mockPerformanceData);
        setStudentScores(mockStudentScores);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setLoading(false);
    }
  };

  // Filter students based on selected filter
  const getFilteredStudents = () => {
    const sortedStudents = [...studentScores].sort((a, b) => b.score - a.score);
    
    if (studentFilter === 'highest') {
      // Top 3 highest scores
      return sortedStudents.slice(0, 3);
    } else if (studentFilter === 'lowest') {
      // Bottom 3 lowest scores
      return sortedStudents.slice(-3).reverse();
    }
    // All students (sorted by score desc)
    return sortedStudents;
  };

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Enter daily challenge menu mode with backPath to list
    enterDailyChallengeMenu(0, null, '/teacher/daily-challenges');
    
    // Exit daily challenge menu mode when component unmounts
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu]);

  useEffect(() => {
    fetchPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, timeRange]);

  const chartConfig = {
    data: performanceData.trend,
    xField: 'date',
    yField: 'score',
    smooth: true,
    height: 300,
    xAxis: {
      title: {
        text: t('dailyChallenge.date'),
      },
    },
    yAxis: {
      title: {
        text: t('dailyChallenge.scoreLabel'), 
      },
      min: 0,
      max: 10,
      tickCount: 11,
    },
    color: '#1890ff',
    lineStyle: {
      lineWidth: 2,
    },
    point: {
      size: 4,
      shape: 'circle',
    },
  };

  return (
    <ThemedLayout>
      <div className="daily-challenge-performance-wrapper">
        {/* Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            className={`time-range-select ${theme}-time-range-select`}
            style={{ width: 220 }}
          >
            <Select.Option value="7days">{t('dailyChallenge.last7Days')}</Select.Option>
            <Select.Option value="15days">{t('dailyChallenge.last15Days')}</Select.Option>
            <Select.Option value="30days">{t('dailyChallenge.last30Days')}</Select.Option>
            <Select.Option value="90days">{t('dailyChallenge.last90Days')}</Select.Option>
          </Select>
          <Select
            value={studentFilter}
            onChange={setStudentFilter}
            className={`student-filter-select ${theme}-student-filter-select`}
            style={{ width: 220 }}
          >
            <Select.Option value="all">
              {t('dailyChallenge.allStudents') || 'All Students'}
            </Select.Option>
            <Select.Option value="highest">
              <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
              {t('dailyChallenge.topPerformers') || 'Top Performers'}
            </Select.Option>
            <Select.Option value="lowest">
              {t('dailyChallenge.needsImprovement') || 'Needs Improvement'}
            </Select.Option>
          </Select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <Button
              className={`tab-button ${theme}-tab-button`}
              onClick={() => navigate(`/teacher/daily-challenges/detail/${id}/content`)}
            >
              {t('dailyChallenge.content')}
            </Button>
            <Button
              className={`tab-button ${theme}-tab-button`}
              onClick={() => navigate(`/teacher/daily-challenges/detail/${id}/submissions`)}
            >
              {t('dailyChallenge.submission')}
            </Button>
          </div>
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
                    color: '#000',
                    textAlign: 'center'
                  }}>
                    {t('dailyChallenge.studentName')}
                  </h2>
                  
                  <div style={{ 
                    flex: 1, 
                    overflow: 'auto',
                    maxHeight: '480px' // Chiều cao cho khoảng 6 học sinh (mỗi item ~80px)
                  }}>
                    <List
                      dataSource={getFilteredStudents()}
                      renderItem={(student, index) => {
                        const isTopScore = index === 0 && studentFilter !== 'lowest';
                        
                        return (
                          <List.Item
                            style={{
                              padding: '12px 16px',
                              borderBottom: theme === 'sun' ? '1px solid #f0f0f0' : '1px solid #3a3458',
                              background: 'transparent',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            className={`student-list-item ${theme}-student-list-item`}
                          >
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flex: 1
                            }}>
                              {isTopScore && (
                                <TrophyOutlined 
                                  style={{ 
                                    color: '#faad14',
                                    fontSize: '18px'
                                  }} 
                                />
                              )}
                              <span style={{ 
                                fontWeight: 600,
                                fontSize: '16px',
                                color: '#000'
                              }}>
                                {student.name}
                              </span>
                            </div>
                            <span style={{ 
                              fontWeight: 700,
                              fontSize: '18px',
                              color: student.score >= 8 
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

                {/* Trend Chart */}
                <Card className={`chart-card ${theme}-chart-card`} style={{ flex: 1, marginBottom: '24px' }}>
                  <h2 style={{ 
                    margin: 0, 
                    marginBottom: '24px', 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#000',
                    textAlign: 'center'
                  }}>
                    {t('dailyChallenge.trendChart')}
                  </h2>
                  <Line {...chartConfig} />
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

