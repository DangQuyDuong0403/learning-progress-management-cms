import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Input,
  Tag,
  Row,
  Col,
  Typography,
  DatePicker,
  Select,
  Card,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  FireOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Pie, Column, Line, Bar } from '@ant-design/charts';
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useSelector } from 'react-redux';
import ROUTER_PAGE from "../../../../constants/router";
import "./StudentLearningProgressOverview.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock data for learning sessions (ordered from oldest to newest)
const mockLearningSessions = [
  {
    id: 8,
    date: "2024-12-14",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Writing Practice - Formal Letters",
    chapter: "Writing Skills",
    teacher: "Mr. David Wilson",
    status: "completed",
    skill: "Writing",
    score: 85,
    timeSpent: 90,
  },
  {
    id: 7,
    date: "2024-12-15",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Listening Comprehension - News Report",
    chapter: "Listening Skills",
    teacher: "Ms. Sarah Johnson",
    status: "completed",
    skill: "Listening",
    score: 92,
    timeSpent: 90,
  },
  {
    id: 6,
    date: "2024-12-16",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Speaking Practice - Daily Conversations",
    chapter: "Speaking Skills",
    teacher: "Mr. David Wilson",
    status: "completed",
    skill: "Speaking",
    score: 78,
    timeSpent: 90,
  },
  {
    id: 5,
    date: "2024-12-17",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Unit 1: Introduction to English Tenses",
    chapter: "Grammar Fundamentals",
    teacher: "Ms. Sarah Johnson",
    status: "completed",
    skill: "Grammar",
    score: 88,
    timeSpent: 90,
  },
  {
    id: 4,
    date: "2024-12-18",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Unit 2: Future Tenses",
    chapter: "Grammar Fundamentals",
    teacher: "Ms. Sarah Johnson",
    status: "completed",
    skill: "Grammar",
    score: 91,
    timeSpent: 90,
  },
  {
    id: 3,
    date: "2024-12-19",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Unit 3: Reading Comprehension - Space Exploration",
    chapter: "Reading Skills",
    teacher: "Mr. David Wilson",
    status: "completed",
    skill: "Reading",
    score: 87,
    timeSpent: 90,
  },
  {
    id: 2,
    date: "2024-12-20",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Unit 4: Past Simple vs Past Continuous",
    chapter: "Grammar Fundamentals",
    teacher: "Ms. Sarah Johnson",
    status: "completed",
    skill: "Grammar",
    score: 89,
    timeSpent: 90,
  },
  {
    id: 1,
    date: "2024-12-21",
    startTime: "09:00",
    endTime: "10:30",
    duration: "1h 30m",
    lesson: "Unit 5: Present Perfect Tense",
    chapter: "Grammar Fundamentals",
    teacher: "Ms. Sarah Johnson",
    status: "completed",
    skill: "Grammar",
    score: 94,
    timeSpent: 90,
  },
];

// Mock data for additional statistics
const mockProgressData = {
  weeklyProgress: [
    { week: 'Tuần 1', sessions: 3, avgScore: 82 },
    { week: 'Tuần 2', sessions: 4, avgScore: 85 },
    { week: 'Tuần 3', sessions: 2, avgScore: 88 },
    { week: 'Tuần 4', sessions: 5, avgScore: 91 },
  ],
  skillDistribution: [
    { skill: 'Grammar', count: 4, percentage: 50 },
    { skill: 'Listening', count: 1, percentage: 12.5 },
    { skill: 'Reading', count: 1, percentage: 12.5 },
    { skill: 'Writing', count: 1, percentage: 12.5 },
    { skill: 'Speaking', count: 1, percentage: 12.5 },
  ],
  scoreTrend: [
    { date: '2024-12-14', score: 85 },
    { date: '2024-12-15', score: 92 },
    { date: '2024-12-16', score: 78 },
    { date: '2024-12-17', score: 88 },
    { date: '2024-12-18', score: 91 },
    { date: '2024-12-19', score: 87 },
    { date: '2024-12-20', score: 89 },
    { date: '2024-12-21', score: 94 },
  ],
  skillScores: [
    { skill: 'Grammar', score: 90.5 },
    { skill: 'Listening', score: 92 },
    { skill: 'Reading', score: 87 },
    { skill: 'Writing', score: 85 },
    { skill: 'Speaking', score: 78 },
  ],
};

