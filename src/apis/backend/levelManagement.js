import axiosClient from '../index.js';

const levelManagementApi = {
    getLevels: (params) => axiosClient.get('/level', params),
    createLevel: (data) => axiosClient.post('/level', data),
    updateLevel: (id, data) => axiosClient.put(`/level/${id}`, data),
    deleteLevel: (id) => axiosClient.delete(`/level/${id}`),
    getLevelById: (id) => axiosClient.get(`/level/${id}`),
}

export default levelManagementApi;