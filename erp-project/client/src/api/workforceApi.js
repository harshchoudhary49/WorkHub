import { axiosClient } from './axiosClient.js';

export const workforceApi = {
  overview: () => axiosClient.get('/workforce/overview'),
  map: (params) => axiosClient.get('/workforce/map', { params }),
};
