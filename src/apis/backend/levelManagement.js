import axiosClient from '../index.js';

const levelManagementApi = {
	getLevels: (params) => axiosClient.get('/level', { params }),
	createLevel: (data) => axiosClient.post('/level', data),
	updateLevel: (id, data) => axiosClient.put(`/level/${id}`, data),
	deleteLevel: (id) => axiosClient.delete(`/level/${id}`),
	getLevelById: (id) => axiosClient.get(`/level/${id}`),
	activateDeactivateLevel: (id) => {
		return axiosClient.patch(`/level/${id}/activate-deactivate`);
	},
	bulkUpdateLevels: (data) => axiosClient.put('/level/bulk-order', data),
	publishAllLevels: () => axiosClient.patch('/level/publish-all'),
	draftAllLevels: () => axiosClient.patch('/level/draft-all'),
};

export default levelManagementApi;
