import axiosClient from '../index.js';

const classManagementApi = {
	// Lấy danh sách classes với phân trang, search, filter và sort
	getClasses: (params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.searchText && params.searchText.trim()) {
			queryParams.append('searchText', params.searchText.trim());
		}
		if (params.status && params.status !== 'all') {
			queryParams.append('status', params.status);
		}
		if (params.syllabusId) {
			queryParams.append('syllabusId', params.syllabusId);
		}
		if (params.startDateFrom) {
			queryParams.append('startDateFrom', params.startDateFrom);
		}
		if (params.startDateTo) {
			queryParams.append('startDateTo', params.startDateTo);
		}
		if (params.endDateFrom) {
			queryParams.append('endDateFrom', params.endDateFrom);
		}
		if (params.endDateTo) {
			queryParams.append('endDateTo', params.endDateTo);
		}
		if (params.include) {
			queryParams.append('include', params.include);
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/class${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetClasses API - URL:', url);
		console.log('GetClasses API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo class mới
	createClass: (classData) => {
		const url = `/class`;
		console.log('CreateClass API - URL:', url);
		console.log('CreateClass API - Data:', JSON.stringify(classData, null, 2));
		
		return axiosClient.post(url, classData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('CreateClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Cập nhật class
	updateClass: (classId, classData) => {
		const url = `/class/${classId}`;
		console.log('UpdateClass API - URL:', url);
		console.log('UpdateClass API - Data:', JSON.stringify(classData, null, 2));
		
		return axiosClient.put(url, classData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('UpdateClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Xóa class
	deleteClass: (classId) => {
		const url = `/class/${classId}`;
		console.log('DeleteClass API - URL:', url);
		console.log('DeleteClass API - Params:', { classId });
		
		return axiosClient.delete(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('DeleteClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Lấy thông tin chi tiết class
	getClassDetail: (classId) => {
		const url = `/class/${classId}`;
		console.log('GetClassDetail API - URL:', url);
		console.log('GetClassDetail API - Params:', { classId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật trạng thái class (active/inactive)
	toggleClassStatus: (classId, status) => {
		const url = `/class/${classId}/toggle?status=${status}`;
		console.log('ToggleClassStatus API - URL:', url);
		console.log('ToggleClassStatus API - Params:', { classId, status });
		
		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách học sinh trong class với phân trang, search, filter, sort
	getClassStudents: (classId, params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}
		if (params.status && params.status !== 'all') {
			queryParams.append('status', params.status);
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/class-student/${classId}/students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetClassStudents API - URL:', url);
		console.log('GetClassStudents API - Params:', { classId, ...params });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách giáo viên trong class với phân trang, search, filter, sort
	getClassTeachers: (classId, params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}
		if (params.status && params.status !== 'all') {
			queryParams.append('status', params.status);
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/class-teacher/${classId}/teachers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetClassTeachers API - URL:', url);
		console.log('GetClassTeachers API - Params:', { classId, ...params });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy lịch sử hoạt động của class với phân trang và sort
	getClassActivities: (classId, params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/class-history/${classId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy thông tin overview của class
	getClassOverview: (classId) => {
		const url = `/class/${classId}/overview`;
		console.log('GetClassOverview API - URL:', url);
		console.log('GetClassOverview API - Params:', { classId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},
};

export default classManagementApi;
