import axiosClient from '..';

const adminDashboardApi = {
  getDashboard: () => axiosClient.get('/admin/dashboard'),
  getAccountGrowthByRole: (params = {}) =>
    axiosClient.get('/admin/dashboard/account-growth-by-role', {
      params,
    }),
};

export default adminDashboardApi;


