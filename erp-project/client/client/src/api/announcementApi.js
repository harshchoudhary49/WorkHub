import { axiosClient } from './axiosClient.js';

export const announcementApi = {
  list: () => axiosClient.get('/announcements'),
  create: (payload) => axiosClient.post('/announcements', payload),
  remove: (id) => axiosClient.delete(`/announcements/${id}`),
};
