import axios from 'axios';
import authApi from './backend/auth';
import { isTokenExpiringSoon, getRoleFromToken } from '../utils/jwtUtils';
import { spaceToast } from '../component/SpaceToastify';
import store from '../redux/store';
import { logout } from '../redux/auth';

// Tạo instance mặc định cho axios
const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL || 'https://learning-progress-management-hndjatgmc3fva3gs.southeastasia-01.azurewebsites.net/learning-progress-management/api/v1',
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
		// Bỏ qua việc gắn Authorization cho endpoint refresh-token và login
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
				
				// Kiểm tra nếu lỗi do account bị inactive
				const refreshErrorMessage = refreshError.response?.data?.message || refreshError.response?.data?.error || refreshError.message || '';
				const refreshErrorData = refreshError.response?.data?.data || refreshError.response?.data || {};
				
				const isAccountInactiveFromRefresh = 
					(refreshErrorMessage && (
						refreshErrorMessage.toLowerCase().includes('inactive') ||
						refreshErrorMessage.toLowerCase().includes('account is disabled') ||
						refreshErrorMessage.toLowerCase().includes('account has been deactivated')
					)) ||
					(refreshErrorData.status && refreshErrorData.status.toUpperCase() === 'INACTIVE');

				if (isAccountInactiveFromRefresh) {
					console.warn('🚨 ACCOUNT INACTIVE: Refresh token failed due to inactive account');
					spaceToast.error('Your account has been deactivated. Please contact administrator.');
				}
				
				// Xóa tất cả tokens
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				localStorage.removeItem('user');
				localStorage.removeItem('mustChangePassword');
				localStorage.removeItem('mustUpdateProfile');
				
				// Dispatch logout action
				store.dispatch(logout());
				
				// Xử lý queue với error
				processQueue(refreshError, null);
				
				// Chỉ redirect nếu không phải đang ở trang login
				if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/choose-login')) {
					window.location.href = '/choose-login';
				}
				
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// Kiểm tra nếu tài khoản bị inactive
		const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
		const errorData = error.response?.data?.data || error.response?.data || {};
		const statusCode = error.response?.status;
		
		// Kiểm tra các trường hợp cho thấy tài khoản bị inactive:
		// 1. Error message chứa "inactive" hoặc "INACTIVE"
		// 2. Error data có status = "INACTIVE"
		// 3. 401/403 với message về account status
		const isAccountInactive = 
			(errorMessage && (
				errorMessage.toLowerCase().includes('inactive') ||
				errorMessage.toLowerCase().includes('account is disabled') ||
				errorMessage.toLowerCase().includes('account has been deactivated')
			)) ||
			(errorData.status && errorData.status.toUpperCase() === 'INACTIVE') ||
			((statusCode === 401 || statusCode === 403) && 
				errorMessage.toLowerCase().includes('account'));

		if (isAccountInactive) {
			console.warn('🚨 ACCOUNT INACTIVE: User account has been deactivated, logging out...');
			spaceToast.error('Your account has been deactivated. Please contact administrator.');
			
			// Clear all tokens and user data
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('user');
			localStorage.removeItem('mustChangePassword');
			localStorage.removeItem('mustUpdateProfile');
			
			// Dispatch logout action
			store.dispatch(logout());
			
			// Redirect to login page
			if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/choose-login')) {
				window.location.href = '/choose-login';
			}
			
			return Promise.reject(new Error('Account has been deactivated'));
		}

		// Xử lý các lỗi khác
		if (error.response?.status === 403) {
			console.warn('🚨 FORBIDDEN: User does not have permission for this action');
		}

		return Promise.reject(error);
	}
);

export default axiosClient;
