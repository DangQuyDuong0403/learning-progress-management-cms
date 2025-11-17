import axiosClient from '..';

const managerDashboardApi = {
  getOverview: (params = {}) =>
    axiosClient.get('/manager/dashboard/overview', {
      params,
    }),
  getUsersReport: (params = {}) =>
    axiosClient.get('/manager/dashboard/users', {
      params,
    }),
  getSyllabusReport: (params = {}) =>
    axiosClient.get('/manager/dashboard/syllabus', {
      params,
    }),
  getLevelReport: (params = {}) =>
    axiosClient.get('/manager/dashboard/levels', {
      params,
    }),
  getClassesReport: (params = {}) =>
    axiosClient.get('/manager/dashboard/classes', {
      params,
    }),
};

export default managerDashboardApi;


