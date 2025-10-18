import axios from 'axios';
import authApi from './backend/auth';
import { isTokenExpiringSoon, decodeJWT, getRoleFromToken } from '../utils/jwtUtils';
import { spaceToast } from '../component/SpaceToastify';

// Tạo instance mặc định cho axios
const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL,
	timeout: 30000, // Tăng lên 30 giây để xử lý API chậm
	// Không set headers mặc định, chỉ gửi token khi cần
});

// Biến để tránh vòng lặp vô hạn khi refresh token
let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý queue các request bị fail
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

// Interceptor cho request — tự động thêm accessToken và kiểm tra bảo mật
axiosClient.interceptors.request.use(
	(config) => {
		const accessToken = localStorage.getItem('accessToken');
		
		// Kiểm tra accessToken hợp lệ (không phải "undefined" hoặc "null")
		if (accessToken && accessToken !== 'undefined' && accessToken !== 'null' && accessToken.trim() !== '') {
			// Kiểm tra nếu token sắp hết hạn (trong 5 phút)
			if (isTokenExpiringSoon(accessToken, 5)) {
				console.warn('⚠️ AccessToken is expiring soon, will refresh on next 401 response');
			}
			
			// Kiểm tra bảo mật cho accounts phải đổi mật khẩu
			const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
			if (mustChangePassword) {
				const userRole = getRoleFromToken(accessToken);
				
				// Ngăn chặn API calls từ accounts phải đổi mật khẩu (trừ các API liên quan đến reset password)
				const allowedEndpoints = [
					'/auth/change-password',
					'/auth/confirm-reset-password',
					'/auth/logout',
					'/auth/refresh-token'
				];
				
				const isAllowedEndpoint = allowedEndpoints.some(endpoint => 
					config.url?.includes(endpoint)
				);
				
				if (!isAllowedEndpoint) {
					console.warn('🚨 SECURITY ALERT: Account must change password attempted unauthorized API call');
					spaceToast.error('You must reset your password before accessing this feature');
					
					// Clear tokens và redirect
					localStorage.removeItem('accessToken');
					localStorage.removeItem('refreshToken');
					localStorage.removeItem('user');
					localStorage.removeItem('mustChangePassword');
					
					// Redirect based on role
					if (userRole === 'STUDENT') {
						window.location.href = '/change-password';
					} else {
						window.location.href = '/reset-password';
					}
					
					return Promise.reject(new Error('Account must change password - unauthorized access'));
				}
			}
			
			config.headers.Authorization = `Bearer ${accessToken}`;
		} else {
			console.warn('Invalid accessToken detected:', accessToken);
		}
		
		return config;
	},
	(error) => Promise.reject(error)
);

// Interceptor cho response — xử lý refresh token và bảo mật
axiosClient.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// Xử lý lỗi 401 (Unauthorized)
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

			try {
				const refreshToken = localStorage.getItem('refreshToken');
				
				if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
					throw new Error('No refresh token available');
				}

				const response = await authApi.refreshToken(refreshToken);
				const { accessToken } = response.data;

				// Cập nhật token mới
				localStorage.setItem('accessToken', accessToken);
				
				// Kiểm tra bảo mật cho token mới
				const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
				
				// Nếu account vẫn phải đổi mật khẩu, ngăn chặn tiếp tục
				if (mustChangePassword) {
					console.warn('🚨 SECURITY ALERT: Refreshed token but still must change password');
					localStorage.removeItem('accessToken');
					localStorage.removeItem('refreshToken');
					localStorage.removeItem('user');
					localStorage.removeItem('mustChangePassword');
					
					const userRole = getRoleFromToken(accessToken);
					if (userRole === 'STUDENT') {
						window.location.href = '/change-password';
					} else {
						window.location.href = '/reset-password';
					}
					
					throw new Error('Account still must change password');
				}

				// Cập nhật header cho request gốc
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				
				// Xử lý queue
				processQueue(null, accessToken);
				
				return axiosClient(originalRequest);
			} catch (refreshError) {
				console.error('Token refresh failed:', refreshError);
				
				// Xóa tất cả tokens
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				localStorage.removeItem('user');
				localStorage.removeItem('mustChangePassword');
				
				// Xử lý queue với error
				processQueue(refreshError, null);
				
				// Chỉ redirect nếu không phải đang ở trang login
				if (!window.location.pathname.includes('/login')) {
					window.location.href = '/choose-login';
				}
				
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// Xử lý các lỗi khác
		if (error.response?.status === 403) {
			console.warn('🚨 FORBIDDEN: User does not have permission for this action');
			spaceToast.error('You do not have permission to perform this action');
		}

		return Promise.reject(error);
	}
);

export default axiosClient;
