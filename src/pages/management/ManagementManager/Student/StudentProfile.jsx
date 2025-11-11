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
	UploadOutlined,
	DeleteOutlined,
	CopyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ROUTER_PAGE from '../../../../constants/router';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import studentManagementApi from '../../../../apis/backend/StudentManagement';
import accountManagementApi from '../../../../apis/backend/accountManagement';
import authApi from '../../../../apis/backend/auth';
import dayjs from 'dayjs';
import './StudentList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import levelManagementApi from '../../../../apis/backend/levelManagement';
import EditEmailModal from './EditEmailModal';

const StudentProfile = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams();
	const { theme } = useTheme();
	const { user } = useSelector((state) => state.auth);
	const userRole = (user?.role || '').toLowerCase();
	const selectedRole =
		typeof window !== 'undefined'
			? (localStorage.getItem('selectedRole') || '').toLowerCase()
			: '';
	const isManager = userRole === 'manager' || selectedRole === 'manager';
	const isTeacher = userRole === 'teacher' || selectedRole === 'teacher';
	const isTeachingAssistant =
		userRole === 'teaching_assistant' || selectedRole === 'teaching_assistant';
	const shouldHideSidebar = isTeacher || isTeachingAssistant;
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editEmailModalVisible, setEditEmailModalVisible] = useState(false);
	const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
	const [credentialsModalVisible, setCredentialsModalVisible] = useState(false);
	const [studentCredentials, setStudentCredentials] = useState(null);
	const [editForm] = Form.useForm();
	const [editLoading, setEditLoading] = useState(false);
	const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [isCustomAvatar, setIsCustomAvatar] = useState(false);
	const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
	const [avatarModalVisible, setAvatarModalVisible] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null
	});

	// Student data from API
	const [student, setStudent] = useState(null);

	// Published levels state
	const [publishedLevels, setPublishedLevels] = useState([]);
	const [publishedLevelsLoading, setPublishedLevelsLoading] = useState(false);

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
		if (isManager) {
			fetchPublishedLevels();
		}
	}, [id, isManager]); // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch published levels
	const fetchPublishedLevels = async () => {
		setPublishedLevelsLoading(true);
		try {
			const params = {
				page: 0,
				size: 100, // Get all published levels
			};
			
			const response = await levelManagementApi.getPublishedLevels({ params });
			
			// Handle different response structures
			const levelsData = response.data?.content || response.data || [];
			setPublishedLevels(levelsData);
			
			console.log('Fetched published levels:', levelsData);
		} catch (error) {
			console.error('Error fetching published levels:', error);
			spaceToast.error('Failed to load levels');
			setPublishedLevels([]);
		} finally {
			setPublishedLevelsLoading(false);
		}
	};

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
				// Debug log to check requestResetPasswordByTeacher field
				console.log('Student data from API:', response.data);
				console.log('requestResetPasswordByTeacher:', response.data.requestResetPasswordByTeacher);
				
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

	const classIdFromState = location.state?.classId;
	const classIdFromQuery = new URLSearchParams(location.search).get('classId');
	const classIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('selectedClassId') : null;
	const classId = classIdFromState || classIdFromQuery || classIdFromStorage;

	useEffect(() => {
		if (classId) {
			localStorage.setItem('selectedClassId', String(classId));
		}
	}, [classId]);

	const handleBack = () => {
		let targetPath = null;

		if (classId) {
			if (isTeacher) {
				targetPath = ROUTER_PAGE.TEACHER_CLASS_STUDENTS.replace(':id', String(classId));
			} else if (isTeachingAssistant) {
				targetPath = ROUTER_PAGE.TEACHING_ASSISTANT_CLASS_STUDENTS.replace(':id', String(classId));
			} else if (isManager) {
				targetPath = ROUTER_PAGE.MANAGER_CLASS_STUDENTS.replace(':id', String(classId));
			}
		}

		if (!targetPath) {
			if (isManager) {
				targetPath = '/manager/students';
			} else if (isTeacher) {
				targetPath = ROUTER_PAGE.TEACHER_CLASSES;
			} else if (isTeachingAssistant) {
				targetPath = ROUTER_PAGE.TEACHING_ASSISTANT_CLASSES;
			} else {
				targetPath = '/';
			}
		}

		navigate(targetPath);
	};

	const handleEdit = () => {
		if (!student) return;
		
		setEditModalVisible(true);
		
		editForm.setFieldsValue({
			roleName: student.roleName,
			fullName: student.fullName,
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

	const handleEmailUpdateSuccess = () => {
		// Không cập nhật email ngay lập tức
		// Email sẽ chỉ được cập nhật sau khi user confirm từ email
		// Chỉ cần refresh dữ liệu student để lấy thông tin mới nhất
		fetchStudentProfile();
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
				fullName: student.fullName,
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
				fullName: values.fullName,
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
			// Call API to reset student password by teacher
			const response = await authApi.resetPasswordByTeacher(student.userName);
			
			console.log('Reset password response:', response);
			console.log('Response data:', response.data);
			
			// Check if API call was successful
			if (response.success === true) {
				setResetPasswordModalVisible(false);
				// Hide the reset password button by updating student state
				setStudent(prevStudent => ({
					...prevStudent,
					requestResetPasswordByTeacher: false
				}));
				
				// Store credentials from response and show credentials modal
				if (response.data) {
					setStudentCredentials(response.data);
					setCredentialsModalVisible(true);
				}
				
				// Use message from BE response
				spaceToast.success(response.message);
			} else {
				// If success is false or undefined, show error message from BE
				const errorMessage = response.message || 'Failed to reset password';
				spaceToast.error(errorMessage);
			}
		} catch (error) {
			console.error('Error resetting password by teacher:', error);
			// Only show error message from BE response
			const errorMessage = error.response?.data?.message || 
								error.response?.data?.error || 
								error.message;
			spaceToast.error(errorMessage);
		} finally {
			setResetPasswordLoading(false);
		}
	};

	const handleViewLearningProgress = () => {
		if (!student) return;
		let path = ROUTER_PAGE.MANAGER_STUDENT_PROGRESS.replace(':id', String(student.id));
		if (isTeacher) {
			path = ROUTER_PAGE.TEACHER_STUDENT_PROGRESS.replace(':id', String(student.id));
		} else if (isTeachingAssistant) {
			path = ROUTER_PAGE.TEACHING_ASSISTANT_STUDENT_PROGRESS.replace(':id', String(student.id));
		}
		navigate(path, { state: { student, classId } });
	};

	// Handle delete for PENDING students (trash button)
	const handleDeletePending = () => {
		if (!student || student.status !== 'PENDING') return;
		
		const studentName = student.fullName || student.userName;
		
		setConfirmModal({
			visible: true,
			title: t('studentManagement.deleteStudent'),
			content: `${t('studentManagement.confirmDeletePending')} "${studentName}"? ${t('studentManagement.deletePendingNote')}`,
			onConfirm: async () => {
				try {
					// Call API to delete student
					const response = await accountManagementApi.deleteAccount(id);
					
					// Close modal first
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					
					// Use backend message if available, otherwise fallback to translation
					const successMessage = response.message + ` "${studentName}"`;
					spaceToast.success(successMessage);
					
					// Navigate back to student list after successful deletion
					navigate('/manager/students');
				} catch (error) {
					console.error('Error deleting PENDING student:', error);
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message);
				}
			}
		});
	};

	const handleConfirmCancel = () => {
		setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
	};

	const handleCopyCredentials = () => {
		if (!studentCredentials) return;
		
		const username = studentCredentials.username || studentCredentials.userName || '';
		const password = studentCredentials.newPassword || studentCredentials.password || '';
		
		const credentialsText = `Username: ${username}\nPassword: ${password}`;
		
		navigator.clipboard.writeText(credentialsText).then(() => {
			spaceToast.success(t('studentManagement.credentialsCopied'));
		}).catch(() => {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = credentialsText;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			spaceToast.success(t('studentManagement.credentialsCopied'));
		});
	};

	// Loading state
	if (loading) {
		return (
			<ThemedLayout hideSidebar={shouldHideSidebar}>
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
		<ThemedLayout hideSidebar={shouldHideSidebar}>
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
					{(student?.requestResetPasswordByTeacher === true) && !isTeachingAssistant && (
						<Button
							icon={<KeyOutlined />}
							onClick={handleResetPassword}
							className={`reset-password-button ${theme}-reset-password-button`}>
							{t('studentManagement.resetPasswordByTeacher')}
						</Button>
					)}
					<Button
						icon={<BarChartOutlined />}
						onClick={handleViewLearningProgress}
						className={`progress-button ${theme}-progress-button`}>
						{t('studentManagement.studentLearningProgressOverview')}
					</Button>
					{student?.status === 'PENDING' && (
						<Button
							icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
							onClick={handleDeletePending}
							className={`deactivate-button ${theme}-deactivate-button`}
							style={{ 
								color: '#ff4d4f',
								borderColor: '#ff4d4f'
							}}>
							{t('studentManagement.deleteStudent')}
						</Button>
					)}
					{isManager && (
					<Button
						type='primary'
						icon={<EditOutlined />}
						onClick={handleEdit}
						className={`edit-button ${theme}-edit-button`}>
						{t('studentManagement.editProfile')}
					</Button>
					)}
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
							onClick={() => { if (isManager) setAvatarModalVisible(true); }}
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
						{isManager && (
						<Button
							type="text"
							icon={<EditOutlined />}
							onClick={handleEditEmail}
							className={`email-edit-icon ${theme}-email-edit-icon`}
							size="small"
						/>
						)}
						</div>
						
						{/* Level Badge */}
						<div className={`starter-badge-new ${theme}-starter-badge-new`}>
							{(() => {
								// Debug logging to understand data structure
								console.log('StudentProfile Level Debug:', {
									student,
									currentLevelInfo: student?.currentLevelInfo,
									levelName: student?.levelName,
									levelId: student?.levelId
								});
								
								return student?.currentLevelInfo?.levelName || 
									   student?.currentLevelInfo?.name || 
									   student?.levelName || 
									   'N/A';
							})()}
						</div>
					</div>

					{/* Right Section - Student Info */}
					<div className={`student-info-new ${theme}-student-info-new`}>
						{/* Name and Status Row */}
						<div className={`name-status-row-new ${theme}-name-status-row-new`}>
							<h2 className={`student-name-new ${theme}-student-name-new`}>
								{student.fullName}
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

			{/* Edit Modal - managers only */}
			{isManager && (
			<Modal
				title={
					<div style={{ 
						fontSize: '28px', 
						fontWeight: '600', 
						color: 'rgb(24, 144, 255)',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('studentManagement.editProfile')}
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
								<Select 
									placeholder={t('studentManagement.selectRole')}
									disabled={student?.roleName === 'STUDENT' && student?.status !== 'PENDING'}
								>
									<Select.Option value="STUDENT">{t('common.student')}</Select.Option>
									{/* Allow TEST_TAKER option if current role is not STUDENT, or if STUDENT has PENDING status */}
									{(student?.roleName !== 'STUDENT' || student?.status === 'PENDING') && (
										<Select.Option value="TEST_TAKER">{t('common.testTaker')}</Select.Option>
									)}
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
						<Col span={24}>
							<Form.Item
								name="fullName"
								label={
									<span>
										{t('studentManagement.fullName')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
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
									loading={publishedLevelsLoading}
									showSearch
									filterOption={(input, option) =>
										option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
									}
									notFoundContent={publishedLevelsLoading ? "Loading..." : "No levels found"}
								>
									{publishedLevels && publishedLevels.length > 0 ? (
										publishedLevels.map(level => {
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
										!publishedLevelsLoading && (
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
								style={{ 
									width: '100%', 
									height: 32,
									fontSize: '16px',
									fontWeight: '500',
									padding: '4px 15px'
								}}
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
									fontSize: '16px',
									fontWeight: '500',
									padding: '4px 15px',
									background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
									borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
									color: theme === 'sun' ? '#000' : '#fff',
									borderRadius: '6px',
									transition: 'all 0.3s ease',
									boxShadow: 'none'
								}}
								className={`submit-button ${theme}-submit-button`}
							>
								{t('common.update')}
							</Button>
						</Col>
					</Row>
				</Form>
			</Modal>
			)}

			{/* Reset Password Modal */}
			<Modal
				title={
					<div style={{ 
						fontSize: '28px', 
						fontWeight: '600', 
						color: 'rgb(24, 144, 255)',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('studentManagement.resetPasswordByTeacher')}
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
							{t('studentManagement.resetPasswordByTeacherConfirmation')} <strong>{student.fullName}</strong>?
						</p>
						<p style={{ 
							fontSize: '12px', 
							color: '#999', 
							textAlign: 'center',
							marginBottom: '16px'
						}}>
							{t('studentManagement.resetPasswordByTeacherNote')}
						</p>
					</div>

					{/* Action Buttons */}
					<Row gutter={16} style={{ marginTop: 24 }}>
						<Col span={12}>
							<Button
								type="default"
								onClick={() => setResetPasswordModalVisible(false)}
								style={{ 
									width: '100%', 
									height: 32,
									fontSize: '16px',
									fontWeight: '500',
									padding: '4px 15px'
								}}
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
									fontSize: '16px',
									fontWeight: '500',
									padding: '4px 15px',
									background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
									borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
									color: theme === 'sun' ? '#000' : '#fff',
									borderRadius: '6px',
									transition: 'all 0.3s ease',
									boxShadow: 'none'
								}}
								className={`submit-button ${theme}-submit-button`}
							>
								{t('studentManagement.confirmResetPasswordByTeacher')}
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

			{/* Student Credentials Modal */}
			<Modal
				title={
					<div style={{
						fontSize: '28px',
						fontWeight: '600',
						color: 'rgb(24, 144, 255)',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('studentManagement.studentCredentials')}
					</div>
				}
				open={credentialsModalVisible}
				onCancel={() => setCredentialsModalVisible(false)}
				footer={null}
				width={500}
				centered
				destroyOnClose
			>
				<div style={{ padding: '20px 0' }}>
					{/* Success Icon */}
					<div style={{ textAlign: 'center', marginBottom: '20px' }}>
						<p style={{
							fontSize: '16px',
							color: '#52c41a',
							fontWeight: '600',
							margin: 0
						}}>
							{t('studentManagement.passwordResetSuccess')}
						</p>
					</div>

					{/* Credentials Display */}
					{studentCredentials && (
						<div style={{
							backgroundColor: '#ffffff',
							border: '2px solid #d9d9d9',
							borderRadius: '24px',
							padding: '30px 20px',
							marginBottom: '20px'
						}}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: '24px',
								position: 'relative'
							}}>
								<h4 style={{
									fontSize: '20px',
									fontWeight: '700',
									color: '#000000',
									margin: 0,
									textAlign: 'center'
								}}>
									{t('studentManagement.newCredentials')}
								</h4>
								<Button
									type="text"
									icon={<CopyOutlined />}
									onClick={handleCopyCredentials}
									style={{
										position: 'absolute',
										right: '0',
										color: '#000000',
										fontSize: '18px',
										padding: '4px 8px',
										height: 'auto'
									}}
									title={t('studentManagement.copyCredentials')}
								/>
							</div>
							
							{/* Username */}
							<div style={{ marginBottom: '16px' }}>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									<label style={{
										color: '#000000',
										fontWeight: 500,
										fontSize: '16px',
										marginBottom: '8px',
										width: '90%',
										textAlign: 'left'
									}}>
										{t('login.username')}
									</label>
									<div style={{
										borderRadius: '50px',
										background: '#ffffff',
										border: '2px solid #999999',
										color: '#000000',
										fontSize: '16px',
										width: '90%',
										height: '44px',
										padding: '0 20px',
										display: 'flex',
										alignItems: 'center'
									}}>
										{studentCredentials.username || studentCredentials.userName || '-'}
									</div>
								</div>
							</div>

							{/* Password */}
							<div style={{ marginBottom: '16px' }}>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									<label style={{
										color: '#000000',
										fontWeight: 500,
										fontSize: '16px',
										marginBottom: '8px',
										width: '90%',
										textAlign: 'left'
									}}>
										{t('login.password')}
									</label>
									<div style={{
										borderRadius: '50px',
										background: '#ffffff',
										border: '2px solid #999999',
										color: '#000000',
										fontSize: '16px',
										width: '90%',
										height: '44px',
										padding: '0 20px',
										display: 'flex',
										alignItems: 'center'
									}}>
										{studentCredentials.newPassword || studentCredentials.password || '-'}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Warning Message */}
					<div style={{
						backgroundColor: '#fff7e6',
						border: '1px solid #ffd591',
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '20px'
					}}>
						<div style={{
							fontSize: '14px',
							color: '#d46b08',
							fontWeight: '500',
							marginBottom: '4px'
						}}>
							⚠️ {t('studentManagement.credentialsWarning')}
						</div>
						<div style={{
							fontSize: '12px',
							color: '#d46b08',
							lineHeight: '1.4'
						}}>
							{t('studentManagement.credentialsNote')}
						</div>
					</div>

					{/* Action Button */}
					<div style={{ textAlign: 'end' }}>
						<Button
							type="primary"
							onClick={() => setCredentialsModalVisible(false)}
							style={{
								background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
								borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
								color: theme === 'sun' ? '#000' : '#fff',
								borderRadius: '6px',
								height: '32px',
								fontWeight: '500',
								fontSize: '16px',
								padding: '4px 15px',
								width: '100px',
								transition: 'all 0.3s ease',
								boxShadow: 'none'
							}}
						>
							{t('common.close')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Avatar Selection Modal - managers only */}
			{isManager && (
			<Modal
				title={
					<div style={{
						fontSize: '28px',
						fontWeight: '600',
						color: 'rgb(24, 144, 255)',
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
							<div style={{ fontSize: '24px', marginBottom: '8px' }}><UploadOutlined /></div>
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
			)}
			</div>
		</div>
		</ThemedLayout>
	);
};

export default StudentProfile;
