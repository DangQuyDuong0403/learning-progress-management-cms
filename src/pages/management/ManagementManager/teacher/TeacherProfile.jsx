import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

	// Available teacher avatar images
	const teacherAvatarImages = useMemo(() => [
		'teacher1.png',
		'teacher2.png',
		'teacher3.png',
		'teacher4.png',
		'teacher5.png',
		'teacher6.png',
		'teacher7.png',
		'teacher8.png',
		'teacher9.png',
		'teacher10.png',
		'teacher11.png',
		'teacher12.png',
	], []);

	// Function to get random teacher avatar based on teacher ID
	const getRandomTeacherAvatar = useCallback((teacherId) => {
		if (!teacherId) return null;
		
		// Use teacher ID as seed for consistent random selection
		const seed = parseInt(teacherId.toString().slice(-3)) || 0;
		const randomIndex = seed % teacherAvatarImages.length;
		return `/img/teacher_avatar/${teacherAvatarImages[randomIndex]}`;
	}, [teacherAvatarImages]);

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
				// Use random teacher avatar based on teacher ID instead of API avatarUrl
				const randomAvatar = getRandomTeacherAvatar(response.data.id);
				setAvatarUrl(randomAvatar);
			} else {
				setError(response.message || 'Failed to fetch teacher profile');
			}
		} catch (error) {
			console.error('Error fetching teacher profile:', error);
			setError('An error occurred while fetching the teacher profile');
		} finally {
			setLoading(false);
		}
	}, [teacherId, getRandomTeacherAvatar]);

	useEffect(() => {
		fetchTeacherProfile();
	}, [fetchTeacherProfile]);

	const handleBack = () => {
		navigate('/manager/teachers');
	};

	const handleEdit = () => {
		if (!teacher) return;
		
		setEditModalVisible(true);
		
		// Get current avatar filename from avatarUrl
		const currentAvatarFilename = avatarUrl ? avatarUrl.split('/').pop() : null;
		
		editForm.setFieldsValue({
			roleName: teacher.roleName,
			firstName: teacher.firstName,
			lastName: teacher.lastName,
			email: teacher.email,
			phoneNumber: teacher.phoneNumber,
			dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
			gender: teacher.gender,
			address: teacher.address,
			// Avatar selection
			avatar: currentAvatarFilename,
		});
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
		// Format the data according to the API requirements from the image
		const teacherData = {
			roleName: values.roleName || "TEACHER", // Use selected role or default to TEACHER
			email: values.email,
			firstName: values.firstName,
			lastName: values.lastName,
			avatarUrl: "string", // Always send "string" as per API requirement
			dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null, // Use ISO format like in the image
			address: values.address || "",
			phoneNumber: values.phoneNumber,
			gender: values.gender || "MALE", // MALE, FEMALE, OTHER
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

	// Function to handle avatar selection from dropdown
	const handleAvatarSelect = (selectedAvatar) => {
		if (selectedAvatar) {
			setAvatarUrl(`/img/teacher_avatar/${selectedAvatar}`);
		}
	};

	const classColumns = [
		{
			title: "Class Name",
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: "Students",
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
			title: "Start Date",
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
			title: "Status",
			dataIndex: 'status',
			key: 'status',
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{status === 'active' ? 'Active' : 'Inactive'}
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
												{teacher.roleName === 'TEACHER' ? 'Teacher' : teacher.roleName === 'TEACHING_ASSISTANT' ? 'Teaching Assistant' : 'N/A'}
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
												{teacher.status === 'ACTIVE' ? 'Active' : 'Inactive'}
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
											<span style={{ color: theme === 'space' ? '#ffffff' : '#000000' }}>{teacher.gender === 'MALE' ? 'Male' : teacher.gender === 'FEMALE' ? 'Female' : teacher.gender === 'OTHER' ? 'Other' : 'N/A'}</span>
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
										src={avatarUrl}
										style={{ 
											backgroundColor: '#1890ff',
											marginBottom: 16,
											border: `3px solid ${theme === 'space' ? 'rgba(77, 208, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
											boxShadow: `0 4px 12px ${theme === 'space' ? 'rgba(77, 208, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`
										}}
									/>
									<div>
										<Form.Item
											name="avatar"
											label={t('teacherManagement.selectAvatar')}
											rules={[{ required: true, message: t('teacherManagement.avatarRequired') }]}
										>
											<Select
												placeholder={t('teacherManagement.selectAvatar')}
												onChange={handleAvatarSelect}
												className={`custom-dropdown ${theme}-custom-dropdown`}
												showSearch
												filterOption={(input, option) =>
													option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
												}
												style={{ width: 200 }}
											>
												{teacherAvatarImages.map((avatar, index) => (
													<Select.Option key={index} value={avatar}>
														<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
															<Avatar
																size={24}
																src={`/img/teacher_avatar/${avatar}`}
																style={{ flexShrink: 0 }}
															/>
															<span>{avatar.replace('.png', '').replace('teacher', 'Teacher ')}</span>
														</div>
													</Select.Option>
												))}
											</Select>
										</Form.Item>
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
									label={t('teacherManagement.gender')}
									name="gender"
									rules={[
										{ required: true, message: t('teacherManagement.genderRequired') },
									]}
								>
									<Select placeholder={t('teacherManagement.genderPlaceholder')}>
										<Select.Option value="MALE">{t('teacherManagement.male')}</Select.Option>
										<Select.Option value="FEMALE">{t('teacherManagement.female')}</Select.Option>
										<Select.Option value="OTHER">{t('teacherManagement.other')}</Select.Option>
									</Select>
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
