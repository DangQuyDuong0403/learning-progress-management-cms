import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleOutlined } from '@ant-design/icons';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemedLayoutFullScreen from '../../component/ThemedLayoutFullScreen';
import './Login.css';

export default function ForgotPasswordSuccess() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isSunTheme } = useTheme();

	const handleBackToLogin = () => {
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
				
				
				<div className='d-flex align-items-center justify-content-center w-100'>
					<div className='row justify-content-center w-100'>
						<div
							className='card mb-0'
							style={getSuccessCardStyle(isSunTheme)}>
							<div
								className='card-body'
								style={{ padding: '3rem 2.5rem' }}>
								{/* Success Icon with Animation */}
								<div style={getIconContainerStyle(isSunTheme)}>
									<CheckCircleOutlined 
										style={getIconStyle(isSunTheme)} 
										className="success-icon-animation"
									/>
								</div>

								{/* Success Title */}
								<h2 style={getTitleStyle(isSunTheme)}>
									{t('forgotPasswordSuccess.title')}
								</h2>

								{/* Success Message */}
								<p style={getMessageStyle(isSunTheme)}>
									{t('forgotPasswordSuccess.message')}
								</p>

								{/* Additional Info */}
								<div style={getInfoBoxStyle(isSunTheme)}>
									<p style={getInfoTextStyle(isSunTheme)}>
										{t('forgotPasswordSuccess.checkEmail')}
									</p>
								</div>

								{/* Back to Login Button */}
								<div className='text-center mt-4'>
									<button
										type='button'
										className='btn w-90 rounded-3'
										style={getBackButtonStyle(isSunTheme)}
										onClick={handleBackToLogin}>
										{t('forgotPasswordSuccess.backToLogin')}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Add CSS Animation */}
			<style>{`
				@keyframes successPulse {
					0% {
						transform: scale(0);
						opacity: 0;
					}
					50% {
						transform: scale(1.1);
					}
					100% {
						transform: scale(1);
						opacity: 1;
					}
				}

				.success-icon-animation {
					animation: successPulse 0.6s ease-out;
				}
			`}</style>
		</ThemedLayoutFullScreen>
	);
}

// Dynamic styles
const getSuccessCardStyle = (isSunTheme) => ({
	background: isSunTheme ? '#EDF1FF' : 'rgba(109, 95, 143, 0.7)',
	backdropFilter: isSunTheme ? 'blur(1px)' : 'blur(5px)',
	borderRadius: 32,
	boxShadow: isSunTheme 
		? '0 20px 60px rgba(0, 0, 0, 0.15)' 
		: '0 20px 60px rgba(77, 208, 255, 0.25)',
	border: isSunTheme ? '2px solid #3B82F6' : 'none',
	minWidth: 500,
	maxWidth: 700,
	margin: '0 auto',
	padding: 0,
});

const getIconContainerStyle = (isSunTheme) => ({
	display: 'flex',
	justifyContent: 'center',
	marginBottom: '2rem',
});

const getIconStyle = (isSunTheme) => ({
	fontSize: '100px',
	color: isSunTheme ? '#10b981' : '#4ade80',
	filter: isSunTheme 
		? 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))' 
		: 'drop-shadow(0 0 30px rgba(74, 222, 128, 0.5))',
});

const getTitleStyle = (isSunTheme) => ({
	fontSize: '36px',
	fontWeight: 700,
	color: isSunTheme ? '#3b82f6' : '#fff',
	textAlign: 'center',
	marginBottom: '1.5rem',
	textShadow: isSunTheme ? 'none' : '0 0 10px rgba(77, 208, 255, 0.5)',
});

const getMessageStyle = (isSunTheme) => ({
	fontSize: '18px',
	fontWeight: 400,
	color: isSunTheme ? '#374151' : '#e5e7eb',
	textAlign: 'center',
	marginBottom: '2rem',
	lineHeight: '1.6',
});

const getInfoBoxStyle = (isSunTheme) => ({
	background: isSunTheme 
		? 'rgba(59, 130, 246, 0.1)' 
		: 'rgba(77, 208, 255, 0.1)',
	border: isSunTheme 
		? '1px solid rgba(59, 130, 246, 0.3)' 
		: '1px solid rgba(77, 208, 255, 0.3)',
	borderRadius: '16px',
	padding: '1.5rem',
	marginBottom: '1rem',
});

const getInfoTextStyle = (isSunTheme) => ({
	fontSize: '16px',
	fontWeight: 500,
	color: isSunTheme ? '#3b82f6' : '#7dd3fc',
	textAlign: 'center',
	margin: 0,
	lineHeight: '1.5',
});

const getBackButtonStyle = (isSunTheme) => ({
	background: isSunTheme 
		? 'linear-gradient(135deg, #FFFFFF 10%, #DFEDFF 34%, #C3DEFE 66%, #9CC8FE 100%)' 
		: 'linear-gradient(135deg, #D9D9D9 0%, #CAC0E3 42%, #BAA5EE 66%, #AA8BF9 100%)',
	border: 'none',
	color: 'black',
	fontWeight: 600,
	fontSize: '20px',
	padding: '14px 32px',
	width: '90%',
	borderRadius: '12px',
	boxShadow: isSunTheme 
		? '0 8px 25px rgba(139, 176, 249, 0.3)' 
		: '0 8px 25px rgba(170, 139, 249, 0.3)',
	transition: 'all 0.3s ease',
	cursor: 'pointer',
});

