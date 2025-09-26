import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import './Login.css';

export default function ResetPassword() {
	const [formData, setFormData] = useState({
		newPassword: '',
		confirmPassword: '',
	});
	const [message, setMessage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

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
		<div className='kids-space'>
			<div
				className='page-wrapper'
				id='main-wrapper'
				data-layout='vertical'
				data-navbarbg='skin6'
				data-sidebartype='full'
				data-sidebar-position='fixed'
				data-header-position='fixed'>
				<div className='position-relative overflow-hidden min-vh-100 d-flex align-items-center justify-content-center'>
					<div className='d-flex align-items-center justify-content-center w-100'>
						<div className='row justify-content-center w-100'>
							<div
								className='card mb-0 kids-card'
								style={{
									minWidth: 420,
									maxWidth: 520,
									margin: '0 auto',
									padding: 0,
									borderRadius: 32,
									boxShadow: '0 20px 60px rgba(30, 20, 90, 0.25)',
								}}>
								<div className='card mb-0 kids-card'>
									<div
										className='card-body'
										style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
										<h5 className='text-center kids-heading mb-1'>
											Reset password
										</h5>
										<p className='text-center kids-subtitle mb-4'>
											Enter your new password
										</p>
										<form onSubmit={handleSubmit}>
											<div className='mb-3'>
												<label htmlFor='newPassword' className='form-label'>
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
													style={{ borderRadius: '8px' }}
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
												<label htmlFor='confirmPassword' className='form-label'>
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
													style={{ borderRadius: '8px' }}
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

											<div className='text-center mb-4'>
												<button
													type='submit'
													className='btn btn-space w-90 mb-3 rounded-3'
													style={{ color: 'white' }}
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
													style={{ cursor: 'pointer' }}>
													Return to login
												</a>
											</div>
										</form>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Background elements from Login */}
					<img className='rocket-bg' src='img/astro.png' alt='rocket' />
					<img className='planet-1' src='img/planet-1.png' alt='plant-1' />
					<img className='planet-2' src='img/planet-2.png' alt='plant-2' />
					<img className='planet-3' src='img/planet-3.png' alt='plant-3' />
					<img className='planet-4' src='img/planet-4.png' alt='plant-4' />
					<img className='planet-5' src='img/planet-5.png' alt='plant-5' />
					<img className='planet-6' src='img/planet-6.png' alt='plant-6' />
					<svg
						className='planet'
						viewBox='0 0 120 120'
						xmlns='http://www.w3.org/2000/svg'
						aria-hidden='true'>
						<defs>
							<linearGradient id='pGrad' x1='0' x2='1' y1='0' y2='1'>
								<stop offset='0%' stopColor='#ff7ad9' />
								<stop offset='100%' stopColor='#ffd36e' />
							</linearGradient>
						</defs>
						<circle cx='60' cy='60' r='34' fill='url(#pGrad)' />
						<ellipse
							cx='60'
							cy='70'
							rx='54'
							ry='14'
							fill='none'
							stroke='#ffe8a3'
							strokeWidth='6'
						/>
						<ellipse
							cx='60'
							cy='70'
							rx='54'
							ry='14'
							fill='none'
							stroke='#ffb3e6'
							strokeWidth='3'
						/>
					</svg>

					<div className='twinkle' aria-hidden='true'>
						<span className='star star-1'></span>
						<span className='star star-2'></span>
						<span className='star star-3'></span>
						<span className='star star-4'></span>
						<span className='star star-5'></span>
						<span className='star star-6'></span>
						<span className='star star-7'></span>
						<span className='star star-8'></span>
						<span className='star star-9'></span>
						<span className='star star-10'></span>
						<span className='star star-11'></span>
						<span className='star star-12'></span>
						<span className='star star-13'></span>
						<span className='star star-14'></span>
						<span className='star star-15'></span>
						<span className='star star-16'></span>
						<span className='star star-17'></span>
						<span className='star star-18'></span>
					</div>

					<svg
						className='moon'
						viewBox='0 0 100 100'
						xmlns='http://www.w3.org/2000/svg'
						aria-hidden='true'>
						<defs>
							<linearGradient id='mGrad' x1='0' x2='1' y1='0' y2='1'>
								<stop offset='0%' stopColor='#d9e6ff' />
								<stop offset='100%' stopColor='#ffffff' />
							</linearGradient>
						</defs>
						<circle
							cx='50'
							cy='50'
							r='30'
							fill='url(#mGrad)'
							stroke='#e5e8ff'
						/>
						<circle cx='62' cy='40' r='5' fill='#ccd6ff' />
						<circle cx='42' cy='58' r='6' fill='#ccd6ff' />
						<circle cx='56' cy='64' r='3' fill='#ccd6ff' />
					</svg>
				</div>
			</div>
		</div>
	);
}
