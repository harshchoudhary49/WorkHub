import { axiosClient } from './axiosClient.js';

export const holidayApi = {
  list: (params) => axiosClient.get('/holidays', { params }),
  create: (payload) => axiosClient.post('/holidays', payload),
  update: (id, payload) => axiosClient.patch(`/holidays/${id}`, payload),
  remove: (id) => axiosClient.delete(`/holidays/${id}`),
};
