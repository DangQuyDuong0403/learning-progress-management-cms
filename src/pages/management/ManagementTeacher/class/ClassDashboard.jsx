import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Table,
  Space,
  Statistic,
  Progress,
  Avatar,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  TrophyOutlined,
  BookOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
// Removed recharts import to avoid dependency issues
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassDetail.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";

// Mock data for class dashboard
const mockClassData = {
  id: 1,
  name: "Rising star 1",
  studentCount: 15,
  color: "#00d4ff",
  status: "active",
  createdAt: "2024-01-15",
  teacher: "Nguyễn Văn A",
};

// Mock student performance data
const mockStudentPerformance = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    avatar: null,
    averageScore: 85,
    totalTests: 8,
    completedTests: 7,
    lastTestScore: 90,
    improvement: "+5%",
    grade: "A",
    status: "active",
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "binh.tran@example.com",
    avatar: null,
    averageScore: 78,
    totalTests: 8,
    completedTests: 8,
    lastTestScore: 82,
    improvement: "+3%",
    grade: "B+",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn Cường",
    email: "cuong.le@example.com",
    avatar: null,
    averageScore: 92,
    totalTests: 8,
    completedTests: 6,
    lastTestScore: 95,
    improvement: "+8%",
    grade: "A+",
    status: "active",
  },
  {
    id: 4,
    name: "Phạm Thị Dung",
    email: "dung.pham@example.com",
    avatar: null,
    averageScore: 73,
    totalTests: 8,
    completedTests: 8,
    lastTestScore: 75,
    improvement: "-2%",
    grade: "B",
    status: "active",
  },
  {
    id: 5,
    name: "Hoàng Văn Em",
    email: "em.hoang@example.com",
    avatar: null,
    averageScore: 88,
    totalTests: 8,
    completedTests: 7,
    lastTestScore: 85,
    improvement: "+4%",
    grade: "A-",
    status: "active",
  },
];

// Mock test data for charts
const mockTestData = [
  { name: "Grammar Test", average: 82, students: 12, maxScore: 100 },
  { name: "Vocabulary Quiz", average: 78, students: 15, maxScore: 100 },
  { name: "Reading Test", average: 85, students: 13, maxScore: 100 },
  { name: "Writing Test", average: 80, students: 11, maxScore: 100 },
  { name: "Listening Test", average: 88, students: 14, maxScore: 100 },
  { name: "Speaking Test", average: 75, students: 10, maxScore: 100 },
];

// Mock grade distribution data
const mockGradeDistribution = [
  { name: "A+", value: 2, color: "#52c41a" },
  { name: "A", value: 4, color: "#73d13d" },
  { name: "A-", value: 3, color: "#95de64" },
  { name: "B+", value: 3, color: "#ffd666" },
  { name: "B", value: 2, color: "#ffa940" },
  { name: "C+", value: 1, color: "#ff7875" },
  { name: "C", value: 0, color: "#ff4d4f" },
];

// Mock monthly progress data
const mockMonthlyProgress = [
  { month: "Jan", averageScore: 75, students: 15 },
  { month: "Feb", averageScore: 78, students: 15 },
  { month: "Mar", averageScore: 82, students: 15 },
  { month: "Apr", averageScore: 85, students: 15 },
  { month: "May", averageScore: 83, students: 15 },
  { month: "Jun", averageScore: 87, students: 15 },
];

