import axiosClient from '../index.js';

const levelManagementApi = {
	getLevels: (params) => axiosClient.get('/level', { params }),
	createLevel: (data) => axiosClient.post('/level', data),
	deleteLevel: (id) => axiosClient.delete(`/level/${id}`),
	getLevelById: (id) => axiosClient.get(`/level/${id}`),
	updateLevel: (id, data) => axiosClient.put(`/level/${id}`, data),
	activateDeactivateLevel: (id) => {
		return axiosClient.patch(`/level/${id}/activate-deactivate`);
	},
};

export default levelManagementApi;
