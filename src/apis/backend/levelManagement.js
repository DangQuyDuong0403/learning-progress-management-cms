import axiosClient from '../index.js';

const levelManagementApi = {
	getLevels: (config) => axiosClient.get('/level', config),
	createLevel: (data) => axiosClient.post('/level', data),
	deleteLevel: (id) => axiosClient.delete(`/level/${id}`),
	getLevelById: (id) => axiosClient.get(`/level/${id}`),
	activateDeactivateLevel: (id) => {
		return axiosClient.patch(`/level/${id}/activate-deactivate`);
	},
};

export default levelManagementApi;
