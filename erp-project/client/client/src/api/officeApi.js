import { axiosClient } from './axiosClient.js';

export const officeApi = {
  list: () => axiosClient.get('/offices'),
  create: (payload) => axiosClient.post('/offices', payload),
  update: (id, payload) => axiosClient.patch(`/offices/${id}`, payload),
  remove: (id) => axiosClient.delete(`/offices/${id}`),
};
