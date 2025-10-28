import axiosClient from '../index.js';

const dailyChallengeApi = {
	// Lấy danh sách daily challenges cho một class cụ thể
	getDailyChallengesByClass: (classId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/daily-challenges/class/${classId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetDailyChallengesByClass API - URL:', url);
		console.log('GetDailyChallengesByClass API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Gọi OpenAI service để sinh câu hỏi theo cấu hình
	generateAIQuestions: async (payload) => {
		// payload expected: { challengeId, questionTypeConfigs: [{questionType, numberOfQuestions}], description }
		// Endpoint của service OpenAI đang ở /api/openai/... (không có /v1)
		// axiosClient baseURL hiện là .../api/v1 nên cần build absolute URL tương ứng
		const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
		const absoluteUrl = base.includes('/api/v1')
			? base.replace('/api/v1', '/api') + '/openai/generate-gv-questions'
			: (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api')) + '/openai/generate-gv-questions';
		console.log('GenerateAIQuestions API - URL:', absoluteUrl);
		console.log('GenerateAIQuestions API - Payload:', payload);
		return axiosClient.post(absoluteUrl, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			},
		});
	},

	// Lấy tất cả daily challenges của teacher (không theo class cụ thể)
	getAllDailyChallenges: (params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/daily-challenges${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetAllDailyChallenges API - URL:', url);
		console.log('GetAllDailyChallenges API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy chi tiết một daily challenge
	getDailyChallengeById: (id) => {
		const url = `/daily-challenges/${id}`;
		console.log('GetDailyChallengeById API - URL:', url);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo daily challenge mới
	createDailyChallenge: (data) => {
		console.log('CreateDailyChallenge API - Data:', data);
		
		return axiosClient.post('/daily-challenges', data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Cập nhật daily challenge
	updateDailyChallenge: (id, data) => {
		console.log('UpdateDailyChallenge API - ID:', id, 'Data:', data);
		
		return axiosClient.put(`/daily-challenges/${id}`, data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Xóa daily challenge
	deleteDailyChallenge: (id) => {
		const url = `/daily-challenges/${id}`;
		console.log('DeleteDailyChallenge API - URL:', url);
		
		return axiosClient.delete(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật status của daily challenge
	updateDailyChallengeStatus: (id, challengeStatus) => {
		const url = `/daily-challenges/${id}/status`;
		console.log('UpdateDailyChallengeStatus API - URL:', url, 'Status:', challengeStatus);
		
		return axiosClient.put(url, null, {
			params: {
				challengeStatus: challengeStatus
			},
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Kích hoạt/vô hiệu hóa daily challenge (legacy method - kept for backward compatibility)
	toggleDailyChallengeStatus: (id) => {
		const url = `/daily-challenges/${id}/toggle-status`;
		console.log('ToggleDailyChallengeStatus API - URL:', url);
		
		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách submissions của một daily challenge
	getDailyChallengeSubmissions: (challengeId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}
		if (params.sortDir) {
			queryParams.append('sortDir', params.sortDir);
		}

		const url = `/daily-challenges/${challengeId}/submissions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetDailyChallengeSubmissions API - URL:', url);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy thống kê performance của daily challenge
	getDailyChallengePerformance: (challengeId) => {
		const url = `/daily-challenges/${challengeId}/performance`;
		console.log('GetDailyChallengePerformance API - URL:', url);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách sections (questions) cho một challenge
	getSectionsByChallenge: (challengeId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}

		const url = `/sections/challenge/${challengeId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetSectionsByChallenge API - URL:', url);
		console.log('GetSectionsByChallenge API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lưu section với questions cho một challenge
	saveSectionWithQuestions: (challengeId, sectionData) => {
		const url = `/sections/${challengeId}`;
		console.log('SaveSectionWithQuestions API - URL:', url);
		console.log('SaveSectionWithQuestions API - Data:', sectionData);
		
		return axiosClient.post(url, sectionData, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Bulk update sections (delete, reorder) for a challenge
	bulkUpdateSections: (challengeId, sectionsData) => {
		const url = `/sections/bulk/${challengeId}`;
		console.log('BulkUpdateSections API - URL:', url);
		console.log('BulkUpdateSections API - Data:', sectionsData);
		
		return axiosClient.post(url, sectionsData, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Upload file (PDF, audio, image, etc.)
	uploadFile: (file) => {
		const url = `/file/upload`;
		console.log('UploadFile API - URL:', url);
		console.log('UploadFile API - FileName:', file.name);
		
		// Create FormData to upload as multipart/form-data
		const formData = new FormData();
		formData.append('file', file);
		
		return axiosClient.post(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				'accept': '*/*',
			}
		});
	}
};

export default dailyChallengeApi;
