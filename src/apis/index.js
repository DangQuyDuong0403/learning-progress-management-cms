import axios from 'axios';

// Tạo instance mặc định cho axios
const axiosClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL, // URL backend
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 10000, // Giới hạn 10 giây
});


// Interceptor cho request — tự động thêm token nếu có
axiosClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Interceptor cho response — xử lý lỗi tập trung
axiosClient.interceptors.response.use(
	(response) => response.data, // chỉ trả data ra cho gọn
	(error) => {
		if (error.response) {
			console.error('API Error:', error.response);
			// Ví dụ: token hết hạn → logout
			if (error.response.status === 401) {
				localStorage.removeItem('token');
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	}
);

export default axiosClient;
