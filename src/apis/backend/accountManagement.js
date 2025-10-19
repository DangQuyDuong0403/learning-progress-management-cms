import axiosClient from '../index.js';

const accountManagementApi = {
    getAccounts: (params) => axiosClient.get('/account', params),
    getAccountById: (id) => axiosClient.get(`/account/${id}`),
    createAccount: (data) => axiosClient.post('/account', data),
    updateAccount: (id, params) => axiosClient.put(`/account/${id}`, null, {
        params: params
    }),
    updateAccountStatus: (id, userStatus) => axiosClient.put(`/account/${id}/status`, null, {
        params: { userStatus }
    }),
}

export default accountManagementApi;