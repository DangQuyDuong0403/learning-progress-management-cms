import axiosClient from '../index.js';

const syllabusManagementApi = {
    getSyllabuses: (params) => axiosClient.get('/syllabus', params),
    createSyllabus: (data) => axiosClient.post('/syllabus', data),
    updateSyllabus: (id, data) => axiosClient.put(`/syllabus/${id}`, data),
    deleteSyllabus: (id) => axiosClient.delete(`/syllabus/${id}`),
}

export default syllabusManagementApi;