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
		return axiosClient.post('/auth/request-reset-password-email', requestBody, {
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
		
		return axios.post(`${baseURL}/auth/reset-password-by-token`, requestBody, {
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
			path: '/confirm-email-change'
		};
		
		const url = `/user/change-email?userId=${userId}`;
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
			// domain:'http://localhost:3000',
			path: '/confirm-email-change'
		};
		
		const url = `/user/change-email?userId=${userId}`;
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
			return response;
		}).catch(error => {
			console.error('ConfirmEmailChange API - Error:', error);
			console.error('ConfirmEmailChange API - Error Response:', error.response);
			throw error;
		});
	},

	// Request password reset by teacher (for student to request)
	requestPasswordByTeacher: (username) => {
		const requestBody = {
			userName: username
		};
		return axiosClient.post('/auth/request-reset-password-teacher', requestBody, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Reset password by teacher (for teacher to actually reset)
	resetPasswordByTeacher: (username) => {
		return axiosClient.post(`/auth/reset-password-by-teacher?username=${username}`, {}, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

};

export default authApi;
