import { axiosClient } from './axiosClient.js';

export const messageApi = {
  inbox: () => axiosClient.get('/messages/inbox'),
  conversation: (employeeId) => axiosClient.get(`/messages/direct/${employeeId}`),
  sendDirect: (payload) => axiosClient.post('/messages/direct', payload),
  myTeams: () => axiosClient.get('/messages/my-teams'),
  teamMessages: (teamId) => axiosClient.get(`/messages/team/${teamId}`),
  sendTeam: (teamId, body) => axiosClient.post(`/messages/team/${teamId}`, { body }),
};
