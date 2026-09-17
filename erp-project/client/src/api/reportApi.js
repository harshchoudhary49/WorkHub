import { axiosClient } from './axiosClient.js';

export const reportApi = {
  attendance: (params) => axiosClient.get('/reports/attendance', { params }),
  leaves: (params) => axiosClient.get('/reports/leaves', { params }),
  employees: (params) => axiosClient.get('/reports/employees', { params }),
  tasks: (params) => axiosClient.get('/reports/tasks', { params }),
  performance: (params) => axiosClient.get('/reports/performance', { params }),
  workload: (params) => axiosClient.get('/reports/workload', { params }),
};
