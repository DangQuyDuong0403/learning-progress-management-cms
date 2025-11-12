import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Row, Col, Empty, Select, Avatar } from 'antd';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as ReBarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { useTheme } from '../../../../contexts/ThemeContext';
import ThemedLayoutWithSidebar from '../../../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../../../component/teacherlayout/ThemedLayout';
import { classManagementApi } from '../../../../apis/apis';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { spaceToast } from '../../../../component/SpaceToastify';
import { useClassMenu } from '../../../../contexts/ClassMenuContext';
import usePageTitle from '../../../../hooks/usePageTitle';
import './ClassReportV2.css';

const ROLE_COLORS = ['#c0aaff', '#80b9ff', '#7dd3b8', '#ffc98a', '#f79ac0', '#9aa7ff'];

const ClassReport = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { enterClassMenu, exitClassMenu } = useClassMenu();

  // Determine which layout to use based on user role
  const userRole = user?.role?.toLowerCase();
  const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant')
    ? ThemedLayoutNoSidebar
    : ThemedLayoutWithSidebar;

  // Set page title
  usePageTitle('Class Report');

  // State management
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [roleDistributionData, setRoleDistributionData] = useState([]);
  const [teacherActivityData, setTeacherActivityData] = useState([]);
  const [studentRankings, setStudentRankings] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('VOCABULARY');
  const [selectedProgressSkill, setSelectedProgressSkill] = useState('VOCABULARY');
  const [sortBy, setSortBy] = useState('score');
  const [challengeStatsBySkill, setChallengeStatsBySkill] = useState([]);
  const [challengeProgress, setChallengeProgress] = useState([]);

  // Load class detail and report data
  useEffect(() => {
    if (!id) return;
    
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Load class detail and report data in parallel
        const [classResponse, overviewResponse, membersResponse] = await Promise.all([
          classManagementApi.getClassDetail(id),
          classManagementApi.getClassReportOverview(id),
          classManagementApi.getClassReportMembers(id, sortBy),
        ]);

        // Process class detail
        if (classResponse?.data) {
          setClassData({
            id: classResponse.data.id,
            name: classResponse.data.name || classResponse.data.className,
            isActive: classResponse.data.status === 'ACTIVE',
          });
        }

        // Process overview data
        if (overviewResponse?.data) {
          const overview = overviewResponse.data;
          setOverviewData({
            averageScore: overview.averageScore ?? 0,
            completionPercentage: overview.completionRate ?? 0,
            totalLessons: overview.totalLessons ?? 0,
            totalLessonsLearned: overview.completedLessons ?? 0,
            totalActiveTeachers: overview.memberCount?.teachers ?? 0,
            totalActiveStudents: overview.memberCount?.students ?? 0,
            totalDailyChallenges: overview.totalChallenges ?? 0,
          });
        }

        // Process members data
        if (membersResponse?.data) {
          const members = membersResponse.data;
          
          // Process role distribution
          if (members.roleDistribution && Array.isArray(members.roleDistribution)) {
            const roleMap = {
              'TEACHER': { name: 'Teachers', color: ROLE_COLORS[0] },
              'STUDENT': { name: 'Students', color: ROLE_COLORS[1] },
              'TEACHING_ASSISTANT': { name: 'Teaching Assistants', color: ROLE_COLORS[2] },
              'TEST_TAKER': { name: 'Test Takers', color: ROLE_COLORS[3] },
            };
            
            const distribution = members.roleDistribution
              .filter(role => role.count > 0)
              .map(role => ({
                name: roleMap[role.roleName]?.name || role.roleName,
                value: role.count,
                percentage: role.percentage ?? 0,
                color: roleMap[role.roleName]?.color || ROLE_COLORS[0],
              }));
            
            setRoleDistributionData(distribution);
          }

          // Process teacher activities
          if (members.teacherActivities && Array.isArray(members.teacherActivities)) {
            const activities = members.teacherActivities.map(teacher => ({
              name: teacher.fullName || teacher.email,
              creatingAssignments: teacher.assignedChallenges ?? 0,
              gradingAssignments: teacher.gradedSubmissions ?? 0,
            }));
            setTeacherActivityData(activities);
          }

          // Process student rankings
          if (members.studentRankings && Array.isArray(members.studentRankings)) {
            setStudentRankings(members.studentRankings);
          }
        }
      } catch (err) {
        console.error('Error loading class report data:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load class report data');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [id, sortBy]);

  // Load challenge progress by all skills
  useEffect(() => {
    if (!id) return;
    
    const loadChallengeProgress = async () => {
      try {
        const response = await classManagementApi.getClassChallengeProgress(id);
        if (response?.data?.skills) {
          setChallengeProgress(response.data.skills);
        }
      } catch (err) {
        console.error('Error loading challenge progress:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load challenge progress');
      }
    };
    
    loadChallengeProgress();
  }, [id]);

  // Load challenge stats by skill
  useEffect(() => {
    if (!id || !selectedSkill || selectedSkill === 'all') return;
    
    const loadChallengeStats = async () => {
      try {
        const response = await classManagementApi.getClassChallengeStatsBySkill(id, selectedSkill);
        if (response?.data?.challenges) {
          setChallengeStatsBySkill(response.data.challenges);
        } else {
          setChallengeStatsBySkill([]);
        }
      } catch (err) {
        console.error('Error loading challenge stats by skill:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load challenge stats');
        setChallengeStatsBySkill([]);
      }
    };
    
    loadChallengeStats();
  }, [id, selectedSkill]);

  // Track if we've already entered class menu to prevent infinite loops
  const hasEnteredClassMenu = useRef(false);
  const currentClassId = useRef(null);
  const enterClassMenuRef = useRef(enterClassMenu);
  const exitClassMenuRef = useRef(exitClassMenu);
  const tRef = useRef(t);

  // Update refs when values change
  useEffect(() => {
    enterClassMenuRef.current = enterClassMenu;
    exitClassMenuRef.current = exitClassMenu;
    tRef.current = t;
  });

  // Enter class menu mode when component mounts
  useEffect(() => {
    // Only enter if we have classData and haven't entered yet, or classId changed
    if (!classData?.id || !classData?.name) {
      // If classData is cleared, exit class menu
      if (hasEnteredClassMenu.current) {
        exitClassMenuRef.current();
        hasEnteredClassMenu.current = false;
        currentClassId.current = null;
      }
      return;
    }

    // If this is a new class or we haven't entered yet
    if (currentClassId.current !== classData.id) {
      enterClassMenuRef.current({
        id: classData.id,
        name: classData.name,
        description: `${classData.name} - ${tRef.current('classReport.report')}`,
      });
      hasEnteredClassMenu.current = true;
      currentClassId.current = classData.id;
    }
  }, [classData?.id, classData?.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasEnteredClassMenu.current) {
        exitClassMenuRef.current();
        hasEnteredClassMenu.current = false;
        currentClassId.current = null;
      }
    };
  }, []);

  // Top students by score (from API data)
  const topStudentsByScore = useMemo(() => {
    if (!studentRankings || studentRankings.length === 0) return [];
    
    // If sortBy is 'score', use the rankings as-is (already sorted by API)
    if (sortBy === 'score') {
      return studentRankings
        .slice(0, 10)
        .map((s, idx) => ({
          ...s,
          id: s.userId,
          name: s.fullName || s.email,
          email: s.email,
          averageScore: s.averageScore ?? 0,
          totalSubmissions: s.totalSubmissions ?? 0,
          lateSubmissions: s.lateSubmissions ?? 0,
          onTimeSubmissions: s.onTimeSubmissions ?? 0,
          diligenceScore: s.diligenceScore ?? 0,
          rank: idx + 1,
        }));
    }
    
    // If sortBy is 'diligence', sort by diligenceScore
    if (sortBy === 'diligence') {
      return [...studentRankings]
        .sort((a, b) => (b.diligenceScore ?? 0) - (a.diligenceScore ?? 0))
        .slice(0, 10)
        .map((s, idx) => ({
          ...s,
          id: s.userId,
          name: s.fullName || s.email,
          email: s.email,
          averageScore: s.averageScore ?? 0,
          totalSubmissions: s.totalSubmissions ?? 0,
          lateSubmissions: s.lateSubmissions ?? 0,
          onTimeSubmissions: s.onTimeSubmissions ?? 0,
          diligenceScore: s.diligenceScore ?? 0,
          rank: idx + 1,
        }));
    }
    
    // Otherwise, sort by score
    return [...studentRankings]
      .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
      .slice(0, 10)
      .map((s, idx) => ({
        ...s,
        id: s.userId,
        name: s.fullName || s.email,
        email: s.email,
        averageScore: s.averageScore ?? 0,
        totalSubmissions: s.totalSubmissions ?? 0,
        lateSubmissions: s.lateSubmissions ?? 0,
        onTimeSubmissions: s.onTimeSubmissions ?? 0,
        diligenceScore: s.diligenceScore ?? 0,
        rank: idx + 1,
      }));
  }, [studentRankings, sortBy]);


  // Mock data for challenge stats (temporary until API has data)
  const mockChallengeStats = useMemo(() => {
    const skillName = selectedSkill || 'VOCABULARY';
    return [
      {
        challengeId: 1,
        challengeName: `${skillName} Challenge 1`,
        onTimeCount: 18,
        lateCount: 3,
        notSubmittedCount: 4,
        averageScore: 7.5,
      },
      {
        challengeId: 2,
        challengeName: `${skillName} Challenge 2`,
        onTimeCount: 20,
        lateCount: 2,
        notSubmittedCount: 3,
        averageScore: 8.2,
      },
      {
        challengeId: 3,
        challengeName: `${skillName} Challenge 3`,
        onTimeCount: 15,
        lateCount: 5,
        notSubmittedCount: 5,
        averageScore: 6.8,
      },
      {
        challengeId: 4,
        challengeName: `${skillName} Challenge 4`,
        onTimeCount: 22,
        lateCount: 1,
        notSubmittedCount: 2,
        averageScore: 8.9,
      },
      {
        challengeId: 5,
        challengeName: `${skillName} Challenge 5`,
        onTimeCount: 19,
        lateCount: 4,
        notSubmittedCount: 2,
        averageScore: 7.3,
      },
    ];
  }, [selectedSkill]);

  // Daily challenges chart data from API (challenge stats by skill)
  const dailyChallengesChartData = useMemo(() => {
    // Use API data if available, otherwise use mock data
    const dataSource = (challengeStatsBySkill && challengeStatsBySkill.length > 0) 
      ? challengeStatsBySkill 
      : mockChallengeStats;
    
    if (!dataSource || dataSource.length === 0) return [];
    
    return dataSource.map((challenge, index) => ({
      name: challenge.challengeName || `DC ${challenge.challengeId}`,
      dcName: challenge.challengeName || `DC ${challenge.challengeId}`,
      averageScore: challenge.averageScore ?? 0,
      onTimeSubmissions: challenge.onTimeCount ?? 0,
      lateSubmissions: challenge.lateCount ?? 0,
      notSubmitted: challenge.notSubmittedCount ?? 0,
      totalSubmissions: (challenge.onTimeCount ?? 0) + (challenge.lateCount ?? 0) + (challenge.notSubmittedCount ?? 0),
    }));
  }, [challengeStatsBySkill, mockChallengeStats]);


  const availableSkills = useMemo(() => {
    const skills = ['VOCABULARY', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];
    return skills;
  }, []);

  // Challenge progress chart data by selected skill
  const challengeProgressData = useMemo(() => {
    // Always return 4 statuses, even if all are 0
    if (!challengeProgress || challengeProgress.length === 0) {
      return [
        { stage: 'Draft', value: 0, count: 0, color: '#9ca3af' },
        { stage: 'Published', value: 0, count: 0, color: '#60a5fa' },
        { stage: 'In Progress', value: 0, count: 0, color: '#f59e0b' },
        { stage: 'Finished', value: 0, count: 0, color: '#22c55e' },
      ];
    }
    
    const selectedSkillData = challengeProgress.find(skill => skill.skill === selectedProgressSkill);
    if (!selectedSkillData || !selectedSkillData.statusBreakdown) {
      return [
        { stage: 'Draft', value: 0, count: 0, color: '#9ca3af' },
        { stage: 'Published', value: 0, count: 0, color: '#60a5fa' },
        { stage: 'In Progress', value: 0, count: 0, color: '#f59e0b' },
        { stage: 'Finished', value: 0, count: 0, color: '#22c55e' },
      ];
    }
    
    const breakdown = selectedSkillData.statusBreakdown;
    
    // Always return 4 statuses, even if all percentages are 0
    return [
      { 
        stage: 'Draft', 
        value: breakdown.draftPercentage ?? 0, 
        count: breakdown.draft ?? 0,
        color: '#9ca3af' 
      },
      { 
        stage: 'Published', 
        value: breakdown.publishedPercentage ?? 0, 
        count: breakdown.published ?? 0,
        color: '#60a5fa' 
      },
      { 
        stage: 'In Progress', 
        value: breakdown.inProgressPercentage ?? 0, 
        count: breakdown.inProgress ?? 0,
        color: '#f59e0b' 
      },
      { 
        stage: 'Finished', 
        value: breakdown.finishedPercentage ?? 0, 
        count: breakdown.finished ?? 0,
        color: '#22c55e' 
      },
    ];
  }, [challengeProgress, selectedProgressSkill]);

  // Format skill name to capitalize first letter
  const formatSkillName = (skill) => {
    if (!skill) return '';
    return skill.charAt(0) + skill.slice(1).toLowerCase();
  };

  // Render summary cards
  const renderSummaryCards = (cards = []) => (
    <Row gutter={[12, 16]} style={{ marginBottom: 24 }}>
      {cards.map((stat) => (
        <Col
          key={stat.key}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          flex="1 1 220px"
          style={{ display: 'flex' }}
        >
          <Card
            hoverable
            style={{
              backgroundColor: stat.bg,
              border: 'none',
              borderRadius: 16,
              boxShadow: theme === 'sun' ? '0 8px 20px rgba(0,0,0,0.08)' : undefined,
              minHeight: 170,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {stat.icon}
              </div>
              <div style={{ fontWeight: 600, fontSize: 18, color: '#5b6b83', lineHeight: 1.1 }}>{stat.title}</div>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
              {stat.value}
            </div>
            <div style={{ color: '#6b7280', fontSize: 14 }}>
              {stat.subtitle}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Overview cards
  const overviewCards = useMemo(() => {
    if (!overviewData) return [];
    return [
      {
        key: 'averageScore',
        title: t('classReport.averageScore'),
        value: `${Number(overviewData.averageScore ?? 0).toFixed(1)}%`,
        subtitle: 'Class average',
        icon: <TrophyOutlined style={{ color: '#f59e0b' }} />,
        bg: '#fff7ed',
      },
      {
        key: 'completionPercentage',
        title: t('classReport.completionPercentage', 'Completion %'),
        value: `${Number(overviewData.completionPercentage ?? 0).toFixed(1)}%`,
        subtitle: 'Overall completion',
        icon: <CheckCircleOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5',
      },
      {
        key: 'lessons',
        title: t('classReport.lessons', 'Lessons'),
        value: `${overviewData.totalLessonsLearned ?? 0}/${overviewData.totalLessons ?? 0}`,
        subtitle: 'Learned / Total',
        icon: <BookOutlined style={{ color: '#6366f1' }} />,
        bg: '#eef2ff',
      },
      {
        key: 'activeTeachers',
        title: t('classReport.activeTeachers', 'Active Teachers'),
        value: overviewData.totalActiveTeachers ?? 0,
        subtitle: 'Currently active',
        icon: <TeamOutlined style={{ color: '#8b5cf6' }} />,
        bg: '#f5f3ff',
      },
      {
        key: 'activeStudents',
        title: t('classReport.activeStudents', 'Active Students'),
        value: overviewData.totalActiveStudents ?? 0,
        subtitle: 'Currently active',
        icon: <UserOutlined style={{ color: '#0ea5e9' }} />,
        bg: '#e0f2fe',
      },
      {
        key: 'dailyChallenges',
        title: t('classReport.totalDailyChallenges', 'Daily Challenges'),
        value: overviewData.totalDailyChallenges ?? 0,
        subtitle: 'Total DCs',
        icon: <FileTextOutlined style={{ color: '#ec4899' }} />,
        bg: '#fdf2f8',
      },
    ];
  }, [overviewData, t]);

  if (loading) {
    return (
      <ThemedLayout>
        <div className="class-report-v2-container">
          <LoadingWithEffect loading={true} message={t('classReport.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }


  return (
    <ThemedLayout>
      <div className={`class-report-v2-container ${theme}-theme`}>
        {/* Overview Section */}
        {renderSummaryCards(overviewCards)}

        {/* Member Details Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />
                <div className="crv2-title">Role Distribution</div>
              </div>
              {roleDistributionData.length === 0 ? (
                <Empty description="No data" />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 24, right: 24, bottom: 48, left: 24 }}>
                      <Pie
                        data={roleDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        outerRadius={110}
                        label={({ name, percentage }) => `${name} (${Number(percentage).toFixed(2)}%)`}
                      >
                        {roleDistributionData.map((entry, index) => (
                          <Cell key={`role-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ marginTop: 12 }} />
                      <ReTooltip 
                        formatter={(value, name, props) => {
                          // Hiển thị số lượng khi hover
                          return [`${value} members`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#10b981', fontSize: 20 }} />
                <div className="crv2-title">Teacher Activity</div>
              </div>
              {teacherActivityData.length === 0 ? (
                <Empty description="No activity data" />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <ReBarChart data={teacherActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Legend />
                      <ReTooltip />
                      <Bar dataKey="creatingAssignments" fill="#90caf9" radius={[6, 6, 0, 0]} name="Creating" />
                      <Bar dataKey="gradingAssignments" fill="#a5d6a7" radius={[6, 6, 0, 0]} name="Grading" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Student Performance Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 420,
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrophyOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                  <div className="crv2-title">Top Students by Score</div>
                </div>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 150 }}
                  size="small"
                >
                  <Select.Option value="score">By Score</Select.Option>
                  <Select.Option value="diligence">By Diligence</Select.Option>
                </Select>
              </div>
              {topStudentsByScore.length === 0 ? (
                <Empty description="No student data" />
              ) : (
                <div className="crv2-table crv2-scroll">
                  <div className="crv2-table__head" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr 1fr 1fr 1fr' }}>
                    <div>Rank</div>
                    <div>Student</div>
                    <div>Average Score</div>
                    <div>Total Submissions</div>
                    <div>On Time</div>
                    <div>Late</div>
                    <div>Diligence Score</div>
                  </div>
                  {topStudentsByScore.map((student, idx) => (
                    <div className="crv2-table__row" key={student.id || student.userId || idx} style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr 1fr 1fr 1fr' }}>
                      <div style={{ fontWeight: 700, color: '#6366f1' }}>#{student.rank}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar 
                          size={32} 
                          src={student.avatarUrl} 
                          icon={<UserOutlined />} 
                          style={{ backgroundColor: '#6366f1' }} 
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.name || student.email}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{student.email}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{Number(student.averageScore ?? 0).toFixed(2)}</div>
                      <div style={{ color: '#1f2937' }}>{student.totalSubmissions ?? 0}</div>
                      <div style={{ color: '#22c55e', fontWeight: 500 }}>{student.onTimeSubmissions ?? 0}</div>
                      <div style={{ color: '#ef4444', fontWeight: 500 }}>{student.lateSubmissions ?? 0}</div>
                      <div style={{ fontWeight: 600, color: '#6366f1' }}>{Number(student.diligenceScore ?? 0).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Daily Challenges Analysis Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
          <Col xs={24}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileTextOutlined style={{ color: '#ec4899', fontSize: 20 }} />
                  <div className="crv2-title">Daily Challenges Analysis</div>
                </div>
                <Select
                  value={selectedSkill}
                  onChange={setSelectedSkill}
                  style={{ width: 200 }}
                  placeholder="Select skill"
                >
                  {availableSkills.map(skill => (
                    <Select.Option key={skill} value={skill}>{formatSkillName(skill)}</Select.Option>
                  ))}
                </Select>
              </div>
              {dailyChallengesChartData.length === 0 ? (
                <Empty description="No daily challenge data" />
              ) : (
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <ComposedChart 
                      data={dailyChallengesChartData}
                      margin={{ top: 20, right: 30, bottom: 50, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }} 
                        angle={-20} 
                        textAnchor="end" 
                        height={60}
                        label={{ value: 'Daily Challenges', position: 'insideBottom', offset: 10 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Số lượng', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 'dataMax']}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${Number(v).toFixed(1)}`}
                        label={{ value: 'Điểm TB', angle: 90, position: 'insideRight' }}
                      />
                      <ReTooltip 
                        formatter={(value, name) => {
                          if (name === 'averageScore') {
                            return [`${Number(value).toFixed(2)}`, 'Điểm TB'];
                          }
                          if (name === 'onTimeSubmissions') {
                            return [value, 'Nộp đúng hạn'];
                          }
                          if (name === 'lateSubmissions') {
                            return [value, 'Nộp muộn'];
                          }
                          if (name === 'notSubmitted') {
                            return [value, 'Chưa nộp'];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ marginTop: 20 }} />
                      <Bar yAxisId="left" dataKey="onTimeSubmissions" stackId="submissions" fill="#a5d6a7" name="Nộp đúng hạn" />
                      <Bar yAxisId="left" dataKey="lateSubmissions" stackId="submissions" fill="#ef9a9a" name="Nộp muộn" />
                      <Bar yAxisId="left" dataKey="notSubmitted" stackId="submissions" fill="#ffccbc" name="Chưa nộp" />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="averageScore" 
                        stroke="#81d4fa" 
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#81d4fa' }}
                        activeDot={{ r: 6, fill: '#4fc3f7' }}
                        name="Điểm TB"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Challenge Progress by All Skills */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 300,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                  <div className="crv2-title">Challenge Progress by All Skills</div>
                </div>
                <Select
                  value={selectedProgressSkill}
                  onChange={setSelectedProgressSkill}
                  style={{ width: 200 }}
                  placeholder="Select skill"
                >
                  {availableSkills.map(skill => (
                    <Select.Option key={skill} value={skill}>{formatSkillName(skill)}</Select.Option>
                  ))}
                </Select>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <ReBarChart data={challengeProgressData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={120} />
                    <ReTooltip 
                      formatter={(value, name, props) => {
                        const count = props.payload?.count ?? 0;
                        return [`${value}% (${count} challenges)`, props.payload?.stage || name];
                      }} 
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {challengeProgressData.map((entry, index) => (
                        <Cell key={`progress-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>


      </div>
    </ThemedLayout>
  );
};

export default ClassReport;
