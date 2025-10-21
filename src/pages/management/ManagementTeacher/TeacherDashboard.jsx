import React, { useState, useEffect, useCallback } from 'react';
import {
	Button,
	Card,
	Row,
	Col,
	Table,
	Statistic,
	Progress,
	Avatar,
	List,
	Select,
} from 'antd';
import {
	UserOutlined,
	TrophyOutlined,
	BookOutlined,
	BarChartOutlined,
	CalendarOutlined,
	TeamOutlined,
	ClockCircleOutlined,
	RocketOutlined,
	SunOutlined,
	MoonOutlined,
} from '@ant-design/icons';
import ThemedLayout from '../../../component/teacherlayout/ThemedLayout';
import LoadingWithEffect from '../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spaceToast } from '../../../component/SpaceToastify';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

// Mock data for teacher dashboard
const mockTeacherData = {
	id: 1,
	name: 'Nguyễn Văn Teacher',
	email: 'teacher@fpt.edu.vn',
	avatar: '/img/teacher_avatar/teacher1.png',
	totalClasses: 4,
	totalStudents: 60,
	totalChallenges: 12,
	averageRating: 4.8,
};

// Mock classes data
const mockClasses = [
	{
		id: 1,
		name: 'Rising Stars 1',
		studentCount: 15,
		color: '#4d9de0', // Primary blue
		status: 'active',
		averageScore: 85,
		completionRate: 92,
		lastActivity: '2 hours ago',
		nextClass: 'Tomorrow 9:00 AM',
	},
	{
		id: 2,
		name: 'Rising Stars 2',
		studentCount: 18,
		color: '#52c41a', // Secondary green
		status: 'active',
		averageScore: 78,
		completionRate: 88,
		lastActivity: '1 hour ago',
		nextClass: 'Today 2:00 PM',
	},
	{
		id: 3,
		name: 'Rising Stars 3',
		studentCount: 12,
		color: '#fa8c16', // Accent orange
		status: 'active',
		averageScore: 92,
		completionRate: 95,
		lastActivity: '3 hours ago',
		nextClass: 'Friday 10:00 AM',
	},
	{
		id: 4,
		name: 'Rising Stars 4',
		studentCount: 15,
		color: '#4d9de0', // Primary blue
		status: 'active',
		averageScore: 80,
		completionRate: 90,
		lastActivity: '5 hours ago',
		nextClass: 'Monday 11:00 AM',
	},
];

// Mock recent activities
const mockRecentActivities = [
	{
		id: 1,
		type: 'test_completed',
		class: 'Rising Stars 1',
		student: 'Nguyễn Văn An',
		score: 95,
		timestamp: '2 hours ago',
		icon: <TrophyOutlined style={{ color: '#52c41a' }} />, // Secondary green
	},
	{
		id: 2,
		type: 'challenge_created',
		class: 'Rising Stars 2',
		challenge: 'Grammar Challenge',
		timestamp: '4 hours ago',
		icon: <RocketOutlined style={{ color: '#4d9de0' }} />, // Primary blue
	},
	{
		id: 3,
		type: 'student_joined',
		class: 'Rising Stars 3',
		student: 'Trần Thị Bình',
		timestamp: '6 hours ago',
		icon: <UserOutlined style={{ color: '#fa8c16' }} />, // Accent orange
	},
	{
		id: 4,
		type: 'assignment_submitted',
		class: 'Rising Stars 1',
		student: 'Lê Văn Cường',
		score: 88,
		timestamp: '8 hours ago',
		icon: <BookOutlined style={{ color: '#52c41a' }} />, // Secondary green
	},
];

// Mock performance data
const mockPerformanceData = [
	{ month: 'Jan', averageScore: 75, students: 60 },
	{ month: 'Feb', averageScore: 78, students: 60 },
	{ month: 'Mar', averageScore: 82, students: 60 },
	{ month: 'Apr', averageScore: 85, students: 60 },
	{ month: 'May', averageScore: 83, students: 60 },
	{ month: 'Jun', averageScore: 87, students: 60 },
];

