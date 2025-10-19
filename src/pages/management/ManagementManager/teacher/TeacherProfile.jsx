import React, { useState, useEffect, useCallback } from 'react';
import {
	Card,
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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
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

	// Teacher data from API
	const [teacher, setTeacher] = useState(null);



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
				spaceToast.success(t('teacherManagement.updateTeacherSuccess'));
			} else {
				spaceToast.error(response.message || t('teacherManagement.updateTeacherError'));
			}
		} catch (error) {
			console.error('Error updating teacher profile:', error);
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.updateTeacherError');
			spaceToast.error(errorMessage);
		} finally {
			setEditLoading(false);
		}
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
					{students}
				</Space>
			),
		},
		{
			title: t('teacherManagement.startDate'),
			dataIndex: 'startDate',
			key: 'startDate',
			render: (date) => (
				<Space>
					<CalendarOutlined />
					{new Date(date).toLocaleDateString('vi-VN')}
				</Space>
			),
		},
		{
			title: t('teacherManagement.status'),
			dataIndex: 'status',
			key: 'status',
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{status === 'active' ? t('teacherManagement.active') : t('teacherManagement.inactive')}
				</Tag>
			),
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
							background: theme === 'space' ? 'rgb(224 217 255 / 95%)' : theme === 'sun' ? '#E6F5FF' : 'rgba(240, 248, 255, 0.95)',
							borderRadius: '16px',
							padding: '20px',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
							border: theme === 'space' ? '1px solid rgba(77, 208, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
							maxWidth: '800px',
							margin: '24px auto 0 auto',
							minHeight: 'auto',
							height: '300px'
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
							<Table
								columns={classColumns}
								dataSource={teacher.classList || []}
								rowKey='id'
								pagination={false}
								size='small'
								locale={{
									emptyText: t('teacherManagement.noClassesFound')
								}}
								style={{ marginBottom: 0 }}
							/>
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
							fontSize: '18px', 
							fontWeight: '600', 
							color: '#000000',
							textAlign: 'center',
							padding: '8px 0'
						}}>
							{t('teacherManagement.editProfile')}
						</div>
					}
					open={editModalVisible}
					onCancel={() => setEditModalVisible(false)}
					footer={null}
					width={600}
					className={`edit-modal ${theme}-edit-modal`}
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
									<Select placeholder={t('teacherManagement.rolePlaceholder')}>
										<Select.Option value="TEACHER">{t('teacherManagement.teacher')}</Select.Option>
										<Select.Option value="TEACHING_ASSISTANT">{t('teacherManagement.teacherAssistant')}</Select.Option>
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
									<Input placeholder={t('teacherManagement.enterFullName')} />
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
									<Input placeholder={t('teacherManagement.enterPhone')} />
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
									<Input placeholder={t('teacherManagement.enterAddress')} />
								</Form.Item>
							</Col>
						</Row>

						{/* Action Buttons */}
						<Row gutter={16} style={{ marginTop: 24 }}>
							<Col span={12}>
								<Button
									type="default"
									onClick={() => setEditModalVisible(false)}
									style={{ width: '100%', height: 32 }}
								>
									{t('common.cancel')}
								</Button>
							</Col>
							<Col span={12}>
								<Button
									type="primary"
									htmlType="submit"
									loading={editLoading}
									style={{ 
										width: '100%', 
										height: 32,
										backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
										background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
										borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
										color: theme === 'sun' ? '#000000' : '#ffffff',
									}}
								>
									{t('teacherManagement.updateProfile')}
								</Button>
							</Col>
						</Row>
					</Form>
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
