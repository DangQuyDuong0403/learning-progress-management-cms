import React, { useState, useEffect } from 'react';
import {
	Card,
	Row,
	Col,
	Button,
	Avatar,
	Space,
	Modal,
	Form,
	Input,
	Select,
	DatePicker,
	Spin,
	Alert,
} from 'antd';
import {
	ArrowLeftOutlined,
	EditOutlined,
	UserOutlined,
	KeyOutlined,
	BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import studentManagementApi from '../../../../apis/backend/StudentManagement';
import dayjs from 'dayjs';
import './StudentList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLevels } from '../../../../redux/level';

const StudentProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
	const [editForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Student data from API
	const [student, setStudent] = useState(null);

	// Redux state for levels
	const { levels, loading: levelsLoading } = useSelector((state) => state.level);

	// Available avatar images
	const avatarImages = [
		'avatar1.png',
		'avatar2.png',
		'avatar3.png',
		'avatar4.png',
		'avatar5.png',
		'avatar6.png',
		'avatar7.png',
		'avatar8.png',
		'avatar9.png',
		'avatar10.png',
		'avatar11.png',
		'avatar12.png',
		'avatar13.png',
		'avatar14.png',
		'avatar15.png',
		'avatar16.png',
		'avatar17.png',
		'avatar18.png',
	];

	// Function to get random avatar based on student ID
	const getRandomAvatar = (studentId) => {
		if (!studentId) return null;
		
		// Use student ID as seed for consistent random selection
		const seed = parseInt(studentId.toString().slice(-3)) || 0;
		const randomIndex = seed % avatarImages.length;
		return `/img/student_avatar/${avatarImages[randomIndex]}`;
	};


	useEffect(() => {
		fetchStudentProfile();
		dispatch(fetchLevels());
	}, [id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

	const fetchStudentProfile = async () => {
		try {
			setLoading(true);
			setError(null);
			
			console.log('Fetching profile for student ID:', id);
			if (!id) {
				setError('Student ID not found in URL');
				return;
			}
			
			const response = await studentManagementApi.getStudentProfile(id);
			
			if (response.success && response.data) {
				setStudent(response.data);
				// Use random avatar based on student ID instead of API avatarUrl
				const randomAvatar = getRandomAvatar(response.data.id);
				setAvatarUrl(randomAvatar);
			} else {
				setError(response.message || 'Failed to fetch student profile');
			}
		} catch (error) {
			console.error('Error fetching student profile:', error);
			setError('An error occurred while fetching the student profile');
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		navigate('/manager/students');
	};

	const handleEdit = () => {
		if (!student) return;
		
		setEditModalVisible(true);
		
		// Get current avatar filename from avatarUrl
		const currentAvatarFilename = avatarUrl ? avatarUrl.split('/').pop() : null;
		
		editForm.setFieldsValue({
			roleName: student.roleName,
			firstName: student.firstName,
			lastName: student.lastName,
			email: student.email,
			phoneNumber: student.phoneNumber,
			dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth) : null,
			gender: student.gender,
			address: student.address,
			levelId: student.currentLevelInfo?.id || null,
			// Avatar selection
			avatar: currentAvatarFilename,
			// Parent information
			parentName: student.parentInfo?.parentName,
			parentEmail: student.parentInfo?.parentEmail,
			parentPhone: student.parentInfo?.parentPhone,
			relationship: student.parentInfo?.relationship,
		});
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
			// Format the data according to the API requirements
			const studentData = {
				roleName: values.roleName, // Allow editing role name
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				avatarUrl: "string", // Always send "string" as per API requirement
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
				address: values.address || null,
				phoneNumber: values.phoneNumber || null,
				gender: values.gender || null, // MALE, FEMALE, OTHER
				parentInfo: {
					parentName: values.parentName || "",
					parentEmail: values.parentEmail || null,
					parentPhone: values.parentPhone || "",
					relationship: values.relationship || null,
				},
				levelId: values.levelId,
			};
			
			console.log('Updating student with data:', studentData);
			
			const response = await studentManagementApi.updateStudentProfile(id, studentData);
			
			if (response.success && response.data) {
				setStudent(response.data);
				setEditModalVisible(false);
				spaceToast.success(t('studentManagement.updateStudentSuccess'));
			} else {
				spaceToast.error(response.message || t('studentManagement.updateStudentError'));
			}
		} catch (error) {
			console.error('Error updating student profile:', error);
			spaceToast.error(error.response?.data?.message || error.message || t('studentManagement.updateStudentError'));
		} finally {
			setEditLoading(false);
		}
	};

	const handleResetPassword = () => {
		setResetPasswordModalVisible(true);
	};

	const handleResetPasswordSubmit = async () => {
		setResetPasswordLoading(true);
		try {
			// TODO: Implement reset password to default API call
			// const response = await studentManagementApi.resetPasswordToDefault(id);
			
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			setResetPasswordModalVisible(false);
			spaceToast.success(t('studentManagement.passwordResetToDefaultSuccess'));
		} catch (error) {
			spaceToast.error(t('studentManagement.passwordResetError'));
		} finally {
			setResetPasswordLoading(false);
		}
	};

	const handleViewLearningProgress = () => {
		if (!student) return;
		
		navigate(`/manager/student/${student.id}/progress`, { 
			state: { student: student } 
		});
	};

	// Function to handle avatar selection from dropdown
	const handleAvatarSelect = (selectedAvatar) => {
		if (selectedAvatar) {
			setAvatarUrl(`/img/student_avatar/${selectedAvatar}`);
		}
	};

	// Loading state
	if (loading) {
		return (
			<ThemedLayout>
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
					<Spin size="large" tip="Loading student profile..." />
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
							<Button size="small" onClick={fetchStudentProfile}>
								Retry
							</Button>
						}
					/>
				</div>
			</ThemedLayout>
		);
	}

	// No student data
	if (!student) {
		return (
			<ThemedLayout>
				<div style={{ padding: '20px' }}>
					<Alert 
						message="Not Found" 
						description="Student profile not found." 
						type="warning" 
						showIcon 
					/>
				</div>
			</ThemedLayout>
		);
	}

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
							{t('common.back')}
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
									alignItems: 'center',
									gap: '8px',
									marginBottom: '16px',
								}}>
								<h2
									className={`student-name ${theme}-student-name`}
									style={{ 
										margin: 0,
										fontSize: '32px',
										fontWeight: '700',
										color: theme === 'space' ? '#4dd0ff' : '#1890ff',
										letterSpacing: '0.5px',
										textAlign: 'center'
									}}>
									{student.firstName} {student.lastName}
								</h2>

								<div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
									<span
										style={{
											fontSize: '16px',
											padding: '6px 12px',
											borderRadius: '8px',
											color: '#1890ff',
											fontWeight: '500',
										}}
										className={`role-text ${theme}-role-text`}>
										{student.roleName ? student.roleName.charAt(0).toUpperCase() + student.roleName.slice(1).toLowerCase() : 'N/A'}
									</span>
									<span
										style={{
											fontSize: '16px',
											padding: '6px 12px',
											borderRadius: '8px',
											color: student.status === 'ACTIVE' ? '#52c41a' : '#ff4d4f',
											fontWeight: '500',
										}}
										className={`status-text ${theme}-status-text`}>
										{student.status === 'ACTIVE'
											? t('studentManagement.active')
											: t('studentManagement.inactive')}
									</span>
								</div>
							</div>

							<div className='student-details'>
								<p>
									<strong>{t('studentManagement.username')}:</strong>{' '}
									{student.userName || '-'}
								</p>
								<p>
									<strong>{t('studentManagement.email')}:</strong>{' '}
									{student.email || '-'}
								</p>
								<p>
									<strong>{t('studentManagement.phone')}:</strong>{' '}
									{student.phoneNumber || '-'}
								</p>
								<p>
									<strong>{t('studentManagement.dateOfBirth')}:</strong>{' '}
									{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
								</p>
								<p>
									<strong>{t('studentManagement.gender')}:</strong>{' '}
									{student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1).toLowerCase() : '-'}
								</p>
								<p>
									<strong>{t('studentManagement.address')}:</strong>{' '}
									{student.address || '-'}
								</p>
								{student.currentClassInfo && (
									<p>
										<strong>{t('studentManagement.class')}:</strong>{' '}
										{student.currentClassInfo.name || '-'}
									</p>
								)}
							
								{student.currentLevelInfo && (
                                    <p>
                                        <strong>{t('studentManagement.level')}:</strong>{' '}
                                        {student.currentLevelInfo.levelName || '-'}
                                    </p>
                                )}
							</div>
						</div>
					</Col>
				</Row>
			</Card>


			{/* Parent Information */}
			{student.parentInfo && (
				<Card
					title={
						<Space>
							<UserOutlined />
							{t('studentManagement.parentInformation')}
						</Space>
					}
					className={`parent-card ${theme}-parent-card`}
					style={{ 
						marginTop: 24, 
						marginBottom: 24,
					}}>
					<Row gutter={[16, 16]}>
						<Col xs={24} sm={12} md={8}>
							<div className="parent-info-item">
								<strong style={{ color: '#000000' }}>{t('studentManagement.parentName')}:</strong>
								<span style={{ color: '#000000' }}>{student.parentInfo.parentName || '-'}</span>
							</div>
						</Col>
						<Col xs={24} sm={12} md={8}>
							<div className="parent-info-item">
								<strong style={{ color: '#000000' }}>{t('studentManagement.parentEmail')}:</strong>
								<span style={{ color: '#000000' }}>{student.parentInfo.parentEmail || '-'}</span>
							</div>
						</Col>
						<Col xs={24} sm={12} md={8}>
							<div className="parent-info-item">
								<strong style={{ color: '#000000' }}>{t('studentManagement.parentPhone')}:</strong>
								<span style={{ color: '#000000' }}>{student.parentInfo.parentPhone || '-'}</span>
							</div>
						</Col>
						<Col xs={24} sm={12} md={8}>
							<div className="parent-info-item">
								<strong style={{ color: '#000000' }}>{t('studentManagement.relationship')}:</strong>
								<span style={{ color: '#000000' }}>{student.parentInfo.relationship || '-'}</span>
							</div>
						</Col>
					</Row>
				</Card>
			)}

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
									<Form.Item
										name="avatar"
										label={t('studentManagement.selectAvatar')}
										rules={[{ required: true, message: t('studentManagement.avatarRequired') }]}
									>
										<Select
											placeholder={t('studentManagement.selectAvatar')}
											onChange={handleAvatarSelect}
											className={`custom-dropdown ${theme}-custom-dropdown`}
											showSearch
											filterOption={(input, option) =>
												option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
											}
											style={{ width: 200 }}
										>
											{avatarImages.map((avatar, index) => (
												<Select.Option key={index} value={avatar}>
													<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
														<Avatar
															size={24}
															src={`/img/student_avatar/${avatar}`}
															style={{ flexShrink: 0 }}
														/>
														<span>{avatar.replace('.png', '').replace('avatar', 'Avatar ')}</span>
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
					<Row gutter={24}>
						<Col span={12}>
							<Form.Item
								name="roleName"
								label={
									<span>
										Role Name
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								rules={[
									{ required: true, message: 'Role name is required' },
								]}
							>
								<Select placeholder="Select role">
									<Select.Option value="STUDENT">Student</Select.Option>
									<Select.Option value="TEST_TAKER">Test taker</Select.Option>
								</Select>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								name="email"
								label={
									<span>
										Email
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								rules={[
									{ required: true, message: 'Email is required' },
									{ type: 'email', message: 'Please enter a valid email' },
									{ max: 255, message: 'Email must not exceed 255 characters' },
								]}
							>
								<Input 
									placeholder="Enter email address"
									className={`form-input ${theme}-form-input`}
								/>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={24}>
						<Col span={12}>
							<Form.Item
								name="firstName"
								label={t('studentManagement.firstName')}
								rules={[
									{ required: true, message: t('studentManagement.firstNameRequired') },
									{ min: 2, message: t('studentManagement.nameMinLength') },
								]}
							>
								<Input 
									placeholder={t('studentManagement.enterFirstName')}
									className={`form-input ${theme}-form-input`}
								/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								name="lastName"
								label={t('studentManagement.lastName')}
								rules={[
									{ required: true, message: t('studentManagement.lastNameRequired') },
									{ min: 2, message: t('studentManagement.nameMinLength') },
								]}
							>
								<Input 
									placeholder={t('studentManagement.enterLastName')}
									className={`form-input ${theme}-form-input`}
								/>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={24}>
						<Col span={12}>
							<Form.Item
								name="phoneNumber"
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
								name="gender"
								label={t('studentManagement.gender')}
								rules={[{ required: true, message: t('studentManagement.genderRequired') }]}
							>
								<Select 
									placeholder="Select gender"
									className={`custom-dropdown ${theme}-custom-dropdown`}
								>
									<Select.Option value="MALE">Male</Select.Option>
									<Select.Option value="FEMALE">Female</Select.Option>
									<Select.Option value="OTHER">Other</Select.Option>
								</Select>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								name="address"
								label={t('studentManagement.address')}
								rules={[{ required: true, message: t('studentManagement.addressRequired') }]}
							>
								<Input 
									placeholder={t('studentManagement.enterAddress')}
									className={`form-input ${theme}-form-input`}
								/>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={24}>
						<Col span={12}>
							<Form.Item
								name="levelId"
								label={t('studentManagement.level')}
								rules={[{ required: true, message: t('studentManagement.levelRequired') }]}
							>
								<Select 
									placeholder={t('studentManagement.selectLevel')}
									className={`custom-dropdown ${theme}-custom-dropdown`}
									loading={levelsLoading}
									showSearch
									filterOption={(input, option) =>
										option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
									}
									notFoundContent={levelsLoading ? "Loading..." : "No levels found"}
								>
									{levels && levels.length > 0 ? (
										levels.map(level => {
											// Handle different field names that might come from API
											const levelName = level.name || level.levelName || level.title || 'Unknown Level';
											const levelCode = level.code || level.levelCode || level.code || '';
											
											return (
												<Select.Option key={level.id} value={level.id}>
													{levelName} {levelCode ? `(${levelCode})` : ''}
												</Select.Option>
											);
										})
									) : (
										!levelsLoading && (
											<Select.Option disabled value="">
												No levels available
											</Select.Option>
										)
									)}
								</Select>
							</Form.Item>
						</Col>
					</Row>

					{/* Parent Information Section */}
					{student.parentInfo && (
						<div style={{ marginTop: 32, marginBottom: 24 }}>
							<h3 className={`section-title ${theme}-section-title`} style={{ 
								fontSize: '18px', 
								fontWeight: '600', 
								marginBottom: '20px',
								color: '#000000'
							}}>
								{t('studentManagement.parentInformation')}
							</h3>
							
							<Row gutter={24}>
								<Col span={12}>
									<Form.Item
										name="parentName"
										label={t('studentManagement.parentName')}
										rules={[{ required: true, message: t('studentManagement.parentNameRequired') }]}
									>
										<Input 
											placeholder={t('studentManagement.enterParentName')}
											className={`form-input ${theme}-form-input`}
										/>
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="parentPhone"
										label={t('studentManagement.parentPhone')}
										rules={[{ required: true, message: t('studentManagement.parentPhoneRequired') }]}
									>
										<Input 
											placeholder={t('studentManagement.enterParentPhone')}
											className={`form-input ${theme}-form-input`}
										/>
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="parentEmail"
										label={t('studentManagement.parentEmail')}
										rules={[
											{ required: true, message: t('studentManagement.parentEmailRequired') },
											{ type: 'email', message: t('studentManagement.emailInvalid') }
										]}
									>
										<Input 
											placeholder={t('studentManagement.enterParentEmail')}
											className={`form-input ${theme}-form-input`}
										/>
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										name="relationship"
										label={t('studentManagement.relationship')}
										rules={[{ required: true, message: t('studentManagement.relationshipRequired') }]}
									>
										<Input 
											placeholder="Enter relationship"
											className={`form-input ${theme}-form-input`}
										/>
									</Form.Item>
								</Col>
							</Row>
						</div>
					)}

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
						color: '#000000',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('studentManagement.resetPasswordToDefault')}
					</div>
				}
				open={resetPasswordModalVisible}
				onCancel={() => setResetPasswordModalVisible(false)}
				footer={null}
				width={500}
				centered
			>
				<div style={{ textAlign: 'center', padding: '20px 0' }}>
					<div style={{ marginBottom: 24 }}>
						<p style={{ 
							fontSize: '16px', 
							color: '#666', 
							textAlign: 'center',
							marginBottom: '20px',
							lineHeight: '1.6'
						}}>
							{t('studentManagement.resetPasswordToDefaultConfirmation')} <strong>{student.firstName} {student.lastName}</strong>?
						</p>
						<p style={{ 
							fontSize: '14px', 
							color: '#999', 
							textAlign: 'center',
							marginBottom: '20px'
						}}>
							{t('studentManagement.resetPasswordToDefaultNote')}
						</p>
					</div>

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
								onClick={handleResetPasswordSubmit}
								loading={resetPasswordLoading}
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
								{t('studentManagement.confirmResetPassword')}
							</Button>
						</Col>
					</Row>
				</div>
			</Modal>
				</div>
			</div>
		</ThemedLayout>
	);
};

export default StudentProfile;
