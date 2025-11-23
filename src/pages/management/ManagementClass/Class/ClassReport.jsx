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
  WarningOutlined,
  ArrowDownOutlined,
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
  LabelList,
  ComposedChart,
} from 'recharts';
import { useTheme } from '../../../../contexts/ThemeContext';
import ThemedLayoutWithSidebar from '../../../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../../../component/teacherlayout/ThemedLayout';
import { classManagementApi } from '../../../../apis/apis';
import axiosClient from '../../../../apis';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { spaceToast } from '../../../../component/SpaceToastify';
import { useClassMenu } from '../../../../contexts/ClassMenuContext';
import usePageTitle from '../../../../hooks/usePageTitle';
import './ClassReportV2.css';

const ROLE_COLORS = ['#c0aaff', '#80b9ff', '#7dd3b8', '#ffc98a', '#f79ac0', '#9aa7ff'];

// Mapping skill name to skill code for API
const SKILL_CODE_MAP = {
  'VOCABULARY': 'GV',
  'READING': 'RE',
  'LISTENING': 'LI',
  'WRITING': 'WR',
  'SPEAKING': 'SP',
};

// Human-readable labels for skill codes (used in charts)
const SKILL_LABEL_MAP = {
  GV: 'Grammar & Vocabulary',
  RE: 'Reading',
  LI: 'Listening',
  WR: 'Writing',
  SP: 'Speaking',
};

