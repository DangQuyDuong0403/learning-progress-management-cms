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

	// Bulk update student status (ACTIVE/INACTIVE)
	bulkUpdateStudentStatus: (userIds, targetStatus) => {
		const url = `/user/students/bulk-status`;
		console.log('BulkUpdateStudentStatus API - URL:', url);
		console.log('BulkUpdateStudentStatus API - Data:', { userIds, targetStatus });
		
		return axiosClient.patch(url, {
			userIds: userIds,
			targetStatus: targetStatus
		}, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('BulkUpdateStudentStatus API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Cập nhật trạng thái student (ACTIVE/INACTIVE) - Single student
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

	// Import students from Excel file
	importStudents: (formData) => {
		const url = `/user/students/import`;
		console.log('ImportStudents API - URL:', url);
		console.log('ImportStudents API - FormData:', formData);
		
		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				// Don't set Content-Type, let axios handle it for FormData
			}
		}).catch(error => {
			console.error('ImportStudents API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Validate student import file without importing
	validateImportFile: (formData) => {
		const url = `/user/students/validate-import`;
		console.log('ValidateImportFile API - URL:', url);
		console.log('ValidateImportFile API - FormData:', formData);
		
		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				// Don't set Content-Type, let axios handle it for FormData
			},
			responseType: 'blob', // Important for file download
		}).catch(error => {
			console.error('ValidateImportFile API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Upload avatar for student
	uploadStudentAvatar: (userId, file) => {
		const formData = new FormData();
		formData.append('file', file);
		
		const url = `/user/profile/${userId}/avatar`;
		console.log('UploadStudentAvatar API - URL:', url);
		console.log('UploadStudentAvatar API - UserId:', userId);
		console.log('UploadStudentAvatar API - File:', file);
		
		return axiosClient.patch(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('UploadStudentAvatar API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Export students to Excel with filtering
	exportStudents: (params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Add filter parameters if provided
		if (params.text) queryParams.append('text', params.text);
		if (params.status && params.status.length > 0) {
			params.status.forEach(status => queryParams.append('status', status));
		}
		if (params.roleName && params.roleName.length > 0) {
			params.roleName.forEach(role => queryParams.append('roleName', role));
		}
		if (params.classIds && params.classIds.length > 0) {
			params.classIds.forEach(classId => queryParams.append('classIds', classId));
		}

		const url = `/user/students/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('ExportStudents API - URL:', url);
		console.log('ExportStudents API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
			responseType: 'blob' // Important for file download
		}).catch(error => {
			console.error('ExportStudents API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Lấy tổng quan của học sinh: thời gian bắt đầu học, level hiện tại, lớp hiện tại, tỷ lệ làm DC (reports API)
	// Endpoint: GET /reports/student/overview?userId={userId}
	getStudentOverview: (userId) => {
		const queryParams = new URLSearchParams();
		if (userId) {
			queryParams.append('userId', userId);
		}
		const url = `/reports/student/overview${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetStudentOverview API - URL:', url);
		console.log('GetStudentOverview API - Params:', { userId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('GetStudentOverview API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Lấy lịch sử các level đã học: thông tin level, các lớp đã học, điểm TB theo từng loại DC (reports API)
	// Endpoint: GET /reports/student/level-history?userId={userId?}
	getStudentLevelHistory: (userId) => {
		const queryParams = new URLSearchParams();
		if (userId) {
			queryParams.append('userId', userId);
		}
		const url = `/reports/student/level-history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetStudentLevelHistory API - URL:', url);
		console.log('GetStudentLevelHistory API - Params:', { userId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('GetStudentLevelHistory API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Chi tiết DC của học sinh trong 1 lớp: list DC kèm điểm, type, status, tỷ lệ hoàn thành đúng hạn (reports API)
	// Endpoint: GET /reports/student/class/{classId}/challenges?userId={userId}
	getStudentClassChallengeDetail: (classId, userId) => {
		const queryParams = new URLSearchParams();
		if (userId) {
			queryParams.append('userId', userId);
		}
		const url = `/reports/student/class/${classId}/challenges${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetStudentClassChallengeDetail API - URL:', url);
		console.log('GetStudentClassChallengeDetail API - Params:', { classId, userId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('GetStudentClassChallengeDetail API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},
};

export default studentManagementApi;
