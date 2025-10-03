import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import './Login.css'; // import Login CSS instead

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState(null);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isSunTheme } = useTheme();

	const handleSubmit = (e) => {
		e.preventDefault();

		if (email === 'admin@example.com') {
			// Chuyển đến trang OTP sau khi gửi email thành công
			navigate('/otp-verification');
		} else {
			setMessage({
				type: 'error',
				text: 'Email không tồn tại trong hệ thống!',
			});
		}
	};

  const handleBackToLogin = () => {
    navigate(-1);
  };

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
									{/* Back Button */}
									<div className='d-flex justify-content-start mb-3'>
										<Button
											type='text'
											icon={<ArrowLeftOutlined style={{ color: isSunTheme ? '#3b82f6' : '#c8c8f7' }} />}
											onClick={handleBackToLogin}
											style={{
												color: isSunTheme ? '#3b82f6' : '#c8c8f7',
												fontWeight: 600,
												padding: '4px 8px',
												height: 'auto',
												borderRadius: '6px',
												display: 'flex',
												alignItems: 'center',
												gap: '6px'
											}}>
											{t('common.back')}
										</Button>
									</div>
									<h5 className='text-center mb-1' style={getHeadingStyle(isSunTheme)}>
										{t('login.forgotPassword')}
									</h5>
									<p className='text-center mb-4' style={getSubtitleStyle(isSunTheme)}>
										Enter email to receive OTP to reset password
									</p>
									<form onSubmit={handleSubmit}>
										<div className='mb-3'>
											<label htmlFor='forgotEmail' className='form-label' style={getLabelStyle(isSunTheme)}>
												{t('common.email')}
											</label>
											<Input
												id='forgotEmail'
												type='email'
												placeholder={t('common.email')}
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												prefix={<MailOutlined />}
												size='large'
												style={getInputStyle(isSunTheme)}
												required
											/>
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
												Submit
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