// Convert skill name to skill code
const getSkillCode = (skillName) => {
  return SKILL_CODE_MAP[skillName] || skillName;
};

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
  // Sorting for Top Students table (FE only). Default: Average Score
  const [sortBy, setSortBy] = useState('averageScore');
  const [challengeStatsBySkill, setChallengeStatsBySkill] = useState([]);
  const [challengeProgress, setChallengeProgress] = useState([]);
  const [atRiskSummary, setAtRiskSummary] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);

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
          // Get members once; sorting of students is handled on FE
          classManagementApi.getClassReportMembers(id),
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
              'TEACHER': { name: t('classReport.teachers'), color: ROLE_COLORS[0] },
              'STUDENT': { name: t('classReport.students'), color: ROLE_COLORS[1] },
              'TEACHING_ASSISTANT': { name: t('classReport.teachingAssistants'), color: ROLE_COLORS[2] },
              'TEST_TAKER': { name: t('classReport.testTakers'), color: ROLE_COLORS[3] },
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
  }, [id, t]);

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
        // Convert skill name to skill code for API
        const skillCode = getSkillCode(selectedSkill);
        const response = await classManagementApi.getClassChallengeStatsBySkill(id, skillCode);
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

  // Load at-risk students data
  useEffect(() => {
    if (!id) return;

    const loadAtRiskStudents = async () => {
      try {
        const fetchFn =
          typeof classManagementApi.getClassAtRiskStudents === 'function'
            ? classManagementApi.getClassAtRiskStudents
            : (classId) => axiosClient.get(`/reports/class/${classId}/at-risk`);

        const response = await fetchFn(id);
        const apiData = response?.data?.data || response?.data || {};

        setAtRiskSummary({
          classId: apiData.classId,
          className: apiData.className,
          minChallengesRequired: apiData.minChallengesRequired ?? 0,
          totalStudents: Array.isArray(apiData.students) ? apiData.students.length : 0,
        });

        if (Array.isArray(apiData.students)) {
          setAtRiskStudents(apiData.students);
        } else {
          setAtRiskStudents([]);
        }
      } catch (err) {
        console.error('Error loading at-risk students:', err);
        spaceToast.error(err.response?.data?.message || 'Failed to load at-risk students');
        setAtRiskStudents([]);
      }
    };

    loadAtRiskStudents();
  }, [id]);

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

    const rankings = [...studentRankings];

    // FE-only sorting
    if (sortBy === 'improvementScore') {
      rankings.sort((a, b) => (b.improvementScore ?? 0) - (a.improvementScore ?? 0));
    } else {
      // Default: sort by Average Score
      rankings.sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
    }

    return rankings
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
        improvementScore: s.improvementScore ?? 0,
        rank: idx + 1,
      }));
  }, [studentRankings, sortBy]);


  // Daily challenges chart data from API (challenge stats by skill)
  const dailyChallengesChartData = useMemo(() => {
    if (!challengeStatsBySkill || challengeStatsBySkill.length === 0) return [];
    
    return challengeStatsBySkill.map((challenge, index) => ({
      name: challenge.challengeName || `DC ${challenge.challengeId}`,
      dcName: challenge.challengeName || `DC ${challenge.challengeId}`,
      averageScore: challenge.averageScore ?? 0,
      onTimeSubmissions: challenge.onTimeCount ?? 0,
      lateSubmissions: challenge.lateCount ?? 0,
      notSubmitted: challenge.notSubmittedCount ?? 0,
      totalSubmissions: (challenge.onTimeCount ?? 0) + (challenge.lateCount ?? 0) + (challenge.notSubmittedCount ?? 0),
    }));
  }, [challengeStatsBySkill]);


  const availableSkills = useMemo(() => {
    const skills = ['VOCABULARY', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];
    return skills;
  }, []);

  // Challenge progress chart data by selected skill
  const challengeProgressSource = useMemo(() => {
    if (!challengeProgress || challengeProgress.length === 0) {
      return [];
    }
    return challengeProgress;
  }, [challengeProgress]);

  const formatSkillName = (skill) => {
    if (!skill) return '';
    return skill.charAt(0) + skill.slice(1).toLowerCase();
  };

  const challengeProgressData = useMemo(() => {
    if (!challengeProgressSource || challengeProgressSource.length === 0) {
      return [];
    }

    const calculatePercentage = (percentageValue, countValue, totalCount) => {
      if (typeof percentageValue === 'number') {
        return Number(percentageValue);
      }
      if (!totalCount) return 0;
      return Number(((countValue || 0) / totalCount) * 100);
    };

    return challengeProgressSource.map((skillData) => {
      const rawSkillKey = skillData.skill || skillData.skillName || '';
      const skillKey = (rawSkillKey || '').toString().toUpperCase();
      const breakdown = skillData.statusBreakdown || {};
      const draftCount = breakdown.draft ?? 0;
      const publishedCount = breakdown.published ?? 0;
      const inProgressCount = breakdown.inProgress ?? 0;
      const finishedCount = breakdown.finished ?? 0;
      const totalCount = draftCount + publishedCount + inProgressCount + finishedCount;

      const draftValue = calculatePercentage(breakdown.draftPercentage, draftCount, totalCount);
      const publishedValue = calculatePercentage(breakdown.publishedPercentage, publishedCount, totalCount);
      const inProgressValue = calculatePercentage(breakdown.inProgressPercentage, inProgressCount, totalCount);
      const finishedValue = calculatePercentage(breakdown.finishedPercentage, finishedCount, totalCount);

      const skillLabel = SKILL_LABEL_MAP[skillKey] || formatSkillName(skillKey);

      return {
        // skillCode can be useful later if needed
        skillCode: skillKey,
        // This is what we show on Y-axis
        skill: skillLabel,
        draftValue,
        draftCount,
        draftLabel: draftCount ? `${t('classReport.draft')} (${draftCount})` : '',
        publishedValue,
        publishedCount,
        publishedLabel: publishedCount ? `${t('classReport.published')} (${publishedCount})` : '',
        inProgressValue,
        inProgressCount,
        inProgressLabel: inProgressCount ? `${t('classReport.inProgress')} (${inProgressCount})` : '',
        finishedValue,
        finishedCount,
        finishedLabel: finishedCount ? `${t('classReport.finished')} (${finishedCount})` : '',
      };
    });
  }, [challengeProgressSource, t]);

  const renderStackLabel = (labelKey) => (props) => {
    const { x, y, width, height, payload } = props;
    const label = payload?.[labelKey];
    if (!label || width <= 0 || height <= 0) {
      return null;
    }

    const isCompact = width < 40;
    const textX = isCompact ? x + width + 6 : x + width / 2;
    const textY = y + height / 2;
    const textColor = '#1f2937';

    return (
      <text
        x={textX}
        y={textY}
        fill={textColor}
        fontSize={12}
        fontWeight={600}
        dominantBaseline="middle"
        textAnchor={isCompact ? 'start' : 'middle'}
      >
        {label}
      </text>
    );
  };

  const challengeProgressTooltipFormatter = (value, name, item) => {
    const payload = item?.payload || {};
    const dataKey = item?.dataKey || '';
    const countKey = dataKey.replace('Value', 'Count');
    const count = payload[countKey] ?? 0;
    const percentage = Number(value ?? 0).toFixed(1);
    return [`${percentage}% (${count} challenges)`, name];
  };

  const CHALLENGE_PROGRESS_ORDER = ['finishedValue', 'publishedValue', 'inProgressValue', 'draftValue'];
