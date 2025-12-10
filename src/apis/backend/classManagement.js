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
			// Support both single status and array of statuses
			if (Array.isArray(params.status)) {
				params.status.forEach(status => queryParams.append('status', status));
			} else {
				queryParams.append('status', params.status);
			}
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
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo class mới
	createClass: (classData) => {
		const url = `/class`;

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

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật trạng thái class (active/inactive) - Updated to use new API format
	toggleClassStatus: (classId, status) => {
		const url = `/class/${classId}/change-status?status=${status}`;

		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('ToggleClassStatus API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
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
			// Support both single status and array of statuses
			if (Array.isArray(params.status)) {
				params.status.forEach(status => queryParams.append('status', status));
			} else {
				queryParams.append('status', params.status);
			}
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/class-student/${classId}/students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
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
			// Support both single status and array of statuses
			if (Array.isArray(params.status)) {
				params.status.forEach(status => queryParams.append('status', status));
			} else {
				queryParams.append('status', params.status);
			}
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/class-teacher/${classId}/teachers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
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

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy thông tin tổng quan của lớp (reports API)
	getClassReportOverview: (classId) => {
		const url = `/reports/class/${classId}/overview`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy chi tiết thành viên của lớp (reports API)
	getClassReportMembers: (classId, sortBy = 'score') => {
		const queryParams = new URLSearchParams();
		if (sortBy) {
			queryParams.append('sortBy', sortBy);
		}
		const url = `/reports/class/${classId}/members${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy challenge stats by skill (reports API)
	getClassChallengeStatsBySkill: (classId, skill) => {
		const url = `/reports/class/${classId}/challenges/skill?skill=${skill}`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy challenge progress by all skills (reports API)
	getClassChallengeProgress: (classId) => {
		const url = `/reports/class/${classId}/challenges/progress`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách học sinh có nguy cơ (At-risk Students Alert - reports API)
	// Endpoint: GET /reports/class/{classId}/at-risk
	getClassAtRiskStudents: (classId) => {
		const url = `/reports/class/${classId}/at-risk`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách teachers có thể thêm vào class
	getAvailableTeachers: (params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}
		if (params.role) {
			queryParams.append('role', params.role);
		}
		if (params.status && params.status !== 'all') {
			queryParams.append('status', params.status);
		}

		const url = `/teacher${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Thêm teacher vào class
	addTeacherToClass: (classId, teacherData) => {
		const url = `/class-teacher/${classId}/add-teacher`;

		return axiosClient.post(url, teacherData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('AddTeacherToClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Xóa teacher khỏi class
	removeTeacherFromClass: (classId, userId) => {
		const url = `/class-teacher/${classId}/remove-teacher/${userId}`;

		return axiosClient.delete(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('RemoveTeacherFromClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Thêm students vào class
	addStudentsToClass: (classId, userIds) => {
		const url = `/class-student/${classId}/add-student`;

		return axiosClient.post(url, {
			userIds: userIds
		}, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('AddStudentsToClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Xóa student khỏi class
	removeStudentFromClass: (classId, userId) => {
		const url = `/class-student/${classId}/remove-student/${userId}`;

		return axiosClient.delete(url, {
			headers: {
				'accept': '*/*',
			}
		}).then(response => {
			return response;
		}).catch(error => {
			console.error('RemoveStudentFromClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Upload ảnh avatar cho class - DISABLED until API is ready
	uploadClassAvatar: (file) => {
		// TODO: Enable when backend API is ready
		return Promise.reject(new Error('Image upload API not available yet'));
	},

	// Class Students Import/Export APIs
	// Download class students import template
	downloadClassStudentsTemplate: (classId) => {
		const url = `/class-student/download-template`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('DownloadClassStudentsTemplate API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Validate class students import file
	validateClassStudentsImport: (classId, formData) => {
		const url = `/class-student/validate-import`;

		return axiosClient.post(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			responseType: 'blob' // Important for file download
		}).catch(error => {
			console.error('ValidateClassStudentsImport API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Import class students from Excel file
	importClassStudents: (classId, formData) => {
		const url = `/class-student/import-students`;

		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				// Don't set Content-Type, let axios handle it for FormData
			}
		}).catch(error => {
			console.error('ImportClassStudents API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Export class students to Excel with filtering
	exportClassStudents: (classId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Add filter parameters if provided
		if (params.text) queryParams.append('text', params.text);
		if (params.status && params.status !== 'all') {
			queryParams.append('status', params.status);
		}
		if (params.sortBy) queryParams.append('sortBy', params.sortBy);
		if (params.sortDir) queryParams.append('sortDir', params.sortDir);
		
		const url = `/class-student/${classId}/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
			responseType: 'blob' // Important for file download
		}).catch(error => {
			console.error('ExportClassStudents API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Lấy danh sách lớp học của học sinh hiện tại
	// Backend sẽ check JWT token để lấy student ID và chỉ trả về classes mà student đang tham gia
	getStudentClasses: (params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('searchText', params.text.trim());
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

		const url = `/class${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('GetStudentClasses API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Lấy lịch sử lớp học (bao gồm filter, phân trang, sort)
	getClassHistory: (classId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.sortBy) queryParams.append('sortBy', params.sortBy);
		if (params.sortDir) queryParams.append('sortDir', params.sortDir);
		if (params.startDate) queryParams.append('startDate', params.startDate);
		if (params.endDate) queryParams.append('endDate', params.endDate);
		if (params.actionBy) queryParams.append('actionBy', params.actionBy);
		if (params.text) queryParams.append('text', params.text);

		const url = `/class/history/${classId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('GetClassHistory API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},
};

export default classManagementApi;