// Mock student progress data for each class
const mockStudentProgress = [
	{
		classId: 1,
		className: 'Rising Stars 1',
		students: [
			{
				name: 'Nguyễn Văn An',
				assignmentsSubmitted: 18,
				totalAssignments: 20,
				submissionRate: 90,
				lastSubmission: '2 hours ago',
			},
			{
				name: 'Trần Thị Bình',
				assignmentsSubmitted: 16,
				totalAssignments: 20,
				submissionRate: 80,
				lastSubmission: '1 day ago',
			},
			{
				name: 'Lê Văn Cường',
				assignmentsSubmitted: 19,
				totalAssignments: 20,
				submissionRate: 95,
				lastSubmission: '30 minutes ago',
			},
			{
				name: 'Phạm Thị Dung',
				assignmentsSubmitted: 15,
				totalAssignments: 20,
				submissionRate: 75,
				lastSubmission: '3 days ago',
			},
			{
				name: 'Hoàng Văn Em',
				assignmentsSubmitted: 14,
				totalAssignments: 20,
				submissionRate: 70,
				lastSubmission: '5 days ago',
			},
		],
	},
	{
		classId: 2,
		className: 'Rising Stars 2',
		students: [
			{
				name: 'Vũ Thị Phương',
				assignmentsSubmitted: 17,
				totalAssignments: 20,
				submissionRate: 85,
				lastSubmission: '1 hour ago',
			},
			{
				name: 'Đặng Văn Giang',
				assignmentsSubmitted: 13,
				totalAssignments: 20,
				submissionRate: 65,
				lastSubmission: '4 days ago',
			},
			{
				name: 'Bùi Thị Hoa',
				assignmentsSubmitted: 18,
				totalAssignments: 20,
				submissionRate: 90,
				lastSubmission: '2 hours ago',
			},
			{
				name: 'Ngô Văn Ích',
				assignmentsSubmitted: 12,
				totalAssignments: 20,
				submissionRate: 60,
				lastSubmission: '1 week ago',
			},
			{
				name: 'Dương Thị Kim',
				assignmentsSubmitted: 19,
				totalAssignments: 20,
				submissionRate: 95,
				lastSubmission: '1 hour ago',
			},
		],
	},
	{
		classId: 3,
		className: 'Rising Stars 3',
		students: [
			{
				name: 'Lý Văn Long',
				assignmentsSubmitted: 20,
				totalAssignments: 20,
				submissionRate: 100,
				lastSubmission: '30 minutes ago',
			},
			{
				name: 'Mai Thị Mỹ',
				assignmentsSubmitted: 18,
				totalAssignments: 20,
				submissionRate: 90,
				lastSubmission: '2 hours ago',
			},
			{
				name: 'Phan Văn Nam',
				assignmentsSubmitted: 17,
				totalAssignments: 20,
				submissionRate: 85,
				lastSubmission: '1 day ago',
			},
			{
				name: 'Võ Thị Oanh',
				assignmentsSubmitted: 16,
				totalAssignments: 20,
				submissionRate: 80,
				lastSubmission: '2 days ago',
			},
			{
				name: 'Tôn Văn Phúc',
				assignmentsSubmitted: 19,
				totalAssignments: 20,
				submissionRate: 95,
				lastSubmission: '1 hour ago',
			},
		],
	},
	{
		classId: 4,
		className: 'Rising Stars 4',
		students: [
			{
				name: 'Chu Thị Quỳnh',
				assignmentsSubmitted: 15,
				totalAssignments: 20,
				submissionRate: 75,
				lastSubmission: '3 days ago',
			},
			{
				name: 'Hồ Văn Rồng',
				assignmentsSubmitted: 16,
				totalAssignments: 20,
				submissionRate: 80,
				lastSubmission: '2 days ago',
			},
			{
				name: 'Lưu Thị Sương',
				assignmentsSubmitted: 14,
				totalAssignments: 20,
				submissionRate: 70,
				lastSubmission: '4 days ago',
			},
			{
				name: 'Đinh Văn Tài',
				assignmentsSubmitted: 18,
				totalAssignments: 20,
				submissionRate: 90,
				lastSubmission: '1 hour ago',
			},
			{
				name: 'Cao Thị Uyên',
				assignmentsSubmitted: 17,
				totalAssignments: 20,
				submissionRate: 85,
				lastSubmission: '1 day ago',
			},
		],
	},
];

