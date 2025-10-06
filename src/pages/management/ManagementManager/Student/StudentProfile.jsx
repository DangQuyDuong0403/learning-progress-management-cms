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
	KeyOutlined,
	BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import dayjs from 'dayjs';
import './StudentList.css';
import ThemedLayout from '../../../../component/ThemedLayout';

const StudentProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { studentId } = useParams();
	const { theme } = useTheme();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
	const [editForm] = Form.useForm();
	const [resetPasswordForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);

	// Mock data - replace with actual API call
	const [student, setStudent] = useState({
		id: studentId || '1',
		studentCode: 'STU001',
		fullName: 'Nguyễn Văn An',
		email: 'nguyenvanan@example.com',
		phone: '0123456789',
		class: 'Lớp 10A1',
		level: 'Intermediate',
		status: 'active',
		avatar: '/img/avatar.png',
		dateOfBirth: '2005-03-15',
		gender: 'male',
		joinDate: '2024-01-15',
		username: 'student001',
		lastActivity: '2024-12-21',
	});

	// Mock data - 1 học sinh chỉ có 1 lớp
	const [currentClass] = useState({
		id: '1',
		name: 'Lớp 10A1',
		teacher: 'Ms. Sarah Johnson',
		students: 35,
		startDate: '2024-01-15',
		status: 'active',
		subject: 'English',
		schedule: 'Thứ 2, 4, 6 - 9:00-10:30',
		room: 'Phòng 201',
	});

	useEffect(() => {
		fetchStudentProfile();
	}, [studentId]);

	const fetchStudentProfile = async () => {
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			// In real app, fetch student data by studentId
		} catch (error) {
			console.error('Error fetching student profile:', error);
		}
	};

	const handleBack = () => {
		navigate('/manager/students');
	};

	const handleEdit = () => {
		setEditModalVisible(true);
		editForm.setFieldsValue({
			...student,
			dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth) : null,
		});
		setAvatarUrl(student.avatar);
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const updatedStudent = {
				...student,
				...values,
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
				avatar: avatarUrl,
			};
			
			setStudent(updatedStudent);
			setEditModalVisible(false);
			spaceToast.success(t('studentManagement.updateStudentSuccess'));
		} catch (error) {
			spaceToast.error(t('studentManagement.loadStudentsError'));
		} finally {
			setEditLoading(false);
		}
	};

	const handleResetPassword = () => {
		setResetPasswordModalVisible(true);
		resetPasswordForm.resetFields();
	};

	const handleResetPasswordSubmit = async (values) => {
		setResetPasswordLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			setResetPasswordModalVisible(false);
			resetPasswordForm.resetFields();
			spaceToast.success(t('studentManagement.passwordChangedSuccess'));
		} catch (error) {
			spaceToast.error(t('studentManagement.passwordChangeError'));
		} finally {
			setResetPasswordLoading(false);
		}
	};

	const handleViewLearningProgress = () => {
		navigate(`/manager/student/${student.id}/progress`, { 
			state: { student: student } 
		});
	};

	const handleAvatarChange = (info) => {
		if (info.file.status === 'done') {
			// Simulate successful upload
			const url = URL.createObjectURL(info.file.originFileObj);
			setAvatarUrl(url);
			message.success(t('studentManagement.avatarUploadSuccess'));
		} else if (info.file.status === 'error') {
			message.error(t('studentManagement.avatarUploadError'));
		}
	};

	const uploadProps = {
		name: 'avatar',
		listType: 'picture',
		showUploadList: false,
		beforeUpload: (file) => {
			const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
			if (!isJpgOrPng) {
				message.error(t('studentManagement.avatarFormatError'));
			}
			const isLt2M = file.size / 1024 / 1024 < 2;
			if (!isLt2M) {
				message.error(t('studentManagement.avatarSizeError'));
			}
			return isJpgOrPng && isLt2M;
		},
		onChange: handleAvatarChange,
	};

	// Thông tin tài khoản
	const accountInfo = {
		username: student.username,
		passwordLastChanged: '2024-11-15',
		loginAttempts: 0,
		lastLogin: '2024-12-21 14:30',
		accountStatus: 'active',
		emailVerified: true,
		phoneVerified: true,
	};

	return (
		<ThemedLayout>
			<div className={`student-profile ${theme}-student-profile`}>
				<div className='profile-container'>
					{/* Header */}
					<div className='profile-header'>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={handleBack}
							className={`back-button ${theme}-back-button`}>
							{t('studentManagement.backToStudents')}
						</Button>
						<div className="header-actions">
							<Button
								icon={<KeyOutlined />}
								onClick={handleResetPassword}
								className={`reset-password-button ${theme}-reset-password-button`}>
								{t('studentManagement.resetPassword')}
							</Button>
							<Button
								icon={<BarChartOutlined />}
								onClick={handleViewLearningProgress}
								className={`progress-button ${theme}-progress-button`}>
								{t('studentManagement.studentLearningProgressOverview')}
							</Button>
							<Button
								type='primary'
								icon={<EditOutlined />}
								onClick={handleEdit}
								className={`edit-button ${theme}-edit-button`}>
								{t('studentManagement.editProfile')}
							</Button>
						</div>
					</div>

					{/* Student Info Card */}
					<Card className={`profile-card ${theme}-profile-card`}>
						<Row gutter={24}>
							<Col span={6}>
								<div className='avatar-section'>
									<Avatar
										size={120}
										icon={<UserOutlined />}
										src={student.avatar}
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
									className='student-info'
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
											flexDirection: 'column',
											alignItems: 'flex-start',
											gap: '8px',
											marginBottom: '16px',
										}}>
										<h2
											className={`student-name ${theme}-student-name`}
											style={{ margin: 0 }}>
											{student.fullName}
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
												{t('studentManagement.student')}
											</span>
											<span
												style={{
													fontSize: '16px',
													padding: '6px 12px',
													borderRadius: '8px',
													color: '#52c41a',
													fontWeight: '500',
												}}
												className={`status-text ${theme}-status-text`}>
												{student.status === 'active'
													? t('studentManagement.active')
													: t('studentManagement.inactive')}
											</span>
										</div>
									</div>

									<div className='student-details'>
										<p>
											<strong>{t('studentManagement.studentCode')}:</strong>{' '}
											{student.studentCode}
										</p>
										<p>
											<strong>{t('studentManagement.email')}:</strong>{' '}
											{student.email}
										</p>
										<p>
											<strong>{t('studentManagement.phone')}:</strong>{' '}
											{student.phone}
										</p>
										<p>
											<strong>{t('studentManagement.class')}:</strong>{' '}
											{student.class}
										</p>
										<p>
											<strong>{t('studentManagement.level')}:</strong>{' '}
											{student.level}
										</p>
										<p>
											<strong>{t('studentManagement.joinDate')}:</strong>{' '}
											{new Date(student.joinDate).toLocaleDateString('vi-VN')}
										</p>
									</div>
								</div>
							</Col>
						</Row>
					</Card>


					{/* Account Information */}
					<Card
						title={
							<Space>
								<UserOutlined />
								{t('studentManagement.accountInformation')}
							</Space>
						}
						className={`account-card ${theme}-account-card`}
						style={{ marginBottom: 24 }}>
						<Row gutter={[16, 16]}>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.username')}:</strong>
									<span>{accountInfo.username}</span>
								</div>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.lastLogin')}:</strong>
									<span>{accountInfo.lastLogin}</span>
								</div>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.passwordLastChanged')}:</strong>
									<span>{new Date(accountInfo.passwordLastChanged).toLocaleDateString('vi-VN')}</span>
								</div>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.loginAttempts')}:</strong>
									<span>{accountInfo.loginAttempts}</span>
								</div>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.accountStatus')}:</strong>
									<span>{accountInfo.accountStatus === 'active'
										? t('studentManagement.active')
										: t('studentManagement.inactive')}</span>
								</div>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.emailVerified')}:</strong>
									<span>{accountInfo.emailVerified
										? t('studentManagement.verified')
										: t('studentManagement.notVerified')}</span>
								</div>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<div className="account-info-item">
									<strong>{t('studentManagement.phoneVerified')}:</strong>
									<span>{accountInfo.phoneVerified
										? t('studentManagement.verified')
										: t('studentManagement.notVerified')}</span>
								</div>
							</Col>
						</Row>
					</Card>
				</div>

				{/* Edit Modal */}
				<Modal
					title={t('studentManagement.editProfile')}
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
												{t('studentManagement.uploadAvatar')}
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
									name="fullName"
									label={t('studentManagement.fullName')}
									rules={[
										{ required: true, message: t('studentManagement.fullNameRequired') },
										{ min: 2, message: t('studentManagement.nameMinLength') },
									]}
								>
									<Input 
										placeholder={t('studentManagement.enterFullName')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="email"
									label={t('studentManagement.email')}
									rules={[
										{ required: true, message: t('studentManagement.emailRequired') },
										{ type: 'email', message: t('studentManagement.emailInvalid') },
									]}
								>
									<Input 
										placeholder={t('studentManagement.enterEmail')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="phone"
									label={t('studentManagement.phone')}
									rules={[
										{ required: true, message: t('studentManagement.phoneRequired') },
										{ pattern: /^[0-9]{10,11}$/, message: t('studentManagement.phoneInvalid') },
									]}
								>
									<Input 
										placeholder={t('studentManagement.enterPhone')}
										className={`form-input ${theme}-form-input`}
									/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="dateOfBirth"
									label={t('studentManagement.dateOfBirth')}
								>
									<DatePicker 
										style={{ width: '100%' }}
										placeholder={t('studentManagement.selectDateOfBirth')}
										className={`form-input ${theme}-form-input`}
										format="DD/MM/YYYY"
									/>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="class"
									label={t('studentManagement.class')}
									rules={[{ required: true, message: t('studentManagement.classRequired') }]}
								>
									<Select 
										placeholder={t('studentManagement.selectClass')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="Lớp 10A1">Lớp 10A1</Select.Option>
										<Select.Option value="Lớp 10A2">Lớp 10A2</Select.Option>
										<Select.Option value="Lớp 10A3">Lớp 10A3</Select.Option>
										<Select.Option value="Lớp 11B1">Lớp 11B1</Select.Option>
										<Select.Option value="Lớp 9C1">Lớp 9C1</Select.Option>
										<Select.Option value="Lớp 12A1">Lớp 12A1</Select.Option>
									</Select>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="level"
									label={t('studentManagement.level')}
									rules={[{ required: true, message: t('studentManagement.levelRequired') }]}
								>
									<Select 
										placeholder={t('studentManagement.selectLevel')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="Beginner">{t('studentManagement.beginner')}</Select.Option>
										<Select.Option value="Intermediate">{t('studentManagement.intermediate')}</Select.Option>
										<Select.Option value="Advanced">{t('studentManagement.advanced')}</Select.Option>
									</Select>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={24}>
							<Col span={12}>
								<Form.Item
									name="gender"
									label={t('studentManagement.gender')}
									rules={[{ required: true, message: t('studentManagement.genderRequired') }]}
								>
									<Select 
										placeholder={t('studentManagement.selectGender')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="male">{t('common.male')}</Select.Option>
										<Select.Option value="female">{t('common.female')}</Select.Option>
									</Select>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="status"
									label={t('studentManagement.status')}
									rules={[{ required: true, message: t('studentManagement.statusRequired') }]}
								>
									<Select 
										placeholder={t('studentManagement.selectStatus')}
										className={`custom-dropdown ${theme}-custom-dropdown`}
									>
										<Select.Option value="active">{t('studentManagement.active')}</Select.Option>
										<Select.Option value="inactive">{t('studentManagement.inactive')}</Select.Option>
									</Select>
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

				{/* Reset Password Modal */}
				<Modal
					title={
						<div style={{ 
							fontSize: '20px', 
							fontWeight: '600', 
							color: '#1890ff',
							textAlign: 'center',
							padding: '10px 0'
						}}>
							{t('studentManagement.resetPasswordForStudent')}
						</div>
					}
					open={resetPasswordModalVisible}
					onCancel={() => setResetPasswordModalVisible(false)}
					footer={null}
					width={500}
					centered
				>
					<Form
						form={resetPasswordForm}
						layout="vertical"
						onFinish={handleResetPasswordSubmit}
					>
						<div style={{ marginBottom: 24 }}>
							<p style={{ 
								fontSize: '16px', 
								color: '#666', 
								textAlign: 'center',
								marginBottom: '20px'
							}}>
								{t('studentManagement.resetPasswordConfirmation')} <strong>{student.fullName}</strong>?
							</p>
						</div>

						<Form.Item
							name="newPassword"
							label={t('studentManagement.newPassword')}
							rules={[
								{ required: true, message: t('studentManagement.newPasswordRequired') },
								{ min: 6, message: t('studentManagement.passwordMinLength') },
							]}
						>
							<Input.Password 
								placeholder={t('studentManagement.enterNewPassword')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>

						<Form.Item
							name="confirmPassword"
							label={t('studentManagement.confirmPassword')}
							rules={[
								{ required: true, message: t('studentManagement.confirmPasswordRequired') },
								({ getFieldValue }) => ({
									validator(_, value) {
										if (!value || getFieldValue('newPassword') === value) {
											return Promise.resolve();
										}
										return Promise.reject(new Error(t('studentManagement.passwordsDoNotMatch')));
									},
								}),
							]}
						>
							<Input.Password 
								placeholder={t('studentManagement.confirmNewPassword')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>

						{/* Action Buttons */}
						<Row gutter={16} style={{ marginTop: 32 }}>
							<Col span={12}>
								<Button
									type="default"
									onClick={() => setResetPasswordModalVisible(false)}
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
									loading={resetPasswordLoading}
									style={{ width: '100%', height: 40 }}
									className={`submit-button ${theme}-submit-button`}
								>
									{t('studentManagement.resetPassword')}
								</Button>
							</Col>
						</Row>
					</Form>
				</Modal>
			</div>
		</ThemedLayout>
	);
};

export default StudentProfile;
