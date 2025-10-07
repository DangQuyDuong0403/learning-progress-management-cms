import axiosClient from '../index.js';

const accountManagementApi = {
    getAccounts: (params) => axiosClient.get('/account', params),
    updateAccountStatus: (id, userStatus) => axiosClient.put(`/account/${id}/status`, null, {
        params: { userStatus }
    }),
}

export default accountManagementApi;