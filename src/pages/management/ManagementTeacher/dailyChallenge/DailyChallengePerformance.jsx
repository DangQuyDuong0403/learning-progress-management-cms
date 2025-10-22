import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Select, Statistic, Button } from "antd";
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
  const [performanceData, setPerformanceData] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    trend: []
  });

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

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setPerformanceData(mockPerformanceData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setLoading(false);
    }
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
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          <div>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              className={`time-range-select ${theme}-time-range-select`}
              style={{ width: 200 }}
            >
              <Select.Option value="7days">{t('dailyChallenge.last7Days')}</Select.Option>
              <Select.Option value="15days">{t('dailyChallenge.last15Days')}</Select.Option>
              <Select.Option value="30days">{t('dailyChallenge.last30Days')}</Select.Option>
              <Select.Option value="90days">{t('dailyChallenge.last90Days')}</Select.Option>
            </Select>
          </div>
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
            {/* Performance Statistics */}
            <Card className={`performance-card ${theme}-performance-card`} style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: 0, marginBottom: '24px', fontSize: '20px', fontWeight: 600, color: '#000' }}>
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
            <Card className={`chart-card ${theme}-chart-card`}>
              <h2 style={{ margin: 0, marginBottom: '24px', fontSize: '20px', fontWeight: 600, color: '#000' }}>
                {t('dailyChallenge.trendChart')}
              </h2>
              <Line {...chartConfig} />
            </Card>
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengePerformance;

