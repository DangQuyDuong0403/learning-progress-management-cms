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
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Bulk update teacher status (ACTIVE/INACTIVE)
	bulkUpdateTeacherStatus: (userIds, targetStatus) => {
		const url = `/user/teachers/bulk-status`;

		return axiosClient.patch(url, {
			userIds: userIds,
			targetStatus: targetStatus
		}, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('BulkUpdateTeacherStatus API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Cập nhật trạng thái teacher (ACTIVE/INACTIVE) - Single teacher
	updateTeacherStatus: (userId, status) => {
		const url = `/user/teachers/${userId}/status?status=${status}`;

		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},
	getTeacherProfile: (userId) => {
		const url = `/user/profile/${userId}`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo teacher mới
	createTeacher: (teacherData) => {
		const url = `/user/teachers`;

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

	// Class Management APIs for Teacher
	getClassById: (classId) => {
		const url = `/class/${classId}`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	getClassesByTeacher: (teacherId, params) => {
		const queryParams = new URLSearchParams();
		
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text) queryParams.append('text', params.text);
		if (params.status && params.status.length > 0) {
			params.status.forEach(status => queryParams.append('status', status));
		}

		const url = `/class${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Class Chapter Management APIs
	getClassChapters: (classId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Add classId as required parameter
		queryParams.append('classId', classId);
		
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.searchText) queryParams.append('searchText', params.searchText);

		const url = `/class-chapter${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	getClassChapterById: (id) => {
		const url = `/class-chapter/${id}`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	syncClassChapters: (classId, chaptersData) => {
		const url = `/class-chapter/sync/${classId}`;
		
		return axiosClient.put(url, chaptersData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('SyncClassChapters API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Class Lesson Management APIs - Using /class-lesson endpoint
	getClassLessons: (params = {}) => {
		const queryParams = new URLSearchParams();
		
		// classChapterId parameter for /class-lesson endpoint
		if (params.classChapterId) queryParams.append('classChapterId', params.classChapterId);
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.searchText) queryParams.append('searchText', params.searchText);

		const url = `/class-lesson${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	syncClassLessons: (classChapterId, lessonsData) => {
		const url = `/class-lesson/sync/${classChapterId}`;

		return axiosClient.put(url, lessonsData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('SyncClassLessons API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	importClassLessons: (classId, formData) => {
		const url = `/class-lesson/import?classId=${classId}`;

		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'multipart/form-data',
			}
		}).catch(error => {
			console.error('ImportClassLessons API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	validateClassLessonImportFile: (classId, formData) => {
		const url = `/class-lesson/validate-import?classId=${classId}`;

		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'multipart/form-data',
			},
			responseType: 'blob', // Important to receive file from server
		}).catch(error => {
			console.error('ValidateClassLessonImportFile API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	downloadClassLessonTemplate: () => {
		const url = `/class-lesson/download-template`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
			responseType: 'blob'
		}).catch(error => {
			console.error('DownloadClassLessonTemplate API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	importClassChapters: (classId, formData) => {
		const url = `/class-chapter/import?classId=${classId}`;
		
		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'multipart/form-data',
			}
		}).catch(error => {
			console.error('ImportClassChapters API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	validateClassChapterImportFile: (classId, formData) => {
		const url = `/class-chapter/validate-import?classId=${classId}`;
		
		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'multipart/form-data',
			},
			responseType: 'blob', // Important to receive file from server
		}).catch(error => {
			console.error('ValidateClassChapterImportFile API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	downloadClassChapterTemplate: () => {
		const url = `/class-chapter/download-template`;
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('DownloadClassChapterTemplate API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Download teacher import template
	downloadTeacherTemplate: () => {
		const url = `/user/teachers/download-template`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('DownloadTeacherTemplate API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Import teachers from Excel file
	importTeachers: (formData) => {
		const url = `/user/teachers/import`;

		return axiosClient.post(url, formData, {
			headers: {
				'accept': '*/*',
				// Don't set Content-Type, let axios handle it for FormData
			}
		}).catch(error => {
			console.error('ImportTeachers API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Validate teacher import file without importing
	validateImportFile: (formData) => {
		const url = `/user/teachers/validate-import`;

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

	// Upload avatar for teacher
	uploadTeacherAvatar: (userId, file) => {
		const formData = new FormData();
		formData.append('file', file);
		
		const url = `/user/profile/${userId}/avatar`;

		return axiosClient.patch(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('UploadTeacherAvatar API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Export teachers to Excel with filtering
	exportTeachers: (params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Add filter parameters if provided
		if (params.text) queryParams.append('text', params.text);
		if (params.status && params.status.length > 0) {
			params.status.forEach(status => queryParams.append('status', status));
		}
		if (params.roleName && params.roleName.length > 0) {
			params.roleName.forEach(role => queryParams.append('roleName', role));
		}
		
		const url = `/user/teachers/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
			responseType: 'blob' // Important for file download
		}).catch(error => {
			console.error('ExportTeachers API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},
};

export default teacherManagementApi;
