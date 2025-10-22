import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeLayoutLogin from '../../component/ThemeLayoutLogin';
import './Login.css';

export default function OTPVerification() {
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const [message, setMessage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isSunTheme } = useTheme();

	const handleOtpChange = (index, value) => {
		// Chỉ cho phép nhập số và giới hạn 1 ký tự
		if (value.length > 1) return;

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		// Tự động chuyển sang ô tiếp theo khi nhập
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index + 1}`);
			if (nextInput) nextInput.focus();
		}
	};

	const handleKeyDown = (index, e) => {
		// Xử lý phím Backspace
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`);
			if (prevInput) prevInput.focus();
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage(null);

		const otpString = otp.join('');

		// Kiểm tra OTP có đủ 6 số không
		if (otpString.length !== 6) {
			setMessage({
				type: 'error',
				text: 'Vui lòng nhập đầy đủ 6 số OTP!',
			});
			setIsLoading(false);
			return;
		}

		// Giả lập gửi OTP (thay thế bằng API call thực tế)
		setTimeout(() => {
			if (otpString === '123456') {
				setMessage({
					type: 'success',
					text: 'Xác thực OTP thành công!',
				});
				// Chuyển đến trang reset password sau 1.5 giây
				setTimeout(() => {
					navigate('/reset-password');
				}, 1500);
			} else {
				setMessage({
					type: 'error',
					text: 'Mã OTP không chính xác! Vui lòng thử lại.',
				});
			}
			setIsLoading(false);
		}, 1000);
	};

	const handleResendOtp = () => {
		setMessage({
			type: 'success',
			text: 'Mã OTP mới đã được gửi tới email của bạn!',
		});
	};

	const handleBackToForgotPassword = () => {
		navigate('/forgot-password-email');
	};

	return (
		<ThemeLayoutLogin>
			<div className="main-content" style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
				{/* Theme Toggle - Top Right */}
				<div className={`login-theme-toggle-container ${isSunTheme ? 'sun-theme' : 'space-theme'}`} style={{ position: 'absolute', top: '20px', right: '20px' }}>
					<ThemeToggleSwitch />
					<LanguageToggle />
				</div>
				
				<div className='d-flex align-items-center justify-content-center w-100'>
					<div className='row justify-content-center w-100'>
						<div
							className='card mb-0'
							style={getOTPCardStyle(isSunTheme)}>
						<div
							className='card-body'
							style={{ padding: '1rem 1.5rem 1rem 1.5rem' }}>
								<h5 className='mb-0' style={getHeadingStyle(isSunTheme)}>
									OTP verification
								</h5>
								<p className='text-center mb-4' style={getSubtitleStyle(isSunTheme)}>
									Enter the 6-digit OTP code sent to your email
								</p>
									<form onSubmit={handleSubmit}>
										<div className='mb-4'>
											<label className='form-label text-center d-block' style={getLabelStyle(isSunTheme)}>
												OTP code
											</label>
											<div className='d-flex justify-content-center gap-2 mb-3'>
												{otp.map((digit, index) => (
													<Input
														key={index}
														id={`otp-${index}`}
														type='text'
														inputMode='numeric'
														pattern='[0-9]*'
														className='text-center'
														style={getOTPInputStyle(isSunTheme)}
														value={digit}
														onChange={(e) =>
															handleOtpChange(
																index,
																e.target.value.replace(/\D/g, '')
															)
														}
														onKeyDown={(e) => handleKeyDown(index, e)}
														maxLength={1}
														required
													/>
												))}
											</div>
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

									<div className='text-center mb-4'>
										<button
											type='submit'
											className='btn w-90 mb-3 rounded-3'
											style={getSubmitButtonStyle(isSunTheme)}
											disabled={isLoading}>
											{isLoading ? 'In progressing...' : 'Verify OTP'}
										</button>
									</div>

									<div className='text-center mb-3'>
										<button
											className='fw-bold forgot-password'
											onClick={handleResendOtp}
											style={{ 
												cursor: 'pointer', 
												background: 'none', 
												border: 'none', 
												padding: 0, 
												textDecoration: 'underline',
												color: isSunTheme ? '#3b82f6' : '#C8C8F7'
											}}>
											Resend OTP code
										</button>
									</div>

									<div className='text-center'>
										<button
											className='fw-bold forgot-password'
											onClick={handleBackToForgotPassword}
											style={{ 
												cursor: 'pointer', 
												background: 'none', 
												border: 'none', 
												padding: 0, 
												textDecoration: 'underline',
												color: isSunTheme ? '#3b82f6' : '#C8C8F7'
											}}>
											{t('common.back')} to {t('login.forgotPassword')}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ThemeLayoutLogin>
	);
}

// Dynamic styles that change based on theme
const getOTPCardStyle = (isSunTheme) => ({
	background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.7)',
	backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
	borderRadius: 24,
	boxShadow: isSunTheme 
		? '0 15px 40px rgba(0, 0, 0, 0.15)' 
		: '0 15px 40px rgba(77, 208, 255, 0.25)',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	minWidth: 350,
	maxWidth: 450,
	margin: '0 auto',
	padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
	fontSize: '40px',
	fontWeight: 700,
	color: isSunTheme ? '#3b82f6' : '#fff',
	textAlign: 'center',
	marginBottom: '8px',
	textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
});

const getSubtitleStyle = (isSunTheme) => ({
	fontSize: '16px',
	fontWeight: 400,
	color: isSunTheme ? '#6b7280' : '#C8C8F7',
	textAlign: 'center',
	marginBottom: '1.5rem',
	lineHeight: '1.6',
});

const getLabelStyle = (isSunTheme) => ({
	color: isSunTheme ? '#3b82f6' : '#ffffff',
	fontWeight: 400,
	fontSize: '16px',
	marginBottom: '6px',
});

const getOTPInputStyle = (isSunTheme) => ({
	width: '40px',
	height: '40px',
	fontSize: '1.1rem',
	fontWeight: 'bold',
	border: isSunTheme ? '2px solid #3B82F6' : '2px solid #e4e8ff',
	borderRadius: '6px',
	background: isSunTheme ? '#ffffff' : '#ffffff',
	color: isSunTheme ? '#374151' : 'black',
});

const getSubmitButtonStyle = (isSunTheme) => ({
	background: isSunTheme 
		? 'linear-gradient(135deg, #FFFFFF 10%, #DFEDFF 34%, #C3DEFE 66%, #9CC8FE 100%)' 
		: 'linear-gradient(135deg, #D9D9D9 0%, #CAC0E3 42%, #BAA5EE 66%, #AA8BF9 100%)',
	border: 'none',
	color: 'black',
	fontWeight: 600,
	fontSize: '18px',
	padding: '10px 20px',
	width: '90%',
	borderRadius: '10px',
	boxShadow: isSunTheme 
		? '0 6px 20px rgba(139, 176, 249, 0.3)' 
		: '0 6px 20px rgba(170, 139, 249, 0.3)',
	transition: 'all 0.3s ease',
});