const StudentLearningProgressOverview = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const userRole = (user?.role || '').toLowerCase();
  const isTeacher = userRole === 'teacher';
  const isTeachingAssistant = userRole === 'teaching_assistant';
  const classId = location.state?.classId || (typeof window !== 'undefined' ? localStorage.getItem('selectedClassId') : null);
  const returnTo = location.state?.returnTo;
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [student, setStudent] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");

  // Get student data from location state or fetch it
  useEffect(() => {
    if (location.state?.student) {
      setStudent(location.state.student);
    } else {
      // Mock student data if not passed via state
      setStudent({
        id: id,
        studentCode: "STU001",
        fullName: "Nguyễn Văn An",
        email: "nguyenvanan@example.com",
        phone: "0123456789",
        class: "Lớp 10A1",
        level: "Intermediate",
        status: "active",
      });
    }
  }, [id, location.state]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setSessions(mockLearningSessions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter and sort sessions (oldest to newest)
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = 
      session.lesson.toLowerCase().includes(searchText.toLowerCase()) ||
      session.chapter.toLowerCase().includes(searchText.toLowerCase()) ||
      session.teacher.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    const matchesChapter = chapterFilter === "all" || session.chapter === chapterFilter;
    
    let matchesDate = true;
    if (dateRange && dateRange.length === 2) {
      const sessionDate = new Date(session.date);
      const startDate = dateRange[0];
      const endDate = dateRange[1];
      matchesDate = sessionDate >= startDate && sessionDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesChapter && matchesDate;
  }).sort((a, b) => {
    // Sort by date (oldest first), then by start time
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() === dateB.getTime()) {
      return a.startTime.localeCompare(b.startTime);
    }
    
    return dateA.getTime() - dateB.getTime();
  });

  // Get unique chapters for filter
  const uniqueChapters = [...new Set(sessions.map(session => session.chapter))];

  // Calculate statistics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === "completed").length;
  const averageScore = sessions.length > 0 ? 
    (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length).toFixed(1) : 0;
  const studyStreak = 5; // Mock streak data

  const handleBack = () => {
    let path = ROUTER_PAGE.MANAGER_STUDENT_PROFILE.replace(':id', String(id));
    if (isTeacher) {
      path = ROUTER_PAGE.TEACHER_STUDENT_PROFILE.replace(':id', String(id));
    } else if (isTeachingAssistant) {
      path = ROUTER_PAGE.TEACHING_ASSISTANT_STUDENT_PROFILE.replace(':id', String(id));
    }
    navigate(path, { state: { student, classId, returnTo } });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "in-progress":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "cancelled":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <MinusCircleOutlined style={{ color: "#d9d9d9" }} />;
    }
  };


  return (
    <ThemedLayout>
      {/* Main Content Panel */}
      <div className={`main-content-panel ${theme}-main-panel`}>
        {/* Header Section */}
        <div className={`panel-header ${theme}-panel-header`}>
          <div className="header-left">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className={`back-button ${theme}-back-button`}
            >
              {t('common.back')}
            </Button>
            <div className="student-info">
              <Title level={3} className={`student-name ${theme}-student-name`}>
                {student?.fullName}
              </Title>
              <Text className={`student-code ${theme}-student-code`}>
                {student?.studentCode} • {student?.class} • {student?.level}
              </Text>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={`stats-section ${theme}-stats-section`}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card className={`stat-card ${theme}-stat-card`}>
                <Statistic
                  title={t('studentProgress.totalSessions')}
                  value={totalSessions}
                  prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className={`stat-card ${theme}-stat-card`}>
                <Statistic
                  title={t('studentProgress.completedSessions')}
                  value={completedSessions}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className={`stat-card ${theme}-stat-card`}>
                <Statistic
                  title={t('studentProgress.averageScore')}
                  value={averageScore}
                  suffix="/ 100"
                  prefix={<StarOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className={`stat-card ${theme}-stat-card`}>
                <Statistic
                  title={t('studentProgress.studyStreak')}
                  value={studyStreak}
                  suffix="days"
                  prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Charts Section */}
        <div className={`charts-section ${theme}-charts-section`}>
          <Row gutter={[16, 16]}>
            {/* Skill Distribution Pie Chart */}
            <Col xs={24} lg={12}>
              <Card 
                title={t('studentProgress.skillDistribution')}
                className={`chart-card ${theme}-chart-card`}
              >
                <Pie
                  data={mockProgressData.skillDistribution}
                  angleField="count"
                  colorField="skill"
                  radius={0.8}
                  label={{
                    type: 'outer',
                    content: '{name}: {percentage}',
                  }}
                  interactions={[{ type: 'element-active' }]}
                  height={300}
                />
              </Card>
            </Col>

            {/* Weekly Progress Bar Chart */}
            <Col xs={24} lg={12}>
              <Card 
                title={t('studentProgress.weeklyProgress')}
                className={`chart-card ${theme}-chart-card`}
              >
                <Column
                  data={mockProgressData.weeklyProgress}
                  xField="week"
                  yField="sessions"
                  columnStyle={{
                    radius: [4, 4, 0, 0],
                  }}
                  height={300}
                />
              </Card>
            </Col>

            {/* Score Trend Line Chart */}
            <Col xs={24} lg={12}>
              <Card 
                title={t('studentProgress.scoreTrend')}
                className={`chart-card ${theme}-chart-card`}
              >
                <Line
                  data={mockProgressData.scoreTrend}
                  xField="date"
                  yField="score"
                  point={{
                    size: 5,
                    shape: 'diamond',
                  }}
                  height={300}
                />
              </Card>
            </Col>

            {/* Skill Scores Horizontal Bar Chart */}
            <Col xs={24} lg={12}>
              <Card 
                title={t('studentProgress.skillScores')}
                className={`chart-card ${theme}-chart-card`}
              >
                <Bar
                  data={mockProgressData.skillScores}
                  xField="score"
                  yField="skill"
                  seriesField="skill"
                  height={300}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Filters Section */}
        <div className={`filters-section ${theme}-filters-section`}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`search-input ${theme}-search-input`}
                style={{ height: '40px', fontSize: '16px' }}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={[t('studentProgress.startDate'), t('studentProgress.endDate')]}
                className={`date-picker ${theme}-date-picker`}
                format="YYYY-MM-DD"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className={`status-filter ${theme}-status-filter`}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('studentProgress.allStatuses')}</Option>
                <Option value="completed">{t('studentProgress.completed')}</Option>
                <Option value="in-progress">{t('studentProgress.inProgress')}</Option>
                <Option value="cancelled">{t('studentProgress.cancelled')}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={chapterFilter}
                onChange={setChapterFilter}
                className={`chapter-filter ${theme}-chapter-filter`}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('studentProgress.allChapters')}</Option>
                {uniqueChapters.map(chapter => (
                  <Option key={chapter} value={chapter}>{chapter}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        {/* Sessions List */}
        <div className={`sessions-section ${theme}-sessions-section`}>
          <LoadingWithEffect
            loading={loading}
            message={t('studentProgress.loadingSessions')}>
            <div className="sessions-list">
              {filteredSessions.map((session) => (
                <div key={session.id} className={`session-card ${theme}-session-card`}>
                  <div className="session-header">
                    <div className="session-date">
                      <CalendarOutlined />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="session-time">
                      <ClockCircleOutlined />
                      <span>{session.startTime} - {session.endTime}</span>
                      <span className="duration">({session.duration})</span>
                    </div>
                    <div className="session-status">
                      {getStatusIcon(session.status)}
                      <Tag color={session.status === 'completed' ? 'green' : session.status === 'in-progress' ? 'blue' : 'red'}>
                        {session.status === 'completed' ? t('studentProgress.completed') : 
                         session.status === 'in-progress' ? t('studentProgress.inProgress') : 
                         t('studentProgress.cancelled')}
                      </Tag>
                    </div>
                  </div>

                  <div className="session-content">
                    <div className="lesson-info">
                      <Title level={5} className={`lesson-title ${theme}-lesson-title`}>
                        {session.lesson}
                      </Title>
                      <Text className={`chapter-text ${theme}-chapter-text`}>
                        {session.chapter}
                      </Text>
                    </div>

                    <div className="session-details">
                      <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <div className="detail-item">
                            <UserOutlined />
                            <span>{session.teacher}</span>
                          </div>
                        </Col>
                      </Row>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default StudentLearningProgressOverview;
