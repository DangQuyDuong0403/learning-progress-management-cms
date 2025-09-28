import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock API functions - Replace with actual API calls
const mockSyllabuses = [
	{
		id: 1,
		name: 'Cambridge A2 KET Complete Syllabus',
		description: 'Complete syllabus for Cambridge A2 Key English Test preparation',
		levelId: 3,
		level: {
			id: 3,
			name: 'A2 KET Level 1',
			code: 'A2KET1'
		},
		duration: 20,
		totalLessons: 60,
		status: 'active',
		objectives: 'Prepare students for Cambridge A2 KET examination with comprehensive coverage of all skills',
		learningOutcomes: 'Students will achieve A2 level competency in reading, writing, listening, and speaking',
		assessmentCriteria: 'Regular assessments, mock tests, and final evaluation',
		createdAt: '2024-01-15T08:00:00Z',
		chapters: [
			{
				id: 1,
				syllabusId: 1,
				name: 'Introduction to A2 Level',
				description: 'Basic introduction to A2 level English',
				order: 1,
				duration: 2,
				status: 'active',
				objectives: 'Introduce students to A2 level expectations',
				learningOutcomes: 'Students understand A2 level requirements',
				assessmentCriteria: 'Initial assessment and placement test',
				createdAt: '2024-01-16T08:00:00Z',
				lessons: [
					{
						id: 1,
						chapterId: 1,
						name: 'Welcome to A2 Level',
						description: 'Introduction lesson',
						order: 1,
						duration: 1,
						type: 'theory',
						status: 'active',
						objectives: 'Welcome students and explain course structure',
						content: 'Course overview, expectations, and materials',
						materials: 'Textbook, workbook, audio files',
						homework: 'Read chapter 1, complete vocabulary exercise',
						createdAt: '2024-01-17T08:00:00Z',
					},
					{
						id: 2,
						chapterId: 1,
						name: 'Placement Test',
						description: 'Initial assessment',
						order: 2,
						duration: 1,
						type: 'mixed',
						status: 'active',
						objectives: 'Assess current English level',
						content: 'Grammar, vocabulary, and skills assessment',
						materials: 'Test papers, answer sheets',
						homework: 'Review test results',
						createdAt: '2024-01-17T08:00:00Z',
					}
				]
			},
			{
				id: 2,
				syllabusId: 1,
				name: 'Grammar Fundamentals',
				description: 'Essential grammar for A2 level',
				order: 2,
				duration: 4,
				status: 'active',
				objectives: 'Master basic grammar structures',
				learningOutcomes: 'Students can use basic grammar correctly',
				assessmentCriteria: 'Grammar exercises and tests',
				createdAt: '2024-01-20T08:00:00Z',
				lessons: [
					{
						id: 3,
						chapterId: 2,
						name: 'Present Tenses',
						description: 'Present simple and continuous',
						order: 1,
						duration: 1.5,
						type: 'theory',
						status: 'active',
						objectives: 'Learn present tenses usage',
						content: 'Present simple vs continuous, form and usage',
						materials: 'Grammar book, exercises',
						homework: 'Complete grammar exercises 1-10',
						createdAt: '2024-01-21T08:00:00Z',
					},
					{
						id: 4,
						chapterId: 2,
						name: 'Past Tenses',
						description: 'Past simple and continuous',
						order: 2,
						duration: 1.5,
						type: 'theory',
						status: 'active',
						objectives: 'Learn past tenses usage',
						content: 'Past simple vs continuous, irregular verbs',
						materials: 'Grammar book, verb list',
						homework: 'Practice irregular verbs, complete exercises',
						createdAt: '2024-01-21T08:00:00Z',
					}
				]
			}
		]
	},
	{
		id: 2,
		name: 'B1 PET Preparation Syllabus',
		description: 'Comprehensive syllabus for Cambridge B1 Preliminary English Test',
		levelId: 4,
		level: {
			id: 4,
			name: 'B1 PET Level 1',
			code: 'B1PET1'
		},
		duration: 24,
		totalLessons: 80,
		status: 'active',
		objectives: 'Prepare students for Cambridge B1 PET examination',
		learningOutcomes: 'Students achieve B1 level competency',
		assessmentCriteria: 'Mock tests, practice exams, final assessment',
		createdAt: '2024-02-01T08:00:00Z',
		chapters: [
			{
				id: 3,
				syllabusId: 2,
				name: 'B1 Level Overview',
				description: 'Introduction to B1 level requirements',
				order: 1,
				duration: 2,
				status: 'active',
				objectives: 'Understand B1 level expectations',
				learningOutcomes: 'Students know what to expect at B1 level',
				assessmentCriteria: 'Initial assessment',
				createdAt: '2024-02-02T08:00:00Z',
				lessons: []
			}
		]
	}
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Async thunks for Syllabuses
export const fetchSyllabuses = createAsyncThunk(
	'syllabus/fetchSyllabuses',
	async (_, { rejectWithValue }) => {
		try {
			await delay(1000);
			return mockSyllabuses;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const createSyllabus = createAsyncThunk(
	'syllabus/createSyllabus',
	async (syllabusData, { rejectWithValue }) => {
		try {
			await delay(800);
			const newSyllabus = {
				id: Date.now(),
				...syllabusData,
				chapters: [],
				createdAt: new Date().toISOString(),
			};
			mockSyllabuses.push(newSyllabus);
			return newSyllabus;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const updateSyllabus = createAsyncThunk(
	'syllabus/updateSyllabus',
	async ({ id, ...updateData }, { rejectWithValue }) => {
		try {
			await delay(800);
			const index = mockSyllabuses.findIndex(syllabus => syllabus.id === id);
			if (index !== -1) {
				mockSyllabuses[index] = { ...mockSyllabuses[index], ...updateData };
				return mockSyllabuses[index];
			}
			throw new Error('Syllabus not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const deleteSyllabus = createAsyncThunk(
	'syllabus/deleteSyllabus',
	async (id, { rejectWithValue }) => {
		try {
			await delay(800);
			const index = mockSyllabuses.findIndex(syllabus => syllabus.id === id);
			if (index !== -1) {
				mockSyllabuses.splice(index, 1);
				return id;
			}
			throw new Error('Syllabus not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const updateSyllabusStatus = createAsyncThunk(
	'syllabus/updateSyllabusStatus',
	async ({ id, status }, { rejectWithValue }) => {
		try {
			await delay(500);
			const index = mockSyllabuses.findIndex(syllabus => syllabus.id === id);
			if (index !== -1) {
				mockSyllabuses[index].status = status;
				return mockSyllabuses[index];
			}
			throw new Error('Syllabus not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

// Async thunks for Chapters
export const fetchChaptersBySyllabus = createAsyncThunk(
	'syllabus/fetchChaptersBySyllabus',
	async (syllabusId, { rejectWithValue }) => {
		try {
			await delay(800);
			const syllabus = mockSyllabuses.find(s => s.id === syllabusId);
			return syllabus ? syllabus.chapters || [] : [];
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const createChapter = createAsyncThunk(
	'syllabus/createChapter',
	async (chapterData, { rejectWithValue }) => {
		try {
			await delay(800);
			const newChapter = {
				id: Date.now(),
				...chapterData,
				lessons: [],
				createdAt: new Date().toISOString(),
			};
			
			const syllabus = mockSyllabuses.find(s => s.id === chapterData.syllabusId);
			if (syllabus) {
				syllabus.chapters = syllabus.chapters || [];
				syllabus.chapters.push(newChapter);
			}
			
			return newChapter;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const updateChapter = createAsyncThunk(
	'syllabus/updateChapter',
	async ({ id, ...updateData }, { rejectWithValue }) => {
		try {
			await delay(800);
			for (const syllabus of mockSyllabuses) {
				const chapterIndex = syllabus.chapters?.findIndex(chapter => chapter.id === id);
				if (chapterIndex !== -1) {
					syllabus.chapters[chapterIndex] = { ...syllabus.chapters[chapterIndex], ...updateData };
					return syllabus.chapters[chapterIndex];
				}
			}
			throw new Error('Chapter not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const deleteChapter = createAsyncThunk(
	'syllabus/deleteChapter',
	async (id, { rejectWithValue }) => {
		try {
			await delay(800);
			for (const syllabus of mockSyllabuses) {
				const chapterIndex = syllabus.chapters?.findIndex(chapter => chapter.id === id);
				if (chapterIndex !== -1) {
					syllabus.chapters.splice(chapterIndex, 1);
					return id;
				}
			}
			throw new Error('Chapter not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const updateChapterStatus = createAsyncThunk(
	'syllabus/updateChapterStatus',
	async ({ id, status }, { rejectWithValue }) => {
		try {
			await delay(500);
			for (const syllabus of mockSyllabuses) {
				const chapterIndex = syllabus.chapters?.findIndex(chapter => chapter.id === id);
				if (chapterIndex !== -1) {
					syllabus.chapters[chapterIndex].status = status;
					return syllabus.chapters[chapterIndex];
				}
			}
			throw new Error('Chapter not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

// Async thunks for Lessons
export const fetchLessonsByChapter = createAsyncThunk(
	'syllabus/fetchLessonsByChapter',
	async (chapterId, { rejectWithValue }) => {
		try {
			await delay(800);
			for (const syllabus of mockSyllabuses) {
				const chapter = syllabus.chapters?.find(c => c.id === chapterId);
				if (chapter) {
					return chapter.lessons || [];
				}
			}
			return [];
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const createLesson = createAsyncThunk(
	'syllabus/createLesson',
	async (lessonData, { rejectWithValue }) => {
		try {
			await delay(800);
			const newLesson = {
				id: Date.now(),
				...lessonData,
				createdAt: new Date().toISOString(),
			};
			
			for (const syllabus of mockSyllabuses) {
				const chapter = syllabus.chapters?.find(c => c.id === lessonData.chapterId);
				if (chapter) {
					chapter.lessons = chapter.lessons || [];
					chapter.lessons.push(newLesson);
					return newLesson;
				}
			}
			
			throw new Error('Chapter not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const updateLesson = createAsyncThunk(
	'syllabus/updateLesson',
	async ({ id, ...updateData }, { rejectWithValue }) => {
		try {
			await delay(800);
			for (const syllabus of mockSyllabuses) {
				for (const chapter of syllabus.chapters || []) {
					const lessonIndex = chapter.lessons?.findIndex(lesson => lesson.id === id);
					if (lessonIndex !== -1) {
						chapter.lessons[lessonIndex] = { ...chapter.lessons[lessonIndex], ...updateData };
						return chapter.lessons[lessonIndex];
					}
				}
			}
			throw new Error('Lesson not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const deleteLesson = createAsyncThunk(
	'syllabus/deleteLesson',
	async (id, { rejectWithValue }) => {
		try {
			await delay(800);
			for (const syllabus of mockSyllabuses) {
				for (const chapter of syllabus.chapters || []) {
					const lessonIndex = chapter.lessons?.findIndex(lesson => lesson.id === id);
					if (lessonIndex !== -1) {
						chapter.lessons.splice(lessonIndex, 1);
						return id;
					}
				}
			}
			throw new Error('Lesson not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

export const updateLessonStatus = createAsyncThunk(
	'syllabus/updateLessonStatus',
	async ({ id, status }, { rejectWithValue }) => {
		try {
			await delay(500);
			for (const syllabus of mockSyllabuses) {
				for (const chapter of syllabus.chapters || []) {
					const lessonIndex = chapter.lessons?.findIndex(lesson => lesson.id === id);
					if (lessonIndex !== -1) {
						chapter.lessons[lessonIndex].status = status;
						return chapter.lessons[lessonIndex];
					}
				}
			}
			throw new Error('Lesson not found');
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

// Initial state
const initialState = {
	syllabuses: [],
	chapters: [],
	lessons: [],
	loading: false,
	error: null,
	selectedSyllabus: null,
	selectedChapter: null,
};

// Slice
const syllabusSlice = createSlice({
	name: 'syllabus',
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		selectSyllabus: (state, action) => {
			state.selectedSyllabus = action.payload;
		},
		clearSelectedSyllabus: (state) => {
			state.selectedSyllabus = null;
		},
		selectChapter: (state, action) => {
			state.selectedChapter = action.payload;
		},
		clearSelectedChapter: (state) => {
			state.selectedChapter = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Syllabuses
			.addCase(fetchSyllabuses.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchSyllabuses.fulfilled, (state, action) => {
				state.loading = false;
				state.syllabuses = action.payload;
			})
			.addCase(fetchSyllabuses.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(createSyllabus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createSyllabus.fulfilled, (state, action) => {
				state.loading = false;
				state.syllabuses.push(action.payload);
			})
			.addCase(createSyllabus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(updateSyllabus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateSyllabus.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.syllabuses.findIndex(syllabus => syllabus.id === action.payload.id);
				if (index !== -1) {
					state.syllabuses[index] = action.payload;
				}
			})
			.addCase(updateSyllabus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(deleteSyllabus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteSyllabus.fulfilled, (state, action) => {
				state.loading = false;
				state.syllabuses = state.syllabuses.filter(syllabus => syllabus.id !== action.payload);
			})
			.addCase(deleteSyllabus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(updateSyllabusStatus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateSyllabusStatus.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.syllabuses.findIndex(syllabus => syllabus.id === action.payload.id);
				if (index !== -1) {
					state.syllabuses[index] = action.payload;
				}
			})
			.addCase(updateSyllabusStatus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			// Chapters
			.addCase(fetchChaptersBySyllabus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchChaptersBySyllabus.fulfilled, (state, action) => {
				state.loading = false;
				state.chapters = action.payload;
			})
			.addCase(fetchChaptersBySyllabus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(createChapter.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createChapter.fulfilled, (state, action) => {
				state.loading = false;
				state.chapters.push(action.payload);
			})
			.addCase(createChapter.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(updateChapter.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateChapter.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.chapters.findIndex(chapter => chapter.id === action.payload.id);
				if (index !== -1) {
					state.chapters[index] = action.payload;
				}
			})
			.addCase(updateChapter.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(deleteChapter.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteChapter.fulfilled, (state, action) => {
				state.loading = false;
				state.chapters = state.chapters.filter(chapter => chapter.id !== action.payload);
			})
			.addCase(deleteChapter.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(updateChapterStatus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateChapterStatus.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.chapters.findIndex(chapter => chapter.id === action.payload.id);
				if (index !== -1) {
					state.chapters[index] = action.payload;
				}
			})
			.addCase(updateChapterStatus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			// Lessons
			.addCase(fetchLessonsByChapter.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchLessonsByChapter.fulfilled, (state, action) => {
				state.loading = false;
				state.lessons = action.payload;
			})
			.addCase(fetchLessonsByChapter.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(createLesson.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createLesson.fulfilled, (state, action) => {
				state.loading = false;
				state.lessons.push(action.payload);
			})
			.addCase(createLesson.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(updateLesson.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateLesson.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.lessons.findIndex(lesson => lesson.id === action.payload.id);
				if (index !== -1) {
					state.lessons[index] = action.payload;
				}
			})
			.addCase(updateLesson.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(deleteLesson.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteLesson.fulfilled, (state, action) => {
				state.loading = false;
				state.lessons = state.lessons.filter(lesson => lesson.id !== action.payload);
			})
			.addCase(deleteLesson.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			
			.addCase(updateLessonStatus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateLessonStatus.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.lessons.findIndex(lesson => lesson.id === action.payload.id);
				if (index !== -1) {
					state.lessons[index] = action.payload;
				}
			})
			.addCase(updateLessonStatus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export const {
	clearError,
	selectSyllabus,
	clearSelectedSyllabus,
	selectChapter,
	clearSelectedChapter,
} = syllabusSlice.actions;

export default syllabusSlice.reducer;
