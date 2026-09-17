import { axiosClient } from './axiosClient.js';

export const departmentApi = {
  list: (params) => axiosClient.get('/departments', { params }),
  create: (payload) => axiosClient.post('/departments', payload),
  update: (id, payload) => axiosClient.patch(`/departments/${id}`, payload),
  remove: (id) => axiosClient.delete(`/departments/${id}`),
};
