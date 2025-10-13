import React, { useState, useEffect, useCallback } from 'react';
import {
	Form,
	Button,
	Row,
	Col,
	Card,
	Tag,
	Input,
	List,
	Avatar,
	Empty,
	Spin,
} from 'antd';
import {
	UserOutlined,
	TeamOutlined,
	CheckOutlined,
	SearchOutlined,
	StarOutlined,
	ClockCircleOutlined,
	BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';


const AssignStudentToClass = ({ student, onClose }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState('');

	// Mock data for all available classes - replace with actual API calls
	const [allClasses] = useState([
		{
			id: 1,
			name: 'Lớp 10A1 - Beginner',
			level: 'Beginner',
			ageRange: '15-16 years',
			currentTeacher: 'Nguyễn Văn B',
			studentCount: 15,
			maxStudents: 25,
			status: 'active',
			assigned: false,
			rating: 4.5,
			schedule: 'Mon, Wed, Fri - 8:00-9:30',
		},
		{
			id: 2,
			name: 'Lớp 10A2 - Intermediate',
			level: 'Intermediate',
			ageRange: '15-16 years',
			currentTeacher: 'Trần Thị C',
			studentCount: 20,
			maxStudents: 25,
			status: 'active',
			assigned: false,
			rating: 4.8,
			schedule: 'Tue, Thu, Sat - 9:00-10:30',
		},
		{
			id: 3,
			name: 'Lớp 11B1 - Advanced',
			level: 'Advanced',
			ageRange: '16-17 years',
			currentTeacher: 'Lê Văn D',
			studentCount: 18,
			maxStudents: 25,
			status: 'active',
			assigned: true,
			rating: 4.9,
			schedule: 'Mon, Wed, Fri - 10:00-11:30',
		},
		{
			id: 4,
			name: 'Lớp 9C1 - Beginner',
			level: 'Beginner',
			ageRange: '14-15 years',
			currentTeacher: 'Phạm Thị E',
			studentCount: 12,
			maxStudents: 25,
			status: 'active',
			assigned: false,
			rating: 4.3,
			schedule: 'Tue, Thu, Sat - 14:00-15:30',
		},
		{
			id: 5,
			name: 'Lớp 12A1 - Advanced',
			level: 'Advanced',
			ageRange: '17-18 years',
			currentTeacher: 'Hoàng Văn F',
			studentCount: 22,
			maxStudents: 25,
			status: 'active',
			assigned: false,
			rating: 4.7,
			schedule: 'Mon, Wed, Fri - 15:00-16:30',
		},
		{
			id: 6,
			name: 'Lớp 10B1 - Intermediate',
			level: 'Intermediate',
			ageRange: '15-16 years',
			currentTeacher: 'Vũ Thị G',
			studentCount: 16,
			maxStudents: 25,
			status: 'active',
			assigned: false,
			rating: 4.6,
			schedule: 'Tue, Thu, Sat - 16:00-17:30',
		},
		{
			id: 7,
			name: 'Lớp 11A1 - Beginner',
			level: 'Beginner',
			ageRange: '16-17 years',
			currentTeacher: 'Đỗ Văn H',
			studentCount: 14,
			maxStudents: 25,
			status: 'active',
			assigned: false,
			rating: 4.4,
			schedule: 'Mon, Wed, Fri - 17:00-18:30',
		},
	]);

	// State for search and recommendations
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const [selectedClass, setSelectedClass] = useState(null);

	useEffect(() => {
		if (student) {
			// Pre-select class where this student is already assigned
			const assignedClass = allClasses.find(cls => cls.assigned);
			setSelectedClass(assignedClass ? assignedClass.id : null);
		}
	}, [student, allClasses]);

	const handleSubmit = async (values) => {
		setLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			spaceToast.success(t('studentManagement.assignStudentSuccess'));
			onClose();
		} catch (error) {
			spaceToast.error(t('studentManagement.assignStudentError'));
		} finally {
			setLoading(false);
		}
	};

	const handleClassSelection = (classId) => {
		setSelectedClass(classId);
	};

	// Search and recommendation logic
	const handleSearch = useCallback(async (searchValue) => {
		if (!searchValue.trim()) {
			setSearchResults([]);
			setHasSearched(false);
			return;
		}

		setIsSearching(true);
		setHasSearched(true);

		try {
			// Simulate API call delay
			await new Promise(resolve => setTimeout(resolve, 800));

			// Filter classes based on search
			const filtered = allClasses.filter((cls) => {
				const matchesSearch =
					cls.name.toLowerCase().includes(searchValue.toLowerCase()) ||
					cls.level.toLowerCase().includes(searchValue.toLowerCase()) ||
					(cls.currentTeacher && cls.currentTeacher.toLowerCase().includes(searchValue.toLowerCase()));
				return matchesSearch && cls.status === 'active';
			});

			// Add recommendation logic based on student's level and age
			const recommended = filtered.map(cls => {
				let recommendationScore = 0;
				let reasons = [];

				// Level matching (highest priority)
				if (cls.level === student?.level) {
					recommendationScore += 50;
					reasons.push(t('studentManagement.levelMatch'));
				}

				// Age range matching
				const studentAge = student?.age || 16; // Default age if not provided
				const ageRange = cls.ageRange.match(/(\d+)-(\d+)/);
				if (ageRange) {
					const minAge = parseInt(ageRange[1]);
					const maxAge = parseInt(ageRange[2]);
					if (studentAge >= minAge && studentAge <= maxAge) {
						recommendationScore += 30;
						reasons.push(t('studentManagement.ageMatch'));
					}
				}

				// Class capacity (prefer classes with more available spots)
				const availableSpots = cls.maxStudents - cls.studentCount;
				if (availableSpots > 5) {
					recommendationScore += 20;
					reasons.push(t('studentManagement.goodCapacity'));
				}

				// Teacher rating
				if (cls.rating >= 4.5) {
					recommendationScore += 10;
					reasons.push(t('studentManagement.highRatedTeacher'));
				}

				return {
					...cls,
					recommendationScore,
					reasons,
					isRecommended: recommendationScore >= 30
				};
			});

			// Sort by recommendation score (highest first)
			recommended.sort((a, b) => b.recommendationScore - a.recommendationScore);

			setSearchResults(recommended);
		} catch (error) {
			spaceToast.error(t('studentManagement.searchError'));
		} finally {
			setIsSearching(false);
		}
	}, [allClasses, student, t]);

	// Debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			handleSearch(searchText);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchText, handleSearch]);

	// Render class recommendation item
	const renderClassItem = (classItem) => (
		<List.Item
			key={classItem.id}
			className={`class-recommendation-item ${theme}-class-recommendation-item`}
			style={{
				background: selectedClass === classItem.id ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
				border: selectedClass === classItem.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
				borderRadius: '8px',
				marginBottom: '12px',
				padding: '16px',
				cursor: 'pointer',
			}}
			onClick={() => handleClassSelection(classItem.id)}
		>
			<List.Item.Meta
				avatar={
					<Avatar 
						icon={<BookOutlined />} 
						style={{ 
							backgroundColor: classItem.isRecommended ? '#52c41a' : '#1890ff',
							color: 'white'
						}} 
					/>
				}
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ fontWeight: 'bold', fontSize: '16px' }}>
							{classItem.name}
						</span>
						{classItem.isRecommended && (
							<Tag color="green" icon={<StarOutlined />}>
								{t('studentManagement.recommended')}
							</Tag>
						)}
					</div>
				}
				description={
					<div>
						<div style={{ marginBottom: '8px' }}>
							<Tag color="blue">{classItem.level}</Tag>
							<Tag color="orange">{classItem.ageRange}</Tag>
							<Tag color="purple">
								<TeamOutlined /> {classItem.studentCount}/{classItem.maxStudents}
							</Tag>
						</div>
						<div style={{ marginBottom: '8px' }}>
							<span style={{ color: '#666' }}>
								<ClockCircleOutlined /> {classItem.schedule}
							</span>
						</div>
						<div style={{ marginBottom: '8px' }}>
							<span style={{ color: '#666' }}>
								{t('studentManagement.teacher')}: {classItem.currentTeacher}
							</span>
							<span style={{ marginLeft: '16px', color: '#faad14' }}>
								<StarOutlined /> {classItem.rating}/5.0
							</span>
						</div>
						{classItem.reasons && classItem.reasons.length > 0 && (
							<div>
								<span style={{ color: '#52c41a', fontSize: '12px' }}>
									{t('studentManagement.recommendationReasons')}: {classItem.reasons.join(', ')}
								</span>
							</div>
						)}
					</div>
				}
			/>
			<div>
				{selectedClass === classItem.id ? (
					<Button
						type="primary"
						icon={<CheckOutlined />}
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							setSelectedClass(null);
						}}
					>
						{t('studentManagement.selected')}
					</Button>
				) : (
					<Button
						type="default"
						icon={<CheckOutlined />}
						size="small"
						disabled={classItem.studentCount >= classItem.maxStudents}
						onClick={(e) => {
							e.stopPropagation();
							handleClassSelection(classItem.id);
						}}
					>
						{t('studentManagement.select')}
					</Button>
				)}
			</div>
		</List.Item>
	);

	return (
		<div className={`assign-student-form ${theme}-assign-student-form`}>
			{/* Student Info Card */}
			<Card 
				title={t('studentManagement.studentInfo')}
				className={`student-info-card ${theme}-student-info-card`}
				style={{ marginBottom: 24 }}
			>
				<Row gutter={16}>
					<Col span={8}>
						<div style={{ textAlign: 'center' }}>
							<UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
						</div>
					</Col>
					<Col span={16}>
						<div>
							<h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
								{student?.firstName} {student?.lastName}
							</h3>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{student?.email}
							</p>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{student?.phoneNumber}
							</p>
							<Tag color="blue">
								{student?.userName}
							</Tag>
							<Tag color="orange" style={{ marginLeft: 8 }}>
								{student?.currentLevelInfo?.name || 'N/A'}
							</Tag>
						</div>
					</Col>
				</Row>
			</Card>

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
			>
				{/* Search Classes */}
				<Card 
					title={t('studentManagement.searchAndRecommendClasses')}
					className={`search-card ${theme}-search-card`}
					style={{ marginBottom: 24 }}
				>
					<Row gutter={16}>
						<Col span={24}>
							<Input
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								className={`search-input ${theme}-search-input`}
								style={{ height: '40px', fontSize: '16px' }}
								allowClear
								size="large"
							/>
						</Col>
					</Row>
					
					{/* Search Results */}
					{hasSearched && (
						<div style={{ marginTop: '16px' }}>
							{isSearching ? (
								<div style={{ textAlign: 'center', padding: '40px 0' }}>
									<Spin size="large" />
									<div style={{ marginTop: '16px', color: '#666' }}>
										{t('studentManagement.searchingClasses')}
									</div>
								</div>
							) : searchResults.length > 0 ? (
								<div>
									<div style={{ marginBottom: '16px', color: '#666' }}>
										{t('studentManagement.foundClasses', { count: searchResults.length })}
									</div>
									<List
										dataSource={searchResults}
										renderItem={renderClassItem}
										className={`search-results-list ${theme}-search-results-list`}
									/>
								</div>
							) : (
								<Empty
									description={t('studentManagement.noClassesFound')}
									image={Empty.PRESENTED_IMAGE_SIMPLE}
								/>
							)}
						</div>
					)}
				</Card>


				{/* Action Buttons */}
				<Row gutter={16} style={{ marginTop: 32 }}>
					<Col span={12}>
						<Button
							type="default"
							onClick={onClose}
							style={{ width: '100%', height: 40 }}
							className={`cancel-button ${theme}-cancel-button`}
						>
							{t('common.cancel')}
						</Button>
					</Col>
					<Col span={12}>
						<Button
							type="primary"
							htmlType="submit"
							loading={loading}
							disabled={!selectedClass}
							style={{ width: '100%', height: 40 }}
							className={`submit-button ${theme}-submit-button`}
						>
							{t('studentManagement.assignToSelectedClass')}
						</Button>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default AssignStudentToClass;
