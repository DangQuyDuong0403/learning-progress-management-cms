import React, { useState, useEffect } from 'react';
import {
	Card,
	Row,
	Col,
	Button,
	Avatar,
	Tag,
	Table,
	Timeline,
	Space,
	Modal,
	Form,
	Input,
	Select,
	DatePicker,
	Upload,
	message,
	Spin,
	Alert,
	Typography,
} from 'antd';
import {
	ArrowLeftOutlined,
	EditOutlined,
	UserOutlined,
	UploadOutlined,
	CalendarOutlined,
	BookOutlined,
	TrophyOutlined,
	ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
import dayjs from 'dayjs';
import './TeacherList.css';
import ThemedLayout from '../../../../component/ThemedLayout';

const { Title } = Typography;

const TeacherProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { teacherId } = useParams();
	const { theme } = useTheme();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Teacher data from API
	const [teacher, setTeacher] = useState(null);

	useEffect(() => {
		fetchTeacherProfile();
	}, [teacherId]);

	const fetchTeacherProfile = async () => {
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
				setAvatarUrl(response.data.avatarUrl);
			} else {
				setError(response.message || 'Failed to fetch teacher profile');
			}
		} catch (error) {
			console.error('Error fetching teacher profile:', error);
			setError('An error occurred while fetching the teacher profile');
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		navigate('/manager/teachers');
	};

	const handleEdit = () => {
		if (!teacher) return;
		
		setEditModalVisible(true);
		editForm.setFieldsValue({
			firstName: teacher.firstName,
			lastName: teacher.lastName,
			email: teacher.email,
			phoneNumber: teacher.phoneNumber,
			dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
			gender: teacher.gender,
			address: teacher.address,
		});
		setAvatarUrl(teacher.avatarUrl);
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
			// Format the data according to the API requirements
			const teacherData = {
				roleName: "TEACHER", // Always TEACHER for teacher profile
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				avatarUrl: avatarUrl || "string", // Use current avatar or default to "string"
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
				address: values.address || null,
				phoneNumber: values.phoneNumber || null,
				gender: values.gender || null, // MALE, FEMALE, OTHER
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
			spaceToast.error(error.response?.data?.message || error.message || t('teacherManagement.updateTeacherError'));
		} finally {
			setEditLoading(false);
		}
	};

	const handleAvatarChange = (info) => {
		// This function is now mainly for handling upload status changes
		// The actual file handling is done in beforeUpload
		if (info.file.status === 'error') {
			message.error(t('teacherManagement.avatarUploadError'));
		}
	};

	const uploadProps = {
		name: 'avatar',
		listType: 'picture',
		showUploadList: false,
		action: '', // Disable default upload action to prevent 404 error
		beforeUpload: (file) => {
			const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
			if (!isJpgOrPng) {
				message.error(t('teacherManagement.avatarFormatError'));
				return false;
			}
			const isLt2M = file.size / 1024 / 1024 < 2;
			if (!isLt2M) {
				message.error(t('teacherManagement.avatarSizeError'));
				return false;
			}
			// Handle file locally without server upload
			const url = URL.createObjectURL(file);
			setAvatarUrl(url);
			message.success(t('teacherManagement.avatarUploadSuccess'));
			return false; // Prevent default upload
		},
		onChange: handleAvatarChange,
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
					{status === 'active'
						? t('teacherManagement.active')
						: t('teacherManagement.inactive')}
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
							{t('teacherManagement.backToTeachers')}
						</Button>
						<Button
							type='primary'
							icon={<EditOutlined />}
							onClick={handleEdit}
							className={`edit-button ${theme}-edit-button`}>
							{t('teacherManagement.editProfile')}
						</Button>
					</div>

					{/* Teacher Info Card */}
					<Card className={`profile-card ${theme}-profile-card`}>
						<Row gutter={24}>
							<Col span={6}>
								<div className='avatar-section'>
									<Avatar
										size={120}
										icon={<UserOutlined />}
										src={teacher.avatarUrl}
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
											style={{ margin: 0 }}>
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
												{teacher.roleName ? teacher.roleName.charAt(0).toUpperCase() + teacher.roleName.slice(1).toLowerCase() : 'N/A'}
											</span>
											<span
												style={{
													fontSize: '16px',
													padding: '6px 12px',
													borderRadius: '8px',
													color: teacher.status === 'ACTIVE' ? '#52c41a' : '#ff4d4f',
													fontWeight: '500',
												}}
												className={`status-text ${theme}-status-text`}>
												{teacher.status === 'ACTIVE'
													? t('teacherManagement.active')
													: t('teacherManagement.inactive')}
											</span>
										</div>
									</div>

									<div className='teacher-details'>
										<p>
											<strong>{t('teacherManagement.teacherCode')}:</strong>{' '}
											{teacher.userName}
										</p>
										<p>
											<strong>{t('teacherManagement.email')}:</strong>{' '}
											{teacher.email}
										</p>
										<p>
											<strong>{t('teacherManagement.phone')}:</strong>{' '}
											{teacher.phoneNumber || 'N/A'}
										</p>
										<p>
											<strong>{t('teacherManagement.dateOfBirth')}:</strong>{' '}
											{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
										</p>
										<p>
											<strong>{t('teacherManagement.gender')}:</strong>{' '}
											{teacher.gender ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1).toLowerCase() : 'N/A'}
										</p>
										<p>
											<strong>{t('teacherManagement.address')}:</strong>{' '}
											{teacher.address || 'N/A'}
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
							fontSize: '26px', 
							fontWeight: '600', 
							color: '#000000ff',
							textAlign: 'center',
							padding: '10px 0'
						}}>
							{t('teacherManagement.editProfile')}
						</div>
					}
					open={editModalVisible}
					onCancel={() => setEditModalVisible(false)}
					footer={null}
					width={800}
					className={`edit-modal ${theme}-edit-modal`}
				>
					<Form
						form={editForm}
						layout="vertical"
						onFinish={handleEditSubmit}
					>
						{/* Avatar Section */}
						<Row gutter={24} style={{ marginBottom: 24 }}>
							<Col span={24} style={{ textAlign: 'center' }}>
								<div className="avatar-section">
									<Avatar
										size={120}
										icon={<UserOutlined />}
										src={avatarUrl || teacher?.avatarUrl}
										style={{ 
											backgroundColor: '#1890ff',
											marginBottom: 16,
											border: `3px solid ${theme === 'space' ? 'rgba(77, 208, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
											boxShadow: `0 4px 12px ${theme === 'space' ? 'rgba(77, 208, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`
										}}
									/>
									<div>
										<Upload {...uploadProps}>
											<Button 
												icon={<UploadOutlined />}
												className={`upload-button ${theme}-upload-button`}
											>
												{t('teacherManagement.uploadAvatar')}
											</Button>
										</Upload>
									</div>
								</div>
							</Col>
						</Row>

						{/* Basic Information */}
						<Title level={5} style={{ marginBottom: '16px', color: '#1890ff' }}>
							{t('teacherManagement.basicInformation')}
						</Title>
						
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
											{t('teacherManagement.email')}
											<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
										</span>
									}
									name="email"
									rules={[
										{ required: true, message: t('teacherManagement.emailRequired') },
										{ type: 'email', message: t('teacherManagement.emailInvalid') },
										{ max: 255, message: t('teacherManagement.emailMaxLength') },
									]}
								>
									<Input placeholder={t('teacherManagement.enterEmail')} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									label={t('teacherManagement.phone')}
									name="phoneNumber"
									rules={[
										{ max: 20, message: t('teacherManagement.phoneMaxLength') },
									]}
								>
									<Input placeholder={t('teacherManagement.enterPhone')} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
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
							<Col span={12}>
								<Form.Item
									label={t('teacherManagement.gender')}
									name="gender"
								>
									<Select placeholder={t('teacherManagement.selectGender')}>
										<Select.Option value="MALE">{t('common.male')}</Select.Option>
										<Select.Option value="FEMALE">{t('common.female')}</Select.Option>
										<Select.Option value="OTHER">{t('common.other')}</Select.Option>
									</Select>
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
						<Row gutter={16} style={{ marginTop: 32 }}>
							<Col span={12}>
								<Button
									type="default"
									onClick={() => setEditModalVisible(false)}
									style={{ width: '100%', height: 40 }}
								>
									{t('common.cancel')}
								</Button>
							</Col>
							<Col span={12}>
								<Button
									type="primary"
									htmlType="submit"
									loading={editLoading}
									style={{ width: '100%', height: 40 }}
								>
									{t('teacherManagement.updateProfile')}
								</Button>
							</Col>
						</Row>
					</Form>
				</Modal>
			</div>
		</ThemedLayout>
	);
};

export default TeacherProfile;