const TeacherDashboard = () => {
	const { t } = useTranslation();
	const { theme, isSunTheme } = useTheme();
	const navigate = useNavigate();
	const [selectedClass, setSelectedClass] = useState(1);
	const [loading, setLoading] = useState(false);
	const [teacherData, setTeacherData] = useState(null);
	const [classes, setClasses] = useState([]);
	const [recentActivities, setRecentActivities] = useState([]);

	const fetchDashboardData = useCallback(async () => {
		setLoading(true);
		try {
			// Simulate API call
			setTimeout(() => {
				setTeacherData(mockTeacherData);
				setClasses(mockClasses);
				setRecentActivities(mockRecentActivities);
				setLoading(false);
			}, 1000);
		} catch (error) {
			spaceToast.error('Error loading dashboard data');
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	const handleClassClick = (classItem) => {
		navigate(`/teacher/classes/menu/${classItem.id}`);
	};

	const handleCreateChallenge = () => {
		navigate('/teacher/daily-challenges');
	};

	const handleViewAllClasses = () => {
		navigate('/teacher/classes');
	};

	// Calculate statistics
	const totalStudents = classes.reduce(
		(sum, classItem) => sum + classItem.studentCount,
		0
	);
	const averageClassScore =
		classes.length > 0
			? Math.round(
					classes.reduce((sum, classItem) => sum + classItem.averageScore, 0) /
						classes.length
			  )
			: 0;
	const averageCompletionRate =
		classes.length > 0
			? Math.round(
					classes.reduce(
						(sum, classItem) => sum + classItem.completionRate,
						0
					) / classes.length
			  )
			: 0;
	const activeClasses = classes.filter(
		(classItem) => classItem.status === 'active'
	).length;

	const classColumns = [
		{
			title: t('teacherDashboard.className'),
			dataIndex: 'name',
			key: 'name',
			render: (text, record) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					<div
						style={{
							width: '12px',
							height: '12px',
							backgroundColor: record.color,
							borderRadius: '50%',
						}}
					/>
					<span style={{ fontWeight: 600, fontSize: '15px' }}>{text}</span>
				</div>
			),
		},
		{
			title: t('teacherDashboard.students'),
			dataIndex: 'studentCount',
			key: 'studentCount',
			sorter: (a, b) => a.studentCount - b.studentCount,
			render: (count) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<UserOutlined style={{ color: '#4d9de0' }} />
					<span style={{ fontWeight: '600' }}>{count}</span>
				</div>
			),
		},
		{
			title: t('teacherDashboard.averageScore'),
			dataIndex: 'averageScore',
			key: 'averageScore',
			sorter: (a, b) => a.averageScore - b.averageScore,
			render: (score) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<TrophyOutlined style={{ color: '#52c41a' }} />
					<span style={{ fontWeight: '600' }}>{score}/100</span>
				</div>
			),
		},
		{
			title: t('teacherDashboard.completionRate'),
			dataIndex: 'completionRate',
			key: 'completionRate',
			render: (rate) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<Progress
						percent={rate}
						size='small'
						strokeColor={
							rate >= 90 ? '#52c41a' : rate >= 80 ? '#faad14' : '#ff4d4f'
						}
						showInfo={false}
						style={{ width: '60px' }}
					/>
					<span style={{ fontWeight: '600', fontSize: '12px' }}>{rate}%</span>
				</div>
			),
		},
		{
			title: t('teacherDashboard.lastActivity'),
			dataIndex: 'lastActivity',
			key: 'lastActivity',
			render: (activity) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<ClockCircleOutlined style={{ color: '#64748b' }} />
					<span style={{ fontSize: '13px', color: '#64748b' }}>{activity}</span>
				</div>
			),
		},
		{
			title: t('teacherDashboard.nextClass'),
			dataIndex: 'nextClass',
			key: 'nextClass',
			render: (nextClass) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<CalendarOutlined style={{ color: '#4d9de0' }} />
					<span style={{ fontSize: '13px', color: '#4d9de0' }}>
						{nextClass}
					</span>
				</div>
			),
		},
		{
			title: t('teacherDashboard.actions'),
			key: 'actions',
			render: (_, record) => (
				<Button
					type='primary'
					size='small'
					onClick={() => handleClassClick(record)}
					style={{
						backgroundColor: record.color,
						borderColor: record.color,
					}}>
					{t('teacherDashboard.viewDetails')}
				</Button>
			),
		},
	];

	if (loading) {
		return (
			<ThemedLayout>
				<div className='teacher-dashboard-container'>
					<LoadingWithEffect
						loading={true}
						message={t('teacherDashboard.loadingDashboard')}
					/>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className='teacher-dashboard-container'>
				{/* Welcome Header */}
				<Card className={`welcome-header ${theme}-welcome-header`}>
					<div className='welcome-content'>
						<div className='welcome-left'>
							<div className='teacher-avatar'>
								<Avatar
									size={80}
									src={teacherData?.avatar}
									icon={<UserOutlined />}
									style={{
										backgroundColor: isSunTheme ? '#ffd700' : '#4d9de0',
										border: `3px solid ${isSunTheme ? '#ff8c00' : '#77d0ff'}`,
									}}
								/>
							</div>
							<div className='teacher-info'>
								<h1 className={`teacher-name ${theme}-teacher-name`}>
									{t('teacherDashboard.welcome')}, {teacherData?.name}!
								</h1>
								<p className={`teacher-subtitle ${theme}-teacher-subtitle`}>
								</p>
							</div>
						</div>
						<div className='welcome-right'>
							<div className={`theme-decoration ${theme}-decoration`}>
								{isSunTheme ? (
									<SunOutlined style={{ fontSize: '48px', color: '#ffd700' }} />
								) : (
									<MoonOutlined
										style={{ fontSize: '48px', color: '#4d9de0' }}
									/>
								)}
							</div>
						</div>
					</div>
				</Card>

				{/* Statistics Cards */}
				<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
					<Col xs={24} sm={12} md={6}>
						<Card className={`stat-card ${theme}-stat-card`}>
							<Statistic
								title={t('teacherDashboard.totalClasses')}
								value={activeClasses}
								prefix={<TeamOutlined />}
								valueStyle={{
									color: isSunTheme ? '#ff8c00' : '#4d9de0',
									fontSize: '28px',
									fontWeight: 'bold',
								}}
							/>
							<div className='stat-description'>
								{t('teacherDashboard.activeClasses')}
							</div>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Card className={`stat-card ${theme}-stat-card`}>
							<Statistic
								title={t('teacherDashboard.totalStudents')}
								value={totalStudents}
								prefix={<UserOutlined />}
								valueStyle={{
									color: isSunTheme ? '#ff6b6b' : '#52c41a',
									fontSize: '28px',
									fontWeight: 'bold',
								}}
							/>
							<div className='stat-description'>
								{t('teacherDashboard.acrossAllClasses')}
							</div>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Card className={`stat-card ${theme}-stat-card`}>
							<Statistic
								title={t('teacherDashboard.averageScore')}
								value={averageClassScore}
								suffix='/100'
								prefix={<TrophyOutlined />}
								valueStyle={{
									color: isSunTheme ? '#ffd700' : '#52c41a',
									fontSize: '28px',
									fontWeight: 'bold',
								}}
							/>
							<div className='stat-description'>
								{t('teacherDashboard.classAverage')}
							</div>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Card className={`stat-card ${theme}-stat-card`}>
							<Statistic
								title={t('teacherDashboard.completionRate')}
								value={averageCompletionRate}
								suffix='%'
								prefix={<BarChartOutlined />}
								valueStyle={{
									color: isSunTheme ? '#4ecdc4' : '#1890ff',
									fontSize: '28px',
									fontWeight: 'bold',
								}}
							/>
							<div className='stat-description'>
								{t('teacherDashboard.overallCompletion')}
							</div>
						</Card>
					</Col>
				</Row>

				{/* Quick Actions */}
				<Card
					className={`quick-actions-card ${theme}-quick-actions`}
					style={{ marginBottom: '24px' }}>
					<h3 className={`section-title ${theme}-section-title`}>
						{t('teacherDashboard.quickActions')}
					</h3>
					<Row gutter={[16, 16]}>
						<Col xs={24} sm={12} md={12}>
							<Button
								type='primary'
								size='large'
								icon={<RocketOutlined />}
								onClick={handleCreateChallenge}
								className={`action-button ${theme}-action-button`}
								style={{
									width: '100%',
									height: '60px',
									backgroundColor: isSunTheme ? '#ff8c00' : '#1890ff',
									borderColor: isSunTheme ? '#ff8c00' : '#1890ff',
								}}>
								{t('teacherDashboard.createChallenge')}
							</Button>
						</Col>
						<Col xs={24} sm={12} md={12}>
							<Button
								size='large'
								icon={<TeamOutlined />}
								onClick={handleViewAllClasses}
								className={`action-button ${theme}-action-button`}
								style={{
									width: '100%',
									height: '60px',
									backgroundColor: isSunTheme ? '#4ecdc4' : '#52c41a',
									borderColor: isSunTheme ? '#4ecdc4' : '#52c41a',
									color: 'white',
								}}>
								{t('teacherDashboard.viewAllClasses')}
							</Button>
						</Col>
					</Row>
				</Card>

				{/* Student Progress Chart */}
				<Card
					className={`main-content-card ${theme}-main-content`}
					style={{ marginTop: '24px' }}>
					<div className='card-header'>
						<h3 className={`section-title ${theme}-section-title`}>
							{t('teacherDashboard.assignmentSubmission')}
						</h3>
						<Select
							value={selectedClass}
							onChange={setSelectedClass}
							style={{ width: 200 }}
							options={mockClasses.map((cls) => ({
								value: cls.id,
								label: cls.name,
							}))}
						/>
					</div>
					<div className='assignment-overview-chart'>
						{(() => {
							const selectedClassData = mockStudentProgress.find(
								(cls) => cls.classId === selectedClass
							);
							if (!selectedClassData) return null;

							const totalStudents = selectedClassData.students.length;
							const totalAssignments =
								selectedClassData.students[0]?.totalAssignments || 20;
							const totalSubmitted = selectedClassData.students.reduce(
								(sum, student) => sum + student.assignmentsSubmitted,
								0
							);
							const totalPossible = totalStudents * totalAssignments;
							const overallSubmissionRate = Math.round(
								(totalSubmitted / totalPossible) * 100
							);

							// Calculate submission rate distribution
							const excellentCount = selectedClassData.students.filter(
								(s) => s.submissionRate >= 90
							).length;
							const goodCount = selectedClassData.students.filter(
								(s) => s.submissionRate >= 70 && s.submissionRate < 90
							).length;
							const needsImprovementCount = selectedClassData.students.filter(
								(s) => s.submissionRate < 70
							).length;

							return (
								<div className='chart-container'>
									{/* Overall Statistics */}
									<div className='overall-stats'>
										<div className='stat-item'>
											<div className='stat-number'>{totalStudents}</div>
											<div className='stat-label'>
												{t('teacherDashboard.totalStudents')}
											</div>
										</div>
										<div className='stat-item'>
											<div className='stat-number'>{totalAssignments}</div>
											<div className='stat-label'>
												{t('teacherDashboard.totalAssignments')}
											</div>
										</div>
										<div className='stat-item'>
											<div className='stat-number'>{totalSubmitted}</div>
											<div className='stat-label'>
												{t('teacherDashboard.totalSubmitted')}
											</div>
										</div>
										<div className='stat-item'>
											<div className='stat-number'>
												{overallSubmissionRate}%
											</div>
											<div className='stat-label'>
												{t('teacherDashboard.overallRate')}
											</div>
										</div>
									</div>

									{/* Submission Rate Distribution Chart */}
									<div className='distribution-chart'>
										<h4 className='chart-title'>
											{t('teacherDashboard.submissionDistribution')}
										</h4>
										<div className='chart-bars'>
											<div className='chart-bar-group'>
												<div className='chart-bar'>
													<div
														className='chart-bar-fill excellent'
														style={{
															height: `${
																(excellentCount / totalStudents) * 100
															}%`,
														}}
													/>
												</div>
												<div className='chart-bar-label'>
													<div className='bar-color excellent'></div>
													<span>
														{t('teacherDashboard.excellent')} ({excellentCount})
													</span>
												</div>
											</div>

											<div className='chart-bar-group'>
												<div className='chart-bar'>
													<div
														className='chart-bar-fill good'
														style={{
															height: `${(goodCount / totalStudents) * 100}%`,
														}}
													/>
												</div>
												<div className='chart-bar-label'>
													<div className='bar-color good'></div>
													<span>
														{t('teacherDashboard.good')} ({goodCount})
													</span>
												</div>
											</div>

											<div className='chart-bar-group'>
												<div className='chart-bar'>
													<div
														className='chart-bar-fill needs-improvement'
														style={{
															height: `${
																(needsImprovementCount / totalStudents) * 100
															}%`,
														}}
													/>
												</div>
												<div className='chart-bar-label'>
													<div className='bar-color needs-improvement'></div>
													<span>
														{t('teacherDashboard.needsImprovement')} (
														{needsImprovementCount})
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* Overall Progress Bar */}
									<div className='overall-progress'>
										<h4 className='chart-title'>
											{t('teacherDashboard.classProgress')}
										</h4>
										<div className='progress-container'>
											<div className='progress-bar-large'>
												<div
													className='progress-fill-large'
													style={{
														width: `${overallSubmissionRate}%`,
														backgroundColor:
															overallSubmissionRate >= 80
																? '#52c41a'
																: overallSubmissionRate >= 60
																? '#4d9de0'
																: '#fa8c16',
													}}
												/>
											</div>
											<div className='progress-text'>
												{overallSubmissionRate}%{' '}
												{t('teacherDashboard.completed')}
											</div>
										</div>
									</div>
								</div>
							);
						})()}
					</div>
				</Card>

				{/* Performance Chart */}
				<Card
					className={`main-content-card ${theme}-main-content`}
					style={{ marginTop: '24px' }}>
					<h3 className={`section-title ${theme}-section-title`}>
						{t('teacherDashboard.monthlyPerformance')}
					</h3>
					<div className='performance-chart'>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'end',
								height: '200px',
								padding: '20px 0',
							}}>
							{mockPerformanceData.map((month, index) => (
								<div
									key={index}
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										flex: 1,
									}}>
									<div
										style={{
											width: '40px',
											height: `${(month.averageScore / 100) * 150}px`,
											backgroundColor: isSunTheme ? '#ff8c00' : '#4d9de0',
											borderRadius: '4px 4px 0 0',
											marginBottom: '8px',
											minHeight: '20px',
											transition: 'all 0.3s ease',
										}}
									/>
									<span
										style={{
											fontSize: '12px',
											fontWeight: '500',
											color: isSunTheme ? '#1e40af' : '#fff',
										}}>
										{month.month}
									</span>
									<span
										style={{
											fontSize: '11px',
											color: isSunTheme
												? '#64748b'
												: 'rgba(255, 255, 255, 0.7)',
										}}>
										{month.averageScore}
									</span>
								</div>
							))}
						</div>
						<div
							style={{
								marginTop: '20px',
								textAlign: 'center',
								color: isSunTheme ? '#64748b' : 'rgba(255, 255, 255, 0.7)',
								fontSize: '14px',
							}}>
							{t('teacherDashboard.averageScoreOverTime')}
						</div>
					</div>
				</Card>

				{/* Main Content Row */}
				<Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
					{/* Classes Overview */}
					<Col xs={24} lg={16}>
						<Card className={`main-content-card ${theme}-main-content`}>
							<div className='card-header'>
								<h3 className={`section-title ${theme}-section-title`}>
									{t('teacherDashboard.myClasses')}
								</h3>
								<Button
									type='link'
									onClick={handleViewAllClasses}
									className={`view-all-button ${theme}-view-all-button`}>
									{t('teacherDashboard.viewAll')}
								</Button>
							</div>
							<Table
								columns={classColumns}
								dataSource={classes}
								rowKey='id'
								pagination={false}
								scroll={{ x: 800 }}
								className={`classes-table ${theme}-classes-table`}
							/>
						</Card>
					</Col>

					{/* Recent Activities */}
					<Col xs={24} lg={8}>
						<Card className={`main-content-card ${theme}-main-content`}>
							<h3 className={`section-title ${theme}-section-title`}>
								{t('teacherDashboard.recentActivities')}
							</h3>
							<List
								dataSource={recentActivities}
								renderItem={(activity) => (
									<List.Item className={`activity-item ${theme}-activity-item`}>
										<List.Item.Meta
											avatar={
												<div className={`activity-icon ${theme}-activity-icon`}>
													{activity.icon}
												</div>
											}
											title={
												<div
													className={`activity-title ${theme}-activity-title`}>
													{activity.type === 'test_completed' && (
														<span>
															{activity.student}{' '}
															{t('teacherDashboard.completedTest')}
															{activity.score && ` (${activity.score}/100)`}
														</span>
													)}
													{activity.type === 'challenge_created' && (
														<span>
															{t('teacherDashboard.createdChallenge')}:{' '}
															{activity.challenge}
														</span>
													)}
													{activity.type === 'student_joined' && (
														<span>
															{activity.student}{' '}
															{t('teacherDashboard.joinedClass')}
														</span>
													)}
													{activity.type === 'assignment_submitted' && (
														<span>
															{activity.student}{' '}
															{t('teacherDashboard.submittedAssignment')}
															{activity.score && ` (${activity.score}/100)`}
														</span>
													)}
												</div>
											}
											description={
												<div className={`activity-meta ${theme}-activity-meta`}>
													<span className='activity-class'>
														{activity.class}
													</span>
													<span className='activity-time'>
														{activity.timestamp}
													</span>
												</div>
											}
										/>
									</List.Item>
								)}
							/>
						</Card>
					</Col>
				</Row>
			</div>
		</ThemedLayout>
	);
};

export default TeacherDashboard;
