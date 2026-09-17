import { axiosClient } from './axiosClient.js';

export const leaveApi = {
  apply: (payload) => axiosClient.post('/leaves', payload),
  myLeaves: (params) => axiosClient.get('/leaves/me', { params }),
  myBalances: () => axiosClient.get('/leaves/balance'),
  cancel: (id) => axiosClient.post(`/leaves/${id}/cancel`),
  teamLeaves: (params) => axiosClient.get('/leaves/team', { params }),
  allLeaves: (params) => axiosClient.get('/leaves', { params }),
  approve: (id) => axiosClient.post(`/leaves/${id}/approve`),
  reject: (id, reason) => axiosClient.post(`/leaves/${id}/reject`, { reason }),
};
