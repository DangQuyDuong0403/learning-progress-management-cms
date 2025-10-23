import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Space,
  Typography,
  Avatar,
  Tag,
  Progress,
} from "antd";
import {
  ClockCircleOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeSubmissionDetail.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";

// Mock data - chi tiết bài làm của học sinh
const mockSubmissionDetail = {
  id: 1,
  student: {
    id: "SE12345",
    name: "Nguyễn Văn A",
    email: "anvn@example.com",
    avatar: null,
    class: "SE1801",
    level: "Basic",
  },
  challenge: {
    id: 1,
    title: "Daily Challenge - Math & Logic",
    totalQuestions: 10,
    totalPoints: 20,
    timeLimit: 30, // minutes
  },
  submission: {
    score: 8.5,
    totalPoints: 17,
    maxPoints: 20,
    correctCount: 7,
    incorrectCount: 2,
    unansweredCount: 1,
    accuracy: 70, // percentage
    timeSpent: 25, // minutes
    submittedAt: "2024-01-15 10:30:00",
    status: "completed",
  },
  answers: [
    {
      questionId: 1,
      questionNumber: 1,
      questionText: "Hàm f(x) xác định với mọi số x với f(x) = |x+3| + |x+2|. Với giá trị nào của x thì f(x) = f(x-1) ?",
      questionType: "multiple-choice",
      options: [
        { key: "A", text: "-3", isCorrect: false },
        { key: "B", text: "-2", isCorrect: true },
        { key: "C", text: "-1", isCorrect: false },
        { key: "D", text: "1", isCorrect: false },
        { key: "E", text: "2", isCorrect: false },
      ],
      studentAnswer: "B",
      correctAnswer: "B",
      isCorrect: true,
      points: 2,
      maxPoints: 2,
      timeSpent: 2.5,
    },
    {
      questionId: 2,
      questionNumber: 2,
      questionText: "Tại đại học FPT, 40% sinh viên là thành viên của cả câu lạc bộ cờ vua và câu lạc bộ bơi lội. Nếu 20% thành viên của câu lạc bộ bơi không phải là thành viên của câu lạc bộ cờ vua, thì bao nhiêu phần trăm tổng số học sinh FPT là thành viên của câu lạc bộ bơi?",
      questionType: "multiple-choice",
      options: [
        { key: "A", text: "20%", isCorrect: false },
        { key: "B", text: "30%", isCorrect: false },
        { key: "C", text: "40%", isCorrect: false },
        { key: "D", text: "50%", isCorrect: true },
      ],
      studentAnswer: "B",
      correctAnswer: "D",
      isCorrect: false,
      points: 0,
      maxPoints: 2,
      timeSpent: 3.2,
    },
    {
      questionId: 3,
      questionNumber: 3,
      questionText: "What is the capital of France?",
      questionType: "multiple-choice",
      options: [
        { key: "A", text: "London", isCorrect: false },
        { key: "B", text: "Berlin", isCorrect: false },
        { key: "C", text: "Paris", isCorrect: true },
        { key: "D", text: "Madrid", isCorrect: false },
      ],
      studentAnswer: "C",
      correctAnswer: "C",
      isCorrect: true,
      points: 2,
      maxPoints: 2,
      timeSpent: 1.5,
    },
    {
      questionId: 4,
      questionNumber: 4,
      questionText: "Which programming language is known as the 'language of the web'?",
      questionType: "multiple-choice",
      options: [
        { key: "A", text: "Python", isCorrect: false },
        { key: "B", text: "JavaScript", isCorrect: true },
        { key: "C", text: "Java", isCorrect: false },
        { key: "D", text: "C++", isCorrect: false },
      ],
      studentAnswer: "A",
      correctAnswer: "B",
      isCorrect: false,
      points: 0,
      maxPoints: 2,
      timeSpent: 2.8,
    },
    {
      questionId: 5,
      questionNumber: 5,
      questionText: "What is 2 + 2?",
      questionType: "multiple-choice",
      options: [
        { key: "A", text: "3", isCorrect: false },
        { key: "B", text: "4", isCorrect: true },
        { key: "C", text: "5", isCorrect: false },
        { key: "D", text: "6", isCorrect: false },
      ],
      studentAnswer: null,
      correctAnswer: "B",
      isCorrect: false,
      points: 0,
      maxPoints: 2,
      timeSpent: 0,
    },
  ],
};

const DailyChallengeSubmissionDetail = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id, submissionId } = useParams();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge - Submission Detail');
  
  const [loading, setLoading] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, correct, incorrect, unanswered

  const fetchSubmissionDetail = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setSubmissionData(mockSubmissionDetail);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error('Error loading submission detail');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [fetchSubmissionDetail]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    const backPath = `/teacher/daily-challenges/detail/${id}/submissions`;
    enterDailyChallengeMenu(0, null, backPath);
    
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, id]);

  // Filter questions based on status
  const filteredAnswers = submissionData?.answers.filter((answer) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'correct') return answer.isCorrect;
    if (filterStatus === 'incorrect') return !answer.isCorrect && answer.studentAnswer !== null;
    if (filterStatus === 'unanswered') return answer.studentAnswer === null;
    return true;
  }) || [];

  const getStatusIcon = (answer) => {
    if (answer.studentAnswer === null) {
      return <MinusCircleOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />;
    }
    return answer.isCorrect ? (
      <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
    ) : (
      <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
    );
  };

  const getStatusClass = (answer) => {
    if (answer.studentAnswer === null) return 'unanswered';
    return answer.isCorrect ? 'correct' : 'incorrect';
  };

  if (loading || !submissionData) {
    return (
      <ThemedLayout>
        <LoadingWithEffect loading={loading} message="Loading submission details..." />
      </ThemedLayout>
    );
  }

  const { student, challenge, submission, answers } = submissionData;

  return (
    <ThemedLayout>
      <div className={`sdc-wrapper ${theme}-sdc-wrapper`}>
        {/* Student Info Card */}
        <div className="sdc-student-info-section" style={{ padding: '24px' }}>
          <div className={`sdc-student-info-card ${theme}-sdc-student-info-card`}>
            <div className="sdc-student-avatar-section">
              <Avatar
                size={80}
                src={student.avatar}
                style={{
                  backgroundColor: theme === 'sun' ? '#1890ff' : '#722ed1',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}
              >
                {student.name.charAt(0)}
              </Avatar>
            </div>
            <div className="sdc-student-details">
              <Typography.Title level={3} style={{ margin: 0, marginBottom: '4px' }}>
                {student.name}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                {student.id} • {student.email}
              </Typography.Text>
              <Space size="middle">
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {student.class}
                </Tag>
                <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {student.level}
                </Tag>
              </Space>
            </div>
          </div>
        </div>

        {/* Performance Summary Cards */}
        <div className="sdc-performance-cards-section" style={{ padding: '0 24px 24px 24px' }}>
          <div className="sdc-performance-cards-grid">
            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-icon" style={{ color: '#1890ff' }}>
                <TrophyOutlined style={{ fontSize: '32px' }} />
              </div>
              <div className="sdc-card-content">
                <Typography.Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  {submission.score}/10
                </Typography.Title>
                <Typography.Text type="secondary">Score</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-icon" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: '32px' }} />
              </div>
              <div className="sdc-card-content">
                <Typography.Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                  {submission.totalPoints}/{submission.maxPoints}
                </Typography.Title>
                <Typography.Text type="secondary">Points</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-icon" style={{ color: '#faad14' }}>
                <ClockCircleOutlined style={{ fontSize: '32px' }} />
              </div>
              <div className="sdc-card-content">
                <Typography.Title level={2} style={{ margin: 0, color: '#faad14' }}>
                  {submission.timeSpent}
                </Typography.Title>
                <Typography.Text type="secondary">Minutes</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-content" style={{ width: '100%' }}>
                <Typography.Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                  {submission.accuracy}%
                </Typography.Title>
                <Progress
                  percent={submission.accuracy}
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#1890ff',
                  }}
                  showInfo={false}
                />
                <Typography.Text type="secondary">Accuracy</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card sdc-summary-card`}>
              <div className="sdc-card-content" style={{ width: '100%' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                      <Typography.Text>Correct</Typography.Text>
                    </Space>
                    <Typography.Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                      {submission.correctCount}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                      <Typography.Text>Incorrect</Typography.Text>
                    </Space>
                    <Typography.Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>
                      {submission.incorrectCount}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <MinusCircleOutlined style={{ color: '#8c8c8c', fontSize: '18px' }} />
                      <Typography.Text>Unanswered</Typography.Text>
                    </Space>
                    <Typography.Text strong style={{ fontSize: '18px', color: '#8c8c8c' }}>
                      {submission.unansweredCount}
                    </Typography.Text>
                  </div>
                </Space>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sdc-action-section" style={{ padding: '0 24px 16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            className={`tab-button ${theme}-tab-button`}
            onClick={() => {
              // Handle add score/feedback
              spaceToast.info('Add score/feedback feature coming soon');
            }}
          >
            {t('dailyChallenge.addScoreFeedback')}
          </Button>
          <Button
            className={`tab-button ${theme}-tab-button`}
            onClick={() => {
              // Handle edit score/feedback
              spaceToast.info('Edit score/feedback feature coming soon');
            }}
          >
            {t('dailyChallenge.editScoreFeedback')}
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="sdc-filter-tabs-section" style={{ padding: '0 24px 16px 24px' }}>
          <Space size="middle">
            <Button
              type={filterStatus === 'all' ? 'primary' : 'default'}
              onClick={() => setFilterStatus('all')}
              className={`sdc-filter-tab ${theme}-sdc-filter-tab ${filterStatus === 'all' ? 'sdc-active' : ''}`}
            >
              All ({answers.length})
            </Button>
            <Button
              type={filterStatus === 'correct' ? 'primary' : 'default'}
              onClick={() => setFilterStatus('correct')}
              className={`sdc-filter-tab ${theme}-sdc-filter-tab ${filterStatus === 'correct' ? 'sdc-active' : ''}`}
              style={{ borderColor: filterStatus === 'correct' ? '#52c41a' : undefined }}
            >
              Correct ({submission.correctCount})
            </Button>
            <Button
              type={filterStatus === 'incorrect' ? 'primary' : 'default'}
              onClick={() => setFilterStatus('incorrect')}
              className={`sdc-filter-tab ${theme}-sdc-filter-tab ${filterStatus === 'incorrect' ? 'sdc-active' : ''}`}
              style={{ borderColor: filterStatus === 'incorrect' ? '#ff4d4f' : undefined }}
            >
              Incorrect ({submission.incorrectCount})
            </Button>
            <Button
              type={filterStatus === 'unanswered' ? 'primary' : 'default'}
              onClick={() => setFilterStatus('unanswered')}
              className={`sdc-filter-tab ${theme}-sdc-filter-tab ${filterStatus === 'unanswered' ? 'sdc-active' : ''}`}
              style={{ borderColor: filterStatus === 'unanswered' ? '#8c8c8c' : undefined }}
            >
              Unanswered ({submission.unansweredCount})
            </Button>
          </Space>
        </div>

        {/* Questions Review */}
        <div className="sdc-questions-review-section" style={{ padding: '0 24px 24px 24px' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {filteredAnswers.map((answer) => (
              <div
                key={answer.questionId}
                className={`sdc-question-review-card ${theme}-sdc-question-review-card sdc-${getStatusClass(answer)}`}
              >
                <div className="sdc-question-header">
                  <div className="sdc-question-status">
                    {getStatusIcon(answer)}
                    <Typography.Title level={4} style={{ margin: 0, marginLeft: '12px' }}>
                      Question {answer.questionNumber}
                    </Typography.Title>
                  </div>
                  <div className="sdc-question-meta">
                    <Tag color={answer.isCorrect ? 'success' : answer.studentAnswer === null ? 'default' : 'error'}>
                      {answer.points}/{answer.maxPoints} pts
                    </Tag>
                    {answer.timeSpent > 0 && (
                      <Tag icon={<ClockCircleOutlined />} color="blue">
                        {answer.timeSpent.toFixed(1)} min
                      </Tag>
                    )}
                  </div>
                </div>

                <div className="sdc-question-content">
                  <Typography.Paragraph style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>
                    {answer.questionText}
                  </Typography.Paragraph>

                  <div className="sdc-question-options">
                    {answer.options.map((option) => {
                      const isStudentAnswer = option.key === answer.studentAnswer;
                      const isCorrectAnswer = option.isCorrect;
                      
                      let optionClass = 'sdc-option-item';
                      if (isStudentAnswer && isCorrectAnswer) {
                        optionClass += ' sdc-student-correct';
                      } else if (isStudentAnswer && !isCorrectAnswer) {
                        optionClass += ' sdc-student-incorrect';
                      } else if (isCorrectAnswer) {
                        optionClass += ' sdc-correct-answer';
                      }

                      return (
                        <div key={option.key} className={optionClass}>
                          <Typography.Text>
                            <span className="sdc-option-key">{option.key}.</span> {option.text}
                          </Typography.Text>
                          {isStudentAnswer && isCorrectAnswer && (
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px', marginLeft: 'auto' }} />
                          )}
                          {isStudentAnswer && !isCorrectAnswer && (
                            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px', marginLeft: 'auto' }} />
                          )}
                          {!isStudentAnswer && isCorrectAnswer && answer.studentAnswer !== null && (
                            <Tag color="success" style={{ marginLeft: 'auto' }}>Correct Answer</Tag>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {answer.studentAnswer === null && (
                    <div className="sdc-unanswered-notice">
                      <Typography.Text type="secondary" italic>
                        Student did not answer this question
                      </Typography.Text>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Space>

          {filteredAnswers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <Typography.Text>No questions found with the selected filter</Typography.Text>
            </div>
          )}
        </div>
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengeSubmissionDetail;

