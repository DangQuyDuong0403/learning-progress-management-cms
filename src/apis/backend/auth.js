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
			domain: "http://localhost:3000",
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
		const token = localStorage.getItem('token');
		const userId = getUserIdFromToken(token);
		
		if (!userId) {
			return Promise.reject(new Error('Unable to extract user ID from token'));
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

	// Đổi mật khẩu
	changePassword: (data) => {
		console.log('ChangePassword API - Request Body:', data);
		
		return axiosClient.post('/auth/change-password', data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

};

export default authApi;
