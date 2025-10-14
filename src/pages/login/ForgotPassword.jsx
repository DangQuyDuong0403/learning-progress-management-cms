import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Button } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import { forgotPassword, clearForgotPasswordState } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import './Login.css'; // import Login CSS instead

export default function ForgotPassword() {
	const [username, setUsername] = useState('');
	const [isInitialized, setIsInitialized] = useState(false);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const { isSunTheme } = useTheme();
	
	// Redux state
	const { forgotPasswordLoading, forgotPasswordError, forgotPasswordSuccess } = useSelector(state => state.auth);

	// Clear state when component mounts
	useEffect(() => {
		dispatch(clearForgotPasswordState());
		setIsInitialized(true);
	}, [dispatch]);

	// Handle success/error messages - only after initialization
	useEffect(() => {
		if (!isInitialized) return;
		
		if (forgotPasswordSuccess) {
			// Navigate to success page with username in state
			navigate('/forgot-password-success', { state: { username } });
		} else if (forgotPasswordError) {
			// Navigate to failure page with username in state
			navigate('/forgot-password-failure', { state: { username } });
		}
	}, [forgotPasswordSuccess, forgotPasswordError, navigate, username, isInitialized]);

	const handleSubmit = (e) => {
		e.preventDefault();
		
		// Validate username
		if (!username) {
			spaceToast.error(t('common.usernameRequired'));
			return;
		}

		// Dispatch forgot password action
		dispatch(forgotPassword(username));
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
                                            {t('forgotPassword.pageTitle')}
                                        </h5>
                                    </div>
									<form onSubmit={handleSubmit}>
                                        <div className='mb-5'>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label htmlFor='forgotUsername' className='form-label' style={{...getLabelStyle(isSunTheme), width: '90%', textAlign: 'left'}}>
                                                    {t('common.username')}
                                                </label>
                                                <Input
                                                    id='forgotUsername'
                                                    type='text'
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    prefix={<UserOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                    required
                                                />
                                            </div>
                                        </div>


										<div className='text-center'>
                                            <button
                                                type='submit'
                                                className='btn w-90 mb-4 rounded-3'
                                                style={getSubmitButtonStyle(isSunTheme)}
                                                disabled={forgotPasswordLoading}>
                                                {forgotPasswordLoading ? t('common.loading') : t('forgotPassword.send')}
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