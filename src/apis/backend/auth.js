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
			 domain: process.env.REACT_APP_DOMAIN,
			//domain:'http://localhost:3000',
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

	// Cập nhật email - sử dụng API change-email
	updateEmail: (data) => {
		const accessToken = localStorage.getItem('accessToken');
		const userId = getUserIdFromToken(accessToken);
		
		if (!userId) {
			return Promise.reject(new Error('Unable to extract user ID from accessToken'));
		}
		
		// Chuẩn bị request body theo API documentation
		const requestBody = {
			newEmail: data.email,
			domain: process.env.REACT_APP_DOMAIN,
			// domain:'http://localhost:3000',
			path: 'confirm-email-change'
		};
		
		const url = `/user/change-email?userId=${userId}`;
		console.log('UpdateEmail API - URL:', url);
		console.log('UpdateEmail API - UserId:', userId);
		console.log('UpdateEmail API - Request Body:', requestBody);
		
		return axiosClient.post(url, requestBody, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Cập nhật avatar
	updateAvatar: (file) => {
		const accessToken = localStorage.getItem('accessToken');
		const userId = getUserIdFromToken(accessToken);
		
		if (!userId) {
			return Promise.reject(new Error('Unable to extract user ID from accessToken'));
		}
		
		const formData = new FormData();
		formData.append('file', file);
		
		const url = `/user/profile/${userId}/avatar`;
		console.log('UpdateAvatar API - URL:', url);
		console.log('UpdateAvatar API - UserId:', userId);
		console.log('UpdateAvatar API - File:', file);
		
		return axiosClient.patch(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				'accept': '*/*',
			}
		});
	},

	// Thay đổi email của user bất kỳ (cho admin/manager)
	changeUserEmail: (userId, data) => {
		// Chuẩn bị request body theo API documentation
		const requestBody = {
			newEmail: data.email,
			domain: process.env.REACT_APP_DOMAIN,
			//domain:'http://localhost:3000',
			path: 'confirm-email-change'
		};
		
		const url = `/user/change-email?userId=${userId}`;
		console.log('ChangeUserEmail API - URL:', url);
		console.log('ChangeUserEmail API - UserId:', userId);
		console.log('ChangeUserEmail API - Request Body:', requestBody);
		
		return axiosClient.post(url, requestBody, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Xác nhận thay đổi email
	confirmEmailChange: (token) => {
		
		const url = `/user/confirm-email-change?token=${token}`;
		
		// Sử dụng axios trực tiếp để tránh interceptor tự động thêm Authorization header
		const baseURL = process.env.REACT_APP_API_URL;
		
		return axios.get(`${baseURL}${url}`, {
			headers: {
				'accept': '*/*',
			}
		}).then(response => {
			console.log('ConfirmEmailChange API - Response:', response);
			return response;
		}).catch(error => {
			console.error('ConfirmEmailChange API - Error:', error);
			console.error('ConfirmEmailChange API - Error Response:', error.response);
			throw error;
		});
	},

};

export default authApi;
