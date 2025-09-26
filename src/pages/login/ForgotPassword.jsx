import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import './Login.css'; // import Login CSS instead

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState(null);
	const navigate = useNavigate();

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
    navigate("/login-student");
  };

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
											Forgot password
										</h5>
										<p className='text-center kids-subtitle mb-4'>
											Enter email to receive OTP to reset password
										</p>
										<form onSubmit={handleSubmit}>
											<div className='mb-3'>
												<label htmlFor='forgotEmail' className='form-label'>
													Email
												</label>
												<Input
													id='forgotEmail'
													type='email'
													placeholder='Email'
													value={email}
													onChange={(e) => setEmail(e.target.value)}
													prefix={<MailOutlined />}
													size='large'
													style={{ borderRadius: '8px' }}
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

											<div className='text-center mb-4'>
												<button
													type='submit'
													className='btn btn-space w-90 mb-3 rounded-3'
													style={{ color: 'white' }}>
													Submit
												</button>
											</div>

											<div className='text-center'>
												<a
													className='fw-bold forgot-password'
													onClick={handleBackToLogin}
													style={{ cursor: 'pointer' }}>
													Return to sign in
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
