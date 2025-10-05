import axiosClient from '../index.js';

const authApi = {
	// Đăng nhập
	loginForTeacher: (data) => axiosClient.post('/auth/login/teacher', data),
    loginForStudent: (data) => axiosClient.post('/auth/login/student', data),


	// Lấy thông tin user hiện tại
	// getProfile: () => axiosClient.get('/auth/me'),

	// Đăng xuất (nếu backend có endpoint)
	// logout: () => axiosClient.post('/auth/logout'),
};

export default authApi;
