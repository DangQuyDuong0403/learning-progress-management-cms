import axiosClient from '../index.js';
import axios from 'axios';
import { getUserIdFromToken } from '../../utils/jwtUtils';

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
		const requestBody = {
			userName: data.username,
			// domain: process.env.REACT_APP_DOMAIN,
			domain:'http://localhost:3000/',
			path: "/reset-password"
		};
		console.log('ForgotPassword API - Request Body:', requestBody);
		return axiosClient.post('/auth/reset-password', requestBody, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Xác nhận reset mật khẩu
	confirmResetPassword: (data) => {
		const requestBody = {
			token: data.token,
			newPassword: data.newPassword
		};
		
		// Sử dụng axios trực tiếp để tránh interceptor tự động thêm Authorization header
		const baseURL = process.env.REACT_APP_API_URL;
		
		return axios.post(`${baseURL}/auth/confirm-reset-password`, requestBody, {
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
	getUserProfile: () => {
		const accessToken = localStorage.getItem('accessToken');
		const userId = getUserIdFromToken(accessToken);
		
		if (!userId) {
			return Promise.reject(new Error('Unable to extract user ID from accessToken'));
		}
		
		const url = `/user/profile/${userId}`;
		console.log('GetUserProfile API - URL:', url);
		console.log('GetUserProfile API - UserId:', userId);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật thông tin profile
	updateProfile: (data) => {
		const accessToken = localStorage.getItem('accessToken');
		const userId = getUserIdFromToken(accessToken);
		
		if (!userId) {
			return Promise.reject(new Error('Unable to extract user ID from accessToken'));
		}
		
		const url = `/user/profile/${userId}`;
		console.log('UpdateProfile API - URL:', url);
		console.log('UpdateProfile API - UserId:', userId);
		console.log('UpdateProfile API - Request Body:', data);
		
		return axiosClient.put(url, data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Cập nhật email
	updateEmail: (data) => {
		const accessToken = localStorage.getItem('accessToken');
		const userId = getUserIdFromToken(accessToken);
		
		if (!userId) {
			return Promise.reject(new Error('Unable to extract user ID from accessToken'));
		}
		
		const url = `/user/profile/${userId}/email`;
		console.log('UpdateEmail API - URL:', url);
		console.log('UpdateEmail API - UserId:', userId);
		console.log('UpdateEmail API - Request Body:', data);
		
		return axiosClient.put(url, data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

};

export default authApi;
