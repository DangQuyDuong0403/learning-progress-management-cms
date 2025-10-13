import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Alert } from 'antd';
import { LockOutlined, SafetyOutlined, ArrowLeftOutlined, KeyOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import { spaceToast } from '../../component/SpaceToastify';
import authApi from '../../apis/backend/auth';
import './Login.css';

export default function ChangePassword() {
	const [formData, setFormData] = useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { isSunTheme } = useTheme();
	const { t } = useTranslation();

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const validatePassword = (password) => {
		const minLength = 6;

		return {
			isValid: password.length >= minLength,
			errors: {
				length:
					password.length < minLength
						? t('changePassword.passwordMinLengthError')
						: null,
			},
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validate old password
		if (!formData.oldPassword) {
			spaceToast.error(t('changePassword.oldPasswordRequired'));
			return;
		}

		// Validate new password
		const passwordValidation = validatePassword(formData.newPassword);
		if (!passwordValidation.isValid) {
			spaceToast.error(t('changePassword.passwordMinLengthError'));
			return;
		}

		// Check if old password and new password are different
		if (formData.oldPassword === formData.newPassword) {
			spaceToast.error(t('changePassword.newPasswordSameAsOld'));
			return;
		}

		// Check if passwords match
		if (formData.newPassword !== formData.confirmPassword) {
			spaceToast.error(t('changePassword.confirmPasswordNotMatch'));
			return;
		}

		setLoading(true);

		try {
			// Get refresh token from localStorage
			const refreshToken = localStorage.getItem('refreshToken');
			
			if (!refreshToken) {
				spaceToast.error('Session expired. Please login again.');
				setLoading(false);
				return;
			}

			// Call change password API
			await authApi.changePassword({
				oldPassword: formData.oldPassword,
				newPassword: formData.newPassword,
				confirmPassword: formData.confirmPassword,
				refreshToken: refreshToken
			});

			// Success - show toast message
			spaceToast.success(t('changePassword.changeSuccess'));

			// Clear tokens from localStorage
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');

			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate('/choose-login');
			}, 2000);

		} catch (error) {
			console.error('Change password error:', error);
			
			// Handle API errors with toast messages
			if (error.response) {
				const errorMessage = error.response.data.message || 'Failed to change password!';
				spaceToast.error(errorMessage);
			} else if (error.request) {
				spaceToast.error('Network error. Please check your connection!');
			} else {
				spaceToast.error('Something went wrong!');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleBackToLogin = () => {
		navigate('/choose-login');
	};

	const passwordValidation = validatePassword(formData.newPassword);

	return (
		<ThemedLayoutFullScreen>
			<style>{darkThemeAlertStyle}</style>
			<div className="main-content" style={{ paddingTop: 120, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
				{/* Theme Toggle - Top Right */}
				<div className={`login-theme-toggle-container ${isSunTheme ? 'sun-theme' : 'space-theme'}`} style={{ position: 'absolute', top: '20px', right: '20px' }}>
					<ThemeToggleSwitch />
					<LanguageToggle />
				</div>
				

				<div className='d-flex align-items-center justify-content-center w-100'>
					<div className='row justify-content-center w-100'>
						<div
							className='card mb-0'
							style={getLoginCardStyle(isSunTheme)}>
                            <div
                                className='card-body'
                                style={{ padding: '1.5rem 2.5rem 1.5rem 2.5rem' }}>
                                <div className='card-body'>
                                    {/* Back Button and Title */}
                                    <div className='d-flex align-items-center justify-content-center mb-4' style={{ position: 'relative' }}>
                                        <Button
                                            type='text'
                                            icon={<ArrowLeftOutlined style={{ 
                                                color: isSunTheme ? '#3b82f6' : '#ffffff', 
                                                fontSize: '24px',
                                                fontWeight: 'bold'
                                            }} />}
                                            onClick={handleBackToLogin}
                                            style={{
                                                color: isSunTheme ? '#3b82f6' : '#ffffff',
                                                fontWeight: 600,
                                                fontSize: '18px',
                                                padding: '8px 12px',
                                                height: 'auto',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                flexShrink: 0,
                                                position: 'absolute',
                                                left: '0'
                                            }}>
                                        </Button>
                                        <h5 className='mb-0' style={getHeadingStyle(isSunTheme)}>
                                            {t('changePassword.title')}
                                        </h5>
                                    </div>
                                    
                                    {/* Security Alert */}
                                    <div className='mb-4'>
                                        <Alert
                                            message="Security Notice"
                                            description="For security reasons, you need to change your password immediately. Please enter your current password and choose a new one."
                                            type="warning"
                                            showIcon
                                            icon={<SecurityScanOutlined />}
                                            style={{
                                                backgroundColor: isSunTheme ? '#fff7e6' : 'rgba(255, 193, 7, 0.1)',
                                                border: isSunTheme ? '1px solid #ffd666' : '1px solid rgba(255, 193, 7, 0.3)',
                                                color: isSunTheme ? '#d46b08' : '#ffffff'
                                            }}
                                            className={isSunTheme ? '' : 'dark-theme-alert'}
                                        />
                                    </div>
                                    
									<form onSubmit={handleSubmit}>
                                        {/* Old Password Field */}
                                        <div className='mb-3'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='oldPassword' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('changePassword.oldPassword')}
                                                </label>
                                                <Input.Password
                                                    id='oldPassword'
                                                    value={formData.oldPassword}
                                                    onChange={(e) =>
                                                        handleInputChange('oldPassword', e.target.value)
                                                    }
                                                    prefix={<KeyOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                    styles={{
                                                        suffix: {
                                                            color: isSunTheme ? '#6b7280' : '#ffffff'
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* New Password Field */}
                                        <div className='mb-3'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='newPassword' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('changePassword.newPassword')}
                                                </label>
                                                <Input.Password
                                                    id='newPassword'
                                                    value={formData.newPassword}
                                                    onChange={(e) =>
                                                        handleInputChange('newPassword', e.target.value)
                                                    }
                                                    prefix={<LockOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                    styles={{
                                                        suffix: {
                                                            color: isSunTheme ? '#6b7280' : '#ffffff'
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>

											{/* Password requirements */}
											{formData.newPassword && (
												<div className='mt-2' style={{ fontSize: '0.8rem' }}>
													<div
														className={`mb-1 ${
															passwordValidation.errors.length
																? 'text-danger'
																: 'text-success'
														}`}>
														•{' '}
														{passwordValidation.errors.length ||
															`✓ ${t('changePassword.minLength')}`}
													</div>
												</div>
											)}
										</div>

                                        {/* Confirm Password Field */}
                                        <div className='mb-4'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='confirmPassword' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('changePassword.confirmPassword')}
                                                </label>
                                                <Input.Password
                                                    id='confirmPassword'
                                                    value={formData.confirmPassword}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            'confirmPassword',
                                                            e.target.value
                                                        )
                                                    }
                                                    prefix={<SafetyOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                    styles={{
                                                        suffix: {
                                                            color: isSunTheme ? '#6b7280' : '#ffffff'
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>

											{/* Password match indicator */}
											{formData.confirmPassword && (
												<div className='mt-2' style={{ fontSize: '0.8rem' }}>
													<div
														className={`mb-1 ${
															formData.newPassword ===
															formData.confirmPassword
																? 'text-success'
																: 'text-danger'
														}`}>
														•{' '}
														{formData.newPassword === formData.confirmPassword
															? `✓ ${t('changePassword.passwordMatch')}`
															: `✗ ${t('changePassword.passwordNotMatch')}`}
													</div>
												</div>
											)}
										</div>


                                  
									<div className='text-center'>
											<button
												type='submit'
												className='btn w-90 mb-4 rounded-3'
												style={getSubmitButtonStyle(isSunTheme)}
												disabled={loading}>
												{loading ? 'Changing Password...' : t('changePassword.changePassword')}
											</button>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ThemedLayoutFullScreen>
	);
}

// Dynamic styles that change based on theme
const getLoginCardStyle = (isSunTheme) => ({
	background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.7)',
	backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
	borderRadius: 32,
	boxShadow: isSunTheme 
		? '0 20px 60px rgba(0, 0, 0, 0.15)' 
		: '0 20px 60px rgba(77, 208, 255, 0.25)',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	minWidth: 400,
	maxWidth: 600,
	margin: '0 auto',
	padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
	fontSize: '48px',
	fontWeight: 700,
	color: isSunTheme ? '#3b82f6' : '#fff',
	textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
	marginBottom: '8px',
});

const getLabelStyle = (isSunTheme) => ({
	color: isSunTheme ? '#3b82f6' : '#ffffff',
	fontWeight: 400,
	fontSize: '18px',
	marginBottom: '8px',
});

const getInputStyle = (isSunTheme) => ({
	borderRadius: '59px',
	background: isSunTheme ? '#ffffff' : '#ffffff',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	color: isSunTheme ? '#374151' : 'black',
	fontSize: '16px',
	width: '90%',
	margin: '0 auto',
	height: '45px',
});

const getSubmitButtonStyle = (isSunTheme) => ({
	background: isSunTheme 
		? 'linear-gradient(135deg, #FFFFFF 10%, #DFEDFF 34%, #C3DEFE 66%, #9CC8FE 100%)' 
		: 'linear-gradient(135deg, #D9D9D9 0%, #CAC0E3 42%, #BAA5EE 66%, #AA8BF9 100%)',
	border: 'none',
	color: 'black',
	fontWeight: 600,
	fontSize: '20px',
	padding: '12px 24px',
	width: '90%',
	borderRadius: '12px',
	boxShadow: isSunTheme 
		? '0 8px 25px rgba(139, 176, 249, 0.3)' 
		: '0 8px 25px rgba(170, 139, 249, 0.3)',
	transition: 'all 0.3s ease',
});

// CSS for dark theme alert
const darkThemeAlertStyle = `
	.dark-theme-alert .ant-alert-message {
		color: #ffffff !important;
	}
	.dark-theme-alert .ant-alert-description {
		color: #ffffff !important;
	}
	.dark-theme-alert .ant-alert-icon {
		color: #ffffff !important;
	}
`;
