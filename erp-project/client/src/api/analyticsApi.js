import { axiosClient } from './axiosClient.js';

export const analyticsApi = {
  overview: () => axiosClient.get('/analytics/overview'),
  attendanceTrend: (days) => axiosClient.get('/analytics/attendance-trend', { params: { days } }),
  taskCompletionByDepartment: () => axiosClient.get('/analytics/task-completion-by-department'),
  headcountByDepartment: () => axiosClient.get('/analytics/headcount-by-department'),
};
