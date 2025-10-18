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
			firstName: teacher.firstName,
			lastName: teacher.lastName,
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
			firstName: values.firstName,
			lastName: values.lastName,
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
							<Button
								type='default'
								icon={<EditOutlined />}
								onClick={handleEditEmail}
								className={`edit-email-button ${theme}-edit-email-button`}
								style={{
									backgroundColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.1)' : 'rgba(138, 122, 255, 0.1)',
									borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'rgb(138, 122, 255)',
									color: theme === 'sun' ? 'rgb(113, 179, 253)' : 'rgb(138, 122, 255)',
								}}>
								{t('teacherManagement.editEmail')}
							</Button>
						</div>
					</div>

					{/* Teacher Info Card */}
					<Card className={`profile-card ${theme}-profile-card`}>
						<Row gutter={24}>
							<Col span={6}>
								<div className='avatar-section' style={{ position: 'relative' }}>
									<div
										onClick={() => document.getElementById('teacher-avatar-upload').click()}
										style={{
											cursor: 'pointer',
											position: 'relative',
											display: 'inline-block'
										}}
									>
										<Avatar
											size={120}
											icon={<UserOutlined />}
											src={avatarUrl}
											style={{
												backgroundColor: '#1890ff',
												border: `3px solid ${
													theme === 'space'
														? 'rgba(77, 208, 255, 0.5)'
														: 'rgba(0, 0, 0, 0.1)'
												}`,
												boxShadow: `0 4px 12px ${
													theme === 'space'
														? 'rgba(77, 208, 255, 0.3)'
														: 'rgba(0, 0, 0, 0.1)'
												}`,
											}}
										/>
										{avatarUploadLoading && (
											<div
												style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													backgroundColor: 'rgba(0, 0, 0, 0.5)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													borderRadius: '50%',
												}}
											>
												<Spin size="small" />
											</div>
										)}
									</div>
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
									<p style={{ 
										textAlign: 'center', 
										marginTop: '8px', 
										fontSize: '12px',
										color: theme === 'space' ? '#ffffff' : '#000000',
										cursor: 'pointer'
									}}>
										{t('teacherManagement.clickToChangeAvatar')}
									</p>
								</div>
							</Col>
							<Col span={18}>
								<div
									className='teacher-info'
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'flex-start',
										gap: '8px',
										marginBottom: '16px',
									}}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column', // ✅ sắp xếp theo cột
											alignItems: 'flex-start', // căn trái
											gap: '8px', // khoảng cách giữa các dòng
											marginBottom: '16px',
										}}>
										<h2
											className={`teacher-name ${theme}-teacher-name`}
											style={{ 
												margin: 0,
												color: theme === 'space' ? '#ffffff' : '#000000'
											}}>
											{teacher.firstName} {teacher.lastName}
										</h2>

										<div style={{ display: 'flex', gap: '8px' }}>
											<span
												style={{
													fontSize: '16px',
													padding: '6px 12px',
													borderRadius: '8px',
													color: '#1890ff',
													fontWeight: '500',
												}}
												className={`role-text ${theme}-role-text`}>
												{teacher.roleName === 'TEACHER' ? t('common.teacher') : teacher.roleName === 'TEACHING_ASSISTANT' ? t('common.teachingAssistant') : 'N/A'}
											</span>
											<span
												style={{
													fontSize: '16px',
													padding: '6px 12px',
													borderRadius: '8px',
													color: teacher.status === 'ACTIVE' ? '#52c41a' : teacher.status === 'PENDING' ? '#faad14' : '#ff4d4f',
													fontWeight: '500',
												}}
												className={`status-text ${theme}-status-text`}>
												{teacher.status === 'ACTIVE' ? t('teacherManagement.active') : teacher.status === 'PENDING' ? t('teacherManagement.pending') : t('teacherManagement.inactive')}
											</span>
										</div>
									</div>

									<div className='teacher-details' style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
										<p style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
											<strong style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{t('teacherManagement.teacherCode')}:</strong>{' '}
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.userName}</span>
										</p>
										<p style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
											<strong style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{t('teacherManagement.email')}:</strong>{' '}
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.email}</span>
										
										</p>
										<p style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
											<strong style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{t('teacherManagement.phone')}:</strong>{' '}
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.phoneNumber || 'N/A'}</span>
										</p>
										<p style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
											<strong style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{t('teacherManagement.dateOfBirth')}:</strong>{' '}
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</span>
										</p>
										<p style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
											<strong style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{t('teacherManagement.gender')}:</strong>{' '}
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.gender === 'MALE' ? t('common.male') : teacher.gender === 'FEMALE' ? t('common.female') : teacher.gender === 'OTHER' ? t('common.other') : 'N/A'}</span>
										</p>
										<p style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>
											<strong style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{t('teacherManagement.address')}:</strong>{' '}
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.address || 'N/A'}</span>
										</p>
									</div>
								</div>
							</Col>
						</Row>
					</Card>

					{/* Current Classes */}
					<Card
						title={
							<Space>
								<BookOutlined />
								{t('teacherManagement.currentClasses')}
							</Space>
						}
						className={`classes-card ${theme}-classes-card`}
						style={{ marginBottom: 24, marginTop: 24 }}>
						<Table
							columns={classColumns}
							dataSource={teacher.classList || []}
							rowKey='id'
							pagination={false}
							size='small'
							locale={{
								emptyText: t('teacherManagement.noClassesFound')
							}}
						/>
					</Card>

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
							<Col span={12}>
								<Form.Item
									label={
										<span>
											{t('teacherManagement.firstName')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="firstName"
									rules={[
										{ required: true, message: t('teacherManagement.firstNameRequired') },
										{ max: 50, message: t('teacherManagement.nameMaxLength') },
									]}
								>
									<Input placeholder={t('teacherManagement.enterFirstName')} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									label={
										<span>
											{t('teacherManagement.lastName')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="lastName"
									rules={[
										{ required: true, message: t('teacherManagement.lastNameRequired') },
										{ max: 50, message: t('teacherManagement.nameMaxLength') },
									]}
								>
									<Input placeholder={t('teacherManagement.enterLastName')} />
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
								>
									<DatePicker 
										style={{ width: '100%' }}
										placeholder={t('teacherManagement.selectDateOfBirth')}
										format="YYYY-MM-DD"
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
