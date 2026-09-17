import { axiosClient } from './axiosClient.js';

export const employeeApi = {
  list: (params) => axiosClient.get('/employees', { params }),
  getOne: (id) => axiosClient.get(`/employees/${id}`),
  create: (payload) => axiosClient.post('/employees', payload),
  updateAdmin: (id, payload) => axiosClient.patch(`/employees/${id}`, payload),
  updateOwnProfile: (payload) => axiosClient.patch('/employees/me', payload),
  deactivate: (id) => axiosClient.post(`/employees/${id}/deactivate`),
  remove: (id) => axiosClient.delete(`/employees/${id}`),
};
