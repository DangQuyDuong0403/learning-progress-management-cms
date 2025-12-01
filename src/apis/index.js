import axios from 'axios';
import authApi from './backend/auth';
import { isTokenExpiringSoon } from '../utils/jwtUtils';

// Tạo instance mặc định cho axios
const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL,
	timeout: 200000,
	// Không set headers mặc định, chỉ gửi token khi cần
});


// Interceptor cho request — tự động thêm accessToken nếu có
axiosClient.interceptors.request.use(
	(config) => {
		// Không đính kèm Authorization cho các endpoint không cần token (đặc biệt là refresh-token)
		const url = config.url || '';
		if (url.includes('/auth/refresh-token') || url.includes('/auth/login')) {
			if (config.headers && config.headers.Authorization) {
				delete config.headers.Authorization;
			}
			return config;
		}

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
let refreshPromise = null;
let failedQueue = [];

// Hàm để reset trạng thái refresh token
const resetRefreshState = () => {
	isRefreshing = false;
	refreshPromise = null;
	failedQueue = [];
	try {
		sessionStorage.removeItem('auth_refresh_in_progress');
	} catch (err) {
		console.warn('Unable to clear refresh marker:', err);
	}
};

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
		// For blob responses (like file downloads), return the full response
		if (response.config.responseType === 'blob') {
			return response;
		}
		
		return response.data; // chỉ trả data ra cho gọn
	},
	async (error) => {
		const originalRequest = error.config;
		
	
		
		// Reset refresh state nếu có lỗi không phải 401 hoặc đã retry
		if (error.response?.status !== 401 || originalRequest._retry) {
			resetRefreshState();
		}
		
		// Reset refresh state nếu có lỗi network hoặc timeout
		if (!error.response) {
			resetRefreshState();
		}
		
		if (error.response?.status === 401 && !originalRequest._retry) {
			
			// Kiểm tra nếu đây là request login hoặc refresh token thì không cần refresh token
			if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
				// Nếu là refresh token request mà trả về 401, có nghĩa là refresh token không hợp lệ
				if (originalRequest.url?.includes('/auth/refresh-token')) {
					localStorage.removeItem('accessToken');
					localStorage.removeItem('user');
					localStorage.removeItem('refreshToken');
					// Chỉ redirect nếu không phải đang ở trang login
					if (!window.location.pathname.includes('/login')) {
						window.location.href = '/choose-login';
					}
				}
				return Promise.reject(error);
			}
			
		if (isRefreshing) {
			// Nếu đang refresh token, thêm request vào queue
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			}).then(accessToken => {
				originalRequest._retry = true;
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return axiosClient(originalRequest);
			}).catch(err => {
				return Promise.reject(err);
			});
			}

			originalRequest._retry = true;
			isRefreshing = true;
			try {
				sessionStorage.setItem('auth_refresh_in_progress', '1');
			} catch (markerError) {
				console.warn('Unable to set refresh marker:', markerError);
			}

			const refreshTokenValue = localStorage.getItem('refreshToken');
			
			if (refreshTokenValue) {
				try {
					if (!refreshPromise) {
						refreshPromise = authApi.refreshToken(refreshTokenValue);
					}

					const response = await refreshPromise;
					
					const payload = response?.data ?? response;
					const tokenBundle = payload?.data ?? payload;
					const { accessToken, refreshToken: newRefreshToken } = tokenBundle || {};
					
					if (!accessToken) {
						throw new Error('Refresh token response missing accessToken');
					}
					
					// Cập nhật cả accessToken và refreshToken mới
					localStorage.setItem('accessToken', accessToken);
					if (newRefreshToken) {
						localStorage.setItem('refreshToken', newRefreshToken);
					}
					
					// Cleanup token thừa nếu có
					if (localStorage.getItem('token')) {
						localStorage.removeItem('token');
					}
					
					// Cập nhật header cho request gốc
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					
					// Xử lý queue với accessToken mới
					processQueue(null, accessToken);
					
					// Retry request gốc
					return axiosClient(originalRequest);
				} catch (refreshError) {
					console.error('❌ Token refresh failed:', refreshError);
					// Refresh token không hợp lệ, đăng xuất
					processQueue(refreshError, null);
					localStorage.removeItem('accessToken');
					localStorage.removeItem('user');
					localStorage.removeItem('refreshToken');
					// Chỉ redirect nếu không phải đang ở trang login
					if (!window.location.pathname.includes('/login')) {
						window.location.href = '/choose-login';
					}
					return Promise.reject(refreshError);
				} finally {
					// Reset trạng thái để tránh stuck
					resetRefreshState();
				}
			} else {
				// Không có refresh token, đăng xuất
				processQueue(error, null); // Xử lý queue với lỗi gốc
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');
				localStorage.removeItem('refreshToken');
				// Reset trạng thái để tránh stuck
				resetRefreshState();
				// Chỉ redirect nếu không phải đang ở trang login
				if (!window.location.pathname.includes('/login')) {
					window.location.href = '/choose-login';
				}
				return Promise.reject(error);
			}
		}

		return Promise.reject(error);
	}
);

export default axiosClient;
