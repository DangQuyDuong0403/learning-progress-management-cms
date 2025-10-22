import axiosClient from '../index.js';

const syllabusManagementApi = {
    getSyllabuses: (params) => axiosClient.get('/syllabus', params),
    createSyllabus: (data) => axiosClient.post('/syllabus', data),
    updateSyllabus: (id, data) => axiosClient.put(`/syllabus/${id}`, data),
    deleteSyllabus: (id) => axiosClient.delete(`/syllabus/${id}`),
    getChapters: (params) => axiosClient.get('/chapter', params),
    getChaptersBySyllabusId: (syllabusId, params) => axiosClient.get('/chapter', { 
        params: { syllabusId, ...params } 
    }),
    bulkUpdateChapters: (data) => axiosClient.put('/chapter/bulk-order', data),
    
    // Chapter Sync API - Đồng bộ toàn bộ danh sách chapter cho một syllabus
    syncChapters: (syllabusId, chaptersData) => axiosClient.put('/chapter/sync', chaptersData, {
        params: { syllabusId }
    }),
    
    // Lesson Sync API - Đồng bộ toàn bộ danh sách lesson cho một chapter
    syncLessons: (chapterId, lessonsData) => axiosClient.put(`/lesson/sync/${chapterId}`, lessonsData),
    
    // Lesson APIs
    getLessonsByChapterId: (chapterId, params) => axiosClient.get('/lesson', { 
        params: { chapterId, ...params } 
    }),
    getLessonsBySyllabusId: (syllabusId, params) => axiosClient.get('/lesson/by-syllabus', { 
        params: { syllabusId, ...params } 
    }),
    createLesson: (data) => axiosClient.post('/lesson', data),
    updateLesson: (id, data) => axiosClient.put(`/lesson/${id}`, data),
    deleteLesson: (id) => axiosClient.delete(`/lesson/${id}`),
    bulkUpdateLessons: (data) => axiosClient.put('/lesson/bulk-order', data),
    
    // Lesson Import/Export APIs
    importLessons: (formData) => axiosClient.post('/lesson/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    downloadLessonTemplate: () => axiosClient.get('/lesson/download-template'),
    
    // Chapter Import/Export APIs
    importChapters: (formData) => axiosClient.post('/chapter/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    downloadChapterTemplate: () => axiosClient.get('/chapter/download-template'),
    
    // Syllabus Import/Export APIs
    importSyllabuses: (formData) => axiosClient.post('/syllabus/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    validateImportFile: (formData) => axiosClient.post('/syllabus/validate-import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Quan trọng để nhận file từ server
    }),
    downloadSyllabusTemplate: () => axiosClient.get('/syllabus/download-template'),
    
    // Export APIs
    exportSyllabuses: (ids = null, searchText = '') => {
        const params = {};
        if (ids && ids.length > 0) {
            params.ids = ids;
        }
        if (searchText) {
            params.searchText = searchText;
        }
        
        return axiosClient.get('/syllabus/export', {
            params,
            responseType: 'blob', // Important for file download
        });
    },
    
    // Legacy APIs for backward compatibility
    exportSyllabusById: (id) => axiosClient.get(`/syllabus/${id}/export`, {
        responseType: 'blob', // Important for file download
    }),
    exportAllSyllabuses: (searchText = '') => axiosClient.get('/syllabus/export', {
        params: { searchText },
        responseType: 'blob', // Important for file download
    }),
}

export default syllabusManagementApi;