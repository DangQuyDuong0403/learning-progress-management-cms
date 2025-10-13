import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import { LockOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import './Login.css';

export default function ResetPassword() {
	const [formData, setFormData] = useState({
		newPassword: '',
		confirmPassword: '',
	});
	const [message, setMessage] = useState(null);
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
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);

		return {
			isValid:
				password.length >= minLength &&
				hasUpperCase &&
				hasLowerCase &&
				hasNumbers,
			errors: {
				length:
					password.length < minLength
						? t('resetPassword.passwordMinLengthError')
						: null,
				uppercase: !hasUpperCase ? t('resetPassword.passwordUppercaseError') : null,
				lowercase: !hasLowerCase
					? t('resetPassword.passwordLowercaseError')
					: null,
				numbers: !hasNumbers ? t('resetPassword.passwordNumbersError') : null,
			},
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage(null);

		// Validate password
		const passwordValidation = validatePassword(formData.newPassword);
		if (!passwordValidation.isValid) {
			setMessage({
				type: 'error',
				text: t('resetPassword.passwordNotMeetRequirements'),
			});
			return;
		}

		// Check if passwords match
		if (formData.newPassword !== formData.confirmPassword) {
			setMessage({
				type: 'error',
				text: t('resetPassword.confirmPasswordNotMatch'),
			});
			return;
		}

		// Giả lập API call (thay thế bằng API call thực tế)
		setTimeout(() => {
			setMessage({
				type: 'success',
				text: t('resetPassword.resetSuccess'),
			});

			// Chuyển về trang login sau 2 giây
			setTimeout(() => {
				navigate('/login-student');
			}, 2000);
		}, 1500);
	};

	const handleBackToLogin = () => {
		navigate('/login-student');
	};

	const passwordValidation = validatePassword(formData.newPassword);

	return (
		<ThemedLayoutFullScreen>
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
                                            {t('resetPassword.title')}
                                        </h5>
                                    </div>
									<form onSubmit={handleSubmit}>
                                        <div className='mb-3'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='newPassword' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('resetPassword.newPassword')}
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
																`✓ ${t('resetPassword.minLength')}`}
														</div>
														<div
															className={`mb-1 ${
																passwordValidation.errors.uppercase
																	? 'text-danger'
																	: 'text-success'
															}`}>
															•{' '}
															{passwordValidation.errors.uppercase ||
																`✓ ${t('resetPassword.hasUppercase')}`}
														</div>
														<div
															className={`mb-1 ${
																passwordValidation.errors.lowercase
																	? 'text-danger'
																	: 'text-success'
															}`}>
															•{' '}
															{passwordValidation.errors.lowercase ||
																`✓ ${t('resetPassword.hasLowercase')}`}
														</div>
														<div
															className={`mb-1 ${
																passwordValidation.errors.numbers
																	? 'text-danger'
																	: 'text-success'
															}`}>
															•{' '}
															{passwordValidation.errors.numbers ||
																`✓ ${t('resetPassword.hasNumbers')}`}
														</div>
													</div>
												)}
											</div>

                                        <div className='mb-4'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='confirmPassword' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('resetPassword.confirmPassword')}
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
																? `✓ ${t('resetPassword.passwordMatch')}`
																: `✗ ${t('resetPassword.passwordNotMatch')}`}
														</div>
													</div>
												)}
											</div>

											{message && (
												<div
													className={`mb-4 p-3 rounded-3 ${
														message.type === 'success'
															? 'alert-success'
															: 'alert-danger'
													}`}
													style={{
														backgroundColor:
															message.type === 'success'
																? '#dcfce7'
																: '#fee2e2',
														color:
															message.type === 'success'
																? '#166534'
																: '#991b1b',
														border: 'none',
													}}>
													{message.text}
												</div>
											)}

                                  
									<div className='text-center'>
											<button
												type='submit'
												className='btn w-90 mb-4 rounded-3'
												style={getSubmitButtonStyle(isSunTheme)}>
												{t('resetPassword.changePassword')}
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
