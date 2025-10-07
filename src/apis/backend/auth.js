import axiosClient from '../index.js';

const authApi = {
	// Đăng nhập - sử dụng endpoint chung với 3 trường: username, password, loginRole
	login: (data) => axiosClient.post('/auth/login', data, {
		headers: {
			'Content-Type': 'application/json',
			'accept': '*/*',
		}
	}),

	// Quên mật khẩu
	forgotPassword: (data) => {
		const url = `/auth/reset-password?userName=${data.username}`;
		console.log('ForgotPassword API - URL:', url);
		console.log('ForgotPassword API - Data:', data);
		return axiosClient.post(url, {}, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Làm mới Access Token
	refreshToken: (refreshToken) => axiosClient.post(`/auth/refresh-token?refreshToken=${refreshToken}`),

	// Đăng xuất
	logout: (refreshToken) => axiosClient.post(`/auth/logout?refreshToken=${refreshToken}`),

	// Lấy thông tin user hiện tại
	getUserProfile: () => axiosClient.get('/user/profile'),

	// Đổi mật khẩu
	changePassword: (data) => axiosClient.post('/auth/change-password', data, {
		headers: {
			'Content-Type': 'application/json',
			'accept': '*/*',
		}
	}),
};

export default authApi;
