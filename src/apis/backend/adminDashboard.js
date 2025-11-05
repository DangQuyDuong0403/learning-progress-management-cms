import axiosClient from '..';

const adminDashboardApi = {
  getDashboard: () => axiosClient.get('/admin/dashboard'),
};

export default adminDashboardApi;


