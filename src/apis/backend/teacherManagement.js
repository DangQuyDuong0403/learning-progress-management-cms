import axiosClient from '../index.js';

const teacherManagementApi = {
	// Lấy danh sách teachers với phân trang, search, filter và sort
	getTeachers: (params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text) queryParams.append('text', params.text);
		if (params.status && params.status.length > 0) {
			params.status.forEach(status => queryParams.append('status', status));
		}
		if (params.roleName && params.roleName.length > 0) {
			params.roleName.forEach(role => queryParams.append('roleName', role));
		}
		if (params.sortBy) queryParams.append('sortBy', params.sortBy);
		if (params.sortDir) queryParams.append('sortDir', params.sortDir);

		const url = `/user/teachers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetTeachers API - URL:', url);
		console.log('GetTeachers API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật trạng thái teacher (ACTIVE/INACTIVE)
	updateTeacherStatus: (userId, status) => {
		const url = `/user/teachers/${userId}/status?status=${status}`;
		console.log('UpdateTeacherStatus API - URL:', url);
		console.log('UpdateTeacherStatus API - Params:', { userId, status });
		
		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy profile của một teacher theo ID
	getTeacherProfile: (userId) => {
		const url = `/user/profile/${userId}`;
		console.log('GetTeacherProfile API - URL:', url);
		console.log('GetTeacherProfile API - Params:', { userId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo teacher mới
	createTeacher: (teacherData) => {
		const url = `/user/teachers`;
		console.log('CreateTeacher API - URL:', url);
		console.log('CreateTeacher API - Data:', JSON.stringify(teacherData, null, 2));
		
		return axiosClient.post(url, teacherData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('CreateTeacher API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Cập nhật profile của teacher
	updateTeacherProfile: (userId, teacherData) => {
		const url = `/user/teachers/${userId}`;
		console.log('UpdateTeacherProfile API - URL:', url);
		console.log('UpdateTeacherProfile API - Data:', JSON.stringify(teacherData, null, 2));
		
		return axiosClient.put(url, teacherData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('UpdateTeacherProfile API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},
};

export default teacherManagementApi;
