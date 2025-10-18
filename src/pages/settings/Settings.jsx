import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import {
	Card,
	Button,
	Modal,
	Form,
	Input,
	message,
	Typography,
} from 'antd';
import {
	LockOutlined,
	GlobalOutlined,
	SettingOutlined,
	EditOutlined,
} from '@ant-design/icons';
import ThemedLayout from '../../component/ThemedLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { spaceToast } from '../../component/SpaceToastify';
import { logout } from '../../redux/auth';
import authApi from '../../apis/backend/auth';
import './Settings.css';

const { Text } = Typography;

const Settings = () => {
	const { t, i18n } = useTranslation();
	const { theme, toggleTheme } = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	
	// Set page title
	usePageTitle('Settings');
	const [passwordForm] = Form.useForm();
	
	// Loading state for password change
	const [changePasswordLoading, setChangePasswordLoading] = useState(false);

	const [modals, setModals] = useState({
		password: false,
		delete: false,
	});

	const [isTransitioning, setIsTransitioning] = useState(false);
	const [transitionDirection, setTransitionDirection] = useState('right'); // 'right' for sun->space, 'left' for space->sun

	// Helper function để lấy ngôn ngữ hiện tại
	const getCurrentLanguage = () => {
		return localStorage.getItem('i18nextLng') || i18n.language || 'en';
	};


	// Password change functionality
	const handlePasswordChange = async () => {
		setChangePasswordLoading(true);
		
		try {
			const values = await passwordForm.validateFields();
			
			// Get refresh token from localStorage
			const refreshToken = localStorage.getItem('refreshToken');
			
			if (!refreshToken) {
				message.error('Session expired. Please login again.');
				return;
			}
			
			// Prepare data for API call - include refreshToken like ChangePassword.jsx
			const passwordData = {
				oldPassword: values.currentPassword,
				newPassword: values.newPassword,
				confirmPassword: values.confirmPassword,
				refreshToken: refreshToken
			};
			
			// Call API directly like ChangePassword.jsx instead of through Redux
			const response = await authApi.changePassword(passwordData);
			
			// Success - show toast and close modal
			spaceToast.success(response.message);
			setModals(prev => ({ ...prev, password: false }));
			passwordForm.resetFields();
			
			// Clear accessToken from localStorage and Redux state (like ChangePassword.jsx)
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('user');
			dispatch(logout());
			
			// Show message that user needs to login again and redirect
			setTimeout(() => {
				spaceToast.info('Please login again with your new password');
				navigate('/choose-login');
			}, 2000);
			
		} catch (error) {
			console.error('Change password error:', error);
			console.error('Error response:', error.response);
			console.error('Error status:', error.response?.status);
			console.error('Error data:', error.response?.data);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data?.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			}
		} finally {
			setChangePasswordLoading(false);
		}
	};



	// Theme change with direction tracking
	const handleThemeChange = () => {
		setIsTransitioning(true);
		
		// Determine direction based on current theme
		if (theme === 'sun') {
			setTransitionDirection('right'); // sun -> space (left to right)
		} else {
			setTransitionDirection('left'); // space -> sun (right to left)
		}
		
		// Add slight delay to show transition animation
		setTimeout(() => {
			toggleTheme();
			setIsTransitioning(false);
		}, 100);
	};

	// Language toggle (similar to theme toggle)
	const handleLanguageToggle = () => {
		// Lấy ngôn ngữ hiện tại từ localStorage hoặc i18n, mặc định là 'en'
		const currentLang = getCurrentLanguage();
		const newLang = currentLang === 'vi' ? 'en' : 'vi';
		
		i18n.changeLanguage(newLang);
	};

	const openModal = (modalName) => {
		setModals(prev => ({ ...prev, [modalName]: true }));
	};

	const closeModal = (modalName) => {
		setModals(prev => ({ ...prev, [modalName]: false }));
		if (modalName === 'password') {
			passwordForm.resetFields();
		}
	};


	return (
		<ThemedLayout>
			<div className={`settings-container ${theme}-settings-container`}>
				{/* Page Title */}
				<div className="page-title-container">
					<Typography.Title 
						level={1} 
						className="page-title"
					>
						{t('settings.title')}
					</Typography.Title>
				</div>
				<div className={`settings-content ${theme}-settings-content`}>
					{/* Password Section */}
					<Card className={`settings-card ${theme}-settings-card`}>
						<div className="settings-card-header">
							<div className="settings-card-title">
								<LockOutlined className="settings-card-icon" />
								<span>{t('settings.password')}</span>
							</div>
							<Button 
								type="text" 
								icon={<EditOutlined />}
								className={`settings-edit-btn ${theme}-settings-edit-btn`}
								onClick={() => openModal('password')}
							>
								{t('common.changePassword')}
							</Button>
						</div>
					</Card>
					{/* Theme Section */}
					<Card className={`settings-card ${theme}-settings-card`}>
						<div className="settings-card-header">
							<div className="settings-card-title">
								<SettingOutlined className="settings-card-icon" />
								<span>{t('settings.theme')}</span>
							</div>
						</div>
						<div className="settings-card-content">
							<div className="settings-field">
								<Text className={`settings-field-label ${theme}-settings-field-label`}>
									{t('settings.selectPreferredTheme')}
								</Text>
								<div className="custom-theme-toggle">
									<div className="theme-toggle-track" onClick={handleThemeChange}>
										<div className={`theme-toggle-thumb ${theme === 'space' ? 'space-theme' : 'sun-theme'} ${isTransitioning ? 'transitioning' : ''}`}>
											<img 
												src={transitionDirection === 'right' ? "/img/astro.png" : "/img/astronut-11.png"} 
												alt="Astronaut" 
												className={`astronaut-image ${transitionDirection === 'right' ? 'astro-image' : 'astronut-image'}`}
											/>
										</div>
									</div>
									<div className="theme-labels">
										<Text className={`theme-label sun-label ${theme === 'sun' ? 'active' : ''}`}>
											☀️ {t('settings.lightTheme')}
										</Text>
										<Text className={`theme-label space-label ${theme === 'space' ? 'active' : ''}`}>
											🌙 {t('settings.darkTheme')}
										</Text>
									</div>
								</div>
							</div>
						</div>
					</Card>

					{/* Language Section */}
					<Card className={`settings-card ${theme}-settings-card`}>
						<div className="settings-card-header">
							<div className="settings-card-title">
								<GlobalOutlined className="settings-card-icon" />
								<span>{t('settings.language')}</span>
							</div>
						</div>
						<div className="settings-card-content">
							<div className="settings-field">
								<Text className={`settings-field-label ${theme}-settings-field-label`}>
									{t('settings.selectPreferredLanguage')}
								</Text>
								<div className="custom-language-toggle">
									<div className="language-toggle-track" onClick={handleLanguageToggle}>
										<div className={`language-toggle-thumb ${getCurrentLanguage() === 'vi' ? 'vi-theme' : 'en-theme'}`}>
											<img 
												src={getCurrentLanguage() === 'vi' ? "/img/vietnamflag.png" : "/img/englandflag.png"} 
												alt="Language Flag" 
												className="flag-image"
											/>
										</div>
									</div>
									<div className="language-labels">
										<Text className={`language-label vi-label ${getCurrentLanguage() === 'vi' ? 'active' : ''}`}>
											🇻🇳 {t('common.vietnamese')}
										</Text>
										<Text className={`language-label en-label ${getCurrentLanguage() === 'en' ? 'active' : ''}`}>
											🇬🇧 {t('common.english')}
										</Text>
									</div>
								</div>
							</div>
						</div>
					</Card>

					


				</div>
			</div>
									
			{/* Password Change Modal */}
			<Modal
				title={
					<div className={`modal-title ${theme}-modal-title`}>
						{t('settings.changePassword')}
					</div>
				}
				open={modals.password}
				onOk={handlePasswordChange}
				onCancel={() => closeModal('password')}
				okText={t('common.save')}
				cancelText={t('common.cancel')}
				confirmLoading={changePasswordLoading}
				width={500}
				className={`settings-modal ${theme}-settings-modal`}
				okButtonProps={{
					style: {
						background: theme === 'sun' 
							? 'rgb(113, 179, 253)' 
							: 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
						border: 'none',
						color: theme === 'sun' ? '#000000' : '#ffffff',
						fontWeight: '600',
						borderRadius: '8px',
						height: '32px',
						padding: '0 16px',
						boxShadow: theme === 'sun' 
							? '0 4px 12px rgba(113, 179, 253, 0.3)' 
							: '0 4px 12px rgba(114, 40, 217, 0.3)',
						transition: 'all 0.3s ease',
						minWidth: '80px',
						width: '80px'
					}
				}}
				cancelButtonProps={{
					style: {
						height: '32px',
						padding: '0 16px',
						borderRadius: '8px',
						fontWeight: '600',
						minWidth: '80px',
						width: '80px',
						transition: 'all 0.3s ease'
					}
				}}
			>
				<Form
					form={passwordForm}
					layout="vertical"
					className={`settings-form ${theme}-settings-form`}
				>
					<Form.Item
						label={
							<span>
								{t('settings.currentPassword')} <span style={{ color: 'red' }}>*</span>
							</span>
						}
						name="currentPassword"
						rules={[
							{ required: true, message: t('settings.currentPasswordRequired') }
						]}
					>
						<Input.Password 
							placeholder={t('settings.enterCurrentPassword')}
							className={`settings-input ${theme}-settings-input`}
						/>
					</Form.Item>

					<Form.Item
						label={
							<span>
								{t('settings.newPassword')} <span style={{ color: 'red' }}>*</span>
							</span>
						}
						name="newPassword"
						rules={[
							{ required: true, message: t('settings.newPasswordRequired') },
							{ min: 6, message: t('settings.passwordMinLength') }
						]}
					>
						<Input.Password 
							placeholder={t('settings.enterNewPassword')}
							className={`settings-input ${theme}-settings-input`}
						/>
					</Form.Item>

					<Form.Item
						label={
							<span>
								{t('settings.confirmNewPassword')} <span style={{ color: 'red' }}>*</span>
							</span>
						}
						name="confirmPassword"
						dependencies={['newPassword']}
						rules={[
							{ required: true, message: t('settings.confirmPasswordRequired') },
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue('newPassword') === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error(t('settings.passwordsDoNotMatch')));
								},
							}),
						]}
					>
						<Input.Password 
							placeholder={t('settings.confirmNewPassword')}
							className={`settings-input ${theme}-settings-input`}
						/>
					</Form.Item>
				</Form>
			</Modal>

		</ThemedLayout>
	);
};

export default Settings;
