import { axiosClient } from './axiosClient.js';

export const deskApi = {
  list: (params) => axiosClient.get('/desks', { params }),
  create: (payload) => axiosClient.post('/desks', payload),
  update: (id, payload) => axiosClient.patch(`/desks/${id}`, payload),
  remove: (id) => axiosClient.delete(`/desks/${id}`),
  assign: (id, employee) => axiosClient.post(`/desks/${id}/assign`, { employee }),
  unassign: (id) => axiosClient.post(`/desks/${id}/unassign`),
};
