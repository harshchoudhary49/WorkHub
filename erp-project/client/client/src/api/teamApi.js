import { axiosClient } from './axiosClient.js';

export const teamApi = {
  list: (params) => axiosClient.get('/teams', { params }),
  getOne: (id) => axiosClient.get(`/teams/${id}`),
  create: (payload) => axiosClient.post('/teams', payload),
  update: (id, payload) => axiosClient.patch(`/teams/${id}`, payload),
  remove: (id) => axiosClient.delete(`/teams/${id}`),
};
