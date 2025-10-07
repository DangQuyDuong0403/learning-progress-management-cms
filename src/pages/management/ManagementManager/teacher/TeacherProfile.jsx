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
} from 'antd';
import {
	ArrowLeftOutlined,
	EditOutlined,
	UserOutlined,
	CalendarOutlined,
	BookOutlined,
	TrophyOutlined,
	ClockCircleOutlined,
	UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import dayjs from 'dayjs';
import './TeacherList.css';
import ThemedLayout from '../../../../component/ThemedLayout';

const TeacherProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { teacherId } = useParams();
	const { theme } = useTheme();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);

	// Mock data - replace with actual API call
	const [teacher, setTeacher] = useState({
		id: teacherId || '1',
		name: 'Nguyễn Văn A',
		email: 'nguyenvana@example.com',
		phone: '0123456789',
		role: 'teacher',
		specialization: 'Mathematics',
		experience: '5 years',
		status: 'active',
		avatar: '/img/avatar.png',
		dateOfBirth: '1990-01-15',
		address: '123 Đường ABC, Quận 1, TP.HCM',
		bio: 'Giáo viên có kinh nghiệm trong việc giảng dạy Toán học cho học sinh cấp 2 và cấp 3.',
		joinDate: '2020-01-15',
		rating: 4.8,
		totalStudents: 150,
		averageRating: 4.7,
		completedCourses: 12,
	});

	const [currentClasses] = useState([
		{
			id: '1',
			name: 'Raising Star 1',
			students: 35,
			startDate: '2024-01-15',
			status: 'active',
		},
		{
			id: '2',
			name: 'A2 PET',
			students: 28,
			startDate: '2024-01-15',
			status: 'active',
		},
		{
			id: '3',
			name: 'Explorer 1',
			students: 32,
			startDate: '2024-01-15',
			status: 'active',
		},
	]);

	const [recentActivities] = useState([
		{
			id: '1',
			action: 'Graded assignments',
			class: 'Raising Star 1',
			date: '2024-01-20',
			time: '14:30',
		},
		{
			id: '2',
			action: 'Conducted class',
			class: 'A2 PET',
			date: '2024-01-20',
			time: '10:00',
		},
		{
			id: '3',
			action: 'Updated lesson plan',
			class: 'Explorer 1',
			date: '2024-01-19',
			time: '16:45',
		},
	]);

	const [achievements] = useState([
		{
			id: '1',
			title: 'Best Teacher Award 2023',
			description: 'Awarded for outstanding teaching performance',
			date: '2023-12-15',
			type: 'award',
		},
		{
			id: '2',
			title: 'Student Satisfaction 95%',
			description: 'Achieved high student satisfaction rating',
			date: '2023-11-30',
			type: 'achievement',
		},
		{
			id: '3',
			title: 'Course Completion Certificate',
			description: 'Completed Advanced Mathematics Teaching Course',
			date: '2023-10-15',
			type: 'certificate',
		},
	]);

	useEffect(() => {
		fetchTeacherProfile();
	}, [teacherId]);

	const fetchTeacherProfile = async () => {
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			// In real app, fetch teacher data by teacherId
		} catch (error) {
			console.error('Error fetching teacher profile:', error);
		}
	};

	const handleBack = () => {
		navigate('/manager/teachers');
	};

	const handleEdit = () => {
		setEditModalVisible(true);
		editForm.setFieldsValue({
			...teacher,
			dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
		});
		setAvatarUrl(teacher.avatar);
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const updatedTeacher = {
				...teacher,
				...values,
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
				avatar: avatarUrl,
			};
			
			setTeacher(updatedTeacher);
			setEditModalVisible(false);
			spaceToast.success(t('teacherManagement.updateTeacherSuccess'));
		} catch (error) {
			spaceToast.error(t('teacherManagement.saveTeacherError'));
		} finally {
			setEditLoading(false);
		}
	};

	const handleAvatarChange = (info) => {
		if (info.file.status === 'done') {
			// Simulate successful upload
			const url = URL.createObjectURL(info.file.originFileObj);
			setAvatarUrl(url);
			message.success(t('teacherManagement.avatarUploadSuccess'));
		} else if (info.file.status === 'error') {
			message.error(t('teacherManagement.avatarUploadError'));
		}
	};

	const uploadProps = {
		name: 'avatar',
		listType: 'picture',
		showUploadList: false,
		beforeUpload: (file) => {
			const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
			if (!isJpgOrPng) {
				message.error(t('teacherManagement.avatarFormatError'));
			}
			const isLt2M = file.size / 1024 / 1024 < 2;
			if (!isLt2M) {
				message.error(t('teacherManagement.avatarSizeError'));
			}
			return isJpgOrPng && isLt2M;
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

	const activityColumns = [
		{
			title: t('teacherManagement.action'),
			dataIndex: 'action',
			key: 'action',
		},
		{
			title: t('teacherManagement.class'),
			dataIndex: 'class',
			key: 'class',
		},
		{
			title: t('teacherManagement.date'),
			dataIndex: 'date',
			key: 'date',
			render: (date, record) => (
				<Space>
					<CalendarOutlined />
					{new Date(date).toLocaleDateString('vi-VN')} {record.time}
				</Space>
			),
		},
	];

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
										src={teacher.avatar}
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
											{teacher.name}
										</h2>

										<div style={{ display: 'flex', gap: '8px' }}>
											{' '}
											{/* ✅ nhóm 2 tag trên cùng 1 hàng */}
											<Tag
												style={{
													fontSize: '16px', // chữ to hơn
													padding: '6px 12px', // khoảng cách trong tag
													borderRadius: '8px', // bo góc
												}}
												color='blue'
												className={`role-tag ${theme}-role-tag`}>
												{teacher.role === 'teacher'
													? t('teacherManagement.teacher')
													: t('teacherManagement.teacherAssistant')}
											</Tag>
											<Tag
												style={{
													fontSize: '16px', // chữ to hơn
													padding: '6px 12px', // khoảng cách trong tag
													borderRadius: '8px', // bo góc
												}}
												color='green'
												className={`status-tag ${theme}-status-tag`}>
												{teacher.status === 'active'
													? t('teacherManagement.active')
													: t('teacherManagement.inactive')}
											</Tag>
										</div>
									</div>

									<div className='teacher-details'>
										<p>
											<strong>{t('teacherManagement.email')}:</strong>{' '}
											{teacher.email}
										</p>
										<p>
											<strong>{t('teacherManagement.phone')}:</strong>{' '}
											{teacher.phone}
										</p>
										<p>
											<strong>{t('teacherManagement.specialization')}:</strong>{' '}
											{teacher.specialization}
										</p>
										<p>
											<strong>{t('teacherManagement.experience')}:</strong>{' '}
											{teacher.experience}
										</p>
										<p>
											<strong>{t('teacherManagement.joinDate')}:</strong>{' '}
											{new Date(teacher.joinDate).toLocaleDateString('vi-VN')}
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
							dataSource={currentClasses}
							rowKey='id'
							pagination={false}
							size='small'
						/>
					</Card>

					{/* Recent Activities */}
					<Card
						title={
							<Space>
								<ClockCircleOutlined />
								{t('teacherManagement.recentActivities')}
							</Space>
						}
						className={`activities-card ${theme}-activities-card`}
						style={{ marginBottom: 24 }}>
						<Table
							columns={activityColumns}
							dataSource={recentActivities}
							rowKey='id'
							pagination={false}
							size='small'
						/>
					</Card>

					{/* Achievements */}
					<Card
						title={
							<Space>
								<TrophyOutlined />
								{t('teacherManagement.achievements')}
							</Space>
						}
						className={`achievements-card ${theme}-achievements-card`}>
						<Timeline>
							{achievements.map((achievement) => (
								<Timeline.Item
									key={achievement.id}
									color={
										achievement.type === 'award'
											? 'gold'
											: achievement.type === 'achievement'
											? 'green'
											: 'blue'
									}>
									<div className='achievement-item'>
										<h4>{achievement.title}</h4>
										<p>{achievement.description}</p>
										<small>
											{new Date(achievement.date).toLocaleDateString('vi-VN')}
										</small>
									</div>
								</Timeline.Item>
							))}
						</Timeline>
					</Card>
				</div>

				{/* Edit Modal */}
				<Modal
					title={t('teacherManagement.editProfile')}
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
						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="name"
									label={t('teacherManagement.name')}
									rules={[
										{ required: true, message: t('teacherManagement.nameRequired') },
										{ min: 2, message: t('teacherManagement.nameMinLength') },
									]}
								>
									<Input 
										placeholder={t('teacherManagement.namePlaceholder')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="email"
									label={t('teacherManagement.email')}
									rules={[
										{ required: true, message: t('teacherManagement.emailRequired') },
										{ type: 'email', message: t('teacherManagement.emailInvalid') },
									]}
								>
									<Input 
										placeholder={t('teacherManagement.emailPlaceholder')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="phone"
									label={t('teacherManagement.phone')}
									rules={[
										{ required: true, message: t('teacherManagement.phoneRequired') },
										{ pattern: /^[0-9]{10,11}$/, message: t('teacherManagement.phoneInvalid') },
									]}
								>
									<Input 
										placeholder={t('teacherManagement.phonePlaceholder')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="dateOfBirth"
									label={t('teacherManagement.dateOfBirth')}
								>
									<DatePicker 
										style={{ width: '100%' }}
										placeholder={t('teacherManagement.dateOfBirthPlaceholder')}
										className={`form-input ${theme}-form-input`}
										format="DD/MM/YYYY"
									/>
								</Form.Item>
							</Col>
						</Row>

						{/* Professional Information */}
						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="role"
									label={t('teacherManagement.role')}
									rules={[{ required: true, message: t('teacherManagement.roleRequired') }]}
								>
									<Select 
										placeholder={t('teacherManagement.rolePlaceholder')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="teacher">{t('teacherManagement.teacher')}</Select.Option>
										<Select.Option value="teacher_assistant">{t('teacherManagement.teacherAssistant')}</Select.Option>
									</Select>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="specialization"
									label={t('teacherManagement.specialization')}
									rules={[{ required: true, message: t('teacherManagement.specializationRequired') }]}
								>
									<Select 
										placeholder={t('teacherManagement.specializationPlaceholder')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="Mathematics">{t('teacherManagement.mathematics')}</Select.Option>
										<Select.Option value="English">{t('teacherManagement.english')}</Select.Option>
										<Select.Option value="Physics">{t('teacherManagement.physics')}</Select.Option>
										<Select.Option value="Chemistry">{t('teacherManagement.chemistry')}</Select.Option>
										<Select.Option value="Biology">{t('teacherManagement.biology')}</Select.Option>
										<Select.Option value="History">{t('teacherManagement.history')}</Select.Option>
										<Select.Option value="Geography">{t('teacherManagement.geography')}</Select.Option>
										<Select.Option value="Computer Science">{t('teacherManagement.computerScience')}</Select.Option>
									</Select>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="experience"
									label={t('teacherManagement.experience')}
									rules={[{ required: true, message: t('teacherManagement.experienceRequired') }]}
								>
									<Input 
										placeholder={t('teacherManagement.experiencePlaceholder')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="status"
									label={t('teacherManagement.status')}
									rules={[{ required: true, message: t('teacherManagement.statusRequired') }]}
								>
									<Select 
										placeholder={t('teacherManagement.statusPlaceholder')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="active">{t('teacherManagement.active')}</Select.Option>
										<Select.Option value="inactive">{t('teacherManagement.inactive')}</Select.Option>
									</Select>
								</Form.Item>
							</Col>
						</Row>

						{/* Address */}
						<Form.Item
							name="address"
							label={t('teacherManagement.address')}
						>
							<Input.TextArea 
								rows={3}
								placeholder={t('teacherManagement.addressPlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>

						{/* Bio */}
						<Form.Item
							name="bio"
							label={t('teacherManagement.bio')}
						>
							<Input.TextArea 
								rows={4}
								placeholder={t('teacherManagement.bioPlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>

						{/* Action Buttons */}
						<Row gutter={16} style={{ marginTop: 32 }}>
							<Col span={12}>
								<Button
									type="default"
									onClick={() => setEditModalVisible(false)}
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
									loading={editLoading}
									style={{ width: '100%', height: 40 }}
									className={`submit-button ${theme}-submit-button`}
								>
									{t('common.update')}
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
