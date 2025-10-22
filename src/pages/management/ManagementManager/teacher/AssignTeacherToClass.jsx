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
	BookOutlined,
	CalendarOutlined,
	UserAddOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import { classManagementApi } from '../../../../apis/apis';

const AssignTeacherToClass = ({ teacher, onClose, onSuccess }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [form] = Form.useForm();
	const [searchText, setSearchText] = useState('');

	// State for classes data
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [selectedClasses, setSelectedClasses] = useState([]);
	const [assigningLoading, setAssigningLoading] = useState(false);

	// Fetch all available classes
	const fetchAllClasses = useCallback(async () => {
		// Filter statuses for class search - can be easily modified
		const FILTER_STATUSES = ['ACTIVE', 'PENDING', 'UPCOMING_END'];
		
		try {
			const response = await classManagementApi.getClasses({
				page: 0,
				size: 100, // Get all classes
				status: FILTER_STATUSES // Filter on backend using array
			});
			
			if (response.message && response.data) {
				// Classes will be loaded when user searches
				console.log('Classes loaded successfully');
			}
		} catch (error) {
			console.error('Error fetching classes:', error);
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.loadClassesError');
			spaceToast.error(errorMessage);
		}
	}, [t]);

	// Fetch all classes on component mount
	useEffect(() => {
		fetchAllClasses();
	}, [fetchAllClasses]);

	const handleSubmit = async (values) => {
		if (selectedClasses.length === 0) {
			spaceToast.warning(t('teacherManagement.selectAtLeastOneClass'));
			return;
		}

		setAssigningLoading(true);
		try {
			// Assign teacher to each selected class
			const assignPromises = selectedClasses.map(classId => 
				classManagementApi.addTeacherToClass(classId, {
					teachers: [
						{
							userId: teacher.id,
							roleInClass: teacher.roleName || 'TEACHER'
						}
					]
				})
			);

			await Promise.all(assignPromises);
			
			spaceToast.success(t('teacherManagement.assignTeacherSuccess'));
			
			// Refresh teacher list to show updated data
			if (onSuccess) {
				onSuccess();
			}
			
			onClose();
		} catch (error) {
			console.error('Error assigning teacher to classes:', error);
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.assignTeacherError');
			spaceToast.error(errorMessage);
		} finally {
			setAssigningLoading(false);
		}
	};

	const handleClassSelection = (classId) => {
		if (selectedClasses.includes(classId)) {
			setSelectedClasses(selectedClasses.filter(id => id !== classId));
		} else {
			setSelectedClasses([...selectedClasses, classId]);
		}
	};

	// Search and recommendation logic
	const handleSearch = useCallback(async (searchValue) => {
		// Filter statuses for class search - can be easily modified
		const FILTER_STATUSES = ['ACTIVE', 'PENDING', 'UPCOMING_END'];
		
		if (!searchValue.trim()) {
			setSearchResults([]);
			setHasSearched(false);
			return;
		}

		setIsSearching(true);
		setHasSearched(true);

		try {
			// Call API to search classes with multiple status filters
			const response = await classManagementApi.getClasses({
				page: 0,
				size: 100,
				searchText: searchValue.trim(),
				status: FILTER_STATUSES // Filter on backend using array
			});

			if (response.message && response.data) {
				const classes = response.data;

				// Add recommendation logic based on teacher's specialization
				const recommended = classes.map(cls => {
					let recommendationScore = 0;
					let reasons = [];

					// Check if teacher is already assigned to this class
					const isAlreadyAssigned = cls.teacherInfos && cls.teacherInfos.some(t => t.teacherId === teacher.id);

					// Specialization matching (highest priority)
					if (cls.syllabus && cls.syllabus.level && teacher?.specialization) {
						const levelName = cls.syllabus.level.levelName || cls.syllabus.level;
						if (levelName && levelName.toLowerCase().includes(teacher.specialization.toLowerCase())) {
							recommendationScore += 50;
							reasons.push(t('teacherManagement.specializationMatch'));
						}
					}

					// Class capacity (prefer classes with more students)
					if (cls.students && cls.students.length > 15) {
						recommendationScore += 30;
						reasons.push(t('teacherManagement.goodClassSize'));
					}

					// Class status scoring
					if (cls.status === 'ACTIVE') {
						recommendationScore += 30;
						reasons.push(t('teacherManagement.activeClass'));
					} else if (cls.status === 'PENDING') {
						recommendationScore += 20;
						reasons.push(t('teacherManagement.pendingClass'));
					} else if (cls.status === 'UPCOMING_END') {
						recommendationScore += 10;
						reasons.push(t('teacherManagement.upcomingEndClass'));
					}

					return {
						...cls,
						recommendationScore,
						reasons,
						isRecommended: recommendationScore >= 30,
						isAlreadyAssigned,
						studentCount: cls.students ? cls.students.length : 0,
						maxStudents: cls.maxStudents || 25,
						currentTeachers: cls.teacherInfos || []
					};
				});

				// Sort by recommendation score (highest first), then by name
				recommended.sort((a, b) => {
					if (b.recommendationScore !== a.recommendationScore) {
						return b.recommendationScore - a.recommendationScore;
					}
					// Use className instead of name, with fallback to empty string
					const nameA = a.className || a.name || '';
					const nameB = b.className || b.name || '';
					return nameA.localeCompare(nameB);
				});

				setSearchResults(recommended);
			} else {
				setSearchResults([]);
			}
		} catch (error) {
			console.error('Error searching classes:', error);
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.searchError');
			spaceToast.error(errorMessage);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}, [teacher, t]);

	// Debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			handleSearch(searchText);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchText, handleSearch]);

	// Render class recommendation item
	const renderClassItem = (classItem) => {
		const isSelected = selectedClasses.includes(classItem.id);
		const isAlreadyAssigned = classItem.isAlreadyAssigned;
		
		return (
			<List.Item
				key={classItem.id}
				className={`class-recommendation-item ${theme}-class-recommendation-item`}
				style={{
					background: isSelected ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
					border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
					borderRadius: '8px',
					marginBottom: '12px',
					padding: '16px',
					cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
					opacity: isAlreadyAssigned ? 0.6 : 1,
				}}
				onClick={() => !isAlreadyAssigned && handleClassSelection(classItem.id)}
			>
				<List.Item.Meta
					avatar={
						<Avatar 
							icon={<BookOutlined />} 
							style={{ 
								backgroundColor: isAlreadyAssigned ? '#ff4d4f' : 
												classItem.isRecommended ? '#52c41a' : '#1890ff',
								color: 'white'
							}} 
						/>
					}
					title={
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span style={{ fontWeight: 'bold', fontSize: '16px' }}>
								{classItem.className || classItem.name || 'Unnamed Class'}
							</span>
							{classItem.isRecommended && !isAlreadyAssigned && (
								<Tag color="green" icon={<StarOutlined />}>
									{t('teacherManagement.recommended')}
								</Tag>
							)}
							{isAlreadyAssigned && (
								<Tag color="red" icon={<UserAddOutlined />}>
									{t('teacherManagement.alreadyAssigned')}
								</Tag>
							)}
						</div>
					}
					description={
						<div>
							<div style={{ marginBottom: '8px' }}>
								{classItem.syllabus && (
									<Tag color="blue">
										{classItem.syllabus.level?.levelName || classItem.syllabus.syllabusName || classItem.syllabus.level || classItem.syllabus.name}
									</Tag>
								)}
								<Tag color="purple">
									<TeamOutlined /> {classItem.studentCount || 0}/{classItem.maxStudents || 25}
								</Tag>
								<Tag color={
									classItem.status === 'ACTIVE' ? 'green' : 
									classItem.status === 'PENDING' ? 'orange' : 
									classItem.status === 'UPCOMING_END' ? 'blue' : 'default'
								}>
									{classItem.status}
								</Tag>
							</div>
							
							{classItem.startDate && (
								<div style={{ marginBottom: '8px' }}>
									<span style={{ color: '#666' }}>
										<CalendarOutlined /> {t('teacherManagement.startDate')}: {new Date(classItem.startDate).toLocaleDateString()}
									</span>
								</div>
							)}
							
							<div style={{ marginBottom: '8px' }}>
								<span style={{ color: '#666' }}>
									{t('teacherManagement.currentTeachers')}: {
										classItem.teacherInfos && classItem.teacherInfos.length > 0 
											? classItem.teacherInfos.map(t => t.fullName || t.userName).join(', ')
											: t('teacherManagement.noTeacher')
									}
								</span>
							</div>
							
							{classItem.reasons && classItem.reasons.length > 0 && !isAlreadyAssigned && (
								<div>
									<span style={{ color: '#52c41a', fontSize: '12px' }}>
										{t('teacherManagement.recommendationReasons')}: {classItem.reasons.join(', ')}
									</span>
								</div>
							)}
						</div>
					}
				/>
				<div>
					{isAlreadyAssigned ? (
						<Button
							type="default"
							disabled
							size="small"
							style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
						>
							{t('teacherManagement.alreadyAssigned')}
						</Button>
					) : isSelected ? (
						<Button
							type="primary"
							icon={<CheckOutlined />}
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								handleClassSelection(classItem.id);
							}}
						>
							{t('teacherManagement.selected')}
						</Button>
					) : (
						<Button
							type="default"
							icon={<CheckOutlined />}
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								handleClassSelection(classItem.id);
							}}
						>
							{t('teacherManagement.select')}
						</Button>
					)}
				</div>
			</List.Item>
		);
	};

	return (
		<div className={`assign-teacher-form ${theme}-assign-teacher-form`}>
			{/* Teacher Info Card */}
			<Card 
				title={t('teacherManagement.teacherInfo')}
				className={`teacher-info-card ${theme}-teacher-info-card`}
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
							<h3 style={{ margin: 0, fontSize: '20px' }}>
								{teacher?.fullName || teacher?.userName || teacher?.name}
							</h3>
							<Tag color={teacher?.roleName === 'TEACHER' ? 'blue' : 'green'}>
								{teacher?.roleName === 'TEACHER' 
									? t('teacherManagement.teacher') 
									: t('teacherManagement.teacherAssistant')
								}
							</Tag>
							{teacher?.specialization && (
								<Tag color="orange" style={{ marginLeft: 8 }}>
									{teacher.specialization}
								</Tag>
							)}
							{teacher?.email && (
								<div style={{ marginTop: '8px', color: '#666' }}>
									{teacher.email}
								</div>
							)}
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
					title={t('teacherManagement.searchAndRecommendClasses')}
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
										{t('teacherManagement.searchingClasses')}
									</div>
								</div>
							) : searchResults.length > 0 ? (
								<div>
									<div style={{ marginBottom: '16px', color: '#666' }}>
										{t('teacherManagement.foundClasses', { count: searchResults.length })}
									</div>
									<List
										dataSource={searchResults}
										renderItem={renderClassItem}
										className={`search-results-list ${theme}-search-results-list`}
									/>
								</div>
							) : (
								<Empty
									description={t('teacherManagement.noClassesFound')}
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
							loading={assigningLoading}
							disabled={selectedClasses.length === 0 || assigningLoading}
							style={{ 
								width: '100%', 
								height: 40,
								backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
								background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
								borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
								color: theme === 'sun' ? '#000000' : '#ffffff',
							}}
							className={`submit-button ${theme}-submit-button`}
						>
							{selectedClasses.length > 0 
								? `${t('teacherManagement.assignToSelectedClasses')} (${selectedClasses.length})`
								: t('teacherManagement.assignToSelectedClasses')
							}
						</Button>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default AssignTeacherToClass;
