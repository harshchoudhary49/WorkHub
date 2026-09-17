import { axiosClient } from './axiosClient.js';

export const authApi = {
  register: (payload) => axiosClient.post('/auth/register', payload),
  login: (payload) => axiosClient.post('/auth/login', payload),
  logout: () => axiosClient.post('/auth/logout'),
  refresh: () => axiosClient.post('/auth/refresh'),
  me: () => axiosClient.get('/auth/me'),
};
