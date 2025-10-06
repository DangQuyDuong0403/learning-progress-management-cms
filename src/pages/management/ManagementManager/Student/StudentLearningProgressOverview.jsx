import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Input,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Divider,
  DatePicker,
  Select,
  Tooltip,
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
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
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
  },
];

const StudentLearningProgressOverview = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleBack = () => {
    navigate(`/manager/student/${id}/profile`, { state: { student: student } });
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
            <Col xs={24} sm={12} md={12}>
              <div className={`student-progress-stat-card ${theme}-student-progress-stat-card`}>
                <div className="stat-icon">
                  <BookOutlined />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalSessions}</div>
                  <div className="stat-label">{t('studentProgress.totalSessions')}</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <div className={`student-progress-stat-card ${theme}-student-progress-stat-card`}>
                <div className="stat-icon">
                  <CheckCircleOutlined />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{completedSessions}</div>
                  <div className="stat-label">{t('studentProgress.completedSessions')}</div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Filters Section */}
        <div className={`filters-section ${theme}-filters-section`}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder={t('studentProgress.searchSessions')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`search-input ${theme}-search-input`}
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
