import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import { Input, Modal, Button } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import './Login.css';

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [forgotVisible, setForgotVisible] = useState(false);
	const [forgotMethod, setForgotMethod] = useState('email');
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isSunTheme } = useTheme();

	const handleSubmit = (e) => {
		e.preventDefault();

		if (username === 'admin' && password === '123456') {
			const fakeResponse = {
				user: { id: 1, name: 'Admin', role: 'MANAGER' },
				token: 'fake-jwt-token-123',
			};
			dispatch(loginSuccess(fakeResponse));
			navigate('/home');
		} else {
			spaceToast.error('Sai tài khoản hoặc mật khẩu!');
		}
	};

	const handleForgotOk = () => {
		setForgotVisible(false);
		navigate(`/forgot-password-${forgotMethod}`);
	};

	const handleBackToChoose = () => {
		navigate('/choose-login');
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
											onClick={handleBackToChoose}
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
										Camkey
									</h5>
									<p className='text-center mb-4' style={getSubtitleStyle(isSunTheme)}>
										Let's fly into the learning space!
									</p>
									<form onSubmit={handleSubmit}>
										<div className='mb-3'>
											<label htmlFor='loginUsername' className='form-label' style={getLabelStyle(isSunTheme)}>
												{t('login.username')}
											</label>
											<Input
												id='loginUsername'
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												prefix={<UserOutlined />}
												size='large'
												style={getInputStyle(isSunTheme)}
											/>
										</div>
										<div className='mb-4'>
											<label htmlFor='loginPassword' className='form-label' style={getLabelStyle(isSunTheme)}>
												{t('login.password')}
											</label>
											<Input.Password
												id='loginPassword'
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												prefix={<LockOutlined />}
												size='large'
												style={getInputStyle(isSunTheme)}
												styles={{
													suffix: {
														color: isSunTheme ? '#6b7280' : '#ffffff'
													}
												}}
											/>
										</div>
										<div className='d-flex align-items-center justify-content-between mb-4'>
											<div className='form-check'>
												<input
													className='form-check-input primary'
													type='checkbox'
													value=''
													id='flexCheckChecked'
													defaultChecked
													style={{
														accentColor: isSunTheme ? '#1677ff' : '#c8c8f7'
													}}
												/>
												<label
													className='form-check-label'
													htmlFor='flexCheckChecked'
													style={getLabelStyle(isSunTheme)}>
													{t('login.rememberMe')}
												</label>
											</div>
											<span
												className='fw-bold forgot-password'
												style={{ 
													cursor: 'pointer', 
													color: isSunTheme ? '#3b82f6' : '#c8c8f7' 
												}}
												onClick={() => setForgotVisible(true)}>
												{t('login.forgotPassword')}
											</span>
										</div>
										<div className='text-center'>
											<button
												type='submit'
												className='btn w-90 mb-4 rounded-3'
												style={getSubmitButtonStyle(isSunTheme)}>
												{t('login.signIn')}
											</button>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal chọn cách quên mật khẩu */}
				<Modal
					title={
						<div style={{ textAlign: 'center', padding: '8px 0' }}>
							<h4
								style={{
									margin: 0,
									fontWeight: 600,
									background: isSunTheme 
										? 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)'
										: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
									backgroundClip: 'text',
								}}>
								Password recovery
							</h4>
						</div>
					}
					open={forgotVisible}
					footer={null}
					onCancel={() => setForgotVisible(false)}
					centered
					width={480}
					style={{ borderRadius: '16px' }}>
					<div style={{ padding: '8px 0' }}>
						<p
							style={{
								textAlign: 'center',
								marginBottom: '24px',
								color: isSunTheme ? '#374151' : '#666',
								fontSize: '16px',
								fontWeight: 500,
							}}>
							Choose the password recovery method that works for you
						</p>

						<div
							style={{
								display: 'flex',
								gap: '20px',
								justifyContent: 'center',
								flexWrap: 'wrap',
							}}>
							{/* Email Option */}
							<div
								onClick={() => {
									setForgotMethod('email');
									handleForgotOk();
								}}
								className='recover-option'>
								<div className='recover-card'>
									<div className='recover-icon'>📧</div>
									<h6>Via email</h6>
									<p>Send OTP code via email</p>
								</div>
							</div>

							{/* Phone Option */}
							<div
								onClick={() => {
									setForgotMethod('phone');
									handleForgotOk();
								}}
								className='recover-option'>
								<div className='recover-card'>
									<div className='recover-icon'>📱</div>
									<h6>Via Phone Number</h6>
									<p>Send OTP code via SMS</p>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div
							style={{
								textAlign: 'center',
								marginTop: '24px',
								padding: '16px 0',
								borderTop: isSunTheme ? '1px solid #e5e7eb' : '1px solid #f0f0f0',
							}}>
							<p
								style={{
									margin: 0,
									color: isSunTheme ? '#6b7280' : '#999',
									fontSize: '12px',
								}}>
								Choose the method you can access most easily
							</p>
						</div>
					</div>
				</Modal>
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
