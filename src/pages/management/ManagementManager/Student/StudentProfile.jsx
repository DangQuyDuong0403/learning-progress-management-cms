import React, { useState, useEffect } from 'react';
import {
	Row,
	Col,
	Button,
	Avatar,
	Modal,
	Form,
	Input,
	Select,
	DatePicker,
	Spin,
	Alert,
	Radio,
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
import EditEmailModal from './EditEmailModal';

const StudentProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editEmailModalVisible, setEditEmailModalVisible] = useState(false);
	const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
	const [editForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [isCustomAvatar, setIsCustomAvatar] = useState(false);
	const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
	const [avatarModalVisible, setAvatarModalVisible] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Student data from API
	const [student, setStudent] = useState(null);

	// Redux state for levels
	const { levels, loading: levelsLoading } = useSelector((state) => state.level);

	// Generate avatar list from system avatars
	const generateAvatarList = () => {
		const avatars = [];
		for (let i = 1; i <= 18; i++) {
			avatars.push({
				id: i,
				url: `/img/student_avatar/avatar${i}.png`,
				name: `Avatar ${i}`
			});
		}
		return avatars;
	};

	const systemAvatars = generateAvatarList();


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
				// Only update avatar from API if no custom avatar is being displayed
				if (!isCustomAvatar) {
					setAvatarUrl(response.data.avatarUrl || "/img/avatar_1.png");
				}
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
		
		editForm.setFieldsValue({
			roleName: student.roleName,
			firstName: student.firstName,
			lastName: student.lastName,
			phoneNumber: student.phoneNumber,
			dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth) : null,
			gender: student.gender || 'MALE',
			address: student.address,
			levelId: student.currentLevelInfo?.id || null,
			// Parent information
			parentName: student.parentInfo?.parentName,
			parentEmail: student.parentInfo?.parentEmail,
			parentPhone: student.parentInfo?.parentPhone,
			relationship: student.parentInfo?.relationship,
		});
	};

	const handleEditEmail = () => {
		setEditEmailModalVisible(true);
	};

	const handleEmailUpdateSuccess = (newEmail) => {
		// Update student data with new email
		setStudent(prev => ({
			...prev,
			email: newEmail
		}));
	};

	const handleAvatarUpload = async (event) => {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				spaceToast.error('Please select an image file');
				return;
			}
			
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				spaceToast.error('File size must be less than 5MB');
				return;
			}
			
		setAvatarUploadLoading(true);
		try {
			// Upload avatar for student using student ID
			console.log('Uploading avatar for student ID:', id);
			const result = await studentManagementApi.uploadStudentAvatar(id, file);
			
			if (result.success || result.data) {
				// Update avatar URL immediately for better UX (custom file)
				setAvatarUrl(URL.createObjectURL(file));
				setIsCustomAvatar(true);
				
				// Close modal
				setAvatarModalVisible(false);
				
				spaceToast.success('Avatar uploaded successfully!');
				
				// Refresh student data after upload
				fetchStudentProfile();
			} else {
				spaceToast.error(result.message || 'Failed to upload avatar');
			}
		} catch (error) {
			console.error('Error uploading avatar:', error);
			const errorMessage = error.response?.data?.message || 
								error.response?.data?.error || 
								error.message;
			spaceToast.error(errorMessage);
		} finally {
			setAvatarUploadLoading(false);
		}
		}
	};

	const handleSelectSystemAvatar = async (selectedAvatarUrl) => {
		setAvatarUploadLoading(true);
		try {
			// Prepare data for API call
			const updateData = {
				roleName: student.roleName,
				firstName: student.firstName,
				lastName: student.lastName,
				avatarUrl: selectedAvatarUrl, // Send the selected avatar URL
				dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
				address: student.address || null,
				phoneNumber: student.phoneNumber || null,
				gender: student.gender || null,
				parentInfo: {
					parentName: student.parentInfo?.parentName || "",
					parentEmail: student.parentInfo?.parentEmail || null,
					parentPhone: student.parentInfo?.parentPhone || "",
					relationship: student.parentInfo?.relationship || null,
				},
				levelId: student.currentLevelInfo?.id || null,
				email: student.email, // Always include email for backend
			};
			
			console.log('Updating student avatar with data:', updateData);
			
			// Call API to update student profile with new avatar URL
			const result = await studentManagementApi.updateStudentProfile(id, updateData);
			
			if (result.success || result.message) {
				// Update avatar URL immediately for better UX (system avatar)
				setAvatarUrl(selectedAvatarUrl);
				setIsCustomAvatar(false);
				
				// Close modal
				setAvatarModalVisible(false);
				
				spaceToast.success('Avatar updated successfully!');
				
				// Refresh student data after update
				fetchStudentProfile();
			} else {
				spaceToast.error(result.message || 'Failed to update avatar');
			}
		} catch (error) {
			console.error('Error updating avatar:', error);
			const errorMessage = error.response?.data?.message || 
								error.response?.data?.error || 
								error.message;
			spaceToast.error(errorMessage);
		} finally {
			setAvatarUploadLoading(false);
		}
	};

	const handleEditSubmit = async (values) => {
		setEditLoading(true);
		try {
			// Format the data according to the API requirements
			const studentData = {
				roleName: values.roleName,
				firstName: values.firstName,
				lastName: values.lastName,
				avatarUrl: student.avatarUrl , // Send current avatar URL
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
				address: values.address || null,
				phoneNumber: values.phoneNumber || null,
				gender: values.gender || null,
				parentInfo: {
					parentName: values.parentName || "",
					parentEmail: values.parentEmail || null,
					parentPhone: values.parentPhone || "",
					relationship: values.relationship || null,
				},
				levelId: values.levelId,
				email: student.email, // Always include email for backend
			};
			
			console.log('Updating student with data:', studentData);
			console.log('Student email:', student.email);
			console.log('Student data:', student);
			
			// Call API to update student profile directly
			const result = await studentManagementApi.updateStudentProfile(id, studentData);
			
			if (result.success || result.message) {
				spaceToast.success(result.message || t('studentManagement.updateStudentSuccess'));
				setEditModalVisible(false);
				// Refresh student data
				fetchStudentProfile();
			} else {
				spaceToast.error(result.message || t('studentManagement.updateStudentError'));
			}
		} catch (error) {
			console.error('Error updating student profile:', error);
			// Show backend error message if available
			const errorMessage = error.response?.data?.message || 
								error.response?.data?.error || 
								error.message
			spaceToast.error(errorMessage);
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
					<Button
						type='primary'
						icon={<EditOutlined />}
						onClick={handleEditEmail}
						className={`edit-email-button ${theme}-edit-email-button`}
						style={{
							backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							background: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
							color: theme === 'sun' ? '#000000' : '#000000',
						}}>
						{t('common.editEmail')}
					</Button>
				</div>
			</div>

			{/* Student Info Card */}
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
							onClick={() => setAvatarModalVisible(true)}
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
								{student.email || '-'}
							</span>
						</div>
						
						{/* Starter Badge */}
						<div className={`starter-badge-new ${theme}-starter-badge-new`}>
							Starter
						</div>
					</div>

					{/* Right Section - Student Info */}
					<div className={`student-info-new ${theme}-student-info-new`}>
						{/* Name and Status Row */}
						<div className={`name-status-row-new ${theme}-name-status-row-new`}>
							<h2 className={`student-name-new ${theme}-student-name-new`}>
								{student.firstName} {student.lastName}
							</h2>
							<div className={`status-badges-new ${theme}-status-badges-new`}>
								<span className={`role-badge-new ${theme}-role-badge-new`}>
									{student.roleName === 'STUDENT' ? t('common.student') : student.roleName === 'TEST_TAKER' ? t('common.testTaker') : 'N/A'}
								</span>
								<span className={`status-badge-new ${theme}-status-badge-new ${student.status?.toLowerCase()}`}>
									{student.status === 'ACTIVE'
										? t('studentManagement.active')
										: student.status === 'PENDING'
										? t('studentManagement.pending')
										: t('studentManagement.inactive')}
								</span>
							</div>
						</div>
						
						{/* Student ID */}
						<div className={`student-id-new ${theme}-student-id-new`}>
							{student.userName || '-'}
						</div>

						{/* Personal Information Grid */}
						<div className={`personal-info-grid-new ${theme}-personal-info-grid-new`}>
							<div className={`info-item-new ${theme}-info-item-new`}>
								<span className={`info-label-new ${theme}-info-label-new`}>{t('studentManagement.phone')}</span>
								<span className={`info-value-new ${theme}-info-value-new`}>{student.phoneNumber || '-'}</span>
							</div>
							<div className={`info-item-new ${theme}-info-item-new`}>
								<span className={`info-label-new ${theme}-info-label-new`}>{t('studentManagement.gender')}</span>
								<span className={`info-value-new ${theme}-info-value-new`}>
									{student.gender === 'MALE' ? t('common.male') : student.gender === 'FEMALE' ? t('common.female') : student.gender === 'OTHER' ? t('common.other') : '-'}
								</span>
							</div>
							<div className={`info-item-new ${theme}-info-item-new`}>
								<span className={`info-label-new ${theme}-info-label-new`}>{t('studentManagement.dateOfBirth')}</span>
								<span className={`info-value-new ${theme}-info-value-new`}>
									{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
								</span>
							</div>
							<div className={`info-item-new ${theme}-info-item-new`}>
								<span className={`info-label-new ${theme}-info-label-new`}>{t('studentManagement.address')}</span>
								<span className={`info-value-new ${theme}-info-value-new`}>{student.address || '-'}</span>
							</div>
						</div>
					</div>
				</div>
			</div>


			{/* Parent Information */}
			{student.parentInfo && (
				<div className={`parent-container-new ${theme}-parent-container-new`}>
					{/* Parent Title */}
					<div className={`parent-title-new ${theme}-parent-title-new`}>
						{t('studentManagement.parentInformation')}
					</div>
					
					{/* Parent Content */}
					<div className={`parent-content-new ${theme}-parent-content-new`}>
						{/* Left Section - Personal Info */}
						<div className={`parent-left-section-new ${theme}-parent-left-section-new`}>
							{/* Family Icon */}
							<div className={`family-icon-new ${theme}-family-icon-new`}>
								<img 
									src="/img/family-icon.png" 
									alt="Family Icon" 
									style={{ width: '60px', height: '60px' }}
								/>
							</div>
							
							{/* Parent Name and Relationship */}
							<div className={`parent-name-section-new ${theme}-parent-name-section-new`}>
								<div className={`parent-name-new ${theme}-parent-name-new`}>
									{student.parentInfo.parentName || '-'}
								</div>
								<div className={`parent-relationship-new ${theme}-parent-relationship-new`}>
									{student.parentInfo.relationship || '-'}
								</div>
							</div>
						</div>

						{/* Right Section - Contact Info */}
						<div className={`parent-right-section-new ${theme}-parent-right-section-new`}>
							{/* Phone */}
							<div className={`parent-contact-item-new ${theme}-parent-contact-item-new`}>
								<div className={`parent-contact-label-new ${theme}-parent-contact-label-new`}>
									{t('studentManagement.parentPhone')}
								</div>
								<div className={`parent-contact-value-new ${theme}-parent-contact-value-new`}>
									{student.parentInfo.parentPhone || '-'}
								</div>
							</div>
							
							{/* Email */}
							<div className={`parent-contact-item-new ${theme}-parent-contact-item-new`}>
								<div className={`parent-contact-label-new ${theme}-parent-contact-label-new`}>
									{t('studentManagement.parentEmail')}
								</div>
								<div className={`parent-contact-value-new ${theme}-parent-contact-value-new`}>
									{student.parentInfo.parentEmail || '-'}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Edit Modal */}
			<Modal
				title={t('studentManagement.editProfile')}
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
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								name="roleName"
								label={
									<span>
										{t('studentManagement.roleName')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								rules={[
									{ required: true, message: t('studentManagement.roleNameRequired') },
								]}
							>
								<Select placeholder={t('studentManagement.selectRole')}>
									<Select.Option value="STUDENT">{t('common.student')}</Select.Option>
									<Select.Option value="TEST_TAKER">{t('common.testTaker')}</Select.Option>
								</Select>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								name="phoneNumber"
								label={
									<span>
										{t('studentManagement.phone')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
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
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								name="firstName"
								label={
									<span>
										{t('studentManagement.firstName')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
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
								label={
									<span>
										{t('studentManagement.lastName')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
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

					<Row gutter={16}>
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
						<Col span={12}>
							<Form.Item
								name="gender"
								label={
									<span>
										{t('studentManagement.gender')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								rules={[{ required: true, message: t('studentManagement.genderRequired') }]}
								initialValue="MALE"
							>
								<Radio.Group>
									<Radio value="MALE">Male</Radio>
									<Radio value="FEMALE">Female</Radio>
									<Radio value="OTHER">Other</Radio>
								</Radio.Group>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={24}>
							<Form.Item
								name="address"
								label={t('studentManagement.address')}
							>
								<Input 
									placeholder={t('studentManagement.enterAddress')}
									className={`form-input ${theme}-form-input`}
								/>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								name="levelId"
								label={t('studentManagement.level')}
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
						<div style={{ marginTop: 24, marginBottom: 16 }}>
							<h3 className={`section-title ${theme}-section-title`} style={{ 
								fontSize: '16px', 
								fontWeight: '600', 
								marginBottom: '16px',
								color: '#000000'
							}}>
								{t('studentManagement.parentInformation')}
							</h3>
							
							<Row gutter={16}>
								<Col span={12}>
									<Form.Item
										name="parentName"
										label={t('studentManagement.parentName')}
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
					<Row gutter={16} style={{ marginTop: 24 }}>
						<Col span={12}>
							<Button
								type="default"
								onClick={() => setEditModalVisible(false)}
								style={{ width: '100%', height: 32 }}
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
									height: 32,
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
						fontSize: '18px', 
						fontWeight: '600', 
						color: '#000000',
						textAlign: 'center',
						padding: '8px 0'
					}}>
						{t('studentManagement.resetPasswordToDefault')}
					</div>
				}
				open={resetPasswordModalVisible}
				onCancel={() => setResetPasswordModalVisible(false)}
				footer={null}
				width={400}
				centered
			>
				<div style={{ textAlign: 'center', padding: '16px 0' }}>
					<div style={{ marginBottom: 20 }}>
						<p style={{ 
							fontSize: '14px', 
							color: '#666', 
							textAlign: 'center',
							marginBottom: '16px',
							lineHeight: '1.5'
						}}>
							{t('studentManagement.resetPasswordToDefaultConfirmation')} <strong>{student.firstName} {student.lastName}</strong>?
						</p>
						<p style={{ 
							fontSize: '12px', 
							color: '#999', 
							textAlign: 'center',
							marginBottom: '16px'
						}}>
							{t('studentManagement.resetPasswordToDefaultNote')}
						</p>
					</div>

					{/* Action Buttons */}
					<Row gutter={16} style={{ marginTop: 24 }}>
						<Col span={12}>
							<Button
								type="default"
								onClick={() => setResetPasswordModalVisible(false)}
								style={{ width: '100%', height: 32 }}
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
									height: 32,
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

			{/* Edit Email Modal */}
			<EditEmailModal
				isVisible={editEmailModalVisible}
				onCancel={() => setEditEmailModalVisible(false)}
				onSuccess={handleEmailUpdateSuccess}
				currentEmail={student?.email}
				studentId={id}
			/>

			{/* Avatar Selection Modal */}
			<Modal
				title={
					<div style={{
						fontSize: '20px',
						fontWeight: '600',
						color: '#000000',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('common.selectAvatar')}
					</div>
				}
				open={avatarModalVisible}
				onCancel={() => setAvatarModalVisible(false)}
				footer={null}
				width={600}
				centered
				destroyOnClose
			>
				<div style={{ padding: '20px 0' }}>
					{/* System Avatars */}
					<div style={{ marginBottom: '30px' }}>
						<h3 style={{ 
							fontSize: '16px', 
							fontWeight: '600', 
							marginBottom: '16px',
							color: '#000000'
						}}>
							{t('common.systemAvatars')}
						</h3>
						<Row gutter={[12, 12]}>
							{systemAvatars.map((avatar) => (
								<Col span={4} key={avatar.id}>
									<div
										onClick={() => handleSelectSystemAvatar(avatar.url)}
										style={{
											cursor: 'pointer',
											padding: '8px',
											borderRadius: '8px',
											border: '2px solid transparent',
											transition: 'all 0.3s ease',
											textAlign: 'center'
										}}
										onMouseEnter={(e) => {
											e.target.style.borderColor = '#1890ff';
											e.target.style.backgroundColor = '#f0f8ff';
										}}
										onMouseLeave={(e) => {
											e.target.style.borderColor = 'transparent';
											e.target.style.backgroundColor = 'transparent';
										}}
									>
										<Avatar
											size={60}
											src={avatar.url}
											style={{
												border: '2px solid #f0f0f0',
												boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
											}}
										/>
									</div>
								</Col>
							))}
						</Row>
					</div>

					{/* Upload Custom Avatar */}
					<div style={{ 
						borderTop: '1px solid #f0f0f0', 
						paddingTop: '20px',
						textAlign: 'center'
					}}>
						<h3 style={{ 
							fontSize: '16px', 
							fontWeight: '600', 
							marginBottom: '16px',
							color: '#000000'
						}}>
							{t('common.uploadCustomAvatar')}
						</h3>
						<div
							onClick={() => document.getElementById('avatar-upload').click()}
							style={{
								cursor: 'pointer',
								padding: '20px',
								border: '2px dashed #d9d9d9',
								borderRadius: '8px',
								backgroundColor: '#fafafa',
								transition: 'all 0.3s ease',
								display: 'inline-block',
								minWidth: '200px'
							}}
							onMouseEnter={(e) => {
								e.target.style.borderColor = '#1890ff';
								e.target.style.backgroundColor = '#f0f8ff';
							}}
							onMouseLeave={(e) => {
								e.target.style.borderColor = '#d9d9d9';
								e.target.style.backgroundColor = '#fafafa';
							}}
						>
							<div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
							<div style={{ fontSize: '14px', color: '#666' }}>
								{t('common.clickToUpload')}
							</div>
							<div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
								{t('common.maxFileSize')}: 5MB
							</div>
						</div>
						<input
							id="avatar-upload"
							type="file"
							accept="image/*"
							onChange={handleAvatarUpload}
							style={{ display: 'none' }}
						/>
					</div>
				</div>
			</Modal>
			</div>
		</div>
		</ThemedLayout>
	);
};

export default StudentProfile;
