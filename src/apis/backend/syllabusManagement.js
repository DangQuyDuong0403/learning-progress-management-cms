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
}

export default syllabusManagementApi;