const CHALLENGE_PROGRESS_COLOR_MAP = {
  finishedValue: '#34d399',
  publishedValue: '#ffcc80',
  inProgressValue: '#80b9ff',
  draftValue: '#d4d4d8',
};

  const ChallengeProgressSkillTick = ({ payload, x, y }) => {
    const value = payload?.value || '';
    const lines =
      value === 'Grammar & Vocabulary'
        ? ['Grammar &', 'Vocabulary']
        : [value];

    return (
      <text
        x={x - 4}
        y={y}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill="#111827"
      >
        {lines.map((line, index) => (
          <tspan key={`${value}-${index}`} x={x - 4} dy={index === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  // Legend payload for "Challenge Progress by All Skills"
  // Keep pastel colors and fixed order: Finished, Published, In Progress, Draft
  const challengeProgressLegendPayload = useMemo(
    () => [
      // Use green & blue tones similar to Role Distribution
      { value: t('classReport.finished'), type: 'square', dataKey: 'finishedValue', color: '#34d399' }, // green
      { value: t('classReport.published'), type: 'square', dataKey: 'publishedValue', color: '#ffcc80' }, // pastel yellow-orange
      { value: t('classReport.inProgress'), type: 'square', dataKey: 'inProgressValue', color: '#80b9ff' }, // blue
      { value: t('classReport.draft'), type: 'square', dataKey: 'draftValue', color: '#d4d4d8' }, // neutral lighter gray
    ],
    [t]
  );

  // Custom legend for "Challenge Progress by All Skills"
  // Fixed order + consistent colors with bars
  const renderChallengeProgressLegend = () => {
    return (
      <ul
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          listStyle: 'none',
          marginTop: 16,
          marginBottom: 0,
          padding: 0,
          flexWrap: 'wrap',
          fontSize: 12,
        }}
      >
        {challengeProgressLegendPayload.map((entry) => (
          <li
            key={entry.dataKey}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: entry.color,
              }}
            />
            <span
              style={{
                color: entry.color,
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  // Custom tooltip for "Challenge Progress by All Skills"
  // Order + colors: Finished, Published, In Progress, Draft
  const renderChallengeProgressTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const orderedItems = payload
      .filter((item) => item && item.dataKey && CHALLENGE_PROGRESS_ORDER.includes(item.dataKey))
      .sort(
        (a, b) =>
          CHALLENGE_PROGRESS_ORDER.indexOf(a.dataKey) -
          CHALLENGE_PROGRESS_ORDER.indexOf(b.dataKey)
      );

    if (!orderedItems.length) return null;

    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 10,
          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          fontSize: 12,
        }}
      >
        {label && (
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#111827' }}>
            {label}
          </div>
        )}
        {orderedItems.map((item) => {
          const [valueLabel] = challengeProgressTooltipFormatter(
            item.value,
            item.name,
            item
          );
          const color = CHALLENGE_PROGRESS_COLOR_MAP[item.dataKey] || item.color;

          return (
            <div
              key={item.dataKey}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: color,
                }}
              />
              <span style={{ color: '#374151' }}>
                <span style={{ fontWeight: 500 }}>{item.name}</span>: {valueLabel}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render summary cards
  const renderSummaryCards = (cards = []) => (
    <Row gutter={[12, 16]} style={{ marginBottom: 24, marginTop: 32 }}>
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
            <div style={{ fontSize: 40, fontWeight: 600, marginBottom: 8, lineHeight: 1, color: '#1f2937' }}>
              {stat.value}
            </div>
            <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
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
        subtitle: t('classReport.classAverage'),
        icon: <TrophyOutlined style={{ color: '#f59e0b' }} />,
        bg: '#fff7ed',
      },
      {
        key: 'completionPercentage',
        title: t('classReport.completionPercentage', 'Completion %'),
        value: `${Number(overviewData.completionPercentage ?? 0).toFixed(1)}%`,
        subtitle: t('classReport.overallCompletion'),
        icon: <CheckCircleOutlined style={{ color: '#22c55e' }} />,
        bg: '#ecfdf5',
      },
      {
        key: 'lessons',
        title: t('classReport.lessons', 'Lessons'),
        value: `${overviewData.totalLessonsLearned ?? 0}/${overviewData.totalLessons ?? 0}`,
        subtitle: t('classReport.learnedTotal'),
        icon: <BookOutlined style={{ color: '#6366f1' }} />,
        bg: '#eef2ff',
      },
      {
        key: 'dailyChallenges',
        title: t('classReport.totalDailyChallenges', 'Daily Challenges'),
        value: overviewData.totalDailyChallenges ?? 0,
        subtitle: t('classReport.totalDCs'),
        icon: <FileTextOutlined style={{ color: '#ec4899' }} />,
        bg: '#fdf2f8',
      },
    ];
  }, [overviewData, t]);

  // Layout helpers
  const isAtRiskScrollable = atRiskStudents && atRiskStudents.length > 2;

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
                <div className="crv2-title">{t('classReport.roleDistribution')}</div>
              </div>
              {roleDistributionData.length === 0 ? (
                <Empty description={t('classReport.noData')} />
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
                        startAngle={90}
                        endAngle={-270}
                        label={({ name, percentage }) => `${name} (${Number(percentage).toFixed(2)}%)`}
                      >
                        {roleDistributionData.map((entry, index) => (
                          <Cell key={`role-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ marginTop: 12 }} />
                      <ReTooltip 
                        formatter={(value, name, props) => {
                          return [`${value} ${t('classReport.members')}`, name];
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
                <div className="crv2-title">{t('classReport.teacherActivity')}</div>
              </div>
              {teacherActivityData.length === 0 ? (
                <Empty description={t('classReport.noActivityData')} />
              ) : (
                <div style={{ width: '100%', height: 380 }}>
                  <ResponsiveContainer>
                    <ReBarChart data={teacherActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Legend />
                      <ReTooltip />
                      <Bar dataKey="creatingAssignments" fill="#90caf9" radius={[6, 6, 0, 0]} name={t('classReport.creating')} />
                      <Bar dataKey="gradingAssignments" fill="#a5d6a7" radius={[6, 6, 0, 0]} name={t('classReport.grading')} />
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
                  <div className="crv2-title">{t('classReport.topStudentsByScore')}</div>
                </div>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 150 }}
                  size="small"
                >
                  <Select.Option value="averageScore">{t('classReport.averageScore')}</Select.Option>
                  <Select.Option value="improvementScore">{t('classReport.improvementScore')}</Select.Option>
                </Select>
              </div>
              {topStudentsByScore.length === 0 ? (
                <Empty description={t('classReport.noStudentData')} />
              ) : (
                <div className="crv2-table crv2-scroll">
                  <div className="crv2-table__head" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr 1fr 1fr 1fr' }}>
                    <div>{t('classReport.rank')}</div>
                    <div>{t('classReport.student')}</div>
                    <div>{t('classReport.averageScore')}</div>
                    <div>{t('classReport.totalSubmissions')}</div>
                    <div>{t('classReport.onTime')}</div>
                    <div>{t('classReport.late')}</div>
                    <div>{t('classReport.improvementScore')}</div>
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
                      <div style={{ fontWeight: 600, color: '#6366f1' }}>{Number(student.improvementScore ?? 0).toFixed(1)}</div>
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
                  <div className="crv2-title">{t('classReport.dailyChallengesAnalysis')}</div>
                </div>
                <Select
                  value={selectedSkill}
                  onChange={setSelectedSkill}
                  style={{ width: 200 }}
                  placeholder={t('classReport.selectSkill')}
                >
                  {availableSkills.map(skill => (
                    <Select.Option key={skill} value={skill}>{formatSkillName(skill)}</Select.Option>
                  ))}
                </Select>
              </div>
              {dailyChallengesChartData.length === 0 ? (
                <Empty description={t('classReport.noDailyChallengeData')} />
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
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        label={{ value: t('classReport.dailyChallenges'), position: 'insideBottom', offset: 10 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        label={{ value: t('classReport.quantity'), angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 'dataMax']}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${Number(v).toFixed(1)}`}
                        label={{ value: t('classReport.averageScore'), angle: 90, position: 'insideRight' }}
                      />
                      <ReTooltip 
                        formatter={(value, name) => {
                          if (name === 'averageScore') {
                            return [`${Number(value).toFixed(2)}`, t('classReport.averageScore')];
                          }
                          if (name === 'onTimeSubmissions') {
                            return [value, t('classReport.onTime')];
                          }
                          if (name === 'lateSubmissions') {
                            return [value, t('classReport.late')];
                          }
                          if (name === 'notSubmitted') {
                            return [value, t('classReport.notSubmitted')];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ marginTop: 20 }} />
                      <Bar yAxisId="left" dataKey="onTimeSubmissions" stackId="submissions" fill="#a5d6a7" name={t('classReport.onTime')} />
                      <Bar yAxisId="left" dataKey="lateSubmissions" stackId="submissions" fill="#ef9a9a" name={t('classReport.late')} />
                      <Bar yAxisId="left" dataKey="notSubmitted" stackId="submissions" fill="#fbbf24" name={t('classReport.notSubmitted')} />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="averageScore" 
                        stroke="#81d4fa" 
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#81d4fa' }}
                        activeDot={{ r: 6, fill: '#4fc3f7' }}
                        name={t('classReport.averageScore')}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Challenge Progress & At-risk Students */}
        <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
          <Col xs={24} xl={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 300,
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <BarChartOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <div className="crv2-title">{t('classReport.challengeProgressByAllSkills')}</div>
              </div>
              {challengeProgressData.length === 0 ? (
                <Empty description={t('classReport.noChallengeProgressData')} />
              ) : (
                <div
                  style={{
                    width: 'calc(100% + 64px)',
                    margin: '0 -40px',
                    paddingLeft: 10,
                    paddingRight: 32,
                    height: 320,
                  }}
                >
                  <ResponsiveContainer>
                    <ReBarChart data={challengeProgressData} layout="vertical" margin={{ top: 24, right: 16, bottom: 10, left: -14 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                      />
                      <YAxis type="category" dataKey="skill" tick={<ChallengeProgressSkillTick />} width={130} />
                      <ReTooltip content={renderChallengeProgressTooltip} />
                      <Legend wrapperStyle={{ marginTop: 12 }} content={renderChallengeProgressLegend} />
                      <Bar dataKey="finishedValue" name={t('classReport.finished')} stackId="progress" fill="#34d399">
                        <LabelList content={renderStackLabel('finishedLabel')} />
                      </Bar>
                      <Bar dataKey="publishedValue" name={t('classReport.published')} stackId="progress" fill="#ffcc80">
                        <LabelList content={renderStackLabel('publishedLabel')} />
                      </Bar>
                      <Bar dataKey="inProgressValue" name={t('classReport.inProgress')} stackId="progress" fill="#80b9ff">
                        <LabelList content={renderStackLabel('inProgressLabel')} />
                      </Bar>
                      <Bar dataKey="draftValue" name={t('classReport.draft')} stackId="progress" fill="#d4d4d8">
                        <LabelList content={renderStackLabel('draftLabel')} />
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              style={{
                backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                border: 'none',
                borderRadius: 16,
                boxShadow: theme === 'sun' ? '0 10px 24px rgba(0,0,0,0.08)' : undefined,
                paddingTop: 8,
                minHeight: 400,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <WarningOutlined style={{ color: '#ef4444', fontSize: 20 }} />
                <div className="crv2-title">{t('classReport.atRiskStudents')}</div>
                <div style={{ 
                  marginLeft: 'auto', 
                  padding: '4px 12px', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#dc2626'
                }}>
                  {atRiskSummary?.totalStudents ?? 0} {t('classReport.studentsNeedAttention')}
                </div>
              </div>
              {(!atRiskStudents || atRiskStudents.length === 0) ? (
                <Empty description={t('classReport.noAtRiskStudents')} />
              ) : (
                <div
                  className={isAtRiskScrollable ? 'crv2-at-risk-scroll' : ''}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {atRiskStudents.map((student, idx) => {
                    const scoreRisks = [];
                    const submissionRisks = [];
                    const skillRisks = [];
                    let hasCheatingFlag = false;

                    if (Array.isArray(student.riskTypes)) {
                      student.riskTypes.forEach((type) => {
                        switch (type) {
                          case 'LOW_SCORES':
                            scoreRisks.push(t('classReport.threeConsecutiveChallenges'));
                            break;
                          case 'FREQUENT_LATE_SUBMISSIONS':
                            submissionRisks.push(t('classReport.fiftyPercentLate'));
                            break;
                          case 'SUSPECTED_CHEATING':
                            hasCheatingFlag = true;
                            break;
                          case 'DECLINING_VOCABULARY':
                            skillRisks.push(t('classReport.grammarVocabularyDropping'));
                            break;
                          case 'DECLINING_READING':
                            skillRisks.push(t('classReport.readingDropping'));
                            break;
                          case 'DECLINING_LISTENING':
                            skillRisks.push(t('classReport.listeningDropping'));
                            break;
                          case 'DECLINING_WRITING':
                            skillRisks.push(t('classReport.writingDropping'));
                            break;
                          case 'DECLINING_SPEAKING':
                            skillRisks.push(t('classReport.speakingDropping'));
                            break;
                          default:
                            break;
                        }
                      });
                    }

                    // Get declining skills from API data
                    const decliningSkills = Array.isArray(student.decliningSkills) ? student.decliningSkills : [];

                    const tabSwitches = student.totalTabSwitches ?? 0;
                    const copyAttempts = student.totalCopyAttempts ?? 0;
                    const hasCheatingSignals = tabSwitches > 0 || copyAttempts > 0;

                    return (
                      <div
                        key={student.id || student.userId || idx}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 16,
                          border: '1px solid #e5e7eb',
                          background:
                            idx % 2 === 0 ? 'rgba(15,118,110,0.03)' : 'rgba(15,118,110,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>#{idx + 1}</span>
                            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                              {student.fullName || student.name}
                            </span>
                            {student.recentChallengesAnalyzed ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#0f766e',
                                  background: '#d1fae5',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.4,
                                }}
                              >
                                {t('classReport.analyzedLastChallenges', { count: student.recentChallengesAnalyzed })}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 140 }}>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{t('classReport.recentAvgScore')}</div>
                            <div style={{ fontWeight: 600, fontSize: 18, color: '#0f172a' }}>
                              {Number(student.recentAverageScore ?? 0).toFixed(2)}
                            </div>
                          </div>
                          <div style={{ minWidth: 120 }}>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{t('classReport.lateSubmissions')}</div>
                            <div style={{ fontWeight: 600, fontSize: 18, color: '#dc2626' }}>
                              {student.lateSubmissionsCount ?? 0}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: 13, color: '#111827', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {scoreRisks.length > 0 && (
                            <div>
                              <span style={{ fontWeight: 600 }}>{t('classReport.scorePattern')} </span>
                              <span>{scoreRisks.join('; ')}</span>
                            </div>
                          )}
                          {submissionRisks.length > 0 && (
                            <div>
                              <span style={{ fontWeight: 600 }}>{t('classReport.submissionBehavior')} </span>
                              <span>{submissionRisks.join('; ')}</span>
                            </div>
                          )}
                          {((decliningSkills.length > 0) || skillRisks.length > 0) && (
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 10,
                              padding: '14px 16px',
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#fafafa',
                            }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{t('classReport.skillTrends')} </span>
                                {skillRisks.length > 0 && (
                                  <span>{skillRisks.join('; ')}</span>
                                )}
                                {decliningSkills.length > 0 && skillRisks.length === 0 && (
                                  <span>
                                    {decliningSkills.map((skill, idx) => skill.skillName || t('classReport.unknownSkill')).join('; ')} {t('classReport.scoreDropping')}
                                  </span>
                                )}
                              </div>
                              {decliningSkills.length > 0 && (
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: 10, 
                                  marginLeft: 16,
                                  marginTop: 4,
                                  paddingLeft: 16,
                                  borderLeft: '3px solid #fecaca',
                                  position: 'relative'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: -6,
                                    top: -2,
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    backgroundColor: '#fecaca',
                                    border: '2px solid #ffffff'
                                  }} />
                                  {decliningSkills.map((skill, skillIdx) => {
                                    const latestScore = Number(skill.latestScore ?? 0);
                                    const averageScore = Number(skill.averageScore ?? 0);
                                    const scoreDrop = Number(skill.scoreDrop ?? 0);
                                    const isSevere = scoreDrop >= 3 || latestScore < 4;
                                    
                                    return (
                                      <div
                                        key={skillIdx}
                                        style={{
                                          display: 'flex',
                                          gap: 16,
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <div style={{ minWidth: 140 }}>
                                          <div style={{ fontSize: 12, color: '#6b7280' }}>{t('classReport.latestScore')}</div>
                                          <div style={{ fontWeight: 600, fontSize: 18, color: isSevere ? '#dc2626' : '#f59e0b' }}>
                                            {latestScore.toFixed(2)}
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                            <ArrowDownOutlined style={{ fontSize: 12, color: '#dc2626' }} />
                                            <span style={{ fontWeight: 600, fontSize: 14, color: '#dc2626' }}>
                                              {scoreDrop.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                        <div style={{ minWidth: 120 }}>
                                          <div style={{ fontSize: 12, color: '#6b7280' }}>{t('classReport.averageScore')}</div>
                                          <div style={{ fontWeight: 600, fontSize: 18, color: '#0f172a' }}>
                                            {averageScore.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {(hasCheatingFlag || hasCheatingSignals) && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 10,
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{t('classReport.cheatingSignals')}</span>
                              <span>
                                {[
                                  hasCheatingFlag ? t('classReport.suspiciousBehaviorDetected') : null,
                                  hasCheatingSignals ? t('classReport.activityAnomaliesRecorded') : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </div>
                          )}
                          {!scoreRisks.length &&
                            !submissionRisks.length &&
                            !skillRisks.length &&
                            !decliningSkills.length &&
                            !hasCheatingFlag &&
                            !hasCheatingSignals && <span>—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </ThemedLayout>
  );
};

export default ClassReport;
