import { axiosClient } from './axiosClient.js';

export const floorApi = {
  list: (params) => axiosClient.get('/floors', { params }),
  create: (payload) => axiosClient.post('/floors', payload),
  update: (id, payload) => axiosClient.patch(`/floors/${id}`, payload),
  remove: (id) => axiosClient.delete(`/floors/${id}`),
};
