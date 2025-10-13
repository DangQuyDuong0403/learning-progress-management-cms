import axiosClient from '../index.js';

const accountManagementApi = {
    getAccounts: (params) => axiosClient.get('/account', params),
    createAccount: (data) => axiosClient.post('/account', data),
    updateAccount: (id, data) => axiosClient.put(`/account/${id}`, data),
    updateAccountStatus: (id, userStatus) => axiosClient.put(`/account/${id}/status`, null, {
        params: { userStatus }
    }),
}

export default accountManagementApi;