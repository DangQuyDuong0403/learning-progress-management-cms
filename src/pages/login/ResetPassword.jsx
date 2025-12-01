import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Button } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import ThemeToggleSwitch from '../../component/ThemeToggleSwitch';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeLayoutLogin from '../../component/ThemeLayoutLogin';
import { spaceToast } from '../../component/SpaceToastify';
import authApi from '../../apis/backend/auth';
import usePageTitle from '../../hooks/usePageTitle';
import './Login.css';

export default function ResetPassword() {
	const [formData, setFormData] = useState({
		newPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { isSunTheme } = useTheme();
	const { t } = useTranslation();
	
	// Set page title
	usePageTitle('Reset Password');

	// Lấy token từ URL params trước, nếu không có thì lấy từ localStorage
	const tokenFromParams = searchParams.get('token');
	const tokenFromStorage = localStorage.getItem('accessToken');
	const token = tokenFromParams || tokenFromStorage;

	// Kiểm tra token khi component mount
	useEffect(() => {
		if (!token) {
			spaceToast.error(t('resetPassword.invalidToken'));
			navigate('/choose-login');
		}
	}, [token, navigate, t]);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};



	const handleSubmit = async (e) => {
		e.preventDefault();

		setLoading(true);

		try {
			// Gọi API confirm reset password
			const response = await authApi.confirmResetPassword({
				token: token,
				newPassword: formData.newPassword
			});
			console.log('=== RESET PASSWORD RESPONSE ===');
			console.log('Full response:', response);
			console.log('Response data:', response.data);
			console.log('Response success:', response.data?.success);
			console.log('Response message:', response.data?.message);
			console.log('===============================');
			
			if (response.data?.success) {
				
				spaceToast.success(response.data.message);
				
				// Lưu selectedRole trước khi xóa localStorage
				const loginRole = localStorage.getItem('selectedRole') || localStorage.getItem('loginRole') || 'TEACHER';
				console.log('Saved role before cleanup:', loginRole);
				
				// Xác định redirect URL ngay lập tức
				let redirectUrl;
				if (loginRole === 'STUDENT') {
					redirectUrl = '/login-student';
					console.log('Redirecting to student login:', redirectUrl);
				} else if (loginRole === 'TEACHER') {
					redirectUrl = '/login-teacher';
					console.log('Redirecting to teacher login:', redirectUrl);
				} else {
					// Fallback cho các role khác hoặc không xác định
					redirectUrl = '/choose-login';
					console.log('Unknown role, redirecting to choose login:', redirectUrl);
				}
				
				// Delay để user thấy success message trước khi chuyển trang
				setTimeout(() => {
					// Force navigation bằng window.location.href để bypass React Router
					window.location.href = redirectUrl;
				}, 1500); // Delay 2 giây để user thấy success message
				
				// Sau đó mới cleanup localStorage và logout
				setTimeout(() => {
					// Gọi API logout để logout tất cả sessions trên backend (bỏ qua lỗi)
					try {
						const refreshToken = localStorage.getItem('refreshToken');
						if (refreshToken) {
							// Không await để tránh bị block bởi lỗi
							authApi.logout(refreshToken).then(() => {
								console.log('Successfully logged out all sessions');
							}).catch((logoutError) => {
								console.log('Logout API failed, but continuing:', logoutError);
							});
						}
					} catch (logoutError) {
						console.log('Logout API failed, but continuing with token cleanup:', logoutError);
					}
					
					// Xóa tất cả auth tokens để logout các tab khác trong cùng trình duyệt
					localStorage.removeItem('accessToken');
					localStorage.removeItem('refreshToken');
					localStorage.removeItem('user');
					localStorage.removeItem('mustChangePassword');
					localStorage.removeItem('mustUpdateProfile');
					
					console.log('Cleanup completed after navigation');
				}, 100); // Delay ngắn để đảm bảo navigation đã hoàn thành
			}
		} catch (error) {
			// Xử lý lỗi từ API - error object có cấu trúc trực tiếp
			const errorMessage = error.response.data.error;
			console.log('Final error message:', errorMessage);
			spaceToast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleBackToLogin = () => {
		navigate('/choose-login');
	};

	return (
		<ThemeLayoutLogin>
			<div className="main-content" style={{ paddingTop: 120, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
				{/* Theme Toggle - Top Right */}
				<div className={`login-theme-toggle-container ${isSunTheme ? 'sun-theme' : 'space-theme'}`} style={{ position: 'absolute', top: '20px', right: '20px' }}>
					{/* <ThemeToggleSwitch /> */}
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
                                                    required
                                                    style={getInputStyle(isSunTheme)}
                                                    styles={{
                                                        suffix: {
                                                            color: isSunTheme ? '#6b7280' : '#ffffff'
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

									<div className='text-center'>
											<button
												type='submit'
												className='btn w-90 mb-4 rounded-3'
												style={getSubmitButtonStyle(isSunTheme)}
												disabled={loading}>
												{loading ? t('common.loading') : t('resetPassword.changePassword')}
											</button>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ThemeLayoutLogin>
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
