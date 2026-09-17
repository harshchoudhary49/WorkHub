import { axiosClient } from './axiosClient.js';

export const recognitionApi = {
  give: (payload) => axiosClient.post('/recognitions', payload),
  feed: () => axiosClient.get('/recognitions/feed'),
  mine: () => axiosClient.get('/recognitions/me'),
};
