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
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Export a challenge worksheet; backend returns a downloadable URL
	exportWorksheet: (challengeId) => {
		const url = `/daily-challenges/${challengeId}/export-worksheet`;
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
		return axiosClient.post(absoluteUrl, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			},
		});
	},

	// Generate AI feedback for writing using dedicated grading endpoint
	// Required payload: { submissionQuestionId }
	generateAIFeedback: async (payload) => {
		const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
		const baseApi = base.includes('/api/v1')
			? base.replace('/api/v1', '/api')
			: (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api'));
		const absoluteUrl = `${baseApi}/openai/grade-writing`;
		return axiosClient.post(absoluteUrl, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			},
		});
	},

	// Assess pronunciation for speaking using OpenAI service proxy
	// Endpoint (swagger image): POST /api/openai/pronunciation-assessment with query params
	// Params: { audioUrl, questionText?, referenceText?, age? }
	assessPronunciation: async ({ audioUrl, questionText, referenceText, age } = {}) => {
		const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
		const baseApi = base.includes('/api/v1')
			? base.replace('/api/v1', '/api')
			: (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api'));
		const url = `${baseApi}/openai/pronunciation-assessment`;
		const params = new URLSearchParams();
		if (audioUrl) params.append('audioUrl', audioUrl);
		if (questionText) params.append('questionText', questionText);
		if (referenceText) params.append('referenceText', referenceText);
		if (age !== undefined && age !== null && age !== '') params.append('age', age);
		const absoluteUrl = params.toString() ? `${url}?${params.toString()}` : url;
		return axiosClient.post(absoluteUrl, null, {
			headers: {
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
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy chi tiết một daily challenge
	getDailyChallengeById: (id) => {
		const url = `/daily-challenges/${id}`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy thông tin phân cấp (level/chapter/lesson) của daily challenge
	getChallengeHierarchy: (id) => {
		const url = `/daily-challenges/${id}/hierarchy`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo daily challenge mới
	createDailyChallenge: (data) => {
		return axiosClient.post('/daily-challenges', data, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Cập nhật daily challenge
	updateDailyChallenge: (id, data) => {
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

		return axiosClient.delete(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật status của daily challenge
	publishDailyChallenge: (id) => {
		const url = `/daily-challenges/${id}/publish`;
		return axiosClient.post(url, null, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Kích hoạt/vô hiệu hóa daily challenge (legacy method - kept for backward compatibility)
	toggleDailyChallengeStatus: (id) => {
		const url = `/daily-challenges/${id}/toggle-status`;

		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật status của daily challenge thành PUBLISHED
	updateDailyChallengeStatus: (id, status) => {
		if (status === 'PUBLISHED') {
			// Sử dụng endpoint /publish để publish challenge
			const url = `/daily-challenges/${id}/publish`;
			return axiosClient.post(url, null, {
				headers: {
					'accept': '*/*',
				}
			});
		} else {
			return Promise.reject(new Error(`Only PUBLISHED status is supported. Got: ${status}`));
		}
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
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},

	// Lấy grading summary cho submission (dùng cho sidebar Performance)
	// Endpoint theo thực tế (ảnh swagger): GET /grading/submission-challenges/{submissionId}
	getSubmissionGradingResult: (submissionId) => {
		const url = `/grading/submission-challenges/${submissionId}`;
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
    return axiosClient.post(url, payload, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
  },

  // Lưu tổng kết chấm điểm/overallFeedback cho submission-challenge
  // Endpoint (updated): POST /grading/submission-challenges/{submissionId}
  saveGradingSummary: (submissionId, payload) => {
    const url = `/grading/submission-challenges/${submissionId}`;
    return axiosClient.post(url, payload, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
  },

  // Grade a specific submission-question (used for Writing AI/manual grading)
  // Endpoint: POST /grading/submission-questions/{submissionQuestionId}
  gradeSubmissionQuestion: (submissionQuestionId, payload) => {
    const url = `/grading/submission-questions/${submissionQuestionId}`;
    return axiosClient.post(url, payload, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
  },

  // Get existing grading for a submission-question
  // Endpoint: GET /grading/submission-questions/{submissionQuestionId}
  getSubmissionQuestionGrading: (submissionQuestionId) => {
    const url = `/grading/submission-questions/${submissionQuestionId}`;
    return axiosClient.get(url, {
      headers: {
        'accept': '*/*',
      },
    });
  },

	// Lấy thống kê performance của daily challenge
	getDailyChallengePerformance: (challengeId) => {
		const url = `/daily-challenges/${challengeId}/performance`;

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
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lưu section với questions cho một challenge
	saveSectionWithQuestions: (challengeId, sectionData) => {
		const url = `/sections/${challengeId}`;

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

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},

	// Get a single submission question detail (prompt + student's submitted content)
	// Endpoint: GET /submission/question/{submissionQuestionId}
	getSubmissionQuestion: (submissionQuestionId) => {
		const url = `/submission/question/${submissionQuestionId}`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},
	// Get draft submission with questions and saved answers (without correct answers)
	getDraftSubmission: (submissionChallengeId) => {
		const url = `/submission/${submissionChallengeId}/draft`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},

	// Append anti-cheat logs to submission
	appendAntiCheatLogs: (submissionChallengeId, logs) => {
		const url = `/challenge-submissions/${submissionChallengeId}/logs`;

		return axiosClient.post(url, { logs }, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Get submission info including timing (duration, start/end, etc.)
	// Endpoint: GET /challenge-submissions/{submissionChallengeId}/info
	getSubmissionChallengeInfo: (submissionChallengeId) => {
		const url = `/challenge-submissions/${submissionChallengeId}/info`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			},
		});
	},

	// Get anti-cheat logs for a submission
	// Endpoint: GET /challenge-submissions/{submissionChallengeId}/logs
	getSubmissionLogs: (submissionChallengeId) => {
		const url = `/challenge-submissions/${submissionChallengeId}/logs`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Mark submission as started by student
	// Endpoint: POST /challenge-submissions/submission/{submissionId}/start
	startSubmission: (submissionId) => {
		const url = `/challenge-submissions/submission/${submissionId}/start`;

		return axiosClient.post(url, null, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Extend submission deadline(s)
	// Endpoint: POST /challenge-submissions/extend-deadline
	extendSubmissionDeadline: (submissionIds, newExpiredAt) => {
		const url = `/challenge-submissions/extend-deadline`;
		const payload = {
			submissionIds: Array.isArray(submissionIds) ? submissionIds : [submissionIds],
			newExpiredAt,
		};
		return axiosClient.post(url, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Reset submissions (re-assign new attempt window)
	// Endpoint: POST /challenge-submissions/reset
	resetSubmissions: (submissionIds, newStartDate, newEndDate) => {
		const url = `/challenge-submissions/reset`;
		const payload = {
			submissionIds: Array.isArray(submissionIds) ? submissionIds : [submissionIds],
			newStartDate,
			newEndDate,
		};
		return axiosClient.post(url, payload, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*',
			}
		});
	},

	// Lấy tổng quan challenge: điểm TB, điểm cao nhất/thấp nhất, số HS hoàn thành/nộp muộn/chưa làm (reports API)
	// Endpoint: GET /reports/challenge/{challengeId}/overview
	getChallengeOverview: (challengeId) => {
		const url = `/reports/challenge/${challengeId}/overview`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy danh sách học sinh với điểm và thời gian làm bài (reports API)
	// Endpoint: GET /reports/challenge/{challengeId}/students
	getChallengeStudentPerformance: (challengeId) => {
		const url = `/reports/challenge/${challengeId}/students`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy dữ liệu biểu đồ cột + đường: điểm và thời gian hoàn thành của từng học sinh (reports API)
	// Endpoint: GET /reports/challenge/{challengeId}/chart
	getChallengeChartData: (challengeId) => {
		const url = `/reports/challenge/${challengeId}/chart`;

		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Lấy thống kê từng câu hỏi: tổng số lần làm và tỷ lệ đúng
	// Endpoint: GET /reports/challenge/{challengeId}/question-stats
	getChallengeQuestionStats: (challengeId) => {
		const url = `/reports/challenge/${challengeId}/question-stats`;
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	}
};

export default dailyChallengeApi;
