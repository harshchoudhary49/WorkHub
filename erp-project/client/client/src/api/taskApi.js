import { axiosClient } from './axiosClient.js';

export const taskApi = {
  create: (payload) => axiosClient.post('/tasks', payload),
  myTasks: (params) => axiosClient.get('/tasks/me', { params }),
  updateStatus: (id, payload) => axiosClient.patch(`/tasks/${id}/status`, payload),
  update: (id, payload) => axiosClient.patch(`/tasks/${id}`, payload),
  remove: (id) => axiosClient.delete(`/tasks/${id}`),
  teamTasks: (params) => axiosClient.get('/tasks/team', { params }),
  allTasks: (params) => axiosClient.get('/tasks', { params }),
};
