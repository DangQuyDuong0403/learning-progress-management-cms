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
                            <img 
                                src="/img/astro.png" 
                                alt="CAMKEY Logo" 
                                style={{ 
                                    width: '100px', 
                                    height: '100px', 
                                    filter: 'drop-shadow(0 0 15px rgba(125, 211, 252, 0.8))'
                                }} 
                            />
                        )}
                        <span style={{ 
                            fontSize: '28px', 
                            fontWeight: 700, 
                            fontFamily: 'Bungee, cursive',
                            color: isSunTheme ? '#1E40AF' : '#cbd5e1',
                            textShadow: isSunTheme ? '0 0 5px rgba(30, 64, 175, 0.5)' : '0 0 8px rgba(203, 213, 225, 0.4)'
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
                                            Forgot password
                                        </h5>
                                    </div>
									<form onSubmit={handleSubmit}>
                                        <div className='mb-5'>
                                            <label htmlFor='forgotEmail' className='form-label' style={getLabelStyle(isSunTheme)}>
                                                {t('common.email')}
                                            </label>
                                            <div style={{ textAlign: 'center' }}>
                                                <Input
                                                    id='forgotEmail'
                                                    type='email'
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    prefix={<MailOutlined />}
                                                    size='large'
                                                    style={getInputStyle(isSunTheme)}
                                                    required
                                                />
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

										<div className='text-center'>
                                            <button
                                                type='submit'
                                                className='btn w-90 mb-4 rounded-3'
                                                style={getSubmitButtonStyle(isSunTheme)}>
                                                Send
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
	background: isSunTheme ? '#ffffff' : '#afa0d3',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	color: isSunTheme ? '#374151' : '#ffffff',
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