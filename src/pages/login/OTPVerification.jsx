import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../component/LanguageToggle';
import './Login.css';

export default function OTPVerification() {
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const [message, setMessage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const { i18n, t } = useTranslation();

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
		<div className='kids-space'>
			{/* Language Toggle - Top Right */}
			<div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
				<LanguageToggle />
			</div>
			
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
											OTP verification
										</h5>
										<p className='text-center kids-subtitle mb-4'>
											Enter the 6-digit OTP code sent to your email
										</p>
										<form onSubmit={handleSubmit}>
											<div className='mb-4'>
												<label className='form-label text-center d-block'>
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
															style={{
																width: '45px',
																height: '45px',
																fontSize: '1.2rem',
																fontWeight: 'bold',
																border: '2px solid #e4e8ff',
																borderRadius: '8px',
															}}
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
													className='btn btn-space w-90 mb-3 rounded-3'
													style={{ color: 'white' }}
													disabled={isLoading}>
													{isLoading ? 'In progressing...' : 'Verify OTP'}
												</button>
											</div>

											<div className='text-center mb-3'>
												<a
													className='fw-bold forgot-password'
													onClick={handleResendOtp}
													style={{ cursor: 'pointer' }}>
													Resend OTP code
												</a>
											</div>

											<div className='text-center'>
												<a
													className='fw-bold forgot-password'
													onClick={handleBackToForgotPassword}
													style={{ cursor: 'pointer' }}>
													{t('common.back')} to {t('login.forgotPassword')}
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
