import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import authApi from '../../apis/backend/auth';
import { Input, Button } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import ForgotPasswordModal from './ForgotPasswordModal';
import usePageTitle from '../../hooks/usePageTitle';
import './Login.css';

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [forgotVisible, setForgotVisible] = useState(false);
	
	// Set page title
	usePageTitle('Student Login');
	const [loading, setLoading] = useState(false);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isSunTheme } = useTheme();

	const handleSubmit = async (e) => {
		e.preventDefault();

		setLoading(true);
		
		try {
			// Clear existing tokens before login
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('user');
			
			// Lấy loginRole từ localStorage
			const loginRole = localStorage.getItem('loginRole') || 'student';
			
			// Gọi API login với 3 trường - đảm bảo thứ tự tuyệt đối
			const loginData = new Map();
			loginData.set('username', username);
			loginData.set('password', password);
			loginData.set('loginRole', loginRole);
			
			const response = await authApi.login(Object.fromEntries(loginData));

			// Dispatch login success với data từ API
			dispatch(loginSuccess(response.data));
			
			// Store new tokens in localStorage
			localStorage.setItem('accessToken', response.data.accessToken);
			localStorage.setItem('refreshToken', response.data.refreshToken);
			
			// Store mustChangePassword flag
			localStorage.setItem('mustChangePassword', response.data.mustChangePassword ? 'true' : 'false');
			localStorage.setItem('mustUpdateProfile', response.data.mustUpdateProfile ? 'true' : 'false');
			
			// Check if user must change password
			if (response.data.mustChangePassword) {
				// Redirect to reset password page
				setTimeout(() => {
					navigate('/reset-password');
				}, 2000);
			} else {
				// Normal login success
				spaceToast.success(response.message);
				// Redirect to student dashboard
				setTimeout(() => {
					navigate('/student/dashboard');
				}, 1000);
			}
			
		} catch (error) {
			console.error('Login error:', error);
			
			// Xử lý lỗi từ API
			if (error.response) {
				const errorMessage = error.response.data.error;
				spaceToast.error(errorMessage);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleForgotMethodSelect = (method) => {
		if (method === 'email') {
			navigate('/forgot-password-email');
		} else if (method === 'teacher') {
			navigate('/forgot-password-teacher');
		}
	};

	const handleBackToChoose = () => {
		navigate('/choose-login');
	};

	return (
		<ThemedLayoutFullScreen>
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
							style={getLoginCardStyle(isSunTheme)}>
							<div
								className='card-body'
								style={{ padding: '1rem 1.5rem 1rem 1.5rem' }}>
								<div className='card-body'>
									{/* Back Button and Login Title */}
									<div className='d-flex align-items-center justify-content-center mb-4' style={{ position: 'relative' }}>
										<Button
											type='text'
											icon={<ArrowLeftOutlined style={{ 
												color: isSunTheme ? '#3b82f6' : '#ffffff', 
												fontSize: '24px',
												fontWeight: 'bold'
											}} />}
											onClick={handleBackToChoose}
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
											{t('login.title')}
										</h5>
									</div>
									{/* For student text below Login */}
									<div className='text-center mb-3'>
										<span
											style={{ 
												color: isSunTheme ? '#3b82f6' : '#C8C8F7',
												fontSize: '20px',
												fontWeight: 400,
												opacity: 0.8
											}}>
											{t('login.forStudent')}
										</span>
									</div>
									<form onSubmit={handleSubmit}>
										<div className='mb-3'>
											<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
												<label htmlFor='loginUsername' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
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
										</div>
										<div className='mb-4'>
											<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
												<label htmlFor='loginPassword' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
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
										</div>
										<div className='d-flex align-items-center mb-4'>
										</div>
										<div className='text-center'>
											<button
												type='submit'
												className='btn w-90 mb-4 rounded-3'
												style={getSubmitButtonStyle(isSunTheme)}
												disabled={loading}>
												{loading ? 'Signing in...' : t('login.signIn')}
											</button>
										</div>
										<div style={{ textAlign: 'end', marginTop: '16px' }}>
											<span
												className='forgot-password'
												style={{ 
													cursor: 'pointer', 
													color: isSunTheme ? '#3b82f6' : '#C8C8F7',
													fontSize: '18px',
													fontWeight: 400
												}}
												onClick={() => setForgotVisible(true)}>
												{t('login.forgotPassword')}
											</span>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal chọn cách quên mật khẩu */}
				<ForgotPasswordModal
					visible={forgotVisible}
					onCancel={() => setForgotVisible(false)}
					onMethodSelect={handleForgotMethodSelect}
				/>
			</div>
		</ThemedLayoutFullScreen>
	);
}

// Dynamic styles that change based on theme
const getLoginCardStyle = (isSunTheme) => ({
	background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.7)',
	backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
	borderRadius: 24,
	boxShadow: isSunTheme 
		? '0 15px 40px rgba(0, 0, 0, 0.15)' 
		: '0 15px 40px rgba(77, 208, 255, 0.25)',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	minWidth: 350,
	maxWidth: 500,
	margin: '0 auto',
	padding: 0,
});

const getHeadingStyle = (isSunTheme) => ({
	fontSize: '40px',
	fontWeight: 700,
	color: isSunTheme ? '#3b82f6' : '#fff',
	textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
	marginBottom: '8px',
});


const getLabelStyle = (isSunTheme) => ({
	color: isSunTheme ? '#3b82f6' : '#ffffff',
	fontWeight: 400,
	fontSize: '16px',
	marginBottom: '6px',
});

const getInputStyle = (isSunTheme) => ({
	borderRadius: '50px',
	background: isSunTheme ? '#ffffff' : '#ffffff',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	color: isSunTheme ? '#374151' : 'black',
	fontSize: '14px',
	width: '90%',
	margin: '0 auto',
	height: '40px',
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
