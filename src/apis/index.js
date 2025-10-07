import axios from 'axios';
import authApi from './backend/auth';

// Tạo instance mặc định cho axios
const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL, // URL backend
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 60000, // Giới hạn 60 giây
});


// Interceptor cho request — tự động thêm token nếu có
axiosClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		console.log('Request interceptor - URL:', config.url);
		console.log('Request interceptor - Token exists:', !!token);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
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
	(response) => response.data, // chỉ trả data ra cho gọn
	async (error) => {
		const originalRequest = error.config;

		console.log('Interceptor - Error status:', error.response?.status);
		console.log('Interceptor - Error response:', error.response);
		
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// Nếu đang refresh token, thêm request vào queue
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(token => {
					originalRequest.headers.Authorization = `Bearer ${token}`;
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
					const response = await authApi.refreshToken(refreshTokenValue);
					const { accessToken } = response;
					
					// Cập nhật token mới
					localStorage.setItem('token', accessToken);
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					
					// Xử lý queue
					processQueue(null, accessToken);
					
					// Retry request gốc
					return axiosClient(originalRequest);
				} catch (refreshError) {
					// Refresh token không hợp lệ, đăng xuất
					console.log('Interceptor - Refresh token failed, redirecting to choose-login');
					processQueue(refreshError, null);
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					localStorage.removeItem('refreshToken');
					// window.location.href = '/choose-login'; // Tạm thời disable
					return Promise.reject(refreshError);
				} finally {
					isRefreshing = false;
				}
			} else {
				// Không có refresh token, đăng xuất
				console.log('Interceptor - No refresh token, redirecting to choose-login');
				localStorage.removeItem('token');
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
