import axiosClient from '../index.js';

const studentManagementApi = {
	// Lấy danh sách students với phân trang, search, filter và sort
	getStudents: (params) => {
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

		const url = `/user/students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetStudents API - URL:', url);
		console.log('GetStudents API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật trạng thái student (ACTIVE/INACTIVE)
	updateStudentStatus: (userId, status) => {
		const url = `/user/students/${userId}/status?status=${status}`;
		console.log('UpdateStudentStatus API - URL:', url);
		console.log('UpdateStudentStatus API - Params:', { userId, status });
		
		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy profile của một student theo ID
	getStudentProfile: (userId) => {
		const url = `/user/profile/${userId}`;
		console.log('GetStudentProfile API - URL:', url);
		console.log('GetStudentProfile API - Params:', { userId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo student mới
	createStudent: (studentData) => {
		const url = `/user/students`;
		console.log('CreateStudent API - URL:', url);
		console.log('CreateStudent API - Data:', JSON.stringify(studentData, null, 2));
		
		return axiosClient.post(url, studentData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('CreateStudent API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Cập nhật profile của student
	updateStudentProfile: (userId, studentData) => {
		const url = `/user/students/${userId}`;
		console.log('UpdateStudentProfile API - URL:', url);
		console.log('UpdateStudentProfile API - Data:', JSON.stringify(studentData, null, 2));
		
		return axiosClient.put(url, studentData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('UpdateStudentProfile API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Download student import template
	downloadStudentTemplate: () => {
		const url = `/user/students/download-template`;
		console.log('DownloadStudentTemplate API - URL:', url);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('DownloadStudentTemplate API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},
};

export default studentManagementApi;
