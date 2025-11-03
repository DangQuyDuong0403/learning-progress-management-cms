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

	// Export a challenge worksheet; backend returns a downloadable URL
	exportWorksheet: (challengeId) => {
		const url = `/daily-challenges/${challengeId}/export-worksheet`;
		console.log('ExportWorksheet API - URL:', url);
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
			responseType: 'blob'
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

	// Generate a reading passage from OpenAI service
	generateReadingPassage: async (payload) => {
		// payload expected: { challengeId, numberOfParagraphs, description }
		const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
		const absoluteUrl = base.includes('/api/v1')
			? base.replace('/api/v1', '/api') + '/openai/generate-reading-passage'
			: (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api')) + '/openai/generate-reading-passage';
		console.log('GenerateReadingPassage API - URL:', absoluteUrl);
		console.log('GenerateReadingPassage API - Payload:', payload);
		return axiosClient.post(absoluteUrl, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			},
		});
	},

	// Generate questions based on provided section content (reading/listening transcript)
	generateContentBasedQuestions: async (payload) => {
		// payload expected: { challengeId, sections: [{ section, questionTypeConfigs }], description }
		const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
		const absoluteUrl = base.includes('/api/v1')
			? base.replace('/api/v1', '/api') + '/openai/generate-content-based-questions'
			: (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api')) + '/openai/generate-content-based-questions';
		console.log('GenerateContentBasedQuestions API - URL:', absoluteUrl);
		console.log('GenerateContentBasedQuestions API - Payload:', payload);
		return axiosClient.post(absoluteUrl, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			},
		});
	},

	// Parse questions from uploaded file with optional description prompt
	parseQuestionsFromFile: async (file, description = '') => {
		// Build absolute URL to /api/openai/parse-questions-from-file
		const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
		const baseApi = base.includes('/api/v1')
			? base.replace('/api/v1', '/api')
			: (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api'));
		const absoluteUrl = `${baseApi}/openai/parse-questions-from-file` + (description && description.trim() ? `?description=${encodeURIComponent(description.trim())}` : '');
		console.log('ParseQuestionsFromFile API - URL:', absoluteUrl);
		console.log('ParseQuestionsFromFile API - FileName:', file?.name, 'Description:', description);

		const formData = new FormData();
		if (file) formData.append('file', file);

		return axiosClient.post(absoluteUrl, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
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

	// Lấy thông tin phân cấp (level/chapter/lesson) của daily challenge
	getChallengeHierarchy: (id) => {
		const url = `/daily-challenges/${id}/hierarchy`;
		console.log('GetChallengeHierarchy API - URL:', url);
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
	publishDailyChallenge: (id) => {
		const url = `/daily-challenges/${id}/publish`;
		console.log('PublishDailyChallenge API - URL:', url);
		return axiosClient.post(url, null, {
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

	// Lấy danh sách student submissions qua service challenge-submissions
	// Endpoint theo swagger: /challenge-submissions/challenge/{challengeId}/submissions
	// Hỗ trợ page (0-based), size, text (search), sortBy, sortDir
	getChallengeSubmissions: (challengeId, params = {}) => {
		const queryParams = new URLSearchParams();
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) queryParams.append('text', params.text.trim());
		if (params.sortBy) queryParams.append('sortBy', params.sortBy);
		if (params.sortDir) queryParams.append('sortDir', params.sortDir);

		const url = `/challenge-submissions/challenge/${challengeId}/submissions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetChallengeSubmissions API - URL:', url);
		console.log('GetChallengeSubmissions API - Params:', params);

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},

	// Lấy danh sách daily challenges cho student theo classId
	// Endpoint theo swagger: /challenge-submissions/class/{classId}
	// Hỗ trợ page (0-based), size, text (search)
	getStudentDailyChallengesByClass: (classId, params = {}) => {
		const queryParams = new URLSearchParams();
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}

		const url = `/challenge-submissions/class/${classId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetStudentDailyChallengesByClass API - URL:', url);
		console.log('GetStudentDailyChallengesByClass API - Params:', params);

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},

  // Lấy grading summary cho submission (dùng cho sidebar Performance)
  // Endpoint: /grading/challenges/submission/{submissionId}/result
  getSubmissionGradingResult: (submissionId) => {
    const url = `/grading/challenges/submission/${submissionId}/result`;
    console.log('GetSubmissionGradingResult API - URL:', url);
    console.log('GetSubmissionGradingResult API - SubmissionId:', submissionId);
    
    return axiosClient.get(url, {
      headers: {
        'accept': '*/*',
      },
    });
  },

  // Lưu kết quả chấm điểm cho submission
  // Endpoint: POST /grading/challenges/submission/{submissionId}/grade
  gradeSubmission: (submissionId, payload) => {
    const url = `/grading/challenges/submission/${submissionId}/grade`;
    console.log('GradeSubmission API - URL:', url, 'Payload:', payload);
    return axiosClient.post(url, payload, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
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
	},

	// Bulk save sections with questions for a challenge
	bulkSaveSections: (challengeId, sectionsData) => {
		const url = `/sections/bulk-save/${challengeId}`;
		console.log('BulkSaveSections API - URL:', url);
		console.log('BulkSaveSections API - Data:', sectionsData);
		
		return axiosClient.post(url, sectionsData, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách sections (questions) cho học sinh làm bài (public endpoint - không có answers)
	getPublicSectionsByChallenge: (challengeId, params = {}) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.text && params.text.trim()) {
			queryParams.append('text', params.text.trim());
		}

		const url = `/sections/challenge/${challengeId}/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetPublicSectionsByChallenge API - URL:', url);
		console.log('GetPublicSectionsByChallenge API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Submit answers for a daily challenge (save as draft or final submit)
	submitDailyChallenge: (submissionChallengeId, data) => {
		// data expected: { saveAsDraft: boolean, questionAnswers: [{ questionId, content: { data: [{ id, value, positionId }] } }] }
		const url = `/submission/${submissionChallengeId}`;
		console.log('SubmitDailyChallenge API - URL:', url);
		console.log('SubmitDailyChallenge API - Data:', data);
		
		return axiosClient.post(url, data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Get submission result including question content and submitted answers
	getSubmissionResult: (submissionChallengeId) => {
		const url = `/submission/${submissionChallengeId}/result`;
		console.log('GetSubmissionResult API - URL:', url);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Get draft submission with questions and saved answers (without correct answers)
	getDraftSubmission: (submissionChallengeId) => {
		const url = `/submission/${submissionChallengeId}/draft`;
		console.log('GetDraftSubmission API - URL:', url);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	}
};

export default dailyChallengeApi;
