import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
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
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const { i18n, t } = useTranslation();
	const { isSunTheme } = useTheme();

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
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		return {
			isValid:
				password.length >= minLength &&
				hasUpperCase &&
				hasLowerCase &&
				hasNumbers,
			errors: {
				length:
					password.length < minLength
						? `Mật khẩu phải có ít nhất ${minLength} ký tự`
						: null,
				uppercase: !hasUpperCase ? 'Mật khẩu phải có ít nhất 1 chữ hoa' : null,
				lowercase: !hasLowerCase
					? 'Mật khẩu phải có ít nhất 1 chữ thường'
					: null,
				numbers: !hasNumbers ? 'Mật khẩu phải có ít nhất 1 số' : null,
			},
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage(null);

		// Validate password
		const passwordValidation = validatePassword(formData.newPassword);
		if (!passwordValidation.isValid) {
			setMessage({
				type: 'error',
				text: 'Mật khẩu không đáp ứng yêu cầu bảo mật!',
			});
			setIsLoading(false);
			return;
		}

		// Check if passwords match
		if (formData.newPassword !== formData.confirmPassword) {
			setMessage({
				type: 'error',
				text: 'Mật khẩu xác nhận không khớp!',
			});
			setIsLoading(false);
			return;
		}

		// Giả lập API call (thay thế bằng API call thực tế)
		setTimeout(() => {
			setMessage({
				type: 'success',
				text: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.',
			});

			// Chuyển về trang login sau 2 giây
			setTimeout(() => {
				navigate('/login-student');
			}, 2000);

			setIsLoading(false);
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
				
				{/* Logo CAMKEY - Top Left */}
				<div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
						{isSunTheme ? (
							<img 
								src="/img/sun-logo.png" 
								alt="CAMKEY Logo" 
								style={{ 
									width: '48px', 
									height: '48px', 
									filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))'
								}} 
							/>
						) : (
							<span style={{ color: '#7DD3FC', fontSize: '36px', textShadow: '0 0 15px rgba(125, 211, 252, 0.8)' }}>🚀</span>
						)}
						<span style={{ 
							fontSize: '28px', 
							fontWeight: 700, 
							color: isSunTheme ? '#3b82f6' : '#fff',
							textShadow: isSunTheme ? '0 0 5px rgba(59, 130, 246, 0.5)' : '0 0 15px rgba(255, 255, 255, 0.8)'
						}}>
							CAMKEY
						</span>
					</div>
				</div>

				<div className='d-flex align-items-center justify-content-center w-100'>
					<div className='row justify-content-center w-100'>
						<div
							className='card mb-0'
							style={getLoginCardStyle(isSunTheme)}>
							<div
								className='card-body'
								style={{ padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
								<div className='card-body'>
									<h5 className='text-center mb-1' style={getHeadingStyle(isSunTheme)}>
										Reset password
									</h5>
									<p className='text-center mb-4' style={getSubtitleStyle(isSunTheme)}>
										Enter your new password
									</p>
									<form onSubmit={handleSubmit}>
										<div className='mb-3'>
											<label htmlFor='newPassword' className='form-label' style={getLabelStyle(isSunTheme)}>
												New password
											</label>
											<Input.Password
												id='newPassword'
												placeholder='Enter new password...'
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
																'✓ Độ dài tối thiểu 6 ký tự'}
														</div>
														<div
															className={`mb-1 ${
																passwordValidation.errors.uppercase
																	? 'text-danger'
																	: 'text-success'
															}`}>
															•{' '}
															{passwordValidation.errors.uppercase ||
																'✓ Có ít nhất 1 chữ hoa'}
														</div>
														<div
															className={`mb-1 ${
																passwordValidation.errors.lowercase
																	? 'text-danger'
																	: 'text-success'
															}`}>
															•{' '}
															{passwordValidation.errors.lowercase ||
																'✓ Có ít nhất 1 chữ thường'}
														</div>
														<div
															className={`mb-1 ${
																passwordValidation.errors.numbers
																	? 'text-danger'
																	: 'text-success'
															}`}>
															•{' '}
															{passwordValidation.errors.numbers ||
																'✓ Có ít nhất 1 số'}
														</div>
													</div>
												)}
											</div>

										<div className='mb-4'>
											<label htmlFor='confirmPassword' className='form-label' style={getLabelStyle(isSunTheme)}>
												Confirm password
											</label>
											<Input.Password
												id='confirmPassword'
												placeholder='Re-enter new password...'
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
																? '✓ Mật khẩu khớp'
																: '✗ Mật khẩu không khớp'}
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
											style={getSubmitButtonStyle(isSunTheme)}
											disabled={
												isLoading ||
												!passwordValidation.isValid ||
												formData.newPassword !== formData.confirmPassword
											}>
											{isLoading ? 'Loading...' : 'Change Password'}
										</button>
									</div>

									<div className='text-center'>
										<a
											className='fw-bold forgot-password'
											onClick={handleBackToLogin}
											style={{ 
												cursor: 'pointer', 
												color: isSunTheme ? '#3b82f6' : '#c8c8f7' 
											}}>
											{t('common.back')} to {t('login.signIn')}
										</a>
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
	background: isSunTheme ? 'rgba(255, 255, 255, 0.4)' : 'rgba(109, 95, 143, 0.4)',
	backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
	borderRadius: 32,
	boxShadow: isSunTheme 
		? '0 20px 60px rgba(0, 0, 0, 0.15)' 
		: '0 20px 60px rgba(77, 208, 255, 0.25)',
	border: isSunTheme 
		? '1px solid #3b82f6' 
		: '1px solid #131326',
	minWidth: 520,
	maxWidth: 720,
	margin: '0 auto',
	padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
	fontSize: '36px',
	fontWeight: 700,
	color: isSunTheme ? '#3b82f6' : '#fff',
	textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
	marginBottom: '8px',
});

const getSubtitleStyle = (isSunTheme) => ({
	fontSize: '20px',
	color: isSunTheme ? '#6b7280' : '#cbd5e1',
	marginBottom: '32px',
});

const getLabelStyle = (isSunTheme) => ({
	color: isSunTheme ? '#3b82f6' : '#c8c8f7',
	fontWeight: 600,
	marginBottom: '8px',
});

const getInputStyle = (isSunTheme) => ({
	borderRadius: '8px',
	background: isSunTheme ? '#e9f7fa' : '#afa0d3',
	border: isSunTheme ? '1px solid #3b82f6' : '1px solid #131326',
	color: isSunTheme ? '#374151' : '#ffffff',
});

const getSubmitButtonStyle = (isSunTheme) => ({
	background: isSunTheme 
		? 'linear-gradient(135deg, #ffffff, #8bb0f9, #1d0161)' 
		: 'linear-gradient(135deg, #ffffff, #aa8bf9, #1d0161)',
	border: 'none',
	color: 'black',
	fontWeight: 600,
	fontSize: '16px',
	padding: '12px 24px',
	width: '90%',
	borderRadius: '12px',
	boxShadow: isSunTheme 
		? '0 8px 25px rgba(139, 176, 249, 0.3)' 
		: '0 8px 25px rgba(170, 139, 249, 0.3)',
	transition: 'all 0.3s ease',
});