const ClassDashboard = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState([]);

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClassData(mockClassData);
        setStudentPerformance(mockStudentPerformance);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('classDashboard.loadingClassInfo'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchClassData();
  }, [id, fetchClassData]);

  const getGradeColor = (grade) => {
    const gradeColors = {
      "A+": "#52c41a",
      "A": "#73d13d", 
      "A-": "#95de64",
      "B+": "#ffd666",
      "B": "#ffa940",
      "B-": "#ff7875",
      "C+": "#ff7875",
      "C": "#ff4d4f",
      "C-": "#ff4d4f",
      "D": "#ff4d4f",
      "F": "#ff4d4f",
    };
    return gradeColors[grade] || "#d9d9d9";
  };

  const getImprovementColor = (improvement) => {
    if (improvement.startsWith("+")) return "#52c41a";
    if (improvement.startsWith("-")) return "#ff4d4f";
    return "#d9d9d9";
  };

  // Calculate statistics
  const totalStudents = studentPerformance.length;
  const averageClassScore = studentPerformance.length > 0 
    ? Math.round(studentPerformance.reduce((sum, student) => sum + student.averageScore, 0) / studentPerformance.length)
    : 0;
  const completedTests = studentPerformance.reduce((sum, student) => sum + student.completedTests, 0);
  const totalPossibleTests = studentPerformance.reduce((sum, student) => sum + student.totalTests, 0);
  const completionRate = totalPossibleTests > 0 ? Math.round((completedTests / totalPossibleTests) * 100) : 0;

  const studentColumns = [
    {
      title: t('classDashboard.student'),
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{
              backgroundColor: classData?.color || "#00d4ff",
            }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px" }}>{text}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: t('classDashboard.averageScore'),
      dataIndex: "averageScore",
      key: "averageScore",
      sorter: (a, b) => a.averageScore - b.averageScore,
      render: (score) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "600", fontSize: "16px" }}>{score}</span>
          <span style={{ color: "#666", fontSize: "14px" }}>/100</span>
        </div>
      ),
    },
    {
      title: t('classDashboard.grade'),
      dataIndex: "grade",
      key: "grade",
      render: (grade) => (
        <Tag color={getGradeColor(grade)} style={{ fontWeight: "600" }}>
          {grade}
        </Tag>
      ),
    },
    {
      title: t('classDashboard.lastTestScore'),
      dataIndex: "lastTestScore",
      key: "lastTestScore",
      render: (score) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "600", fontSize: "15px" }}>{score}</span>
          <span style={{ color: "#666", fontSize: "13px" }}>/100</span>
        </div>
      ),
    },
    {
      title: t('classDashboard.testsCompleted'),
      key: "testsCompleted",
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600" }}>
            {record.completedTests}/{record.totalTests}
          </div>
          <Progress
            percent={Math.round((record.completedTests / record.totalTests) * 100)}
            size="small"
            strokeColor={classData?.color || "#00d4ff"}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: t('classDashboard.improvement'),
      dataIndex: "improvement",
      key: "improvement",
      render: (improvement) => (
        <Tag color={getImprovementColor(improvement)}>
          {improvement}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <ThemedLayout>
        <div className="class-detail-container">
          <LoadingWithEffect loading={true} message={t('classDashboard.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      <div className="class-detail-container">
        {/* Header */}
        <Card className="header-card">
          <div className="header-content">
            <div className="header-left">
               <Button
                 icon={<ArrowLeftOutlined />}
                 onClick={() => navigate(`/teacher/classes/menu/${id}`)}
                 className="back-button"
               >
                 {t('common.back')}
               </Button>
            </div>
            
            <div className="header-center">
              <h2 className="class-title">
                {classData?.name} - {t('classDashboard.dashboard')}
              </h2>
            </div>
            
            <div className="header-right">
              <Space>
              </Space>
            </div>
          </div>
        </Card>

        {/* Main Content Card */}
        <Card className="main-content-card">
          <div style={{ padding: '24px' }}>
             {/* Statistics Cards */}
             <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
             <Col xs={24} sm={12} md={6}>
               <Card style={{ padding: '20px', textAlign: 'center' }}>
                 <Statistic
                   title={t('classDashboard.totalStudents')}
                   value={totalStudents}
                   prefix={<UserOutlined />}
                   valueStyle={{ color: classData?.color || "#00d4ff" }}
                 />
               </Card>
             </Col>
             <Col xs={24} sm={12} md={6}>
               <Card style={{ padding: '20px', textAlign: 'center' }}>
                 <Statistic
                   title={t('classDashboard.averageScore')}
                   value={averageClassScore}
                   suffix="/100"
                   prefix={<TrophyOutlined />}
                   valueStyle={{ color: "#52c41a" }}
                 />
               </Card>
             </Col>
             <Col xs={24} sm={12} md={6}>
               <Card style={{ padding: '20px', textAlign: 'center' }}>
                 <Statistic
                   title={t('classDashboard.testsCompleted')}
                   value={completionRate}
                   suffix="%"
                   prefix={<BookOutlined />}
                   valueStyle={{ color: "#1890ff" }}
                 />
               </Card>
             </Col>
             <Col xs={24} sm={12} md={6}>
               <Card style={{ padding: '20px', textAlign: 'center' }}>
                 <Statistic
                   title={t('classDashboard.topPerformers')}
                   value={studentPerformance.filter(s => s.grade.startsWith('A')).length}
                   prefix={<BarChartOutlined />}
                   valueStyle={{ color: "#722ed1" }}
                 />
               </Card>
             </Col>
           </Row>

          {/* Charts Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {/* Test Performance Chart */}
            <Col xs={24} lg={12}>
              <Card title={t('classDashboard.testPerformance')} style={{ height: '400px' }}>
                <div style={{ padding: '20px 0' }}>
                  {mockTestData.map((test, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '500' }}>{test.name}</span>
                        <span style={{ fontWeight: '600', color: classData?.color || "#00d4ff" }}>
                          {test.average}/100
                        </span>
                      </div>
                      <Progress
                        percent={test.average}
                        strokeColor={classData?.color || "#00d4ff"}
                        showInfo={false}
                        size="small"
                      />
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {test.students} students took this test
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

             {/* Grade Distribution Chart */}
             <Col xs={24} lg={12}>
               <Card title={t('classDashboard.gradeDistribution')} style={{ height: '400px' }}>
                 <div style={{ padding: '20px 24px' }}>
                   {mockGradeDistribution.map((grade, index) => (
                     <div key={index} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                       <div style={{ 
                         width: '20px', 
                         height: '20px', 
                         backgroundColor: grade.color, 
                         borderRadius: '4px',
                         marginRight: '12px'
                       }} />
                       <span style={{ flex: 1, fontWeight: '500' }}>{grade.name}</span>
                       <span style={{ fontWeight: '600', color: grade.color }}>{grade.value} students</span>
                     </div>
                   ))}
                 </div>
               </Card>
             </Col>
          </Row>

          {/* Monthly Progress Chart */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <Card title={t('classDashboard.monthlyProgress')} style={{ height: '300px' }}>
                <div style={{ padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '200px' }}>
                    {mockMonthlyProgress.map((month, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ 
                          width: '40px',
                          height: `${(month.averageScore / 100) * 150}px`,
                          backgroundColor: classData?.color || "#00d4ff",
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px',
                          minHeight: '20px'
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{month.month}</span>
                        <span style={{ fontSize: '11px', color: '#666' }}>{month.averageScore}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                    {t('classDashboard.averageScore')} over time
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

            {/* Student Performance Table */}
            <Card title={t('classDashboard.studentPerformance')}>
              <Table
                columns={studentColumns}
                dataSource={studentPerformance}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('classDashboard.students')}`,
                }}
                scroll={{ x: 800 }}
              />
            </Card>
          </div>
        </Card>
      </div>
    </ThemedLayout>
  );
};

export default ClassDashboard;
