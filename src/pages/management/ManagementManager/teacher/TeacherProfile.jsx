import React, { useState, useEffect, useCallback } from 'react';
import {
	Row,
	Col,
	Button,
	Avatar,
	Tag,
	Table,
	Space,
	Modal,
	Form,
	Input,
	Select,
	DatePicker,
	Spin,
	Alert,
	Typography,
	Radio,
} from 'antd';
import {
	ArrowLeftOutlined,
	EditOutlined,
	UserOutlined,
	CalendarOutlined,
	BookOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
import accountManagementApi from '../../../../apis/backend/accountManagement';
import { classManagementApi } from '../../../../apis/apis';
import dayjs from 'dayjs';
import './TeacherList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import EditEmailModal from './EditEmailModal';

const { Title } = Typography;

const TeacherProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { teacherId } = useParams();
	const { theme } = useTheme();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editEmailModalVisible, setEditEmailModalVisible] = useState(false);
	const [editForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null
	});

	// Teacher data from API
	const [teacher, setTeacher] = useState(null);
	const [teacherClasses, setTeacherClasses] = useState([]);
	const [loadingClasses, setLoadingClasses] = useState(false);



	const fetchTeacherProfile = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			
			console.log('Fetching profile for teacher ID:', teacherId);
			if (!teacherId) {
				setError('Teacher ID not found in URL');
				return;
			}
			
			const response = await teacherManagementApi.getTeacherProfile(teacherId);
			
			if (response.success && response.data) {
				setTeacher(response.data);
				// Use API avatarUrl or default avatar
				setAvatarUrl(response.data.avatarUrl || "/img/avatar_1.png");
			} else {
				setError(response.message || 'Failed to fetch teacher profile');
			}
		} catch (error) {
			console.error('Error fetching teacher profile:', error);
			const errorMessage = error.response?.data?.error || error.message;
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [teacherId]);

	useEffect(() => {
		fetchTeacherProfile();
	}, [fetchTeacherProfile]);

	// Fetch teacher classes details
	const fetchTeacherClasses = useCallback(async (classList) => {
		if (!classList || !Array.isArray(classList) || classList.length === 0) {
			setTeacherClasses([]);
			return;
		}
		
		setLoadingClasses(true);
		try {
			// Fetch details for each class
			const classDetailsPromises = classList.map(async (classItem) => {
				try {
					const response = await classManagementApi.getClassDetail(classItem.id);
					if (response.message && response.data) {
						const cls = response.data;
						return {
							id: cls.id || classItem.id,
							name: cls.className || cls.name || classItem.className || 'Unnamed Class',
							students: cls.studentCount !== undefined ? cls.studentCount : (cls.students ? cls.students.length : 0),
							startDate: cls.startDate,
							status: cls.status || 'INACTIVE',
							roleInClass: classItem.roleInClass || 'TEACHER'
						};
					}
					// Fallback if detail fetch fails
					return {
						id: classItem.id,
						name: classItem.className || 'Unnamed Class',
						students: 0,
						startDate: null,
						status: 'UNKNOWN',
						roleInClass: classItem.roleInClass || 'TEACHER'
					};
				} catch (error) {
					console.error(`Error fetching class ${classItem.id} detail:`, error);
					// Return basic info if detail fetch fails
					return {
						id: classItem.id,
						name: classItem.className || 'Unnamed Class',
						students: 0,
						startDate: null,
						status: 'UNKNOWN',
						roleInClass: classItem.roleInClass || 'TEACHER'
					};
				}
			});

			const classDetails = await Promise.all(classDetailsPromises);
			setTeacherClasses(classDetails);
		} catch (error) {
			console.error('Error fetching teacher classes:', error);
			// Fallback to basic classList data
			const basicClasses = classList.map(classItem => ({
				id: classItem.id,
				name: classItem.className || 'Unnamed Class',
				students: 0,
				startDate: null,
				status: 'UNKNOWN',
				roleInClass: classItem.roleInClass || 'TEACHER'
			}));
			setTeacherClasses(basicClasses);
		} finally {
			setLoadingClasses(false);
		}
	}, []);

	// Fetch classes when teacher data is loaded
	useEffect(() => {
		if (teacher && teacher.classList) {
			fetchTeacherClasses(teacher.classList);
		} else {
			setTeacherClasses([]);
		}
	}, [teacher, fetchTeacherClasses]);

	const handleBack = () => {
		navigate('/manager/teachers');
	};

	const handleEditEmail = () => {
		setEditEmailModalVisible(true);
	};

	const handleEmailUpdateSuccess = () => {
		// Refresh teacher data after email update
		fetchTeacherProfile();
	};

	const handleAvatarUpload = async (file) => {
		setAvatarUploadLoading(true);
		try {
			// Upload avatar for specific teacher
			const response = await teacherManagementApi.uploadTeacherAvatar(teacherId, file);
			
			if (response.success || response.message) {
				// Update avatar immediately for better UX
				setAvatarUrl(URL.createObjectURL(file));
				spaceToast.success(response.message || t('teacherManagement.uploadAvatarSuccess'));
				
				// Refresh teacher data after a short delay
				setTimeout(() => {
					fetchTeacherProfile();
				}, 1000);
			} else {
				spaceToast.error(response.message || t('teacherManagement.uploadAvatarError'));
			}
		} catch (error) {
			console.error('Error uploading teacher avatar:', error);
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.uploadAvatarError');
			spaceToast.error(errorMessage);
		} finally {
			setAvatarUploadLoading(false);
		}
	};

	const handleEdit = () => {
		if (!teacher) return;
		
		setEditModalVisible(true);
		
		editForm.setFieldsValue({
			roleName: teacher.roleName,
			fullName: teacher.fullName,
			phoneNumber: teacher.phoneNumber,
			dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
			gender: teacher.gender,
			address: teacher.address,
		});
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
		// Format the data according to the API requirements
		const teacherData = {
			roleName: values.roleName || "TEACHER",
			fullName: values.fullName,
			avatarUrl: teacher.avatarUrl || "/img/avatar_1.png", // Send current avatar URL
			dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
			address: values.address || "",
			phoneNumber: values.phoneNumber,
			gender: values.gender || "MALE",
			email: teacher.email, // Always include email for backend
		};
			
			console.log('Updating teacher with data:', teacherData);
			
			const response = await teacherManagementApi.updateTeacherProfile(teacherId, teacherData);
			
			if (response.success && response.data) {
				setTeacher(response.data);
				setEditModalVisible(false);
				spaceToast.success(response.message || t('teacherManagement.updateTeacherSuccess'));
			} 
		} catch (error) {
			console.error('Error updating teacher profile:', error);
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.updateTeacherError');
			spaceToast.error(errorMessage);
		} finally {
			setEditLoading(false);
		}
	};

	// Handle delete for PENDING teachers (trash button)
	const handleDeletePending = () => {
		if (!teacher || teacher.status !== 'PENDING') return;
		
		const teacherName = teacher.fullName || teacher.userName;
		
		setConfirmModal({
			visible: true,
			title: t('teacherManagement.deleteTeacher'),
			content: `${t('teacherManagement.confirmDeletePending')} "${teacherName}"? ${t('teacherManagement.deletePendingNote')}`,
			onConfirm: async () => {
				try {
					// Call API to delete teacher
					const response = await accountManagementApi.deleteAccount(teacherId);
					
					// Close modal first
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					
					// Use backend message if available, otherwise fallback to translation
					const successMessage = response.message + ` "${teacherName}"`;
					spaceToast.success(successMessage);
					
					// Navigate back to teacher list after successful deletion
					navigate('/manager/teachers');
				} catch (error) {
					console.error('Error deleting PENDING teacher:', error);
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message);
				}
			}
		});
	};

	const handleConfirmCancel = () => {
		setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
	};

	const classColumns = [
		{
			title: t('teacherManagement.className'),
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: t('teacherManagement.students'),
			dataIndex: 'students',
			key: 'students',
			render: (students) => (
				<Space>
					<UserOutlined />
					{students || 0}
				</Space>
			),
		},
		{
			title: t('teacherManagement.startDate'),
			dataIndex: 'startDate',
			key: 'startDate',
			render: (date) => (
				date ? (
					<Space>
						<CalendarOutlined />
						{new Date(date).toLocaleDateString('vi-VN')}
					</Space>
				) : '-'
			),
		},
		{
			title: t('teacherManagement.status'),
			dataIndex: 'status',
			key: 'status',
			render: (status) => {
				const statusUpper = status?.toUpperCase();
				let color = 'default';
				let text = status;

				if (statusUpper === 'ACTIVE') {
					color = 'green';
					text = t('teacherManagement.active');
				} else if (statusUpper === 'PENDING') {
					color = 'orange';
					text = t('teacherManagement.pending');
				} else if (statusUpper === 'UPCOMING_END') {
					color = 'blue';
					text = t('teacherManagement.upcomingEnd') || 'Upcoming End';
				} else if (statusUpper === 'INACTIVE') {
					color = 'red';
					text = t('teacherManagement.inactive');
				} else if (statusUpper === 'UNKNOWN') {
					color = 'default';
					text = '-';
				}

				return (
					<Tag color={color}>
						{text}
					</Tag>
				);
			},
		},
	];

	// Loading state
	if (loading) {
		return (
			<ThemedLayout>
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
					<Spin size="large" tip="Loading teacher profile..." />
				</div>
			</ThemedLayout>
		);
	}

	// Error state
	if (error) {
		return (
			<ThemedLayout>
				<div style={{ padding: '20px' }}>
					<Alert 
						message="Error" 
						description={error} 
						type="error" 
						showIcon 
						action={
							<Button size="small" onClick={fetchTeacherProfile}>
								Retry
							</Button>
						}
					/>
				</div>
			</ThemedLayout>
		);
	}

	// No teacher data
	if (!teacher) {
		return (
			<ThemedLayout>
				<div style={{ padding: '20px' }}>
					<Alert 
						message="Not Found" 
						description="Teacher profile not found." 
						type="warning" 
						showIcon 
					/>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className={`teacher-profile ${theme}-teacher-profile`}>
				<div className='profile-container'>
					{/* Header */}
					<div className='profile-header'>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={handleBack}
							className={`back-button ${theme}-back-button`}>
							{t('common.back')}
						</Button>
						<div style={{ display: 'flex', gap: '12px' }}>
							{teacher?.status === 'PENDING' && (
								<Button
									icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
									onClick={handleDeletePending}
									className={`deactivate-button ${theme}-deactivate-button`}
									style={{ 
										color: '#ff4d4f',
										borderColor: '#ff4d4f'
									}}>
									{t('teacherManagement.deleteTeacher')}
								</Button>
							)}
							<Button
								type='primary'
								icon={<EditOutlined />}
								onClick={handleEdit}
								className={`edit-button ${theme}-edit-button`}
								style={{
									backgroundColor: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
									background: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
									borderColor: theme === 'sun' ? 'transparent' : 'transparent',
									color: '#000000',
								}}>
								{t('teacherManagement.editProfile')}
							</Button>
						</div>
					</div>

					{/* Teacher Info Card */}
					<div className={`profile-container-new ${theme}-profile-container-new`}>
						{/* Profile Title */}
						<div className={`profile-title-new ${theme}-profile-title-new`}>
							{t('common.profile')}
						</div>
						
						<div className={`profile-content-new ${theme}-profile-content-new`}>
							{/* Left Section - Avatar */}
							<div className={`avatar-section-new ${theme}-avatar-section-new`}>
								<div 
									className="profile-picture-new" 
									onClick={() => document.getElementById('teacher-avatar-upload').click()}
								>
									<Avatar
										size={120}
										icon={<UserOutlined />}
										src={avatarUrl}
										className={`avatar-image-new ${theme}-avatar-image-new`}
									/>
									{avatarUploadLoading && (
										<div className="avatar-loading-overlay">
											Uploading...
										</div>
									)}
								</div>
								
								{/* Email */}
								<div className={`email-section-new ${theme}-email-section-new`}>
									<span className={`email-text-new ${theme}-email-text-new`}>
										{teacher.email || '-'}
									</span>
									{/* Only show edit email button for PENDING status teachers */}
									{teacher.status === 'PENDING' && (
										<Button
											type="text"
											icon={<EditOutlined />}
											onClick={handleEditEmail}
											className={`email-edit-icon ${theme}-email-edit-icon`}
											size="small"
										/>
									)}
								</div>
							</div>

							{/* Right Section - Teacher Info */}
							<div className={`student-info-new ${theme}-student-info-new`}>
								{/* Name and Status Row */}
								<div className={`name-status-row-new ${theme}-name-status-row-new`}>
									<h2 className={`student-name-new ${theme}-student-name-new`}>
										{teacher.fullName}
									</h2>
									<div className={`status-badges-new ${theme}-status-badges-new`}>
										<span 
											className={`role-badge-new ${theme}-role-badge-new`}
											style={{ color: theme === 'sun' ? '#3b82f6' : undefined }}
										>
											{teacher.roleName === 'TEACHER' ? t('common.teacher') : teacher.roleName === 'TEACHING_ASSISTANT' ? t('common.teachingAssistant') : 'N/A'}
										</span>
										<span className={`status-badge-new ${theme}-status-badge-new ${teacher.status?.toLowerCase()}`}>
											{teacher.status === 'ACTIVE'
												? t('teacherManagement.active')
												: teacher.status === 'PENDING'
												? t('teacherManagement.pending')
												: t('teacherManagement.inactive')}
										</span>
									</div>
								</div>
								
								{/* Teacher ID */}
								<div className={`student-id-new ${theme}-student-id-new`}>
									{teacher.userName || '-'}
								</div>

								{/* Personal Information Grid */}
								<div className={`personal-info-grid-new ${theme}-personal-info-grid-new`}>
									<div className={`info-item-new ${theme}-info-item-new`}>
										<span className={`info-label-new ${theme}-info-label-new`}>{t('teacherManagement.phone')}</span>
										<span className={`info-value-new ${theme}-info-value-new`}>{teacher.phoneNumber || '-'}</span>
									</div>
									<div className={`info-item-new ${theme}-info-item-new`}>
										<span className={`info-label-new ${theme}-info-label-new`}>{t('teacherManagement.gender')}</span>
										<span className={`info-value-new ${theme}-info-value-new`}>
											{teacher.gender === 'MALE' ? t('common.male') : teacher.gender === 'FEMALE' ? t('common.female') : teacher.gender === 'OTHER' ? t('common.other') : '-'}
										</span>
									</div>
									<div className={`info-item-new ${theme}-info-item-new`}>
										<span className={`info-label-new ${theme}-info-label-new`}>{t('teacherManagement.dateOfBirth')}</span>
										<span className={`info-value-new ${theme}-info-value-new`}>
											{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
										</span>
									</div>
									<div className={`info-item-new ${theme}-info-item-new`}>
										<span className={`info-label-new ${theme}-info-label-new`}>{t('teacherManagement.address')}</span>
										<span className={`info-value-new ${theme}-info-value-new`}>{teacher.address || '-'}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Hidden file input for avatar upload */}
					<input
						id="teacher-avatar-upload"
						type="file"
						accept="image/*"
						style={{ display: 'none' }}
						onChange={(e) => {
							const file = e.target.files[0];
							if (file) {
								// Validate file type
								if (!file.type.startsWith('image/')) {
									spaceToast.error(t('teacherManagement.invalidFileType'));
									return;
								}
								// Validate file size (max 5MB)
								if (file.size > 5 * 1024 * 1024) {
									spaceToast.error(t('teacherManagement.fileTooLarge'));
									return;
								}
								handleAvatarUpload(file);
							}
						}}
					/>

					{/* Current Classes */}
					<div 
						style={{ 
							background: theme === 'sun' ? '#ffffff' : 'rgb(224, 217, 255, 0.95)',
							borderRadius: '16px',
							padding: '20px',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							maxWidth: '800px',
							margin: '24px auto 0 auto',
							minHeight: 'auto'
						}}
					>
						{/* Classes Title */}
						<div style={{ 
							fontSize: '24px',
							fontWeight: '600',
							textAlign: 'center',
							marginBottom: '20px',
							color: '#000000'
						}}>
							<Space>
								<BookOutlined />
								{t('teacherManagement.currentClasses')}
							</Space>
						</div>
						
						<div style={{ width: '100%' }}>
							{loadingClasses ? (
								<div style={{ textAlign: 'center', padding: '40px 0' }}>
									<Spin size="large" />
								</div>
							) : (
								<Table
									columns={classColumns}
									dataSource={teacherClasses}
									rowKey='id'
									pagination={false}
									size='small'
									locale={{
										emptyText: t('teacherManagement.noClassesFound')
									}}
									style={{ marginBottom: 0 }}
								/>
							)}
						</div>
					</div>

					{/* 
					// Recent Activities
					<Card
						title={
							<Space>
								<ClockCircleOutlined />
								{t('teacherManagement.recentActivities')}
							</Space>
						}
						className={`activities-card ${theme}-activities-card`}
						style={{ marginBottom: 24 }}>
						<Timeline mode='left'>
							{recentActivities.map((activity) => (
								<Timeline.Item key={activity.id} label={new Date(activity.timestamp).toLocaleDateString('vi-VN')}>
									{activity.description}
								</Timeline.Item>
							))}
						</Timeline>
					</Card>

					// Achievements
					<Card
						title={
							<Space>
								<TrophyOutlined />
								{t('teacherManagement.achievements')}
							</Space>
						}
						className={`achievements-card ${theme}-achievements-card`}>
						<Timeline mode='left'>
							{achievements.map((achievement) => (
								<Timeline.Item key={achievement.id} label={new Date(achievement.date).toLocaleDateString('vi-VN')}>
									<strong>{achievement.title}</strong>
									<p>{achievement.description}</p>
								</Timeline.Item>
							))}
						</Timeline>
					</Card>
					*/}

				</div>

				{/* Edit Modal */}
				<Modal
					title={
						<div style={{ 
							fontSize: '28px', 
							fontWeight: '600', 
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0'
						}}>
							{t('teacherManagement.editProfile')}
						</div>
					}
					open={editModalVisible}
					onOk={() => editForm.submit()}
					onCancel={() => setEditModalVisible(false)}
					okText={t('teacherManagement.updateProfile')}
					cancelText={t('common.cancel')}
					confirmLoading={editLoading}
					width={600}
					className={`edit-modal ${theme}-edit-modal`}
					okButtonProps={{
						style: {
							background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
							color: theme === 'sun' ? '#000' : '#fff',
							borderRadius: '6px',
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							minWidth: '130px',
							transition: 'all 0.3s ease',
							boxShadow: 'none'
						}
					}}
					cancelButtonProps={{
						style: {
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							minWidth: '100px'
						}
					}}
				>
					<Form
						form={editForm}
						layout="vertical"
						onFinish={handleEditSubmit}
					>

						{/* Basic Information */}
						<Title level={5} style={{ marginBottom: '12px', color: '#000000', fontSize: '16px' }}>
							{t('teacherManagement.basicInformation')}
						</Title>
						
						<Row gutter={16}>
							<Col span={12}>
								<Form.Item
									label={
										<span>
											{t('teacherManagement.role')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="roleName"
									rules={[
										{ required: true, message: t('teacherManagement.roleRequired') },
									]}
								>
									<Select 
										placeholder={t('teacherManagement.rolePlaceholder')}
										disabled={
											// Disable dropdown if:
											// 1. Current role is TEACHER and status is ACTIVE (cannot change role when active)
											// 2. Current role is TEACHER and status is INACTIVE (cannot change role when inactive)
											teacher?.roleName === 'TEACHER' && (teacher?.status === 'ACTIVE' || teacher?.status === 'INACTIVE')
										}
									>
										<Select.Option 
											value="TEACHER"
											disabled={
												// Disable TEACHER option if:
												// 1. Current role is TEACHER and status is ACTIVE (cannot change to same role when active)
												// 2. Current role is TEACHER and status is INACTIVE (cannot change to same role when inactive)
												teacher?.roleName === 'TEACHER' && (teacher?.status === 'ACTIVE' || teacher?.status === 'INACTIVE')
											}
										>
											{t('teacherManagement.teacher')}
										</Select.Option>
										<Select.Option 
											value="TEACHING_ASSISTANT"
											disabled={
												// Disable TEACHING_ASSISTANT option if:
												// 1. Current role is TEACHER and status is ACTIVE (cannot downgrade)
												// 2. Current role is TEACHER and status is INACTIVE (cannot downgrade)
												teacher?.roleName === 'TEACHER' && (teacher?.status === 'ACTIVE' || teacher?.status === 'INACTIVE')
											}
										>
											{t('teacherManagement.teacherAssistant')}
										</Select.Option>
									</Select>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									label={
										<span>
											{t('teacherManagement.gender')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="gender"
									rules={[
										{ required: true, message: t('teacherManagement.genderRequired') },
									]}
								>
									<Radio.Group>
										<Radio value="MALE">{t('teacherManagement.male')}</Radio>
										<Radio value="FEMALE">{t('teacherManagement.female')}</Radio>
										<Radio value="OTHER">{t('teacherManagement.other')}</Radio>
									</Radio.Group>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={24}>
								<Form.Item
									label={
										<span>
											{t('teacherManagement.fullName')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="fullName"
									rules={[
										{ required: true, message: t('teacherManagement.fullNameRequired') },
										{ max: 100, message: t('teacherManagement.nameMaxLength') },
									]}
								>
									<Input/>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={12}>
								<Form.Item
									label={
										<span>
											{t('teacherManagement.phone')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="phoneNumber"
									rules={[
										{ required: true, message: t('teacherManagement.phoneRequired') },
										{ max: 20, message: t('teacherManagement.phoneMaxLength') },
									]}
								>
									<Input/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									label={t('teacherManagement.dateOfBirth')}
									name="dateOfBirth"
									rules={[
										{
											validator: (_, value) => {
												if (!value) return Promise.resolve();
												const selectedYear = value.year();
												if (selectedYear < 1920) {
													return Promise.reject(new Error('Date of birth must be from 1920 onwards'));
												}
												return Promise.resolve();
											}
										}
									]}
								>
									<DatePicker 
										style={{ width: '100%' }}
										placeholder={t('teacherManagement.selectDateOfBirth')}
										format="YYYY-MM-DD"
										disabledDate={(current) => {
											// Disable dates before 1920-01-01
											return current && current.year() < 1920;
										}}
									/>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={24}>
								<Form.Item
									label={t('teacherManagement.address')}
									name="address"
									rules={[
										{ max: 255, message: t('teacherManagement.addressMaxLength') },
									]}
								>
									<Input />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>

				{/* Confirmation Modal */}
				<Modal
					title={
						<div style={{ 
							fontSize: '28px', 
							fontWeight: '600', 
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0'
						}}>
							{confirmModal.title}
						</div>
					}
					open={confirmModal.visible}
					onOk={confirmModal.onConfirm}
					onCancel={handleConfirmCancel}
					okText={t('common.confirm')}
					cancelText={t('common.cancel')}
					width={500}
					centered
					bodyStyle={{
						padding: '30px 40px',
						fontSize: '16px',
						lineHeight: '1.6',
						textAlign: 'center'
					}}
					okButtonProps={{
						style: {
							background: '#ff4d4f',
							borderColor: '#ff4d4f',
							color: '#fff',
							borderRadius: '6px',
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							width: '100px',
							transition: 'all 0.3s ease',
							boxShadow: 'none'
						}
					}}
					cancelButtonProps={{
						style: {
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							width: '100px'
						}
					}}
				>
					<div style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '20px'
					}}>
						<div style={{
							fontSize: '48px',
							color: '#ff4d4f',
							marginBottom: '10px'
						}}>
							🗑️
						</div>
						<p style={{
							fontSize: '18px',
							color: '#333',
							margin: 0,
							fontWeight: '500'
						}}>
							{confirmModal.content}
						</p>
					</div>
				</Modal>

				{/* Edit Email Modal */}
				<EditEmailModal
					isVisible={editEmailModalVisible}
					onClose={(shouldRefresh) => {
						setEditEmailModalVisible(false);
						if (shouldRefresh) {
							handleEmailUpdateSuccess();
						}
					}}
					teacherId={teacherId}
					currentEmail={teacher?.email}
				/>
			</div>
		</ThemedLayout>
	);
};

export default TeacherProfile;
