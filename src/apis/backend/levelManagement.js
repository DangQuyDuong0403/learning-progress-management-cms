import axiosClient from '../index.js';

const levelManagementApi = {
	getLevels: (config) => axiosClient.get('/level', config),
	createLevel: (data) => axiosClient.post('/level', data),
	updateLevel: (id, data) => axiosClient.put(`/level/${id}`, data),
	deleteLevel: (id) => axiosClient.delete(`/level/${id}`),
	getLevelById: (id) => axiosClient.get(`/level/${id}`),
	activateDeactivateLevel: (id) => {
		return axiosClient.patch(`/level/${id}/activate-deactivate`);
	},
	bulkUpdateLevels: (data) => axiosClient.put('/level/bulk-order', data),
};

export default levelManagementApi;
