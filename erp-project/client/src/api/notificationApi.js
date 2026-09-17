import { axiosClient } from './axiosClient.js';

export const notificationApi = {
  list: (unreadOnly) => axiosClient.get('/notifications', { params: { unread: unreadOnly } }),
  markRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllRead: () => axiosClient.patch('/notifications/read-all'),
};
