import { axiosClient } from './axiosClient.js';

export const goalApi = {
  create: (payload) => axiosClient.post('/goals', payload),
  myGoals: (params) => axiosClient.get('/goals/me', { params }),
  updateOwn: (id, payload) => axiosClient.patch(`/goals/${id}`, payload),
  review: (id, payload) => axiosClient.post(`/goals/${id}/review`, payload),
  remove: (id) => axiosClient.delete(`/goals/${id}`),
  teamGoals: (params) => axiosClient.get('/goals/team', { params }),
  allGoals: (params) => axiosClient.get('/goals', { params }),
};
