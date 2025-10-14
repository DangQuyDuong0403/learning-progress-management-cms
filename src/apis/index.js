import axios from 'axios';
import authApi from './backend/auth';
import { isTokenExpiringSoon } from '../utils/jwtUtils';

// Tạo instance mặc định cho axios
const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL,
	timeout: 30000, // Tăng lên 30 giây để xử lý API chậm
	// Không set headers mặc định, chỉ gửi token khi cần
});


// Interceptor cho request — tự động thêm accessToken nếu có
axiosClient.interceptors.request.use(
	(config) => {
		const accessToken = localStorage.getItem('accessToken');
		// Kiểm tra accessToken hợp lệ (không phải "undefined" hoặc "null")
		if (accessToken && accessToken !== 'undefined' && accessToken !== 'null' && accessToken.trim() !== '') {
			// Kiểm tra nếu token sắp hết hạn (trong 5 phút)
			if (isTokenExpiringSoon(accessToken, 5)) {
				console.warn('⚠️ AccessToken is expiring soon, will refresh on next 401 response');
			}
			
			config.headers.Authorization = `Bearer ${accessToken}`;
		} else {
			console.warn('Invalid accessToken detected:', accessToken);
		}
		
		return config;
	},
	(error) => Promise.reject(error)
);

// Biến để tránh vòng lặp vô hạn khi refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach(prom => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	
	failedQueue = [];
};

// Interceptor cho response — xử lý lỗi tập trung
axiosClient.interceptors.response.use(
	(response) => {

		return response.data; // chỉ trả data ra cho gọn
	},
	async (error) => {
		const originalRequest = error.config;
		
		// Log error details for debugging
		console.log('🚨 API Error:', {
			status: error.response?.status,
			url: originalRequest.url,
			method: originalRequest.method,
			hasRetry: originalRequest._retry
		});
		
		if (error.response?.status === 401 && !originalRequest._retry) {
			console.log('🔐 401 Unauthorized - attempting token refresh');
			
			if (isRefreshing) {
				console.log('⏳ Token refresh already in progress, queuing request');
				// Nếu đang refresh token, thêm request vào queue
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(accessToken => {
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					return axiosClient(originalRequest);
				}).catch(err => {
					return Promise.reject(err);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshTokenValue = localStorage.getItem('refreshToken');
			
			if (refreshTokenValue) {
				try {
					console.log('🔄 Attempting to refresh token...');
					const response = await authApi.refreshToken(refreshTokenValue);
					console.log('✅ Token refresh successful:', response);
					
					const { accessToken, refreshToken: newRefreshToken } = response;
					
					// Cập nhật cả accessToken và refreshToken mới
					localStorage.setItem('accessToken', accessToken);
					if (newRefreshToken) {
						localStorage.setItem('refreshToken', newRefreshToken);
						console.log('🔄 Updated refreshToken in localStorage');
					}
					
					// Cập nhật header cho request gốc
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					
					// Xử lý queue với accessToken mới
					processQueue(null, accessToken);
					
					console.log('🔄 Retrying original request with new accessToken');
					// Retry request gốc
					return axiosClient(originalRequest);
				} catch (refreshError) {
					console.error('❌ Token refresh failed:', refreshError);
					// Refresh token không hợp lệ, đăng xuất
					processQueue(refreshError, null);
					localStorage.removeItem('accessToken');
					localStorage.removeItem('user');
					localStorage.removeItem('refreshToken');
					// window.location.href = '/choose-login'; // Tạm thời disable
					return Promise.reject(refreshError);
				} finally {
					isRefreshing = false;
				}
			} else {
				console.log('❌ No refresh token found, logging out');
				// Không có refresh token, đăng xuất
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');
				localStorage.removeItem('refreshToken');
				// window.location.href = '/choose-login'; // Tạm thời disable
				return Promise.reject(error);
			}
		}

		return Promise.reject(error);
	}
);

export default axiosClient;
