import { axiosClient } from './axiosClient.js';

export const performanceApi = {
  me: (params) => axiosClient.get('/performance/me', { params }),
  myHistory: () => axiosClient.get('/performance/me/history'),
  employee: (employeeId, params) => axiosClient.get(`/performance/${employeeId}`, { params }),
  team: (params) => axiosClient.get('/performance/team', { params }),
  giveFeedback: (employeeId, payload) => axiosClient.post(`/performance/${employeeId}/feedback`, payload),
};
