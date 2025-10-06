import axiosClient from '../index.js';

const authApi = {
	// Đăng nhập
	loginForTeacher: (data) => axiosClient.post('/auth/login/teacher', data),
    loginForStudent: (data) => axiosClient.post('/auth/login/student', data),

	// Quên mật khẩu
	forgotPassword: (data) => axiosClient.post('/auth/reset-password', data),

	// Làm mới Access Token
	refreshToken: (refreshToken) => axiosClient.post(`/auth/refresh-token?refreshToken=${refreshToken}`),

	// Đăng xuất
	logout: (refreshToken) => axiosClient.post(`/auth/logout?refreshToken=${refreshToken}`),

	// Lấy thông tin user hiện tại
	// getProfile: () => axiosClient.get('/auth/me'),
};

export default authApi;
