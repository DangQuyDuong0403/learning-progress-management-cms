import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../redux/auth';
import { toast } from 'react-toastify';
import { Input, Modal, Radio } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Login.css';

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [forgotVisible, setForgotVisible] = useState(false);
	const [forgotMethod, setForgotMethod] = useState('email');
	const dispatch = useDispatch();
	const navigate = useNavigate();

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
			toast.error('Sai tài khoản hoặc mật khẩu!');
		}
	};

	const handleForgotOk = () => {
		setForgotVisible(false);
		navigate(`/forgot-password-${forgotMethod}`);
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
								<div
									className='card-body'
									style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
									<div className='card-body'>
										{/* <div className='text-nowrap logo-img text-center d-block py-3 w-100'>
											<img src='img/logo.png' alt='' />
										</div> */}
										<h5 className='text-center kids-heading mb-1'>
											Child astronaut
										</h5>
										<p className='text-center kids-subtitle mb-4'>
											Let's fly into the learning space!
										</p>
										<form onSubmit={handleSubmit}>
											<div className='mb-3'>
												<label htmlFor='loginUsername' className='form-label'>
													Username
												</label>
												<Input
													id='loginUsername'
													placeholder='Username'
													value={username}
													onChange={(e) => setUsername(e.target.value)}
													prefix={<UserOutlined />}
													size='large'
													style={{ borderRadius: '8px' }}
												/>
											</div>
											<div className='mb-4'>
												<label htmlFor='loginPassword' className='form-label'>
													Password
												</label>
												<Input.Password
													id='loginPassword'
													placeholder='Password'
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													prefix={<LockOutlined />}
													size='large'
													style={{ borderRadius: '8px' }}
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
													/>
													<label
														className='form-check-label text-dark'
														htmlFor='flexCheckChecked'>
														Remember me
													</label>
												</div>
												<span
													className='fw-bold forgot-password'
													style={{ cursor: 'pointer', color: '#1677ff' }}
													onClick={() => setForgotVisible(true)}>
													Forgot Password?
												</span>
											</div>
											<div className='text-center'>
												<button
													type='submit'
													className='btn btn-space w-90 mb-4 rounded-3'
													style={{ color: 'white' }}>
													Sign in
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
										background:
											'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)',
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
									color: '#666',
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
									borderTop: '1px solid #f0f0f0',
								}}>
								<p
									style={{
										margin: 0,
										color: '#999',
										fontSize: '12px',
									}}>
									Choose the method you can access most easily
								</p>
							</div>
						</div>
					</Modal>
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
